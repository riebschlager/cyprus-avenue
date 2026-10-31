import { afterEach, beforeEach, expect, it, vi } from 'vitest'

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
  const auth = (await import('../src/composables/useSpotifyAuth')).useSpotifyAuth()
  await auth.handleOAuthCallback('code', 'state')
  expect(sessionStorage.getItem('spotify_code_verifier')).toBeNull()
  expect(await auth.getValidAccessToken()).toBe('old')
  vi.advanceTimersByTime(61_000)
  expect(await auth.getValidAccessToken()).toBe('fresh')
  expect(fetchMock.mock.calls[1]![1].body).toContain('grant_type=refresh_token')
  expect(auth.restorePendingAction()).toBe('/playlist/favorites')
  expect(JSON.parse(sessionStorage.getItem('spotify_pending_action')!)).toEqual(action)
  sessionStorage.removeItem('spotify_pending_action') // destination consumes action
  expect(auth.restorePendingAction()).toBe('/')
  expect(sessionStorage.getItem('spotify_pending_action')).toBeNull()
})

it('rejects OAuth state mismatches without exchanging credentials', async () => {
  const auth = (await import('../src/composables/useSpotifyAuth')).useSpotifyAuth()
  await expect(auth.handleOAuthCallback('code', 'wrong')).rejects.toThrow('State parameter mismatch')
  expect(fetch).not.toHaveBeenCalled()
  expect(auth.isAuthenticated.value).toBe(false)
})

it('stops after a failed batch and surfaces the error without replaying successful tracks', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockResolvedValueOnce(response({ snapshot_id: 'first' }))
    .mockResolvedValueOnce(response({ error: { message: 'Quota exceeded' } }, 429))
  vi.stubGlobal('fetch', fetchMock)
  const { SpotifyApiClient } = await import('../src/utils/spotifyApi')
  const uris = Array.from({ length: 250 }, (_, i) => `spotify:track:${i}`)
  const assertion = expect(SpotifyApiClient('token').addTracksToPlaylist('playlist', uris)).rejects.toThrow('Quota exceeded')
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
    expect((options?.headers as Record<string, string>).Authorization).toBe('Bearer fresh')
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
  const auth = (await import('../src/composables/useSpotifyAuth')).useSpotifyAuth()
  await auth.handleOAuthCallback('code', 'state')
  const creation = (await import('../src/composables/useSpotifyPlaylistCreation')).useSpotifyPlaylistCreation()
  const result = creation.createPlaylistFromArchivePlaylist({
    date: '2015-01-03', title: 'Favorites', description: '', source_url: '', archived_date: '2025-12-31',
    tracks: [{ artist: 'Artist', song: 'Song' }]
  })
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3)) // OAuth, index, refresh
  expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/me'))).toBe(false)
  resolveIndex(response({ 'Artist|Song': { spotifyId: 'indexed', confidence: 'high' } }))
  await vi.runAllTimersAsync()
  expect(await result).toMatchObject({ success: true, tracksAdded: 1, tracksFailed: 0 })
})
