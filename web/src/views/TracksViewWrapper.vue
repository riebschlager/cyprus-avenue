<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlaylists } from '../composables/usePlaylists'
import TracksView from '../components/TracksView.vue'

const { playlists, loading, error, fetchPlaylists } = usePlaylists()

onMounted(() => {
  fetchPlaylists()
})
</script>

<template>
  <div>
    <div v-if="loading && playlists.length === 0" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-950/50 border border-red-800 rounded-lg p-4">
      <p class="text-red-300">{{ error }}</p>
    </div>

    <TracksView v-else :playlists="playlists" />
  </div>
</template>
