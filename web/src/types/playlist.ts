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
