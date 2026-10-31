<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import SpotifyAuthButton from './SpotifyAuthButton.vue'
import Icon from '../../components/Icon.vue'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useSpotifyPlayback } from './useSpotifyPlayback'

const { isAuthenticated } = useSpotifyAuth()
const { isReady, isPaused, currentTrack, initializePlayer, togglePlay, nextTrack, previousTrack, playbackError, resetPlayer } = useSpotifyPlayback()

const initializeIfAuthenticated = async () => {
  if (!isAuthenticated.value) return
  try {
    await initializePlayer()

  } catch (err) {
    // The playback composable exposes initialization errors in the player.
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

const trackName = computed(() => currentTrack.value?.name ?? 'Nothing playing')
const trackArtists = computed(() => currentTrack.value?.artists.map(a => a.name).join(', ') ?? 'Spotify web player')
const isPlaying = computed(() => isReady.value && !isPaused.value)

const albumArt = computed(() => {
  return currentTrack.value?.album?.images?.[0]?.url ?? null
})
</script>

<template>
  <div class="ca-player__progress" aria-hidden="true"></div>
  <div class="ca-player__inner">
    <div class="ca-player__now">
      <img v-if="albumArt" :src="albumArt" alt="" class="ca-player__art" />
      <div v-else class="ca-player__art"><Icon name="disc-3" /></div>
      <div class="ca-player__text">
        <span class="ca-player__title" :title="trackTitle">{{ trackName }}</span>
        <span class="ca-player__artist">{{ trackArtists }}</span>
      </div>
    </div>

    <div class="ca-player__controls">
      <SpotifyAuthButton v-if="!isAuthenticated" />
      <template v-else>
        <button type="button" class="ca-iconbtn ca-skip" aria-label="Previous track" :disabled="!isReady" @click="previousTrack">
          <Icon name="skip-back" />
        </button>
        <button type="button" class="ca-play" :aria-label="isPaused ? 'Play' : 'Pause'" :disabled="!isReady" @click="togglePlay">
          <Icon :name="isPaused ? 'play' : 'pause'" />
        </button>
        <button type="button" class="ca-iconbtn ca-skip" aria-label="Next track" :disabled="!isReady" @click="nextTrack">
          <Icon name="skip-forward" />
        </button>
      </template>
    </div>

    <div class="ca-player__right">
      <p v-if="playbackError" role="alert" class="ca-player__source player-error">
        {{ playbackError }}
        <button type="button" class="ca-btn ca-btn--link player-retry" @click="resetPlayer(); initializeIfAuthenticated()">Retry</button>
      </p>
      <template v-else>
        <span class="ca-eq" :class="{ 'ca-eq--playing': isPlaying }" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </span>
        <span class="ca-player__source">
          <span class="ca-stream__dot player-dot"></span>
          Playing via Spotify
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ca-play:disabled { opacity: .4; cursor: not-allowed; transform: none; }
.ca-player__source { display: inline-flex; align-items: center; gap: 8px; }
.player-dot { background: var(--brand-spotify); }
.player-error { color: #F08A7E; white-space: normal; }
.player-retry { color: var(--orange-300); font-size: 12px; }
</style>
