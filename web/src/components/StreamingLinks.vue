<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStreamingLinks } from '../composables/useStreamingLinks'
import { useDropdownState } from '../composables/useDropdownState'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'
import { useSpotifyPlayback } from '../composables/useSpotifyPlayback'

const props = defineProps<{
  artist: string
  song: string
  compact?: boolean
}>()

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

const filteredPlatforms = computed(() => {
  if (spotifyTrackUri.value) {
    return platforms.filter(platform => platform.name !== 'Spotify')
  }
  return platforms
})

const toggleDropdown = () => {
  toggle()
}

const handlePlatformClick = (platform: typeof platforms[0]) => {
  openTrack(platform, props.artist, props.song)
  close()
}

const handleSpotifyPlay = async () => {
  if (!spotifyTrackUri.value) return
  if (!isAuthenticated.value) {
    await initiateLogin(router.currentRoute.value.fullPath)
    return
  }

  try {
    await initializePlayer()
    await playTrack(spotifyTrackUri.value)
    close()
  } catch (err) {
    console.error('Failed to start Spotify playback', err)
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
  <div ref="dropdownRef" class="relative inline-block text-left">
    <button
      @click.stop="toggleDropdown"
      :class="[
        'inline-flex items-center text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        compact ? 'p-1' : 'px-2 py-1'
      ]"
      title="Listen on streaming platforms"
    >
      <svg :class="[compact ? 'w-4 h-4' : 'w-4 h-4 mr-1']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span v-if="!compact">Listen</span>
    </button>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 shadow-xl ring-1 ring-gray-700 focus:outline-none border border-gray-700"
      >
        <div class="py-1">
          <button
            v-if="spotifyTrackUri"
            @click.stop="handleSpotifyPlay"
            class="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <div class="flex items-center">
              <span class="mr-2">▶️</span>
              Spotify
            </div>
            <span
              v-if="isAuthenticated"
              class="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-semibold"
              title="Plays in this app"
            >
              App
            </span>
          </button>

          <button
            v-for="platform in filteredPlatforms"
            :key="platform.name"
            @click.stop="handlePlatformClick(platform)"
            class="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <div class="flex items-center">
              <span class="mr-2">{{ platform.icon }}</span>
              {{ platform.name }}
            </div>
            <span
              v-if="!spotifyTrackUri && platform.name === 'Spotify'"
              class="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded font-semibold"
              title="Spotify match not found; opens search"
            >
              Search
            </span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
