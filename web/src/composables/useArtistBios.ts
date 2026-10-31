import { parseArtistBios } from '../../../shared/archive.mjs'
import { biographyText } from '../utils/biographyText'
import { ref } from 'vue'
import type { ArtistBio, ArtistBiosIndex } from '../types/artistBio'

// Singleton state for the artist bios index
const biosIndex = ref<ArtistBiosIndex>({})
const indexLoaded = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
let loadPromise: Promise<void> | null = null
const cacheTimestamp = ref<number>(0)

// Cache duration: 15 minutes (same as Spotify index)
const CACHE_DURATION = 15 * 60 * 1000

export function useArtistBios() {
  /**
   * Load the artist bios index from JSON file
   */
  const loadBiosIndex = (): Promise<void> => {
    if (loadPromise) return loadPromise
    if (indexLoaded.value && Date.now() - cacheTimestamp.value < CACHE_DURATION) {
      return Promise.resolve()
    }

    isLoading.value = true
    error.value = null
    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}artist-bios.json`)
        if (!response.ok) throw new Error(`Artist bios: HTTP ${response.status}`)
        const rawBios = parseArtistBios(await response.json())
        biosIndex.value = Object.fromEntries(Object.entries(rawBios).map(([artist, bio]) => [artist, {
          ...bio,
          ...(bio.bio !== undefined ? { bio: biographyText(bio.bio) } : {}),
          ...(bio.bioSummary !== undefined ? { bioSummary: biographyText(bio.bioSummary) } : {})
        }]))
        indexLoaded.value = true
        cacheTimestamp.value = Date.now()
      } catch (err) {
        // Enrichment is optional. Retain successful data and allow the next call to retry.
        error.value = err instanceof Error ? err.message : 'Artist bios unavailable'
      } finally {
        isLoading.value = false
        loadPromise = null
      }
    })()
    return loadPromise
  }

  /**
   * Get bio for a specific artist
   */
  const getBio = (artistName: string): ArtistBio | null => {
    if (!indexLoaded.value) return null

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
    const withLastfmTags = artists.filter(name => (biosIndex.value[name]?.lastfmTags?.length ?? 0) > 0).length
    const withTags = artists.filter(name => (biosIndex.value[name]?.tags?.length ?? 0) > 0).length

    return {
      totalArtists: artists.length,
      withImages,
      withLastfmTags,
      withTags, // Consolidated tags from all sources
      loaded: indexLoaded.value
    }
  }

  return {
    biosIndex,
    indexLoaded,
    isLoading,
    error,
    loadBiosIndex,
    getBio,
    hasBio,
    getStats
  }
}
