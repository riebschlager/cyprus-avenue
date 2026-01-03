import { ref, computed } from 'vue'
import type { Playlist } from '../types/playlist'

export type SearchFilter = 'playlist' | 'artist' | 'song'

// Create singleton state outside the function
const playlists = ref<Playlist[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const searchFilters = ref<SearchFilter[]>(['playlist', 'artist', 'song'])

let fetchPromise: Promise<void> | null = null

export function usePlaylists() {
  const fetchPlaylists = async () => {
    if (playlists.value.length > 0) return
    // Return existing promise if already fetching
    if (fetchPromise) return fetchPromise

    loading.value = true
    error.value = null

    fetchPromise = (async () => {
      try {
        const response = await fetch('/playlists.json')
        if (!response.ok) {
          throw new Error('Failed to fetch playlists')
        }
        playlists.value = await response.json()
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'An error occurred'
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  const filteredPlaylists = computed(() => {
    if (!searchQuery.value.trim()) {
      return playlists.value
    }

    const query = searchQuery.value.toLowerCase()

    return playlists.value.filter(playlist => {
      // Search in playlist title/description
      if (searchFilters.value.includes('playlist')) {
        if (playlist.title.toLowerCase().includes(query) ||
            playlist.description.toLowerCase().includes(query)) {
          return true
        }
      }

      // Search in artist names
      if (searchFilters.value.includes('artist')) {
        if (playlist.tracks.some(track => track.artist.toLowerCase().includes(query))) {
          return true
        }
      }

      // Search in song titles
      if (searchFilters.value.includes('song')) {
        if (playlist.tracks.some(track => track.song.toLowerCase().includes(query))) {
          return true
        }
      }

      return false
    })
  })

  const stats = computed(() => {
    const totalPlaylists = playlists.value.length
    const totalTracks = playlists.value.reduce((sum, p) => sum + p.tracks.length, 0)
    const avgTracksPerShow = totalPlaylists > 0 ? totalTracks / totalPlaylists : 0

    const dates = playlists.value
      .map(p => p.date)
      .filter((d): d is string => !!d)
      .sort()

    const dateRange = dates.length > 0 ? {
      start: dates[0] as string,
      end: dates[dates.length - 1] as string
    } : null

    return {
      totalPlaylists,
      totalTracks,
      avgTracksPerShow,
      dateRange
    }
  })

  const toggleSearchFilter = (filter: SearchFilter) => {
    const index = searchFilters.value.indexOf(filter)
    if (index > -1) {
      // Remove filter only if there are other filters selected
      if (searchFilters.value.length > 1) {
        searchFilters.value.splice(index, 1)
      }
    } else {
      // Add filter
      searchFilters.value.push(filter)
    }
  }

  const isFilterActive = (filter: SearchFilter) => {
    return searchFilters.value.includes(filter)
  }

  return {
    playlists,
    loading,
    error,
    searchQuery,
    searchFilters,
    filteredPlaylists,
    stats,
    fetchPlaylists,
    toggleSearchFilter,
    isFilterActive
  }
}
