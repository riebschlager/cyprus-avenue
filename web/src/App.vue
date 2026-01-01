<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { usePlaylists } from './composables/usePlaylists'

const { fetchPlaylists } = usePlaylists()
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  fetchPlaylists()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <header
      :class="[
        'sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-800 transition-all duration-300',
        isScrolled ? 'backdrop-blur-md bg-gray-900/95' : ''
      ]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300"
           :class="isScrolled ? 'py-3' : 'py-6'">
        <div :class="['transition-all duration-300', isScrolled ? 'flex items-center justify-between' : '']">
          <div>
            <h1 :class="['font-bold text-white transition-all duration-300', isScrolled ? 'text-xl' : 'text-3xl']">
              Cyprus Avenue Archive
            </h1>
            <p v-show="!isScrolled" class="mt-2 text-sm text-gray-400 transition-opacity duration-300">
              Browse playlists from KCUR's Cyprus Avenue radio show
            </p>
          </div>

          <!-- Navigation Tabs -->
          <div :class="[
            'border-b border-gray-800 transition-all duration-300',
            isScrolled ? 'border-0 ml-8' : 'mt-6'
          ]">
            <nav :class="[
              'flex space-x-8 transition-all duration-300',
              isScrolled ? '' : '-mb-px'
            ]" aria-label="Tabs">
              <router-link
                to="/"
                custom
                v-slot="{ navigate, isActive }"
              >
                <button
                  @click="navigate"
                  :class="[
                    isActive
                      ? isScrolled
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'border-blue-500 text-blue-400'
                      : isScrolled
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                    'whitespace-nowrap font-medium text-sm transition-all duration-300',
                    isScrolled ? 'px-3 py-2 rounded-md' : 'py-4 px-1 border-b-2'
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
                      ? isScrolled
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'border-blue-500 text-blue-400'
                      : isScrolled
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                    'whitespace-nowrap font-medium text-sm transition-all duration-300',
                    isScrolled ? 'px-3 py-2 rounded-md' : 'py-4 px-1 border-b-2'
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
                      ? isScrolled
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'border-blue-500 text-blue-400'
                      : isScrolled
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                    'whitespace-nowrap font-medium text-sm transition-all duration-300',
                    isScrolled ? 'px-3 py-2 rounded-md' : 'py-4 px-1 border-b-2'
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
                      ? isScrolled
                        ? 'text-blue-400 bg-blue-500/10'
                        : 'border-blue-500 text-blue-400'
                      : isScrolled
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700',
                    'whitespace-nowrap font-medium text-sm transition-all duration-300',
                    isScrolled ? 'px-3 py-2 rounded-md' : 'py-4 px-1 border-b-2'
                  ]"
                >
                  Artists
                </button>
              </router-link>
            </nav>
          </div>
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
