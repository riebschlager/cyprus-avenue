export interface SpotifyAuthState {
  isAuthenticated: boolean
  isAuthenticating: boolean
  accessToken: string | null
  error: string | null
}

export interface SpotifyUser {
  id: string
  display_name: string
  external_urls: {
    spotify: string
  }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  external_urls: {
    spotify: string
  }
  uri: string
}

export interface SpotifyTrackMatch {
  artist: string
  song: string
  spotifyId: string | null
  spotifyUri: string | null
  confidence: 'high' | 'medium' | 'low' | 'not_found'
}

export interface PlaylistCreationResult {
  success: boolean
  playlistId: string
  playlistUrl: string
  playlistName: string
  tracksAdded: number
  tracksFailed: number
  notFound: Array<{ artist: string; song: string }>
  error?: string
}

export interface CreationProgress {
  currentTrackIndex: number
  totalTracks: number
  currentTrackName: string
  currentArtist: string
  playlistName: string
}

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
