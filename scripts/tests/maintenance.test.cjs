const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createRequest, createSpotifyClient, loadEnv } = require('../lib/maintenance.cjs')
const response = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers })

test('dotenv quotes, spaces and existing environment values work without shell evaluation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyprus-env-'))
  const file = path.join(dir, '.env')
  try {
    fs.writeFileSync(file, 'CYPRUS_TEST_VALUE="a b=#c $(echo nope)"\nCYPRUS_TEST_EXISTING=replaced\n')
    process.env.CYPRUS_TEST_EXISTING = 'original'
    loadEnv(file)
    assert.equal(process.env.CYPRUS_TEST_VALUE, 'a b=#c $(echo nope)')
    assert.equal(process.env.CYPRUS_TEST_EXISTING, 'original')
  } finally {
    delete process.env.CYPRUS_TEST_VALUE
    delete process.env.CYPRUS_TEST_EXISTING
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('429 respects Retry-After, server failures back off, permanent failures stop', async () => {
  const waits = [], statuses = [429, 503, 200]
  const request = createRequest({ wait: async ms => waits.push(ms), fetchImpl: async () =>
    response({}, statuses.shift(), { 'Retry-After': '2' }) })
  assert.equal((await request('https://example.test')).status, 200)
  assert.deepEqual(waits, [2000, 2000])
  let calls = 0
  const denied = createRequest({ fetchImpl: async () => { calls++; return response({}, 403) } })
  await assert.rejects(denied('https://example.test'), { status: 403 })
  assert.equal(calls, 1)
})

test('network failures, repeated rate limits and excessive Retry-After are bounded', async () => {
  let calls = 0
  const request = createRequest({ retries: 2, wait: async () => {}, fetchImpl: async () => {
    calls++; throw new Error('offline')
  } })
  await assert.rejects(request('https://example.test'), /offline/)
  assert.equal(calls, 3)
  calls = 0
  const limited = createRequest({ retries: 2, wait: async () => {}, fetchImpl: async () => {
    calls++; return response({}, 429)
  } })
  await assert.rejects(limited('https://example.test'), { status: 429 })
  assert.equal(calls, 3)
  const longWait = createRequest({ wait: async () => assert.fail('should stop'),
    fetchImpl: async () => response({}, 429, { 'Retry-After': '3600' }) })
  await assert.rejects(longWait('https://example.test'), { status: 429 })
})

test('timeout aborts stalled requests and their bodies', async () => {
  const request = createRequest({ timeoutMs: 5, retries: 0, fetchImpl: async (_url, options) => ({
    text: () => new Promise((_, reject) => {
      options.signal.addEventListener('abort', () => reject(options.signal.reason))
      // Keep the test event loop alive while AbortSignal.timeout uses an unref timer.
      setTimeout(() => {}, 15)
    })
  }) })
  await assert.rejects(request('https://example.test'), { name: 'TimeoutError' })
})

test('Spotify deduplicates token requests, refreshes expiry and retries 401 once', async () => {
  let time = 0, tokens = 0, denied = false
  const seen = []
  const spotify = createSpotifyClient({ clientId: 'id', clientSecret: 'secret', now: () => time,
    requestImpl: async (url, options) => {
      if (url.includes('/api/token')) return response({ access_token: `token-${++tokens}`, expires_in: 3600 })
      seen.push(options.headers.Authorization)
      if (denied) { denied = false; throw Object.assign(new Error('unauthorized'), { status: 401 }) }
      return response({ genres: ['soul'] })
    } })
  await Promise.all([spotify.getToken(), spotify.getToken()])
  assert.equal(tokens, 1)
  time = 3600000
  await spotify.json('https://api.spotify.com/v1/artists/id')
  assert.equal(tokens, 2)
  denied = true
  await spotify.json('https://api.spotify.com/v1/artists/id')
  assert.equal(tokens, 3)
  assert.deepEqual(seen, ['Bearer token-2', 'Bearer token-2', 'Bearer token-3'])
})

async function runMaintenanceScript(filename, snapshots, spotifyJSON) {
  const vm = require('node:vm')
  let saved
  const fakeProcess = { env: {}, argv: ['node', filename], exitCode: 0,
    exit: code => { throw new Error(`Unexpected exit ${code}`) } }
  const code = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8')
    .replace('main().catch', 'await main().catch')
  await vm.runInNewContext(`(async () => { ${code} })()`, {
    require: name => {
      if (name.endsWith('source-data.cjs')) return {
        sourcePath: (...parts) => parts.at(-1), readJSON: file => structuredClone(snapshots[file]),
        saveSnapshot: (file, value) => { saved = JSON.parse(JSON.stringify(value)) }
      }
      if (name.endsWith('maintenance.cjs')) return {
        loadEnv() {}, createSpotifyClient: () => ({ json: spotifyJSON })
      }
      if (name === 'fs') return { existsSync: () => true, statSync: () => ({ size: 1 }) }
      throw new Error(`Unexpected dependency ${name}`)
    },
    process: fakeProcess, console: { log() {}, error() {} },
    fetch: () => assert.fail('offline consolidation must not fetch')
  })
  return { saved, exitCode: fakeProcess.exitCode }
}

test('offline consolidation preserves legacy Spotify tags and uses retained raw genres deterministically', async () => {
  const snapshots = { 'artist-bios.json': {
    Legacy: { lastfmTags: ['Soul'], tags: ['Soul', 'legacy genre'], tagSources: { spotifyArtist: 1 } },
    Raw: { lastfmTags: ['Soul'], spotifyGenres: [' soul ', 'blues'], tags: ['obsolete'], spotifyId: 'raw' }
  }, 'spotify-index.json': { 'Raw|Song': { genres: ['jazz'] } } }
  const result = await runMaintenanceScript('consolidate-genres.js', snapshots)
  assert.deepEqual(result.saved.Legacy.tags, ['Soul', 'legacy genre'])
  assert.equal(result.saved.Legacy.tagSources.spotifyArtist, 1)
  assert.deepEqual(result.saved.Raw.tags, ['Soul', 'blues', 'jazz'])
  const again = await runMaintenanceScript('consolidate-genres.js', { ...snapshots, 'artist-bios.json': result.saved })
  assert.deepEqual(again.saved, result.saved)
})

test('genre refresh preserves prior data on failure, stores empty successes and does not change display tags', async () => {
  const bios = {
    Failed: { spotifyId: 'failed', spotifyGenres: ['retained'], tags: ['display'], image: 'image' },
    Empty: { spotifyId: 'empty', spotifyGenres: ['old'], tags: ['display'] },
    Unmatched: { tags: ['soul'] }
  }
  const result = await runMaintenanceScript('spotify/fetch-artist-genres.js', { 'artist-bios.json': bios }, async url => {
    if (url.endsWith('/failed')) throw new Error('offline')
    return { genres: [] }
  })
  assert.deepEqual(result.saved.Failed, bios.Failed)
  assert.deepEqual(result.saved.Empty.spotifyGenres, [])
  assert.deepEqual(result.saved.Empty.tags, ['display'])
  assert.deepEqual(result.saved.Unmatched, bios.Unmatched)
  assert.equal(result.exitCode, 1)
})
