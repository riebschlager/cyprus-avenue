export interface TagSources {
  lastfm: number
  spotifyArtist: number
  spotifyTracks: number
  total: number
}

export interface ArtistBio {
  // Last.fm data
  bio: string
  bioSummary: string
  lastfmTags: string[] // Original Last.fm tags only
  url: string
  listeners: number
  playcount: number

  // Spotify data
  image: string
  spotifyId?: string
  spotifyUrl?: string
  popularity?: number
  followers?: number

  // Consolidated tag data
  tags?: string[] // Merged from Last.fm tags + Spotify artist genres + track genres
  tagSources?: TagSources
}

export interface ArtistBiosIndex {
  [artistName: string]: ArtistBio
}
