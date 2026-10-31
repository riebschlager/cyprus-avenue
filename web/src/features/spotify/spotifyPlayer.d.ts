export {}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: typeof Spotify
  }

  namespace Spotify {
    interface PlaybackState {
      paused: boolean
      track_window: {
        current_track: SpotifyTrack
      }
    }

    interface SpotifyTrack {
      name: string
      artists: Array<{ name: string }>
      album: { name: string; images: Array<{ url: string }> }
      uri: string
    }

    interface PlayerInit {
      name: string
      getOAuthToken: (cb: (token: string) => void) => void
      volume?: number
    }

    interface PlayerEvents {
      ready: { device_id: string }
      not_ready: { device_id: string }
      player_state_changed: PlaybackState | null
      initialization_error: { message: string }
      authentication_error: { message: string }
      account_error: { message: string }
      playback_error: { message: string }
    }

    interface Player {
      connect(): Promise<boolean>
      disconnect(): void
      addListener<K extends keyof PlayerEvents>(event: K, cb: (arg: PlayerEvents[K]) => void): boolean
      togglePlay(): Promise<void>
      nextTrack(): Promise<void>
      previousTrack(): Promise<void>
    }

    interface PlayerConstructor {
      new (init: PlayerInit): Player
    }
  }
}
