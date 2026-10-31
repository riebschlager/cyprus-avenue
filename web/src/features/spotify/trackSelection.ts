import type { Playlist, Track } from '../../types/playlist'
import type { ArtistBiosIndex } from '../../types/artistBio'
import { deduplicateTracks } from './trackMatching'
import { normalizeAndFilterTag } from '../../utils/tagFilters'
import { PLAYLIST_NAME_INDIVIDUAL, PLAYLIST_NAME_ALL_TRACKS, PLAYLIST_NAME_ARTIST, PLAYLIST_NAME_TAG } from './spotifyConstants'

export interface TrackSelection {
  tracks: Track[]
  name: string
  description: string
  skipApiSearch: boolean
  delayMs: number
}
// Show order and repeats are preserved; other modes deduplicate exact artist/song pairs.
export const selectShow = (playlist: Playlist): TrackSelection => ({
  tracks: playlist.tracks, name: PLAYLIST_NAME_INDIVIDUAL(playlist.date),
  description: playlist.title, skipApiSearch: false, delayMs: 150
})
export const selectArchive = (playlists: Playlist[]): TrackSelection => ({
  tracks: deduplicateTracks(playlists.flatMap(p => p.tracks)), name: PLAYLIST_NAME_ALL_TRACKS,
  description: `All unique tracks from ${playlists.length} Cyprus Avenue shows`, skipApiSearch: true, delayMs: 1
})
export const selectArtist = (artist: string, playlists: Playlist[]): TrackSelection => ({
  tracks: deduplicateTracks(playlists.flatMap(p => p.tracks).filter(t => t.artist.toLowerCase() === artist.toLowerCase())),
  name: PLAYLIST_NAME_ARTIST(artist), description: `Tracks by ${artist} from the Cyprus Avenue archive`,
  skipApiSearch: false, delayMs: 100
})
export const selectTag = (tag: string, playlists: Playlist[], bios: ArtistBiosIndex): TrackSelection => ({
  tracks: deduplicateTracks(playlists.flatMap(p => p.tracks).filter(track => {
    const bio = bios[track.artist]
    return (bio?.tags || bio?.lastfmTags || []).map(normalizeAndFilterTag).includes(tag)
  })), name: PLAYLIST_NAME_TAG(tag),
  description: `${tag.charAt(0).toUpperCase() + tag.slice(1)} music from the Cyprus Avenue archive`,
  skipApiSearch: true, delayMs: 1
})
