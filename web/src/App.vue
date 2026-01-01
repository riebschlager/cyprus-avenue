<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlaylists } from './composables/usePlaylists'

const { fetchPlaylists } = usePlaylists()

onMounted(() => {
  fetchPlaylists()
})
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
            <router-link
              to="/"
              custom
              v-slot="{ navigate, isActive }"
            >
              <button
                @click="navigate"
                :class="[
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                ]"
              >
                Home
              </button>
            </router-link>
            <router-link
              to="/playlists"
              custom
              v-slot="{ navigate, isActive }"
            >
              <button
                @click="navigate"
                :class="[
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                ]"
              >
                Playlists
              </button>
            </router-link>
            <router-link
              to="/tracks"
              custom
              v-slot="{ navigate, isActive }"
            >
              <button
                @click="navigate"
                :class="[
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                ]"
              >
                All Tracks
              </button>
            </router-link>
            <router-link
              to="/artists"
              custom
              v-slot="{ navigate, isActive }"
            >
              <button
                @click="navigate"
                :class="[
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
                ]"
              >
                Artists
              </button>
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
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
