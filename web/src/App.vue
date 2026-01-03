<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from './composables/usePlaylists'
import { useOpenGraph } from './composables/useOpenGraph'
import { useMobileMenu } from './composables/useMobileMenu'
import ToastContainer from './components/ToastContainer.vue'
import SpotifyWebPlayer from './components/SpotifyWebPlayer.vue'

const { fetchPlaylists } = usePlaylists()
const { setOpenGraphTags, getDefaultOG } = useOpenGraph()
const { isMenuOpen, toggleMenu, closeMenu } = useMobileMenu()
const route = useRoute()
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

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Close menu when route changes
watch(() => route.path, () => {
  closeMenu()
})

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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-4 w-full h-16 sm:h-20">
          <!-- Logo/Title -->
          <div class="flex items-baseline gap-4 flex-1 min-w-0">
            <h1
              class="font-bold text-white whitespace-nowrap"
              :style="{ fontSize: isScrolled ? '1.25rem' : '1.875rem', transition: 'font-size 300ms cubic-bezier(0.4, 0, 0.2, 1)' }"
            >
              Cyprus Avenue Archive
            </h1>
            <p
              class="text-sm text-gray-400 whitespace-nowrap hidden sm:block transition-opacity duration-300"
              :style="{ opacity: isScrolled ? '0' : '1' }"
            >
              Browse playlists from KCUR's Cyprus Avenue radio show
            </p>
          </div>

          <!-- Desktop Navigation (hidden on mobile) -->
          <div class="hidden md:block border-b border-gray-800">
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

          <!-- Mobile Hamburger Menu Button -->
          <button
            @click="toggleMenu"
            class="md:hidden p-2 rounded text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Toggle menu"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!isMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mobile Menu Dropdown -->
        <div
          v-if="isMenuOpen"
          class="md:hidden mt-4 pb-4 border-t border-gray-800"
          style="animation: slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1);"
        >
          <nav class="flex flex-col space-y-2" aria-label="Mobile Tabs">
            <router-link
              to="/"
              custom
              v-slot="{ navigate, isActive }"
            >
              <button
                @click="navigate"
                :style="{ color: isActive ? '#60a5fa' : '#9ca3af' }"
                class="w-full text-left px-4 py-2 rounded font-medium text-sm hover:bg-gray-800/50 transition-colors"
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
                :style="{ color: isActive ? '#60a5fa' : '#9ca3af' }"
                class="w-full text-left px-4 py-2 rounded font-medium text-sm hover:bg-gray-800/50 transition-colors"
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
                :style="{ color: isActive ? '#60a5fa' : '#9ca3af' }"
                class="w-full text-left px-4 py-2 rounded font-medium text-sm hover:bg-gray-800/50 transition-colors"
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
                :style="{ color: isActive ? '#60a5fa' : '#9ca3af' }"
                class="w-full text-left px-4 py-2 rounded font-medium text-sm hover:bg-gray-800/50 transition-colors"
              >
                Artists
              </button>
            </router-link>
          </nav>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] pb-24">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <div class="fixed bottom-0 inset-x-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <SpotifyWebPlayer />
      </div>
    </div>

    <footer class="bg-gray-900 border-t border-gray-800 mt-6 pb-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-400">
            Cyprus Avenue Archive &middot;
            <a href="https://www.kcur.org/tags/cyprus-avenue" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300">
              KCUR Cyprus Avenue
            </a>
          </p>
          <button
            type="button"
            @click="scrollToTop"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-500/40 text-blue-300 hover:text-blue-200 hover:border-blue-400/70 hover:bg-blue-500/10 transition-colors"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
            Back to top
          </button>
          <p class="text-sm text-gray-500">
            Created by 
            <a href="https://the816.com" target="_blank" rel="noopener" class="text-gray-400 hover:text-blue-400 transition-colors font-medium">
              Chris Riebschlager
            </a>
          </p>
        </div>
      </div>
    </footer>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<style>
/* Prevent horizontal layout jump by always reserving scrollbar space */
html {
  overflow-y: scroll;
  scroll-behavior: smooth;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
