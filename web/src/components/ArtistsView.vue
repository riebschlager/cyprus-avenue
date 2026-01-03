<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArtists, type Artist } from '../composables/useArtists'
import type { Playlist } from '../types/playlist'
import ArtistCard from './ArtistCard.vue'
import SearchBar from './SearchBar.vue'
import SpotifyPlaylistModal from './SpotifyPlaylistModal.vue'
import { generateArtistSlug } from '../utils/slug'

const props = defineProps<{
  playlists: Playlist[]
  autoExpandArtist?: Artist | null
}>()

const router = useRouter()
const route = useRoute()
const { searchQuery, selectedGenre, filteredArtists, availableGenres } = useArtists(props.playlists)
const expandedArtistIndex = ref<number | null>(null)
const showGenrePlaylistModal = ref(false)

// Check for pending Spotify action after OAuth redirect
onMounted(() => {
  const pendingAction = sessionStorage.getItem('spotify_pending_action')
  if (pendingAction) {
    try {
      const action = JSON.parse(pendingAction)
      // Check if this was a genre modal
      if (action.mode === 'genre' && action.genre) {
        // Set the genre filter
        selectedGenre.value = action.genre
        // Open the modal
        showGenrePlaylistModal.value = true
        sessionStorage.removeItem('spotify_pending_action')
      }
    } catch (err) {
      console.error('Failed to parse pending Spotify action', err)
      sessionStorage.removeItem('spotify_pending_action')
    }
  }
})

// Pagination
const itemsPerPage = 50
const currentPage = ref(1)

const totalArtists = computed(() => filteredArtists.value.length)
const totalPages = computed(() => Math.ceil(totalArtists.value / itemsPerPage))

const paginatedArtists = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredArtists.value.slice(start, end)
})

const displayedRange = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, totalArtists.value)
  if (totalArtists.value === 0) return '0'
  return `${start}-${end}`
})

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Watch for auto-expand artist from URL
watch(() => props.autoExpandArtist, (artist) => {
  if (artist) {
    const index = filteredArtists.value.findIndex(a => a.name === artist.name)
    if (index !== -1) {
      expandedArtistIndex.value = index
      currentPage.value = Math.floor(index / itemsPerPage) + 1
    }
  }
}, { immediate: true })

// Sync URL query to selectedGenre
watch(() => route.query.genre, (genre) => {
  if (typeof genre === 'string') {
    selectedGenre.value = genre
    document.title = `${genre.charAt(0).toUpperCase() + genre.slice(1)} Artists - Cyprus Avenue Archive`
  } else {
    selectedGenre.value = ''
    if (!props.autoExpandArtist) {
      document.title = 'Artists - Cyprus Avenue Archive'
    }
  }
}, { immediate: true })

// Reset to first page when search changes
watch([searchQuery, selectedGenre], () => {
  currentPage.value = 1
})

const handleGenreSelect = (genre: string) => {
  // Collapse currently expanded artist
  expandedArtistIndex.value = null
  
  // Update URL to reflect genre state
  router.push({ query: { ...route.query, genre } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const clearGenre = () => {
  const query = { ...route.query }
  delete query.genre
  router.push({ query })
}

const toggleArtist = (index: number) => {
  const wasExpanded = expandedArtistIndex.value === index
  expandedArtistIndex.value = wasExpanded ? null : index

  // Update URL without triggering scroll behavior
  if (wasExpanded) {
    // Collapsed - go back to artists view
    router.replace({ path: '/artists', query: route.query })
  } else {
    // Expanded - navigate to artist permalink
    const artist = filteredArtists.value[index]
    if (artist) {
      const slug = generateArtistSlug(artist.name)
      router.replace({ path: `/artist/${slug}`, query: route.query })
    }
  }
}
</script>

<template>
  <div>
    <!-- Stats -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-purple-500">
          <p class="text-sm text-gray-400 mb-2">Total Artists</p>
          <p class="text-4xl font-bold text-white">{{ filteredArtists.length }}</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-green-500">
          <p class="text-sm text-gray-400 mb-2">Total Tracks</p>
          <p class="text-4xl font-bold text-white">
            {{ filteredArtists.reduce((sum, a) => sum + a.tracks.length, 0).toLocaleString() }}
          </p>
        </div>
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-blue-500">
          <p class="text-sm text-gray-400 mb-2">Unique Songs</p>
          <p class="text-4xl font-bold text-white">
            {{ filteredArtists.reduce((sum, a) => sum + a.uniqueSongs.length, 0).toLocaleString() }}
          </p>
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="mt-8 flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <SearchBar v-model="searchQuery" placeholder="Search artists or songs..." />
      </div>
      
      <div class="sm:w-64">
        <select
          :value="selectedGenre"
          @change="(e) => handleGenreSelect((e.target as HTMLSelectElement).value)"
          class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          style="background-image: url(&quot;data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e&quot;); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem;"
        >
          <option value="">All Genres</option>
          <option v-for="genre in availableGenres" :key="genre" :value="genre">
            {{ genre.charAt(0).toUpperCase() + genre.slice(1) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Active Genre Indicator -->
    <div v-if="selectedGenre" class="mt-6 bg-blue-900/40 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🏷️</span>
        <div>
          <p class="text-blue-200 text-sm font-medium uppercase tracking-wider">Viewing Genre</p>
          <h2 class="text-xl font-bold text-white">{{ selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1) }}</h2>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          @click="showGenrePlaylistModal = true"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 transition-colors text-sm font-medium border border-green-500/20"
        >
          <span>🎧</span>
          Create {{ selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1) }} Playlist on Spotify
        </button>
        <button 
          @click="clearGenre"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 transition-colors text-sm font-medium"
        >
          <span>✕</span>
          Clear Filter
        </button>
      </div>
    </div>

    <!-- Artists List -->
    <div class="mt-8 space-y-4">
      <div v-if="filteredArtists.length === 0" class="text-center py-12">
        <p class="text-gray-400">No artists found matching your search.</p>
      </div>

      <div v-else>
        <div class="flex items-center justify-between text-sm text-gray-400 mb-4">
          <p>
            Showing {{ displayedRange }} of {{ totalArtists.toLocaleString() }} artists
          </p>
          
          <!-- Pagination Controls (Top) -->
          <div v-if="totalPages > 1" class="flex gap-2">
            <button 
              @click="changePage(currentPage - 1)" 
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span class="px-2 py-1">Page {{ currentPage }} of {{ totalPages }}</span>
            <button 
              @click="changePage(currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <ArtistCard
            v-for="(artist, i) in paginatedArtists"
            :key="artist.name"
            :artist="artist"
            :is-expanded="expandedArtistIndex === ((currentPage - 1) * itemsPerPage + i)"
            @toggle="toggleArtist((currentPage - 1) * itemsPerPage + i)"
            @select-genre="handleGenreSelect"
          />
        </div>

        <!-- Pagination Controls (Bottom) -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-center gap-2 text-sm text-gray-400">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div class="flex items-center px-2">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Genre Playlist Modal -->
    <SpotifyPlaylistModal
      :is-open="showGenrePlaylistModal"
      :genre="selectedGenre"
      mode="genre"
      @close="showGenrePlaylistModal = false"
    />
  </div>
</template>
