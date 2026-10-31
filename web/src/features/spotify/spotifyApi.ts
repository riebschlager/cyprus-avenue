import { useSpotifyAuth } from './useSpotifyAuth'
import type { SpotifyPlaylist, SpotifyUser } from './spotify'
import { SPOTIFY_API_BASE, SPOTIFY_BATCH_SIZE } from './spotifyConstants'

interface SpotifyApiClientType {
  getCurrentUser(): Promise<SpotifyUser>
  createPlaylist(userId: string, name: string, isPublic?: boolean, description?: string): Promise<SpotifyPlaylist>
  addTracksToPlaylist(playlistId: string, trackUris: string[], onBatchAdded?: (count: number) => void): Promise<void>
  searchTrack(artist: string, song: string): Promise<{ id: string; uri: string } | null>
}

export async function spotifyRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { getValidAccessToken } = useSpotifyAuth()
  const token = await getValidAccessToken()
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, { ...options, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const advice = response.status === 401 ? ' Connect to Spotify again.'
      : response.status === 403 ? ' Check your Spotify account permissions; playback requires Premium.'
      : response.status === 429 ? ' Wait a moment before trying again.' : ''
    throw new Error((body.error?.message || `Spotify API error: ${response.status}`) + advice)
  }
  return response.status === 204 ? undefined as T : response.json()
}

export function SpotifyApiClient(): SpotifyApiClientType {
  const request = spotifyRequest

  return {
    async getCurrentUser(): Promise<SpotifyUser> {
      return request<SpotifyUser>('/me')
    },

    async createPlaylist(
      userId: string,
      name: string,
      isPublic: boolean = false,
      description: string = ''
    ): Promise<SpotifyPlaylist> {
      return request<SpotifyPlaylist>(`/users/${userId}/playlists`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          public: isPublic,
          description
        })
      })
    },

    async addTracksToPlaylist(
      playlistId: string,
      trackUris: string[],
      onBatchAdded?: (count: number) => void
    ): Promise<void> {
      // Batch tracks into groups of SPOTIFY_BATCH_SIZE with delay between batches
      for (let i = 0; i < trackUris.length; i += SPOTIFY_BATCH_SIZE) {
        const batch = trackUris.slice(i, i + SPOTIFY_BATCH_SIZE)
        await request(`/playlists/${playlistId}/tracks`, {
          method: 'POST',
          body: JSON.stringify({
            uris: batch
          })
        })
        onBatchAdded?.(i + batch.length)
        // Add delay between batch requests to avoid rate limiting
        // Spotify has strict rate limits, especially when combined with search requests
        // Using 1 second (1000ms) delay between batches provides safe margin
        // For 1500 tracks in 15 batches = ~15 seconds of delays + API time
        if (i + SPOTIFY_BATCH_SIZE < trackUris.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    },

    async searchTrack(
      artist: string,
      song: string
    ): Promise<{ id: string; uri: string } | null> {
      const query = encodeURIComponent(`artist:"${artist}" track:"${song}"`)
      const result = await request<{ tracks: { items: Array<{ id: string; uri: string }> } }>(`/search?q=${query}&type=track&limit=1`)

      if (result.tracks.items.length > 0) {
        const track = result.tracks.items[0]!
        return {
          id: track.id,
          uri: track.uri
        }
      }

      return null
    }
  }
}
