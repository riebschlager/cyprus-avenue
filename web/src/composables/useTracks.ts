import { computed, ref } from 'vue'
import type { Playlist } from '../types/playlist'

export interface TrackWithPlaylist {
  artist: string
  song: string
  playlistTitle: string
  playlistDate: string
  playlistDescription: string
}

export type SortField = 'artist' | 'song' | 'playlistTitle' | 'playlistDate'
export type SortDirection = 'asc' | 'desc'

export function useTracks(playlists: Playlist[]) {
  const searchQuery = ref('')
  const sortField = ref<SortField>('playlistDate')
  const sortDirection = ref<SortDirection>('desc')

  // Flatten all tracks from all playlists
  const allTracks = computed<TrackWithPlaylist[]>(() => {
    const tracks: TrackWithPlaylist[] = []

    playlists.forEach(playlist => {
      playlist.tracks.forEach(track => {
        tracks.push({
          artist: track.artist,
          song: track.song,
          playlistTitle: playlist.title,
          playlistDate: playlist.date,
          playlistDescription: playlist.description
        })
      })
    })

    return tracks
  })

  // Filter tracks based on search query
  const filteredTracks = computed(() => {
    if (!searchQuery.value.trim()) {
      return allTracks.value
    }

    const query = searchQuery.value.toLowerCase()

    return allTracks.value.filter(track => {
      return (
        track.artist.toLowerCase().includes(query) ||
        track.song.toLowerCase().includes(query) ||
        track.playlistTitle.toLowerCase().includes(query) ||
        track.playlistDate.includes(query)
      )
    })
  })

  // Sort tracks
  const sortedTracks = computed(() => {
    const tracks = [...filteredTracks.value]

    tracks.sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sortField.value) {
        case 'artist':
          aValue = a.artist.toLowerCase()
          bValue = b.artist.toLowerCase()
          break
        case 'song':
          aValue = a.song.toLowerCase()
          bValue = b.song.toLowerCase()
          break
        case 'playlistTitle':
          aValue = a.playlistTitle.toLowerCase()
          bValue = b.playlistTitle.toLowerCase()
          break
        case 'playlistDate':
          aValue = a.playlistDate
          bValue = b.playlistDate
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    })

    return tracks
  })

  const setSortField = (field: SortField) => {
    if (sortField.value === field) {
      // Toggle direction if clicking the same field
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortDirection.value = 'asc'
    }
  }

  return {
    searchQuery,
    sortField,
    sortDirection,
    allTracks,
    sortedTracks,
    setSortField
  }
}
