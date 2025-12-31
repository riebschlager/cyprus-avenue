<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { Playlist } from '../types/playlist'
import StreamingLinks from './StreamingLinks.vue'
import { useStreamingLinks } from '../composables/useStreamingLinks'

const props = defineProps<{
  playlist: Playlist
  isExpanded: boolean
  searchQuery: string
}>()

const emit = defineEmits<{
  toggle: []
}>()

const { getTrackData } = useStreamingLinks()
const cardRef = ref<HTMLElement | null>(null)

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getAlbumArt = (artist: string, song: string): string | null => {
  const trackData = getTrackData(artist, song)
  return trackData?.albumArt || null
}

// Scroll to top of card when expanded
watch(() => props.isExpanded, (newVal) => {
  if (newVal && cardRef.value) {
    nextTick(() => {
      cardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
})
</script>

<template>
  <div ref="cardRef" class="bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-700">
    <button
      @click="emit('toggle')"
      class="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    >
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
            {{ playlist.date }}
          </span>
          <h3 class="text-lg font-semibold text-white truncate">
            {{ playlist.title }}
          </h3>
        </div>
        <p class="mt-1 text-sm text-gray-300 line-clamp-2">
          {{ playlist.description }}
        </p>
        <p class="mt-2 text-xs text-gray-400">
          {{ playlist.tracks.length }} track{{ playlist.tracks.length === 1 ? '' : 's' }}
        </p>
      </div>
      <svg
        class="ml-4 h-5 w-5 text-gray-400 transition-transform flex-shrink-0"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="isExpanded" class="px-6 pb-4 border-t border-gray-700">
      <div class="mt-4">
        <h4 class="text-sm font-semibold text-white mb-3">Track List</h4>
        <div class="space-y-2">
          <div
            v-for="(track, index) in playlist.tracks"
            :key="index"
            class="flex items-start gap-3 py-2 px-3 rounded hover:bg-gray-700/50"
          >
            <span class="text-sm text-gray-500 font-mono min-w-[2rem]">{{ index + 1 }}.</span>

            <!-- Album Art (only loads when expanded) -->
            <div v-if="getAlbumArt(track.artist, track.song)" class="flex-shrink-0">
              <img
                :src="getAlbumArt(track.artist, track.song)!"
                :alt="`${track.song} by ${track.artist}`"
                class="w-12 h-12 rounded shadow-sm object-cover"
                loading="lazy"
              />
            </div>
            <div v-else class="flex-shrink-0 w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white">{{ track.song }}</p>
              <p class="text-xs text-gray-400">{{ track.artist }}</p>
            </div>
            <div class="flex-shrink-0">
              <StreamingLinks :artist="track.artist" :song="track.song" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-700">
        <p class="text-xs text-gray-400">
          Original broadcast: {{ formatDate(playlist.date) }}
        </p>
      </div>
    </div>
  </div>
</template>
