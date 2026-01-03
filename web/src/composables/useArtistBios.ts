import { ref } from 'vue'
import type { ArtistBio, ArtistBiosIndex } from '../types/artistBio'

// Singleton state for the artist bios index
const biosIndex = ref<ArtistBiosIndex>({})
const indexLoaded = ref(false)
const isLoading = ref(false)
const cacheTimestamp = ref<number>(0)

// Cache duration: 15 minutes (same as Spotify index)
const CACHE_DURATION = 15 * 60 * 1000

export function useArtistBios() {
  /**
   * Load the artist bios index from JSON file
   */
  const loadBiosIndex = async (): Promise<void> => {
    // Check if we have a fresh cache
    const now = Date.now()
    if (indexLoaded.value && now - cacheTimestamp.value < CACHE_DURATION) {
      return
    }

    // Prevent concurrent loading
    if (isLoading.value) {
      // Wait for existing load to complete
      while (isLoading.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return
    }

    isLoading.value = true

    try {
      const response = await fetch('/artist-bios.json')
      if (!response.ok) {
        console.warn('Artist bios file not found, using empty index')
        biosIndex.value = {}
        indexLoaded.value = true
        return
      }

      const data = await response.json()
      biosIndex.value = data
      indexLoaded.value = true
      cacheTimestamp.value = now
      console.log(`✓ Loaded ${Object.keys(data).length} artist bios`)
    } catch (error) {
      console.error('Failed to load artist bios:', error)
      biosIndex.value = {}
      indexLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get bio for a specific artist
   */
  const getBio = (artistName: string): ArtistBio | null => {
    if (!indexLoaded.value) {
      console.warn('Artist bios index not loaded yet')
      return null
    }

    return biosIndex.value[artistName] || null
  }

  /**
   * Check if an artist has a bio
   */
  const hasBio = (artistName: string): boolean => {
    if (!indexLoaded.value) return false
    return artistName in biosIndex.value
  }

  /**
   * Get stats about the bios index
   */
  const getStats = () => {
    const artists = Object.keys(biosIndex.value)
    const withImages = artists.filter(name => biosIndex.value[name]?.image).length
    const withTags = artists.filter(name => (biosIndex.value[name]?.tags?.length ?? 0) > 0).length
    const withGenres = artists.filter(name => (biosIndex.value[name]?.genres?.length ?? 0) > 0).length

    return {
      totalArtists: artists.length,
      withImages,
      withTags,
      withGenres, // Consolidated genres from all sources
      loaded: indexLoaded.value
    }
  }

  return {
    biosIndex,
    indexLoaded,
    loadBiosIndex,
    getBio,
    hasBio,
    getStats
  }
}
