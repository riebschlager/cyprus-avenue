<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStreamingLinks } from '../composables/useStreamingLinks'
import { useDropdownState } from '../composables/useDropdownState'
import { useToast } from '../composables/useToast'
import { useSpotifyAuth } from '../features/spotify/useSpotifyAuth'
import { useSpotifyPlayback } from '../features/spotify/useSpotifyPlayback'
import Icon from './Icon.vue'

const props = defineProps<{
  artist: string
  song: string
  compact?: boolean
}>()

const { error: showError } = useToast()
const router = useRouter()
const { platforms, openTrack, indexLoaded, getTrackData } = useStreamingLinks()
const { isAuthenticated, initiateLogin } = useSpotifyAuth()
const { playTrack, initializePlayer } = useSpotifyPlayback()
const dropdownRef = ref<HTMLElement | null>(null)

// Create unique ID for this dropdown instance
const dropdownId = `streaming-${props.artist}-${props.song}-${Math.random()}`
const { isOpen, toggle, close, currentOpenDropdownId } = useDropdownState(dropdownId)

const spotifyTrackUri = computed(() => {
  if (!indexLoaded.value) return null
  const trackData = getTrackData(props.artist, props.song)
  if (!trackData || trackData.confidence === 'low' || !trackData.spotifyId) {
    return null
  }
  return `spotify:track:${trackData.spotifyId}`
})

const brandColors: Record<string, string> = {
  'Spotify': 'var(--brand-spotify)',
  'Apple Music': 'var(--brand-apple)',
  'YouTube Music': 'var(--brand-youtube)'
}

const toggleDropdown = () => {
  toggle()
}

const handlePlatformClick = (platform: typeof platforms[0]) => {
  openTrack(platform, props.artist, props.song)
  close()
}

const handleSpotifyPlay = async () => {
  if (!spotifyTrackUri.value) return
  try {
    if (!isAuthenticated.value) {
      await initiateLogin(router.currentRoute.value.fullPath, {
        action: 'playback',
        spotifyUri: spotifyTrackUri.value,
        artist: props.artist,
        song: props.song
      })
      return
    }

    await initializePlayer()
    await playTrack(spotifyTrackUri.value)
    close()
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Could not start Spotify playback')
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

// Watch for changes to currentOpenDropdownId and close if another dropdown opens
watch(currentOpenDropdownId, (newId) => {
  if (newId !== dropdownId && isOpen.value) {
    isOpen.value = false
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <span ref="dropdownRef" class="ca-stream">
    <button
      type="button"
      @click.stop="toggleDropdown"
      class="ca-iconbtn ca-iconbtn--sm"
      :class="isOpen ? 'ca-iconbtn--active' : 'ca-reveal'"
      :aria-expanded="isOpen"
      aria-label="Listen elsewhere"
      title="Listen elsewhere"
    >
      <Icon name="audio-lines" />
    </button>

    <transition name="stream-menu">
      <div v-if="isOpen" class="ca-menu stream-menu" role="menu">
        <div class="ca-menu__label"><span class="ca-label ca-label--sm">Listen on</span></div>
        <button
          v-if="spotifyTrackUri"
          type="button"
          role="menuitem"
          @click.stop="handleSpotifyPlay"
          class="ca-menu__item"
        >
          <Icon name="play" />
          Play here
          <span class="ca-menu__hint" :title="isAuthenticated ? 'Plays in this app' : 'Connect Spotify to play'">
            {{ isAuthenticated ? 'Spotify' : 'Connect' }}
          </span>
        </button>
        <div v-if="spotifyTrackUri" class="ca-menu__sep"></div>

        <button
          v-for="platform in platforms"
          :key="platform.name"
          type="button"
          role="menuitem"
          @click.stop="handlePlatformClick(platform)"
          class="ca-menu__item"
        >
          <span class="ca-stream__dot" :style="{ background: brandColors[platform.name] ?? 'var(--fg-3)' }"></span>
          {{ platform.name }}
          <span
            class="ca-menu__hint"
            :title="!spotifyTrackUri && platform.name === 'Spotify' ? 'Spotify match not found; opens search' : undefined"
          >{{ !spotifyTrackUri && platform.name === 'Spotify' ? 'Search ↗' : '↗' }}</span>
        </button>
      </div>
    </transition>
  </span>
</template>

<style scoped>
.stream-menu { position: absolute; right: 0; top: calc(100% + 4px); text-align: left; }
.stream-menu-enter-active { transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out); }
.stream-menu-leave-active { transition: opacity 80ms var(--ease-out); }
.stream-menu-enter-from { opacity: 0; transform: translateY(-4px); }
.stream-menu-leave-to { opacity: 0; }
</style>
