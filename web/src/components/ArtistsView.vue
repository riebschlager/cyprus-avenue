<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArtists, type Artist } from '../composables/useArtists'
import type { Playlist } from '../types/playlist'
import ArtistCard from './ArtistCard.vue'
import SearchBar from './SearchBar.vue'
import SpotifyPlaylistModal from './SpotifyPlaylistModal.vue'
import { generateArtistSlug } from '../utils/slug'
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation'

const props = defineProps<{
  playlists: Playlist[]
  autoExpandArtist?: Artist | null
}>()

const router = useRouter()
const route = useRoute()
const { searchQuery, searchFilters, selectedTag, filteredArtists, availableTags } = useArtists(props.playlists)
const expandedArtistIndex = ref<number | null>(null)
const showTagPlaylistModal = ref(false)
const bannerRef = ref<HTMLElement | null>(null)
const cardRefs = ref<InstanceType<typeof ArtistCard>[]>([])

// Check for pending Spotify action after OAuth redirect
onMounted(() => {
  const pendingAction = sessionStorage.getItem('spotify_pending_action')
  if (pendingAction) {
    try {
      const action = JSON.parse(pendingAction)
      // Check if this was a tag modal
      if (action.mode === 'tag' && action.tag) {
        // Set the tag filter
        selectedTag.value = action.tag
        // Open the modal
        showTagPlaylistModal.value = true
      }
    } catch (err) {
      console.error('Failed to parse pending Spotify action', err)
      sessionStorage.removeItem('spotify_pending_action')
    }
  }
})

// Pagination
const itemsPerPage = 20
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

// Sync URL query to selectedTag
watch(() => route.query.tag, (tag) => {
  if (typeof tag === 'string') {
    // Standardize: replace plus signs with spaces if they exist
    const normalizedTag = tag.replace(/\+/g, ' ')
    
    // Convert to Title Case to match normalized data
    const titleCasedTag = normalizedTag
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      
    selectedTag.value = titleCasedTag
    document.title = `${titleCasedTag} Artists - Cyprus Avenue Archive`
  } else {
    selectedTag.value = ''
    if (!props.autoExpandArtist) {
      document.title = 'Artists - Cyprus Avenue Archive'
    }
  }
}, { immediate: true })

// Reset to first page when search changes
watch([searchQuery, selectedTag], () => {
  currentPage.value = 1
})

const handleTagSelect = (tag: string) => {
  // Collapse currently expanded artist
  expandedArtistIndex.value = null

  // Update URL to reflect tag state
  router.push({ query: { ...route.query, tag } })
  
  // Wait for banner to render and scroll to it
  nextTick(() => {
    if (bannerRef.value) {
      const header = document.querySelector('header')
      const headerHeight = header?.clientHeight || 80
      const elementPosition = bannerRef.value.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - headerHeight - 24 // 24px buffer

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  })
}

const clearTag = () => {
  const query = { ...route.query }
  delete query.tag
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

// Keyboard navigation
const { focusedIndex } = useKeyboardNavigation({
  itemCount: totalArtists,
  currentPage,
  itemsPerPage,
  onPageChange: changePage,
  onSelect: (index) => {
    // Convert page-local index to global index
    const globalIndex = (currentPage.value - 1) * itemsPerPage + index
    toggleArtist(globalIndex)
  }
})

// Scroll focused item into view
watch(focusedIndex, async (index) => {
  if (index !== null) {
    await nextTick()
    const card = cardRefs.value[index]
    if (card?.$el) {
      const rect = card.$el.getBoundingClientRect()
      const headerHeight = 100
      if (rect.top < headerHeight || rect.bottom > window.innerHeight) {
        window.scrollTo({
          top: window.scrollY + rect.top - headerHeight - 20,
          behavior: 'smooth'
        })
      }
    }
  }
})
</script>

<template>
  <div>
    <!-- Stats -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-purple-500">
          <p class="text-sm text-gray-400 mb-2">Total Artists</p>
          <p class="text-4xl font-bold text-white">{{ filteredArtists.length }}</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-blue-500">
          <p class="text-sm text-gray-400 mb-2">Total Songs</p>
          <p class="text-4xl font-bold text-white">
            {{ filteredArtists.reduce((sum, a) => sum + a.uniqueSongs.length, 0).toLocaleString() }}
          </p>
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="mt-8 flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <SearchBar
          v-model="searchQuery"
          v-model:filters="searchFilters"
          :filter-options="[
            { id: 'artist', label: 'Artists' },
            { id: 'song', label: 'Songs' }
          ]"
          placeholder="Search artists or songs..."
        />
      </div>
      
      <div class="sm:w-64">
        <select
          :value="selectedTag"
          @change="(e) => handleTagSelect((e.target as HTMLSelectElement).value)"
          class="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer select-chevron"
        >
          <option value="">All Tags</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
      </div>
    </div>

    <!-- Active Tag Indicator -->
    <div v-if="selectedTag" ref="bannerRef" class="mt-6 bg-blue-900/40 border border-blue-500/30 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🏷️</span>
        <div>
          <p class="text-blue-200 text-sm font-medium uppercase tracking-wider">Viewing Tag</p>
          <h2 class="text-xl font-bold text-white">{{ selectedTag }}</h2>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          @click="showTagPlaylistModal = true"
          class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 transition-colors text-sm font-medium border border-green-500/20 w-full sm:w-auto"
        >
          <span>🎧</span>
          Create {{ selectedTag }} Playlist on Spotify
        </button>
        <button
          @click="clearTag"
          class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 transition-colors text-sm font-medium w-full sm:w-auto"
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
          <div class="flex items-center gap-3">
            <p>
              Showing {{ displayedRange }} of {{ totalArtists.toLocaleString() }} artists
            </p>
            <span class="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500">
              <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400 font-mono text-[10px]">j</kbd>
              <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400 font-mono text-[10px]">k</kbd>
              to navigate
            </span>
          </div>
          
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
            :ref="(el) => { if (el) cardRefs[i] = el as InstanceType<typeof ArtistCard> }"
            :key="artist.name"
            :artist="artist"
            :is-expanded="expandedArtistIndex === ((currentPage - 1) * itemsPerPage + i)"
            :is-focused="focusedIndex === i"
            @toggle="toggleArtist((currentPage - 1) * itemsPerPage + i)"
            @select-tag="handleTagSelect"
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

    <!-- Tag Playlist Modal -->
    <SpotifyPlaylistModal
      :is-open="showTagPlaylistModal"
      :tag="selectedTag"
      mode="tag"
      @close="showTagPlaylistModal = false"
    />
  </div>
</template>

<style scoped>
.select-chevron {
  background-image: url('@/assets/chevron-down.svg');
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}
</style>
