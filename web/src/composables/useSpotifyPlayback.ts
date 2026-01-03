import { ref } from 'vue'
import { useSpotifyAuth } from './useSpotifyAuth'

type PlaybackTrack = {
  name: string
  artists: Array<{ name: string }>
  album: { name: string; images: Array<{ url: string }> }
  uri: string
}

const player = ref<Spotify.Player | null>(null)
const deviceId = ref<string | null>(null)
const isReady = ref(false)
const isActive = ref(false)
const isPaused = ref(true)
const currentTrack = ref<PlaybackTrack | null>(null)
const isInitializing = ref(false)

let sdkReadyPromise: Promise<void> | null = null

const loadSdk = (): Promise<void> => {
  if (sdkReadyPromise) return sdkReadyPromise

  sdkReadyPromise = new Promise((resolve, reject) => {
    if ((window as any).Spotify) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    script.onload = () => {
      if ((window as any).Spotify) {
        resolve()
      }
    }
    script.onerror = () => reject(new Error('Failed to load Spotify SDK'))
    document.head.appendChild(script)

    ;(window as any).onSpotifyWebPlaybackSDKReady = () => resolve()
  })

  return sdkReadyPromise
}

export function useSpotifyPlayback() {
  const { getValidAccessToken, isAuthenticated } = useSpotifyAuth()

  const initializePlayer = async () => {
    if (player.value || isInitializing.value) return
    isInitializing.value = true

    try {
      await loadSdk()

      const sdk = (window as any).Spotify as { Player: Spotify.PlayerConstructor }
      player.value = new sdk.Player({
        name: 'Cyprus Avenue Web Player',
        getOAuthToken: async (cb) => {
          try {
            const token = await getValidAccessToken()
            cb(token)
          } catch (err) {
            console.error('Failed to get Spotify token', err)
          }
        }
      })

      player.value.addListener('ready', ({ device_id }) => {
        deviceId.value = device_id
        isReady.value = true
      })

      player.value.addListener('not_ready', ({ device_id }) => {
        if (deviceId.value === device_id) {
          deviceId.value = null
          isReady.value = false
        }
      })

      player.value.addListener('player_state_changed', (state) => {
        if (!state) {
          isActive.value = false
          return
        }

        isActive.value = true
        isPaused.value = state.paused
        currentTrack.value = state.track_window.current_track as PlaybackTrack
      })

      player.value.addListener('initialization_error', ({ message }) => {
        console.error('Spotify player init error', message)
      })
      player.value.addListener('authentication_error', ({ message }) => {
        console.error('Spotify player auth error', message)
      })
      player.value.addListener('account_error', ({ message }) => {
        console.error('Spotify player account error', message)
      })
      player.value.addListener('playback_error', ({ message }) => {
        console.error('Spotify player playback error', message)
      })

      await player.value.connect()
    } finally {
      isInitializing.value = false
    }
  }

  const ensureReady = async () => {
    if (!isAuthenticated.value) {
      throw new Error('Spotify authentication required')
    }
    await initializePlayer()
    if (!deviceId.value) {
      await new Promise<void>((resolve, reject) => {
        const start = Date.now()
        const interval = window.setInterval(() => {
          if (deviceId.value) {
            window.clearInterval(interval)
            resolve()
            return
          }
          if (Date.now() - start > 5000) {
            window.clearInterval(interval)
            reject(new Error('Spotify player device not available'))
          }
        }, 100)
      })
    }
  }

  const playTrack = async (uri: string) => {
    await ensureReady()
    const token = await getValidAccessToken()
    await fetch('https://api.spotify.com/v1/me/player/play?device_id=' + deviceId.value, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris: [uri] })
    })
  }

  const togglePlay = async () => {
    if (!player.value) return
    await player.value.togglePlay()
  }

  const nextTrack = async () => {
    if (!player.value) return
    await player.value.nextTrack()
  }

  const previousTrack = async () => {
    if (!player.value) return
    await player.value.previousTrack()
  }

  return {
    isReady,
    isActive,
    isPaused,
    currentTrack,
    isInitializing,
    initializePlayer,
    playTrack,
    togglePlay,
    nextTrack,
    previousTrack
  }
}
