const isDevelopment = import.meta.env.DEV

export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'b25edf93f14d4719b07ee8ee7b842032'

export const SPOTIFY_REDIRECT_URI = isDevelopment
  ? 'http://localhost:5173/auth/callback'
  : 'https://cyprus-avenue.netlify.app/auth/callback'

export const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
export const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export const SPOTIFY_SCOPES = [
  'playlist-modify-public',
  'playlist-modify-private'
]

export const PLAYLIST_NAME_INDIVIDUAL = (date: string) => `Cyprus Avenue - ${date}`
export const PLAYLIST_NAME_TAG = (tag: string) => `Cyprus Avenue - ${tag.charAt(0).toUpperCase() + tag.slice(1)}`
export const PLAYLIST_NAME_ARTIST = (artist: string) => `Cyprus Avenue - ${artist}`
export const PLAYLIST_NAME_ALL_TRACKS = 'Cyprus Avenue - Complete Archive'

export const SPOTIFY_BATCH_SIZE = 100 // Max tracks per API call
export const TOAST_DURATION = 5000 // ms
