<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePlaylists } from './composables/usePlaylists'
import HomePage from './components/HomePage.vue'
import PlaylistList from './components/PlaylistList.vue'
import SearchBar from './components/SearchBar.vue'
import StatsPanel from './components/StatsPanel.vue'
import TracksView from './components/TracksView.vue'

type View = 'home' | 'playlists' | 'tracks'

const currentView = ref<View>('home')

const { loading, error, playlists, searchQuery, filteredPlaylists, stats, fetchPlaylists } = usePlaylists()

onMounted(() => {
  fetchPlaylists()
})

const setView = (view: View) => {
  currentView.value = view
}
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <header class="bg-gray-900 shadow-lg border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-3xl font-bold text-white">Cyprus Avenue Archive</h1>
        <p class="mt-2 text-sm text-gray-400">
          Browse playlists from KCUR's Cyprus Avenue radio show
        </p>

        <!-- Navigation Tabs -->
        <div class="mt-6 border-b border-gray-800">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              @click="setView('home')"
              :class="[
                currentView === 'home'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              Home
            </button>
            <button
              @click="setView('playlists')"
              :class="[
                currentView === 'playlists'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              Playlists
            </button>
            <button
              @click="setView('tracks')"
              :class="[
                currentView === 'tracks'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              All Tracks
            </button>
          </nav>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>

      <div v-else-if="error" class="bg-red-950/50 border border-red-800 rounded-lg p-4">
        <p class="text-red-300">{{ error }}</p>
      </div>

      <div v-else>
        <!-- Home View -->
        <div v-if="currentView === 'home'">
          <HomePage :stats="stats" @navigate="setView" />
        </div>

        <!-- Playlists View -->
        <div v-else-if="currentView === 'playlists'">
          <StatsPanel :stats="stats" />

          <div class="mt-8">
            <SearchBar v-model="searchQuery" />
          </div>

          <div class="mt-8">
            <PlaylistList :playlists="filteredPlaylists" :search-query="searchQuery" />
          </div>
        </div>

        <!-- Tracks View -->
        <div v-else-if="currentView === 'tracks'">
          <TracksView :playlists="playlists" />
        </div>
      </div>
    </main>

    <footer class="bg-gray-900 border-t border-gray-800 mt-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-sm text-gray-400">
          Cyprus Avenue Archive &middot;
          <a href="https://www.kcur.org/tags/cyprus-avenue" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300">
            KCUR Cyprus Avenue
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
