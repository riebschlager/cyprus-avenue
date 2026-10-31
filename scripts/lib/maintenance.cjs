const fs = require('node:fs')
const path = require('node:path')
const { root } = require('./source-data.cjs')

// Node's dotenv grammar handles quotes, whitespace, comments, and export prefixes.
// Existing process values always take precedence; never evaluate shell code.
function loadEnv(filename = path.join(root, '.env')) {
  if (fs.existsSync(filename)) process.loadEnvFile(filename)
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function createRequest({ fetchImpl = globalThis.fetch, wait = sleep, timeoutMs = 30000,
  retries = 3, maxDelayMs = 60000, now = Date.now } = {}) {
  return async function request(url, options = {}) {
    for (let attempt = 0; ; attempt++) {
      let delay = Math.min(1000 * 2 ** attempt, maxDelayMs)
      try {
        // Read the body within the timeout as well as the response headers.
        const response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) })
        const body = await response.text()
        if (response.ok) return new Response(body, { status: response.status, headers: response.headers })
        const retryable = response.status === 429 || response.status >= 500
        const error = new Error(`HTTP ${response.status}`)
        error.status = response.status
        if (!retryable || attempt >= retries) throw error
        const header = response.headers.get('Retry-After')
        if (header !== null) {
          const seconds = Number(header)
          const retryDelay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - now()
          // Stop instead of retrying earlier than the provider permits.
          if (retryDelay > maxDelayMs) throw error
          if (Number.isFinite(retryDelay)) delay = Math.max(0, retryDelay)
        }
      } catch (error) {
        if (error.status || attempt >= retries) throw error
      }
      await wait(delay)
    }
  }
}
const request = createRequest()

function createSpotifyClient({ requestImpl = request, now = Date.now,
  clientId = process.env.SPOTIFY_CLIENT_ID, clientSecret = process.env.SPOTIFY_CLIENT_SECRET } = {}) {
  let token, expiresAt = 0, pending
  async function getToken() {
    if (token && now() < expiresAt) return token
    if (!pending) pending = (async () => {
      if (!clientId || !clientSecret) throw new Error('Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the repository .env or environment')
      const response = await requestImpl('https://accounts.spotify.com/api/token', {
        method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials'
      })
      const data = await response.json()
      if (!data.access_token || !(data.expires_in > 0)) throw new Error('Invalid Spotify token response')
      token = data.access_token
      expiresAt = now() + Math.max(0, data.expires_in * 1000 - 60000)
      return token
    })().finally(() => { pending = undefined })
    return pending
  }
  async function spotifyRequest(url, options = {}) {
    for (let attempt = 0; ; attempt++) {
      const currentToken = await getToken()
      try {
        return await requestImpl(url, { ...options,
          headers: { ...options.headers, Authorization: `Bearer ${currentToken}` } })
      } catch (error) {
        if (error.status !== 401 || attempt > 0) throw error
        if (token === currentToken) { token = undefined; expiresAt = 0 }
      }
    }
  }
  return { getToken, request: spotifyRequest,
    json: async (url, options) => (await spotifyRequest(url, options)).json() }
}
module.exports = { loadEnv, request, createRequest, createSpotifyClient }
