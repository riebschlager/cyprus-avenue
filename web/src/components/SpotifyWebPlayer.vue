<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import SpotifyAuthButton from './SpotifyAuthButton.vue'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'
import { useSpotifyPlayback } from '../composables/useSpotifyPlayback'

const { isAuthenticated } = useSpotifyAuth()
const { isReady, isPaused, currentTrack, initializePlayer, togglePlay, playTrack } = useSpotifyPlayback()

const consumePendingPlayback = async () => {
  const raw = sessionStorage.getItem('spotify_pending_action')
  if (!raw) return
  try {
    const action = JSON.parse(raw)
    if (action?.action !== 'playback' || !action.spotifyUri) return
    await playTrack(action.spotifyUri)
    sessionStorage.removeItem('spotify_pending_action')
  } catch (err) {
    console.error('Failed to consume pending playback action', err)
  }
}

const initializeIfAuthenticated = async () => {
  if (!isAuthenticated.value) return
  try {
    await initializePlayer()
    await consumePendingPlayback()
  } catch (err) {
    console.error('Failed to initialize Spotify playback', err)
  }
}

onMounted(() => {
  initializeIfAuthenticated().catch((err) => {
    console.error('Failed to resume playback on mount', err)
  })
})

watch(isAuthenticated, (value) => {
  if (value) {
    initializeIfAuthenticated().catch((err) => {
      console.error('Failed to resume playback after auth', err)
    })
  }
})

const trackTitle = computed(() => {
  if (!currentTrack.value) return 'No track playing'
  const artists = currentTrack.value.artists.map(a => a.name).join(', ')
  return `${currentTrack.value.name} - ${artists}`
})

const albumArt = computed(() => {
  return currentTrack.value?.album?.images?.[0]?.url ?? null
})
</script>

<template>
  <div class="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded bg-gray-800 flex items-center justify-center overflow-hidden text-xs font-semibold text-gray-400">
          <img v-if="albumArt" :src="albumArt" alt="" class="w-full h-full object-cover" />
          <span v-else>SP</span>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Spotify Web Player</p>
          <p class="text-sm text-white truncate">{{ trackTitle }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <SpotifyAuthButton v-if="!isAuthenticated" />
        <div v-else class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 hover:text-blue-200 hover:bg-blue-500/30 transition-colors text-xs font-semibold"
            @click="togglePlay"
            title="Play/Pause"
            :disabled="!isReady"
          >
            {{ isPaused ? 'Play' : 'Pause' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
