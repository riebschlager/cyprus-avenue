const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mergeLastfm } = require('../lib/source-data.cjs')

test('Last.fm refresh retains Spotify metadata, consolidated tags and failed/empty values', () => {
  const previous = { bio: 'retained', image: 'spotify-image', spotifyId: 'artist-id',
    tags: ['rock', 'soul'], lastfmTags: ['rock'], tagSources: { total: 2 }, popularity: 50 }
  assert.equal(mergeLastfm(previous, { error: 'timeout' }), previous)
  const refreshed = mergeLastfm(previous, { bio: '', bioSummary: 'fresh', tags: ['blues'], image: '' })
  assert.equal(refreshed.bio, 'retained')
  assert.equal(refreshed.bioSummary, 'fresh')
  assert.equal(refreshed.image, 'spotify-image')
  assert.equal(refreshed.spotifyId, 'artist-id')
  assert.equal(refreshed.popularity, 50)
  assert.deepEqual(refreshed.tags, ['rock', 'soul'])
  assert.deepEqual(refreshed.lastfmTags, ['blues'])
  assert.deepEqual(refreshed.tagSources, { total: 2 })
  assert.deepEqual(previous.lastfmTags, ['rock'])
})

const vm = require('node:vm')
const fs = require('node:fs')
const path = require('node:path')
const helper = require('../lib/source-data.cjs')

async function runLastfm(flags, fetchResponse) {
  const previous = {
    Existing: { bio: 'original', image: 'spotify', spotifyId: 'id', tags: ['soul'], tagSources: { total: 1 } },
    Failed: { bio: 'keep on failure', tags: ['jazz'] },
    Unlisted: { bio: 'keep outside current playlists' }
  }
  let saved
  const requested = []
  const script = fs.readFileSync(path.join(__dirname, '../lastfm/fetch-artist-bios.js'), 'utf8')
    .replace('main().catch', 'await main().catch')
  const fakeFS = { existsSync: () => false,
    readFileSync: () => JSON.stringify([{ tracks: ['Existing', 'Failed', 'New'].map(artist => ({ artist })) }]),
    statSync: () => ({ size: 100 }) }
  const context = {
    require: name => name === 'fs' ? fakeFS : name === 'path' ? path : {
      ...helper, readJSON: () => structuredClone(previous), saveSnapshot: (_name, bios) => { saved = bios }
    },
    __dirname: path.join(__dirname, '../lastfm'), URLSearchParams,
    process: { cwd: () => '/', env: { LASTFM_API_KEY: 'test' }, argv: ['node', 'script', ...flags],
      exit: code => { throw new Error(`Unexpected exit ${code}`) } },
    console: { log() {}, error() {}, warn() {} }, setTimeout: callback => callback(),
    fetch: async url => {
      const artist = new URL(url).searchParams.get('artist')
      requested.push(artist)
      return fetchResponse(artist)
    }
  }
  await vm.runInNewContext(`(async () => { ${script} })()`, context)
  return { saved: JSON.parse(JSON.stringify(saved)), requested, previous }
}

test('default Last.fm run requests only missing bios and keeps all existing artists', async () => {
  const { saved, requested, previous } = await runLastfm([], () => ({ ok: true,
    json: async () => ({ artist: { bio: { content: 'new bio' }, tags: { tag: [] } } }) }))
  assert.deepEqual(requested, ['New'])
  assert.deepEqual(saved.Existing, previous.Existing)
  assert.deepEqual(saved.Failed, previous.Failed)
  assert.deepEqual(saved.Unlisted, previous.Unlisted)
  assert.equal(saved.New.bio, 'new bio')
})

test('full Last.fm refresh keeps failed entries and fields from other providers', async () => {
  const { saved, requested, previous } = await runLastfm(['--refresh'], artist => {
    if (artist === 'Failed') throw new Error('offline')
    return { ok: true, json: async () => ({ artist: { bio: { content: 'refreshed' },
      tags: { tag: [{ name: 'blues' }] } } }) }
  })
  assert.deepEqual(requested, ['Existing', 'Failed', 'New'])
  assert.deepEqual(saved.Failed, previous.Failed)
  assert.deepEqual(saved.Unlisted, previous.Unlisted)
  assert.equal(saved.Existing.bio, 'refreshed')
  assert.equal(saved.Existing.image, 'spotify')
  assert.deepEqual(saved.Existing.tags, ['soul'])
  assert.deepEqual(saved.Existing.lastfmTags, ['blues'])
})
