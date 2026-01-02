<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { usePlaylists } from './composables/usePlaylists'
import { useOpenGraph } from './composables/useOpenGraph'
import ToastContainer from './components/ToastContainer.vue'

const { fetchPlaylists } = usePlaylists()
const { setOpenGraphTags, getDefaultOG } = useOpenGraph()
const scrollY = ref(0)

const isScrolled = computed(() => scrollY.value > 20)

let rafId: number | null = null

const handleScroll = () => {
  if (rafId) return

  rafId = requestAnimationFrame(() => {
    scrollY.value = window.scrollY
    rafId = null
  })
}

onMounted(() => {
  fetchPlaylists()
  // Initialize default OG tags
  setOpenGraphTags(getDefaultOG())
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <header
      class="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-800"
      style="contain: layout style paint;"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-baseline gap-4 flex-1">
            <h1
              class="font-bold text-white whitespace-nowrap"
              :style="{ fontSize: isScrolled ? '1.25rem' : '1.875rem', transition: 'font-size 300ms cubic-bezier(0.4, 0, 0.2, 1)' }"
            >
              Cyprus Avenue Archive
            </h1>
            <p
              class="text-sm text-gray-400 ml-4 whitespace-nowrap"
              :style="{ opacity: isScrolled ? '0' : '1', transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)' }"
            >
              Browse playlists from KCUR's Cyprus Avenue radio show
            </p>
          </div>

          <!-- Navigation Tabs -->
          <div class="border-b border-gray-800">
            <nav class="flex space-x-8 -mb-px" aria-label="Tabs">
              <router-link
                to="/"
                custom
                v-slot="{ navigate, isActive }"
              >
                <button
                  @click="navigate"
                  :style="{
                    color: isActive ? '#60a5fa' : '#9ca3af',
                    borderBottomColor: isActive ? '#3b82f6' : 'transparent',
                    borderBottomWidth: isActive ? '2px' : '2px',
                    transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }"
                  class="whitespace-nowrap font-medium text-sm py-4 px-1"
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
                  :style="{
                    color: isActive ? '#60a5fa' : '#9ca3af',
                    borderBottomColor: isActive ? '#3b82f6' : 'transparent',
                    borderBottomWidth: isActive ? '2px' : '2px',
                    transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }"
                  class="whitespace-nowrap font-medium text-sm py-4 px-1"
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
                  :style="{
                    color: isActive ? '#60a5fa' : '#9ca3af',
                    borderBottomColor: isActive ? '#3b82f6' : 'transparent',
                    borderBottomWidth: isActive ? '2px' : '2px',
                    transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }"
                  class="whitespace-nowrap font-medium text-sm py-4 px-1"
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
                  :style="{
                    color: isActive ? '#60a5fa' : '#9ca3af',
                    borderBottomColor: isActive ? '#3b82f6' : 'transparent',
                    borderBottomWidth: isActive ? '2px' : '2px',
                    transition: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }"
                  class="whitespace-nowrap font-medium text-sm py-4 px-1"
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

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>
