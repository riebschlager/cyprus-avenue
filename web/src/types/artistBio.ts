export interface ArtistBio {
  bio: string
  bioSummary: string
  tags: string[]
  url: string
  image: string
  listeners: number
  playcount: number
}

export interface ArtistBiosIndex {
  [artistName: string]: ArtistBio
}
