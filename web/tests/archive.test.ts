import { describe, expect, it } from 'vitest'
import { formatArchiveDate, parseArchiveDate } from '../src/utils/archiveDate'
import { generatePlaylistSlug, findPlaylistBySlug, generateArtistSlug } from '../src/utils/slug'
import { normalizeAndFilterTag, normalizeTags } from '../src/utils/tagFilters'
import type { Playlist } from '../src/types/playlist'

const playlist: Playlist = {
  title: 'Cyprus Avenue: 2014 Favorites', date: '2015-01-03', description: '',
  tracks: [{ artist: 'Rosanne Cash', song: 'A Feather' }], source_url: 'https://example.test',
  archived_date: '2025-12-31'
}

describe(`archive links and dates in ${process.env.TZ}`, () => {
  it('keeps calendar dates and slugs stable across year boundaries and leap days', () => {
    expect(formatArchiveDate(playlist.date)).toBe('January 3, 2015')
    expect(formatArchiveDate('2016-02-29', 'short')).toBe('Feb 29, 2016')
    expect(formatArchiveDate('2015-01-01')).toBe('January 1, 2015')
    expect(generatePlaylistSlug(playlist.title, playlist.date)).toBe('2014-favorites-january-3-2015')
    expect(generateArtistSlug('Booker T. & The MG’s')).toBe('booker-t-the-mgs')
    expect(() => parseArchiveDate('2015-02-29')).toThrow('Invalid archive date')
  })
  it('resolves canonical and previously shared Chicago links to the same record', () => {
    expect(findPlaylistBySlug([playlist], '2014-favorites-january-3-2015')).toBe(playlist)
    expect(findPlaylistBySlug([playlist], '2014-favorites-january-2-2015')).toBe(playlist)
    expect(findPlaylistBySlug([playlist], 'missing')).toBeNull()
  })
})

it('normalizes aliases and removes provider noise without duplicate categories', () => {
  expect(normalizeTags([' rnb ', 'R&B', 'Hip Hop', 'Hip-Hop', 'Seen Live', '60s'])).toEqual(['R&B', 'Hip-Hop'])
  expect(normalizeAndFilterTag('rock')).toBe('Rock & Roll')
  expect(normalizeAndFilterTag('Blue Grass')).toBe('Bluegrass')
  const tags = normalizeTags(['Singer-Songwriters', 'Alt-Country', 'Boogie-Woogie', 'R&B'])
  expect(normalizeTags(tags)).toEqual(tags)
})
