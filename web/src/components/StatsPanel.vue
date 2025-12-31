<script setup lang="ts">
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
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-gray-900 mb-4">Archive Statistics</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="border-l-4 border-blue-500 pl-4">
        <p class="text-sm text-gray-600">Total Playlists</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.totalPlaylists }}</p>
      </div>
      <div class="border-l-4 border-green-500 pl-4">
        <p class="text-sm text-gray-600">Total Tracks</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.totalTracks.toLocaleString() }}</p>
      </div>
      <div class="border-l-4 border-purple-500 pl-4">
        <p class="text-sm text-gray-600">Avg Tracks/Show</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.avgTracksPerShow.toFixed(1) }}</p>
      </div>
      <div v-if="stats.dateRange" class="border-l-4 border-orange-500 pl-4">
        <p class="text-sm text-gray-600">Date Range</p>
        <p class="text-sm font-semibold text-gray-900">
          {{ stats.dateRange.start }} to<br>{{ stats.dateRange.end }}
        </p>
      </div>
    </div>
  </div>
</template>
