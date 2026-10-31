export type PlaylistAction =
  | { action: 'create-playlist'; mode: 'single'; playlistSlug: string }
  | { action: 'create-playlist'; mode: 'all-tracks' }
  | { action: 'create-playlist'; mode: 'artist'; artistName: string }
  | { action: 'create-playlist'; mode: 'tag'; tag: string }
export type PendingSpotifyAction = PlaylistAction | { action: 'playback'; spotifyUri: string; artist?: string; song?: string }

export function readPendingAction(key = 'spotify_pending_action'): PendingSpotifyAction | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (value?.action === 'playback' && typeof value.spotifyUri === 'string' && value.spotifyUri.startsWith('spotify:track:')) return value
    if (value?.action === 'create-playlist') {
      if (value.mode === 'all-tracks') return value
      const field = ({ single: 'playlistSlug', artist: 'artistName', tag: 'tag' } as Record<string, string>)[value.mode]
      if (field && typeof value[field] === 'string' && value[field]) return value
    }
  } catch { /* Discard stale or malformed context. */ }
  sessionStorage.removeItem(key)
  return null
}

// The root Spotify action host is the sole consumer, before any asynchronous work.
export function takePendingAction(): PendingSpotifyAction | null {
  const action = readPendingAction()
  sessionStorage.removeItem('spotify_pending_action')
  return action
}
