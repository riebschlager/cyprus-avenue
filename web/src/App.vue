<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlaylists } from './composables/usePlaylists'
import PlaylistList from './components/PlaylistList.vue'
import SearchBar from './components/SearchBar.vue'
import StatsPanel from './components/StatsPanel.vue'

const { loading, error, searchQuery, filteredPlaylists, stats, fetchPlaylists } = usePlaylists()

onMounted(() => {
  fetchPlaylists()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-900">Cyprus Avenue Archive</h1>
        <p class="mt-2 text-sm text-gray-600">
          Browse playlists from KCUR's Cyprus Avenue radio show
        </p>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <div v-else>
        <StatsPanel :stats="stats" />

        <div class="mt-8">
          <SearchBar v-model="searchQuery" />
        </div>

        <div class="mt-8">
          <PlaylistList :playlists="filteredPlaylists" :search-query="searchQuery" />
        </div>
      </div>
    </main>

    <footer class="bg-white border-t border-gray-200 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-sm text-gray-500">
          Cyprus Avenue Archive &middot;
          <a href="https://www.kcur.org/tags/cyprus-avenue" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800">
            KCUR Cyprus Avenue
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
