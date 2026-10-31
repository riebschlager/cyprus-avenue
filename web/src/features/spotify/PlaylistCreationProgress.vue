<script setup lang="ts">
import { computed } from 'vue'
import type { CreationProgress } from './spotify'

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
  <div v-if="isCreating" class="progress">
    <div>
      <span class="ca-label">Creating playlist</span>
      <p class="progress__name">{{ progress.playlistName }}</p>
    </div>

    <div>
      <span class="ca-label">Now matching</span>
      <p class="progress__track">{{ progress.currentArtist }} &mdash; {{ progress.currentTrackName }}</p>
    </div>

    <div>
      <div class="progress__bar" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
        <span :style="{ width: `${progressPercent}%` }"></span>
      </div>
      <div class="progress__counts">
        <span class="ca-label ca-label--sm">{{ progress.currentTrackIndex }} / {{ progress.totalTracks }} &middot; {{ progressPercent }}%</span>
        <span class="ca-label ca-label--sm">{{ remainingTracks }} remaining</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress { display: flex; flex-direction: column; gap: var(--space-5); }
.progress__name { margin-top: 4px; font: 700 18px/1.2 var(--font-display); letter-spacing: -0.015em; color: var(--fg-1); }
.progress__track { margin-top: 4px; font: var(--type-ui); color: var(--fg-1); }
.progress__bar { height: 4px; background: var(--paper-200); overflow: hidden; }
.progress__bar span { display: block; height: 100%; background: var(--orange-500); transition: width var(--dur-slow) var(--ease-out); }
.progress__counts { display: flex; justify-content: space-between; margin-top: 8px; }
</style>
