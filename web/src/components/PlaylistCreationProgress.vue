<script setup lang="ts">
import { computed } from 'vue'
import type { CreationProgress } from '../types/spotify'

const props = defineProps<{
  progress: CreationProgress
  isCreating: boolean
}>()

const progressPercent = computed(() => {
  if (props.progress.totalTracks === 0) return 0
  return Math.round((props.progress.currentTrackIndex / props.progress.totalTracks) * 100)
})

const remainingTracks = computed(() => {
  return props.progress.totalTracks - props.progress.currentTrackIndex
})
</script>

<template>
  <div v-if="isCreating" class="space-y-4">
    <!-- Playlist Name -->
    <div>
      <h3 class="text-sm font-semibold text-white mb-2">Creating playlist:</h3>
      <p class="text-sm text-gray-300">{{ progress.playlistName }}</p>
    </div>

    <!-- Current Track -->
    <div>
      <h4 class="text-xs font-medium text-gray-400 mb-2">Now processing:</h4>
      <p class="text-sm text-white">{{ progress.currentArtist }} - {{ progress.currentTrackName }}</p>
    </div>

    <!-- Progress Bar -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-gray-400">Progress</span>
        <span class="text-xs text-gray-400">
          {{ progress.currentTrackIndex }} / {{ progress.totalTracks }} ({{ progressPercent }}%)
        </span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          class="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Remaining Tracks Estimate -->
    <p class="text-xs text-gray-400 text-center">
      {{ remainingTracks }} track{{ remainingTracks !== 1 ? 's' : '' }} remaining
    </p>

    <!-- Loading Animation -->
    <div class="flex justify-center">
      <svg class="w-6 h-6 animate-spin text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </div>
  </div>
</template>
