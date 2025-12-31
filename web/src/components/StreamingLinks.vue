<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStreamingLinks } from '../composables/useStreamingLinks'

const props = defineProps<{
  artist: string
  song: string
}>()

const { platforms, openTrack, hasDirectLink, getTrackData, indexLoaded } = useStreamingLinks()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const hasSpotifyLink = computed(() => {
  // This computed depends on indexLoaded to trigger re-evaluation
  if (!indexLoaded.value) return false
  const result = hasDirectLink(props.artist, props.song)
  console.log(`Checking ${props.artist} - ${props.song}:`, result)
  return result
})
const trackData = computed(() => getTrackData(props.artist, props.song))

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const handlePlatformClick = (platform: typeof platforms[0]) => {
  openTrack(platform, props.artist, props.song)
  isOpen.value = false
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

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
      class="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      title="Listen on streaming platforms"
    >
      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Listen
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
            v-for="platform in platforms"
            :key="platform.name"
            @click.stop="handlePlatformClick(platform)"
            class="flex items-center justify-between w-full px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
            :class="platform.color"
          >
            <div class="flex items-center">
              <span class="mr-2">{{ platform.icon }}</span>
              {{ platform.name }}
            </div>
            <span
              v-if="platform.name === 'Spotify' && hasSpotifyLink"
              class="text-xs bg-white text-green-600 px-2 py-0.5 rounded font-semibold"
              title="Direct link available"
            >
              ✓
            </span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>
