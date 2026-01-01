<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Artist } from '../composables/useArtists'
import StreamingLinks from './StreamingLinks.vue'

const props = defineProps<{
  artist: Artist
  isExpanded: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const cardRef = ref<HTMLElement | null>(null)

// Group tracks by playlist
const playlistsWithTracks = computed(() => {
  const playlistMap = new Map<string, { date: string; title: string; songs: string[] }>()

  props.artist.tracks.forEach(track => {
    const key = `${track.playlistDate}|${track.playlistTitle}`
    if (!playlistMap.has(key)) {
      playlistMap.set(key, {
        date: track.playlistDate,
        title: track.playlistTitle,
        songs: []
      })
    }
    playlistMap.get(key)!.songs.push(track.song)
  })

  // Convert to array and sort by date (newest first)
  return Array.from(playlistMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  )
})

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
        <h3 class="text-lg font-semibold text-white">
          {{ artist.name }}
        </h3>
        <div class="mt-2 flex gap-4 text-xs text-gray-400">
          <span>{{ artist.uniqueSongs.length }} unique song{{ artist.uniqueSongs.length === 1 ? '' : 's' }}</span>
          <span>{{ artist.playlistCount }} playlist{{ artist.playlistCount === 1 ? '' : 's' }}</span>
        </div>
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
      <!-- Unique Songs Section -->
      <div class="mt-4">
        <h4 class="text-sm font-semibold text-white mb-3">Unique Songs</h4>
        <div class="space-y-2">
          <div
            v-for="(song, index) in artist.uniqueSongs"
            :key="index"
            class="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-700/50"
          >
            <span class="text-sm text-gray-500 font-mono min-w-[2rem]">{{ index + 1 }}.</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white">{{ song }}</p>
            </div>
            <div class="flex-shrink-0">
              <StreamingLinks :artist="artist.name" :song="song" />
            </div>
          </div>
        </div>
      </div>

      <!-- Playlists Section -->
      <div class="mt-6 pt-4 border-t border-gray-700">
        <h4 class="text-sm font-semibold text-white mb-3">Appears In</h4>
        <div class="space-y-3">
          <div
            v-for="(playlist, index) in playlistsWithTracks"
            :key="index"
            class="py-2 px-3 rounded hover:bg-gray-700/50"
          >
            <div class="flex items-baseline gap-2 mb-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                {{ playlist.date }}
              </span>
              <p class="text-sm text-gray-300">{{ playlist.title }}</p>
            </div>
            <ul class="ml-[4.5rem] space-y-1">
              <li
                v-for="(song, songIndex) in playlist.songs"
                :key="songIndex"
                class="text-xs text-gray-500"
              >
                {{ song }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
