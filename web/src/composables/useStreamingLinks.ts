export interface StreamingPlatform {
  name: string
  icon: string
  color: string
  getUrl: (artist: string, song: string) => string
}

export const streamingPlatforms: StreamingPlatform[] = [
  {
    name: 'Spotify',
    icon: '🎵',
    color: 'bg-green-600 hover:bg-green-700',
    getUrl: (artist: string, song: string) => {
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
  const openTrack = (platform: StreamingPlatform, artist: string, song: string) => {
    const url = platform.getUrl(artist, song)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return {
    platforms: streamingPlatforms,
    openTrack
  }
}
