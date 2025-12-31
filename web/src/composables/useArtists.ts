import { computed, ref } from 'vue'
import type { Playlist } from '../types/playlist'

export interface ArtistTrack {
  song: string
  playlistTitle: string
  playlistDate: string
}

export interface Artist {
  name: string
  tracks: ArtistTrack[]
  uniqueSongs: string[]
  playlistCount: number
}

export function useArtists(playlists: Playlist[]) {
  const searchQuery = ref('')

  // Build artist map
  const artists = computed(() => {
    const artistMap = new Map<string, ArtistTrack[]>()

    playlists.forEach(playlist => {
      playlist.tracks.forEach(track => {
        const artistName = track.artist
        if (!artistMap.has(artistName)) {
          artistMap.set(artistName, [])
        }
        artistMap.get(artistName)!.push({
          song: track.song,
          playlistTitle: playlist.title,
          playlistDate: playlist.date
        })
      })
    })

    // Convert to Artist array
    const artistList: Artist[] = []
    artistMap.forEach((tracks, name) => {
      const uniqueSongs = [...new Set(tracks.map(t => t.song))]
      const uniquePlaylists = new Set(tracks.map(t => `${t.playlistDate}|${t.playlistTitle}`))

      artistList.push({
        name,
        tracks,
        uniqueSongs,
        playlistCount: uniquePlaylists.size
      })
    })

    // Sort by name
    return artistList.sort((a, b) => a.name.localeCompare(b.name))
  })

  // Filter artists by search query
  const filteredArtists = computed(() => {
    if (!searchQuery.value) {
      return artists.value
    }

    const query = searchQuery.value.toLowerCase()
    return artists.value.filter(artist => {
      return artist.name.toLowerCase().includes(query) ||
             artist.uniqueSongs.some(song => song.toLowerCase().includes(query))
    })
  })

  return {
    searchQuery,
    artists,
    filteredArtists
  }
}
