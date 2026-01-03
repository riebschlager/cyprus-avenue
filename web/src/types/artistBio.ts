export interface GenreSources {
  lastfm: number
  spotifyArtist: number
  spotifyTracks: number
  total: number
}

export interface ArtistBio {
  // Last.fm data
  bio: string
  bioSummary: string
  tags: string[] // Original Last.fm tags
  url: string
  listeners: number
  playcount: number

  // Spotify data
  image: string
  spotifyId?: string
  spotifyUrl?: string
  popularity?: number
  followers?: number

  // Consolidated genre data
  genres?: string[] // Merged from Last.fm tags + Spotify artist genres + track genres
  genreSources?: GenreSources
}

export interface ArtistBiosIndex {
  [artistName: string]: ArtistBio
}
