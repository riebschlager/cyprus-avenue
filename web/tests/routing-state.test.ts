import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive } from 'vue'
import type { Playlist } from '../src/types/playlist'
import type { ArtistBio } from '../src/types/artistBio'

const playlist: Playlist = {
  title: 'Cyprus Avenue: 2014 Favorites', date: '2015-01-03', description: '',
  tracks: [{ artist: 'Booker T. & The MG’s', song: 'Green Onions' }], source_url: '', archived_date: '2025-12-31'
}
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
function deferredResponse() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>(r => { resolve = r })
  return { promise, resolve }
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request') }))
  vi.stubGlobal('window', { location: { origin: 'https://archive.test' } })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.doUnmock('vue-router') })

it('shares playlist requests, exposes failures, retries, and caches an empty archive', async () => {
  const request = deferredResponse()
  const fetchMock = vi.fn().mockReturnValueOnce(request.promise).mockResolvedValueOnce(response([]))
  vi.stubGlobal('fetch', fetchMock)
  const { usePlaylists } = await import('../src/composables/usePlaylists')
  const first = usePlaylists()
  const second = usePlaylists()
  const pending = first.fetchPlaylists()
  expect(second.fetchPlaylists()).toBe(pending)
  expect(first.loading.value).toBe(true)
  request.resolve(response({}, 503))
  await pending
  expect(first.error.value).toBeTruthy()
  expect(first.loaded.value).toBe(false)
  expect(first.loading.value).toBe(false)
  await second.fetchPlaylists()
  expect(first.error.value).toBeNull()
  expect(first.loaded.value).toBe(true)
  await first.fetchPlaylists()
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('shares biography readiness, retries failures, and retains successful metadata on refresh failure', async () => {
  vi.useFakeTimers()
  const request = deferredResponse()
  const fetchMock = vi.fn().mockReturnValueOnce(request.promise)
    .mockResolvedValueOnce(response({ Artist: { bio: 'retained' } }))
    .mockResolvedValueOnce(response({}, 503))
  vi.stubGlobal('fetch', fetchMock)
  const { useArtistBios } = await import('../src/composables/useArtistBios')
  const first = useArtistBios()
  const second = useArtistBios()
  const pending = first.loadBiosIndex()
  expect(second.loadBiosIndex()).toBe(pending)
  expect(first.isLoading.value).toBe(true)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  request.resolve(response({}, 404))
  await pending
  expect(first.error.value).toContain('404')
  expect(first.indexLoaded.value).toBe(false)
  await second.loadBiosIndex()
  expect(first.getBio('Artist')).toEqual({ bio: 'retained' })
  expect(first.error.value).toBeNull()
  await first.loadBiosIndex()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  vi.advanceTimersByTime(15 * 60 * 1000)
  await first.loadBiosIndex()
  expect(first.error.value).toContain('503')
  expect(first.getBio('Artist')).toEqual({ bio: 'retained' })
  expect(first.isLoading.value).toBe(false)
})

it('recomputes artist tracks and tags when an asynchronously loaded prop is replaced', async () => {
  const { useArtists } = await import('../src/composables/useArtists')
  const { useArtistBios } = await import('../src/composables/useArtistBios')
  const props = reactive<{ playlists: Playlist[] }>({ playlists: [] })
  const { artists, availableTags } = useArtists(() => props.playlists)
  expect(artists.value).toEqual([])
  props.playlists = [playlist]
  expect(artists.value[0]?.name).toBe('Booker T. & The MG’s')
  const bio: ArtistBio = { bio: '', bioSummary: '', lastfmTags: [], url: '', listeners: 0, playcount: 0, image: '', tags: ['rnb'] }
  useArtistBios().biosIndex.value = { 'Booker T. & The MG’s': bio }
  expect(availableTags.value).toEqual(['R&B'])
  props.playlists = []
  expect(artists.value).toEqual([])
})

it('updates metadata after a cold deep link, navigation during loading, and record replacement', async () => {
  const route = reactive({ path: '/playlist/2014-favorites-january-2-2015', params: { slug: '2014-favorites-january-2-2015' }, query: {} })
  vi.doMock('vue-router', () => ({ useRoute: () => route }))
  const tags = new Map<string, { setAttribute: (name: string, value: string) => void; content: string }>()
  const fakeDocument = {
    title: '',
    querySelector: (selector: string) => tags.get(selector.match(/="([^"]+)"/)?.[1] || '') || null,
    createElement: () => {
      const element = { content: '', setAttribute(name: string, value: string) {
        if (name === 'content') element.content = value
        else tags.set(value, element)
      } }
      return element
    },
    head: { appendChild: vi.fn() }
  }
  vi.stubGlobal('document', fakeDocument)
  const { usePlaylists } = await import('../src/composables/usePlaylists')
  const { useOpenGraph } = await import('../src/composables/useOpenGraph')
  const { playlists, fetchPlaylists } = usePlaylists()
  const request = deferredResponse()
  vi.stubGlobal('fetch', vi.fn().mockReturnValue(request.promise))
  const scope = effectScope()
  scope.run(() => useOpenGraph())
  try {
    expect(fakeDocument.title).toBe('Cyprus Avenue Archive')
    const pending = fetchPlaylists()
    request.resolve(response([playlist]))
    await pending
    await nextTick()
    expect(fakeDocument.title).toBe(`${playlist.title} - Cyprus Avenue Archive`)
    // A legacy slug resolves to a canonical share URL.
    expect(tags.get('og:url')?.content).toBe('https://archive.test/playlist/2014-favorites-january-3-2015')
    expect(tags.get('og:url')?.content).not.toContain('undefined')
    route.path = '/artist/booker-t-the-mgs'
    route.params.slug = 'booker-t-the-mgs'
    await nextTick()
    expect(tags.get('og:description')?.content).toContain('1 track appearance in')
    playlists.value = []
    await nextTick()
    route.path = '/tracks'
    route.params.slug = ''
    playlists.value = [playlist]
    await nextTick()
    expect(fakeDocument.title).toBe('All Tracks - Cyprus Avenue Archive')
    expect(tags.get('og:type')?.content).toBe('website')
    expect(tags.get('twitter:title')?.content).toBe(fakeDocument.title)
  } finally { scope.stop() }
})

it('includes the configured deployment base exactly once in public links', async () => {
  const { getPublicUrl } = await import('../src/utils/urls')
  expect(getPublicUrl('/playlist/favorites?track=A%26B', 'https://example.test', '/cyprus-avenue/'))
    .toBe('https://example.test/cyprus-avenue/playlist/favorites?track=A%26B')
  expect(getPublicUrl('/artists', 'https://example.test', '/')).toBe('https://example.test/artists')
})
