import { afterEach, beforeEach, expect, it, vi } from 'vitest'

async function authenticate() {
  sessionStorage.setItem('spotify_state', 'state')
  sessionStorage.setItem('spotify_code_verifier', 'verifier')
  const auth = (await import('../src/features/spotify/useSpotifyAuth')).useSpotifyAuth()
  await auth.handleOAuthCallback('code', 'state')
  return auth
}

function storage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) }
  }
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('sessionStorage', storage())
  // Every request must be explicitly mocked; tests cannot reach Spotify.
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request') }))
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it('shares index readiness across concurrent callers and retries a failed load', async () => {
  let resolve!: (value: Response) => void
  const fetchMock = vi.fn().mockReturnValueOnce(new Promise<Response>(r => { resolve = r }))
    .mockResolvedValueOnce(response({ 'Artist|Song': { spotifyId: 'indexed', confidence: 'high' } }))
  vi.stubGlobal('fetch', fetchMock)
  const { useStreamingLinks } = await import('../src/composables/useStreamingLinks')
  const first = useStreamingLinks()
  const second = useStreamingLinks()
  const pending = second.loadSpotifyIndex()
  expect(first.indexLoading.value).toBe(true)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  resolve(response({}, 503))
  await expect(pending).rejects.toThrow('503')
  expect(first.indexLoaded.value).toBe(false)
  await first.loadSpotifyIndex()
  expect(second.hasDirectLink('Artist', 'Song')).toBe(true)
  expect(first.indexError.value).toBeNull()
})

it('refreshes an expired token before authenticated use and restores OAuth context once', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockResolvedValueOnce(response({ access_token: 'old', refresh_token: 'refresh', expires_in: 60 }))
    .mockResolvedValueOnce(response({ access_token: 'fresh', expires_in: 3600 }))
  vi.stubGlobal('fetch', fetchMock)
  sessionStorage.setItem('spotify_state', 'state')
  sessionStorage.setItem('spotify_code_verifier', 'verifier')
  const action = { action: 'create-playlist', mode: 'single', playlistSlug: '2015-01-03' }
  sessionStorage.setItem('spotify_return_path', '/playlist/favorites')
  sessionStorage.setItem('spotify_modal_state', JSON.stringify(action))
  const auth = (await import('../src/features/spotify/useSpotifyAuth')).useSpotifyAuth()
  await auth.handleOAuthCallback('code', 'state')
  expect(sessionStorage.getItem('spotify_code_verifier')).toBeNull()
  expect(await auth.getValidAccessToken()).toBe('old')
  vi.advanceTimersByTime(61_000)
  expect(await Promise.all([auth.getValidAccessToken(), auth.getValidAccessToken()])).toEqual(['fresh', 'fresh'])
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(fetchMock.mock.calls[1]![1].body).toContain('grant_type=refresh_token')
  expect(auth.restorePendingAction()).toBe('/playlist/favorites')
  expect(JSON.parse(sessionStorage.getItem('spotify_pending_action')!)).toEqual(action)
  const { takePendingAction } = await import('../src/features/spotify/pendingAction')
  expect(takePendingAction()).toEqual(action)
  expect(takePendingAction()).toBeNull()
  expect(auth.restorePendingAction()).toBe('/')
  expect(sessionStorage.getItem('spotify_pending_action')).toBeNull()
})

it('rejects OAuth state mismatches without exchanging credentials', async () => {
  const auth = (await import('../src/features/spotify/useSpotifyAuth')).useSpotifyAuth()
  await expect(auth.handleOAuthCallback('code', 'wrong')).rejects.toThrow('State parameter mismatch')
  expect(fetch).not.toHaveBeenCalled()
  expect(auth.isAuthenticated.value).toBe(false)
})

it('stops after a failed batch and surfaces the error without replaying successful tracks', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockResolvedValueOnce(response({ snapshot_id: 'first' }))
    .mockResolvedValueOnce(response({ error: { message: 'Quota exceeded' } }, 429))
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  fetchMock.mockResolvedValueOnce(response({ access_token: 'token', expires_in: 3600 }))
    .mockResolvedValueOnce(response({ snapshot_id: 'first' }))
    .mockResolvedValueOnce(response({ error: { message: 'Quota exceeded' } }, 429))
  await authenticate()
  fetchMock.mockClear()
  const { SpotifyApiClient } = await import('../src/features/spotify/spotifyApi')
  const uris = Array.from({ length: 250 }, (_, i) => `spotify:track:${i}`)
  const assertion = expect(SpotifyApiClient().addTracksToPlaylist('playlist', uris)).rejects.toThrow('Quota exceeded')
  await vi.runAllTimersAsync()
  await assertion
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(JSON.parse(fetchMock.mock.calls[0]![1].body).uris).toEqual(uris.slice(0, 100))
  expect(JSON.parse(fetchMock.mock.calls[1]![1].body).uris).toEqual(uris.slice(100, 200))
})

it('playlist creation waits for a cold index and uses the refreshed token', async () => {
  vi.useFakeTimers()
  vi.doMock('../src/composables/useArtistBios', () => ({ useArtistBios: () => ({ biosIndex: { value: {} } }) }))
  let resolveIndex!: (value: Response) => void
  const fetchMock = vi.fn((url: string, options?: RequestInit) => {
    if (url.endsWith('spotify-index.json')) return new Promise<Response>(resolve => { resolveIndex = resolve })
    if (url.includes('/api/token')) {
      return Promise.resolve(response(options?.body?.toString().includes('refresh_token')
        ? { access_token: 'fresh', expires_in: 3600 }
        : { access_token: 'old', refresh_token: 'refresh', expires_in: 1 }))
    }
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer fresh')
    if (url.endsWith('/me')) return Promise.resolve(response({ id: 'user' }))
    if (url.endsWith('/users/user/playlists')) return Promise.resolve(response({ id: 'new', external_urls: { spotify: 'https://example.test/new' } }))
    if (url.endsWith('/playlists/new/tracks')) {
      expect(JSON.parse(options!.body as string).uris).toEqual(['spotify:track:indexed'])
      return Promise.resolve(response({ snapshot_id: 'added' }))
    }
    throw new Error(`Unexpected request: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  sessionStorage.setItem('spotify_state', 'state')
  sessionStorage.setItem('spotify_code_verifier', 'verifier')
  const auth = (await import('../src/features/spotify/useSpotifyAuth')).useSpotifyAuth()
  await auth.handleOAuthCallback('code', 'state')
  const creation = (await import('../src/features/spotify/useSpotifyPlaylistCreation')).useSpotifyPlaylistCreation()
  const result = creation.createPlaylistFromArchivePlaylist({
    date: '2015-01-03', title: 'Favorites', description: '', source_url: '', archived_date: '2025-12-31',
    tracks: [{ artist: 'Artist', song: 'Song' }]
  })
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2)) // OAuth and index; API waits for readiness
  expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/me'))).toBe(false)
  resolveIndex(response({ 'Artist|Song': { spotifyId: 'indexed', confidence: 'high' } }))
  await vi.runAllTimersAsync()
  expect(await result).toMatchObject({ success: true, tracksAdded: 1, tracksFailed: 0 })
})

it('keeps mode-specific repeat handling and search policies', async () => {
  const { selectShow, selectArchive, selectArtist, selectTag } = await import('../src/features/spotify/trackSelection')
  const track = { artist: 'Artist', song: 'Song' }
  const show = { date: '2015-01-03', title: 'Show', tracks: [track, track], description: '', source_url: '', archived_date: '' }
  expect(selectShow(show)).toMatchObject({ tracks: [track, track], skipApiSearch: false })
  expect(selectArchive([show])).toMatchObject({ tracks: [track], skipApiSearch: true })
  expect(selectArtist('artist', [show])).toMatchObject({ tracks: [track], skipApiSearch: false })
  expect(selectTag('Rock & Roll', [show], { Artist: { tags: ['rock'] } } as any)).toMatchObject({ tracks: [track], skipApiSearch: true })
})

it('refreshes between requests and accepts empty playback responses', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockResolvedValueOnce(response({ access_token: 'old', refresh_token: 'refresh', expires_in: 60 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(response({ access_token: 'fresh', expires_in: 3600 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  await authenticate()
  const { spotifyRequest } = await import('../src/features/spotify/spotifyApi')
  await spotifyRequest('/me/player/play', { method: 'PUT' })
  vi.advanceTimersByTime(61_000)
  await spotifyRequest('/me/player/play', { method: 'PUT' })
  expect(fetchMock.mock.calls[1]![1].headers.get('Authorization')).toBe('Bearer old')
  expect(fetchMock.mock.calls[3]![1].headers.get('Authorization')).toBe('Bearer fresh')
})

it('does not restore a session after logout during refresh', async () => {
  let finish!: (value: Response) => void
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ access_token: 'old', refresh_token: 'refresh', expires_in: 1 }))
    .mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve })))
  const auth = await authenticate()
  const refresh = auth.getValidAccessToken()
  auth.logout()
  finish(response({ access_token: 'fresh', expires_in: 3600 }))
  await expect(refresh).rejects.toThrow('session ended')
  expect(auth.isAuthenticated.value).toBe(false)
})

it('validates all pending modes and discards malformed context', async () => {
  const { takePendingAction } = await import('../src/features/spotify/pendingAction')
  for (const action of [
    { action: 'playback', spotifyUri: 'spotify:track:id' },
    { action: 'create-playlist', mode: 'single', playlistSlug: '2015-01-03' },
    { action: 'create-playlist', mode: 'all-tracks' },
    { action: 'create-playlist', mode: 'artist', artistName: 'Artist' },
    { action: 'create-playlist', mode: 'tag', tag: 'rock' }
  ]) {
    sessionStorage.setItem('spotify_pending_action', JSON.stringify(action))
    expect(takePendingAction()).toEqual(action)
    expect(takePendingAction()).toBeNull()
  }
  sessionStorage.setItem('spotify_pending_action', '{broken')
  expect(takePendingAction()).toBeNull()
  sessionStorage.setItem('spotify_pending_action', '{"action":"create-playlist","mode":"artist"}')
  expect(takePendingAction()).toBeNull()
})

it('disconnects and resets playback on logout, ignores late SDK events, and reports failed play requests', async () => {
  const listeners: Record<string, (arg?: any) => void> = {}
  const disconnect = vi.fn()
  vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' }, Spotify: { Player: class {
    addListener(event: string, cb: (arg?: any) => void) { listeners[event] = cb; return true }
    connect() { listeners.ready!({ device_id: 'device' }); return Promise.resolve(true) }
    disconnect = disconnect
  } } })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ access_token: 'token', expires_in: 3600 }))
    .mockResolvedValueOnce(response({ error: { message: 'Premium required' } }, 403)))
  const auth = await authenticate()
  const playback = (await import('../src/features/spotify/useSpotifyPlayback')).useSpotifyPlayback()
  await playback.initializePlayer()
  expect(playback.isReady.value).toBe(true)
  await expect(playback.playTrack('spotify:track:id')).rejects.toThrow('Premium required')
  expect(playback.playbackError.value).toContain('Premium required')
  auth.logout()
  expect(disconnect).toHaveBeenCalledTimes(1)
  expect(playback.isReady.value).toBe(false)
  expect(playback.currentTrack.value).toBeNull()
  listeners.ready!({ device_id: 'late' })
  expect(playback.isReady.value).toBe(false)
})

it('retries SDK loading after a failed download', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ access_token: 'token', expires_in: 3600 })))
  await authenticate()
  const scripts: any[] = []
  const browser: any = { setTimeout, clearTimeout }
  vi.stubGlobal('window', browser)
  vi.stubGlobal('document', {
    createElement: () => ({ remove: vi.fn() }),
    head: { appendChild: (script: any) => { scripts.push(script) } }
  })
  const playback = (await import('../src/features/spotify/useSpotifyPlayback')).useSpotifyPlayback()
  const first = playback.initializePlayer()
  scripts[0].onerror()
  await expect(first).rejects.toThrow('could not load')
  const retry = playback.initializePlayer()
  expect(scripts).toHaveLength(2)
  browser.Spotify = { Player: class {
    addListener() { return true }
    connect() { return Promise.resolve(true) }
    disconnect() {}
  } }
  browser.onSpotifyWebPlaybackSDKReady()
  await retry
  expect(playback.playbackError.value).toBeNull()
})

it('generates OAuth state and verifier with secure randomness and reports missing configuration', async () => {
  vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'public-id')
  vi.stubGlobal('window', { location: { origin: 'http://localhost:5173', href: '' } })
  const random = vi.spyOn(crypto, 'getRandomValues')
  const auth = (await import('../src/features/spotify/useSpotifyAuth')).useSpotifyAuth()
  await auth.initiateLogin('/tracks', { action: 'playback', spotifyUri: 'spotify:track:id' })
  expect(random).toHaveBeenCalledTimes(2)
  expect(sessionStorage.getItem('spotify_code_verifier')).toMatch(/^[A-Za-z0-9_-]{128}$/)
  const url = new URL(window.location.href)
  expect(url.searchParams.get('code_challenge_method')).toBe('S256')
  expect(url.searchParams.get('state')).toBe(sessionStorage.getItem('spotify_state'))
  random.mockRestore()
  vi.resetModules()
  vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', '')
  const unconfigured = (await import('../src/features/spotify/useSpotifyAuth')).useSpotifyAuth()
  await expect(unconfigured.initiateLogin()).rejects.toThrow('not configured')
  vi.unstubAllEnvs()
})
