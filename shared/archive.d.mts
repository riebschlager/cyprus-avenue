export interface Track {
  artist: string
  song: string
  genres?: string[]
}
export interface Playlist {
  date: string
  title: string
  description: string
  tracks: Track[]
  source_url: string
  archived_date: string
}
export interface TagSources {
  lastfm?: number
  spotifyArtist?: number
  spotifyTracks?: number
  total?: number
}
export interface ArtistBio {
  bio?: string
  bioSummary?: string
  lastfmTags?: string[]
  url?: string
  listeners?: number
  playcount?: number
  image?: string
  spotifyId?: string
  spotifyUrl?: string
  spotifyGenres?: string[]
  popularity?: number
  followers?: number
  tags?: string[]
  genres?: string[]
  tagSources?: TagSources
  genreSources?: TagSources
}
export type ArtistBiosIndex = Record<string, ArtistBio>
export interface SpotifyTrackData {
  spotifyId: string
  spotifyUrl: string
  previewUrl?: string | null
  albumArt?: string | null
  artistName: string
  trackName: string
  genres?: string[]
  confidence: 'high' | 'medium' | 'low'
}
export type SpotifyIndex = Record<string, SpotifyTrackData>
export function parsePlaylists(value: unknown): Playlist[]
export function parseArtistBios(value: unknown): ArtistBiosIndex
export function parseSpotifyIndex(value: unknown): SpotifyIndex
