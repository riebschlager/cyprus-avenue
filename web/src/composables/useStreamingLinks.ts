import { ref } from 'vue'

export interface StreamingPlatform {
  name: string
  icon: string
  getUrl: (artist: string, song: string, spotifyIndex?: SpotifyIndex) => string
}

export interface SpotifyTrackData {
  spotifyId: string
  spotifyUrl: string
  previewUrl: string | null
  albumArt: string | null
  artistName: string
  trackName: string
  genres?: string[]
  confidence: 'high' | 'medium' | 'low'
}

export type SpotifyIndex = Record<string, SpotifyTrackData>

// Spotify index loaded from JSON
const spotifyIndex = ref<SpotifyIndex>({})
const indexLoaded = ref(false)
const indexLoading = ref(false)
const indexError = ref<string | null>(null)
let indexPromise: Promise<void> | null = null

export const streamingPlatforms: StreamingPlatform[] = [
  {
    name: 'Spotify',
    icon: '🎧',
    getUrl: (artist: string, song: string, index?: SpotifyIndex) => {
      // Try to get direct link from index
      const key = `${artist}|${song}`
      const indexed = index?.[key]

      // Use direct link if confidence is high or medium
      if (indexed && indexed.confidence !== 'low') {
        return indexed.spotifyUrl
      }

      // Fallback to search
      const query = encodeURIComponent(`${artist} ${song}`)
      return `https://open.spotify.com/search/${query}`
    }
  },
  {
    name: 'Apple Music',
    icon: '🍎',
    getUrl: (artist: string, song: string) => {
      const query = encodeURIComponent(`${artist} ${song}`)
      return `music://search?term=${query}`
    }
  },
  {
    name: 'YouTube Music',
    icon: '▶️',
    getUrl: (artist: string, song: string) => {
      const query = encodeURIComponent(`${artist} ${song}`)
      return `https://music.youtube.com/search?q=${query}`
    }
  }
]

export function useStreamingLinks() {
  // Load Spotify index on first use
  const loadSpotifyIndex = (): Promise<void> => {
    if (indexLoaded.value) return Promise.resolve()
    if (indexPromise) return indexPromise
    indexLoading.value = true
    indexError.value = null
    indexPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}spotify-index.json`)
        if (!response.ok) throw new Error(`Spotify index: HTTP ${response.status}`)
        spotifyIndex.value = await response.json()
        indexLoaded.value = true
      } catch (error) {
        indexError.value = error instanceof Error ? error.message : 'Spotify index unavailable'
        throw error
      } finally {
        indexLoading.value = false
        indexPromise = null
      }
    })()
    return indexPromise
  }

  // Load index immediately
  void loadSpotifyIndex().catch(() => {})

  const openTrack = (platform: StreamingPlatform, artist: string, song: string) => {
    const url = platform.getUrl(artist, song, spotifyIndex.value)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const hasDirectLink = (artist: string, song: string): boolean => {
    if (!indexLoaded.value) return false
    const key = `${artist}|${song}`
    const indexed = spotifyIndex.value[key]
    return !!(indexed && (indexed.confidence === 'high' || indexed.confidence === 'medium'))
  }

  const getTrackData = (artist: string, song: string): SpotifyTrackData | null => {
    const key = `${artist}|${song}`
    return spotifyIndex.value[key] || null
  }

  return {
    platforms: streamingPlatforms,
    openTrack,
    hasDirectLink,
    getTrackData,
    loadSpotifyIndex,
    indexLoading,
    indexError,
    indexLoaded,
    spotifyIndex
  }
}
