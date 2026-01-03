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

    interface Player {
      connect(): Promise<boolean>
      disconnect(): void
      addListener(event: string, cb: (arg?: any) => void): boolean
      togglePlay(): Promise<void>
      nextTrack(): Promise<void>
      previousTrack(): Promise<void>
    }

    interface PlayerConstructor {
      new (init: PlayerInit): Player
    }
  }
}
