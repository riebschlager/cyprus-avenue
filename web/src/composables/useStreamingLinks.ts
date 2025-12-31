import { ref } from 'vue'

export interface StreamingPlatform {
  name: string
  icon: string
  color: string
  getUrl: (artist: string, song: string, spotifyIndex?: SpotifyIndex) => string
}

export interface SpotifyTrackData {
  spotifyId: string
  spotifyUrl: string
  previewUrl: string | null
  albumArt: string | null
  artistName: string
  trackName: string
  confidence: 'high' | 'medium' | 'low'
}

export type SpotifyIndex = Record<string, SpotifyTrackData>

// Spotify index loaded from JSON
const spotifyIndex = ref<SpotifyIndex>({})
const indexLoaded = ref(false)
const indexLoading = ref(false)

export const streamingPlatforms: StreamingPlatform[] = [
  {
    name: 'Spotify',
    icon: '🎵',
    color: 'bg-green-600 hover:bg-green-700',
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
    color: 'bg-pink-600 hover:bg-pink-700',
    getUrl: (artist: string, song: string) => {
      const query = encodeURIComponent(`${artist} ${song}`)
      return `https://music.apple.com/us/search?term=${query}`
    }
  },
  {
    name: 'YouTube Music',
    icon: '▶️',
    color: 'bg-red-600 hover:bg-red-700',
    getUrl: (artist: string, song: string) => {
      const query = encodeURIComponent(`${artist} ${song}`)
      return `https://music.youtube.com/search?q=${query}`
    }
  }
]

export function useStreamingLinks() {
  // Load Spotify index on first use
  const loadSpotifyIndex = async () => {
    if (indexLoaded.value || indexLoading.value) return

    indexLoading.value = true

    try {
      const response = await fetch('/spotify-index.json')
      if (response.ok) {
        spotifyIndex.value = await response.json()
        indexLoaded.value = true
        console.log(`✓ Loaded Spotify index with ${Object.keys(spotifyIndex.value).length} tracks`)
      }
    } catch (err) {
      console.warn('Spotify index not available, using search fallback')
    } finally {
      indexLoading.value = false
    }
  }

  // Load index immediately
  loadSpotifyIndex()

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
    indexLoaded,
    spotifyIndex
  }
}
