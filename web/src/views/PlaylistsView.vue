<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import { useOpenGraph } from '../composables/useOpenGraph'
import SearchBar from '../components/SearchBar.vue'
import StatsPanel from '../components/StatsPanel.vue'
import PlaylistList from '../components/PlaylistList.vue'
import { findPlaylistBySlug } from '../utils/slug'

const route = useRoute()
const { loading, error, playlists, searchQuery, filteredPlaylists, stats, fetchPlaylists } = usePlaylists()
const { setOpenGraphTags, getPlaylistOG, getDefaultOG } = useOpenGraph()

onMounted(() => {
  fetchPlaylists()
})

onUnmounted(() => {
  searchQuery.value = ''
})

// Track which playlist should be auto-expanded from URL
const autoExpandSlug = ref<string | null>(null)

// Watch for slug parameter in route
watch(() => route.params.slug, (slug) => {
  if (typeof slug === 'string') {
    autoExpandSlug.value = slug
    // Update OG tags when viewing a specific playlist
    const playlist = findPlaylistBySlug(playlists.value, slug)
    if (playlist) {
      setOpenGraphTags(getPlaylistOG(playlist))
    }
  } else {
    // Reset to default OG tags if no slug
    autoExpandSlug.value = null
    setOpenGraphTags(getDefaultOG())
  }
}, { immediate: true })

// Find the playlist to auto-expand
const playlistToExpand = computed(() => {
  if (!autoExpandSlug.value) return null
  return findPlaylistBySlug(playlists.value, autoExpandSlug.value)
})

// Update page title when viewing a specific playlist
watch(playlistToExpand, (playlist) => {
  if (playlist) {
    document.title = `${playlist.title} - Cyprus Avenue Archive`
  } else {
    document.title = 'Playlists - Cyprus Avenue Archive'
  }
}, { immediate: true })
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-950/50 border border-red-800 rounded-lg p-4">
      <p class="text-red-300">{{ error }}</p>
    </div>

    <div v-else>
      <StatsPanel :stats="stats" />

      <div class="mt-8">
        <SearchBar v-model="searchQuery" />
      </div>

      <div class="mt-8">
        <PlaylistList
          :playlists="filteredPlaylists"
          :search-query="searchQuery"
          :auto-expand-playlist="playlistToExpand"
        />
      </div>
    </div>
  </div>
</template>
