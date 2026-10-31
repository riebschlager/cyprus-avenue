import { readFileSync } from 'node:fs'
import { afterEach, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { parsePlaylists, parseArtistBios, parseSpotifyIndex } from '../../shared/archive.mjs'
import { usePagination } from '../src/composables/usePagination'

const read = (name: string) => JSON.parse(readFileSync(new URL(`../public/${name}.json`, import.meta.url), 'utf8'))
afterEach(() => vi.unstubAllGlobals())

it('accepts the retained archive and metadata without changing provider fields', () => {
  const playlists = read('playlists')
  const bios = read('artist-bios')
  const spotify = read('spotify-index')
  expect(parsePlaylists(playlists)).toBe(playlists)
  expect(parseArtistBios(bios)).toBe(bios)
  expect(parseSpotifyIndex(spotify)).toBe(spotify)
  expect(playlists).toHaveLength(125)
})

it('rejects malformed datasets, impossible dates, duplicate shows, and executable metadata URLs', () => {
  expect(() => parsePlaylists({})).toThrow('playlists')
  const [playlist] = read('playlists')
  expect(() => parsePlaylists([{ ...playlist, date: '2015-02-29' }])).toThrow('.date')
  expect(() => parsePlaylists([playlist, playlist])).toThrow('duplicate')
  expect(() => parsePlaylists([{ ...playlist, tracks: [{ artist: null, song: 'Song' }] }])).toThrow('.artist')
  expect(() => parseArtistBios({ Artist: { tags: ['Soul', 1] } })).toThrow('.tags')
  expect(() => parseArtistBios({ Artist: { url: 'javascript:alert(1)' } })).toThrow('.url')
  expect(() => parseArtistBios({ Artist: { tagSources: { total: -1 } } })).toThrow('.total')
  const track = { spotifyId: 'id', spotifyUrl: 'https://open.spotify.com/track/id', artistName: 'Artist', trackName: 'Song', confidence: 'high' }
  expect(parseSpotifyIndex({ 'Artist|Song': { ...track, previewUrl: null, albumArt: null } })).toBeTruthy()
  expect(() => parseSpotifyIndex({ 'Artist|Song': { ...track, confidence: 'sure' } })).toThrow('.confidence')
  expect(() => parseSpotifyIndex({ 'Artist|Song': { ...track, albumArt: 'data:text/html,bad' } })).toThrow('.albumArt')
})

it('rejects an invalid archive shape and allows a later valid retry', async () => {
  vi.resetModules()
  const response = (value: unknown) => new Response(JSON.stringify(value))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ playlists: [] })).mockResolvedValueOnce(response([])))
  const { usePlaylists } = await import('../src/composables/usePlaylists')
  const archive = usePlaylists()
  await archive.fetchPlaylists()
  expect(archive.loaded.value).toBe(false)
  expect(archive.error.value).toContain('Invalid archive data')
  expect(archive.playlists.value).toEqual([])
  await archive.fetchPlaylists()
  expect(archive.loaded.value).toBe(true)
  expect(archive.error.value).toBeNull()
})

it('keeps pagination in bounds when a filtered or replaced dataset shrinks', () => {
  vi.stubGlobal('window', { scrollTo: vi.fn() })
  const items = ref(Array.from({ length: 45 }, (_, i) => i))
  const scope = effectScope()
  try {
    const pagination = scope.run(() => usePagination(items))!
    pagination.changePage(3)
    expect(pagination.displayedRange.value).toBe('41-45')
    items.value = [1, 2, 3]
    expect(pagination.currentPage.value).toBe(1)
    expect(pagination.paginatedItems.value).toEqual([1, 2, 3])
    pagination.changePage(2)
    expect(pagination.currentPage.value).toBe(1)
    items.value = []
    expect(pagination.displayedRange.value).toBe('0')
    expect(pagination.currentPage.value).toBe(1)
  } finally { scope.stop() }
})
