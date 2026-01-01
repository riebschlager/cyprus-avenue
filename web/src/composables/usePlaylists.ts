import { ref, computed } from 'vue'
import type { Playlist } from '../types/playlist'

// Create singleton state outside the function
const playlists = ref<Playlist[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

let fetchPromise: Promise<void> | null = null

export function usePlaylists() {
  const fetchPlaylists = async () => {
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
      // Search in title
      if (playlist.title.toLowerCase().includes(query)) {
        return true
      }

      // Search in description
      if (playlist.description.toLowerCase().includes(query)) {
        return true
      }

      // Search in artist names
      if (playlist.tracks.some(track => track.artist.toLowerCase().includes(query))) {
        return true
      }

      // Search in song titles
      if (playlist.tracks.some(track => track.song.toLowerCase().includes(query))) {
        return true
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

  return {
    playlists,
    loading,
    error,
    searchQuery,
    filteredPlaylists,
    stats,
    fetchPlaylists
  }
}
