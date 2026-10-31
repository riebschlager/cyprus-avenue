<script setup lang="ts">
import { stampArchiveDate } from '../utils/archiveDate'

defineProps<{
  stats: {
    totalPlaylists: number
    totalTracks: number
    avgTracksPerShow: number
    dateRange: { start: string; end: string } | null
  }
}>()

</script>

<template>
  <div class="ca-stats stats-panel">
    <div class="ca-stat">
      <span class="ca-stat__value">{{ stats.totalPlaylists.toLocaleString() }}</span>
      <span class="ca-label">Shows</span>
    </div>
    <div class="ca-stat">
      <span class="ca-stat__value">{{ stats.totalTracks.toLocaleString() }}</span>
      <span class="ca-label">Tracks</span>
    </div>
    <div class="ca-stat">
      <span class="ca-stat__value">{{ stats.avgTracksPerShow.toFixed(1) }}</span>
      <span class="ca-label">Avg tracks per show</span>
    </div>
    <div v-if="stats.dateRange" class="ca-stat">
      <span class="ca-stat__value">{{ stats.dateRange.start.slice(0, 4) }}&ndash;{{ stats.dateRange.end.slice(2, 4) }}</span>
      <span class="ca-label">{{ stampArchiveDate(stats.dateRange.start) }} &ndash; {{ stampArchiveDate(stats.dateRange.end) }}</span>
    </div>
  </div>
</template>

<style scoped>
.stats-panel .ca-stat__value { font-size: 40px; }
</style>
