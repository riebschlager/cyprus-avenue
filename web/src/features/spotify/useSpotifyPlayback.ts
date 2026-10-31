import { ref } from 'vue'
import { spotifyRequest } from './spotifyApi'
import { useSpotifyAuth, onSpotifyLogout } from './useSpotifyAuth'

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

const playbackError = ref<string | null>(null)
let generation = 0
const resetPlayer = () => {
  generation++
  player.value?.disconnect()
  player.value = null
  deviceId.value = null
  isReady.value = false
  isActive.value = false
  isPaused.value = true
  currentTrack.value = null
  playbackError.value = null
  isInitializing.value = false
}
onSpotifyLogout(resetPlayer)

let sdkReadyPromise: Promise<void> | null = null

const loadSdk = (): Promise<void> => {
  if (sdkReadyPromise) return sdkReadyPromise

  sdkReadyPromise = new Promise<void>((resolve, reject) => {
    if (window.Spotify) { resolve(); return }
    const script = document.createElement('script')
    const timer = window.setTimeout(() => fail(), 15000)
    const cleanup = () => { window.clearTimeout(timer); window.onSpotifyWebPlaybackSDKReady = undefined }
    const ready = () => { cleanup(); resolve() }
    const fail = () => {
      cleanup()
      script.remove()
      reject(new Error('Spotify player could not load. Check your connection and retry.'))
    }
    window.onSpotifyWebPlaybackSDKReady = ready
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    script.onload = () => { if (window.Spotify) ready() }
    script.onerror = fail
    document.head.appendChild(script)
  }).catch(error => { sdkReadyPromise = null; throw error })

  return sdkReadyPromise
}

export function useSpotifyPlayback() {
  const { getValidAccessToken, isAuthenticated } = useSpotifyAuth()

  const initializePlayer = async () => {
    if (player.value || isInitializing.value) return
    isInitializing.value = true
    playbackError.value = null
    const started = generation

    try {
      await loadSdk()
      if (started !== generation || !isAuthenticated.value) return

      const sdk = window.Spotify as unknown as { Player: Spotify.PlayerConstructor }
      player.value = new sdk.Player({
        name: 'Cyprus Avenue Web Player',
        getOAuthToken: async (cb) => {
          try {
            const token = await getValidAccessToken()
            cb(token)
          } catch (err) {
            playbackError.value = err instanceof Error ? err.message : 'Connect to Spotify again.'
          }
        }
      })

      const instance = player.value
      const addListener: Spotify.Player['addListener'] = (event, callback) => instance.addListener(event, arg => {
        if (started === generation && player.value === instance) callback(arg)
      })

      addListener('ready', ({ device_id }) => {
        deviceId.value = device_id
        isReady.value = true
      })

      addListener('not_ready', ({ device_id }) => {
        if (deviceId.value === device_id) {
          deviceId.value = null
          isReady.value = false
        }
      })

      addListener('player_state_changed', (state) => {
        if (!state) {
          isActive.value = false
          return
        }

        isActive.value = true
        isPaused.value = state.paused
        currentTrack.value = state.track_window.current_track as PlaybackTrack
      })

      addListener('initialization_error', ({ message }) => {
        playbackError.value = message
      })
      addListener('authentication_error', ({ message }) => {
        playbackError.value = message
      })
      addListener('account_error', ({ message }) => {
        playbackError.value = message
      })
      addListener('playback_error', ({ message }) => {
        playbackError.value = message
      })

      if (!await player.value.connect()) throw new Error('Spotify player connection failed. Retry connection.')
    } catch (error) {
      resetPlayer()
      playbackError.value = error instanceof Error ? error.message : 'Spotify player unavailable'
      throw error
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
    try {
      await ensureReady()
      playbackError.value = null
      await spotifyRequest<void>('/me/player/play?device_id=' + deviceId.value, {
        method: 'PUT', body: JSON.stringify({ uris: [uri] })
      })
    } catch (error) {
      playbackError.value = error instanceof Error ? error.message : 'Playback failed. Try again.'
      throw error
    }
  }

  const togglePlay = async () => {
    if (!player.value) return
    try { await player.value.togglePlay() }
    catch (error) { playbackError.value = error instanceof Error ? error.message : 'Playback failed. Try again.' }
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
    playbackError,
    resetPlayer,
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
