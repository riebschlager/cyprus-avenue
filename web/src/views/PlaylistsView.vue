<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import { useOpenGraph } from '../composables/useOpenGraph'
import SearchBar from '../components/SearchBar.vue'
import StatsPanel from '../components/StatsPanel.vue'
import PlaylistList from '../components/PlaylistList.vue'
import { findPlaylistBySlug } from '../utils/slug'
import { downloadAllPlaylists } from '../utils/downloadFormats'

const route = useRoute()
const { loading, error, playlists, searchQuery, filteredPlaylists, stats, fetchPlaylists } = usePlaylists()
const { setOpenGraphTags, getPlaylistOG, getDefaultOG } = useOpenGraph()
const showDownloadMenu = ref(false)

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
    <div v-if="loading && playlists.length === 0" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-950/50 border border-red-800 rounded-lg p-4">
      <p class="text-red-300">{{ error }}</p>
    </div>

    <div v-else>
      <StatsPanel :stats="stats" />

      <!-- Download Archive Button -->
      <div class="mt-6 flex justify-center">
        <div class="relative inline-block">
          <button
            @click="showDownloadMenu = !showDownloadMenu"
            class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 font-semibold py-2 px-6 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Complete Archive
          </button>

          <!-- Download Format Menu -->
          <div
            v-if="showDownloadMenu"
            @click="showDownloadMenu = false"
            class="absolute left-1/2 -translate-x-1/2 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10"
          >
            <button
              @click="downloadAllPlaylists(playlists, 'json')"
              class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors rounded-t-lg"
            >
              JSON
            </button>
            <button
              @click="downloadAllPlaylists(playlists, 'csv')"
              class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
            >
              CSV
            </button>
            <button
              @click="downloadAllPlaylists(playlists, 'txt')"
              class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors rounded-b-lg"
            >
              Text
            </button>
          </div>
        </div>
      </div>

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
