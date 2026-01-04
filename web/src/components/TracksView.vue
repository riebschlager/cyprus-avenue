<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { Playlist } from '../types/playlist'
import { useTracks } from '../composables/useTracks'
import SearchBar from './SearchBar.vue'
import TracksTable from './TracksTable.vue'
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation'
import { useRouter } from 'vue-router'
import { generateArtistSlug } from '../utils/slug'

const props = defineProps<{
  playlists: Playlist[]
}>()

const router = useRouter()
const { searchQuery, sortField, sortDirection, sortedTracks, setSortField } = useTracks(props.playlists)
const tableRef = ref<InstanceType<typeof TracksTable> | null>(null)

// Pagination
const itemsPerPage = 20
const currentPage = ref(1)

const totalTracks = computed(() => sortedTracks.value.length)
const totalPages = computed(() => Math.ceil(totalTracks.value / itemsPerPage))

const paginatedTracks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedTracks.value.slice(start, end)
})

const displayedRange = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, totalTracks.value)
  if (totalTracks.value === 0) return '0'
  return `${start}-${end}`
})

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Reset to first page when search or sort changes
watch([searchQuery, sortField, sortDirection], () => {
  currentPage.value = 1
})

// Keyboard navigation
const { focusedIndex } = useKeyboardNavigation({
  itemCount: totalTracks,
  currentPage,
  itemsPerPage,
  onPageChange: changePage,
  onSelect: (index) => {
    // Navigate to artist page on Enter
    const track = paginatedTracks.value[index]
    if (track) {
      router.push(`/artist/${generateArtistSlug(track.artist)}`)
    }
  }
})

// Scroll focused row into view
watch(focusedIndex, async (index) => {
  if (index !== null && tableRef.value) {
    await nextTick()
    const row = tableRef.value.$el?.querySelector(`tr[data-index="${index}"]`)
    if (row) {
      const rect = row.getBoundingClientRect()
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
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">All Tracks</h2>
      <p class="text-sm text-gray-400">
        Browse and search all {{ totalTracks.toLocaleString() }} tracks from the archive
      </p>
    </div>

    <div class="mb-6">
      <SearchBar v-model="searchQuery" />
    </div>

    <div class="mb-4 flex items-center justify-between text-sm text-gray-400">
      <div class="flex items-center gap-3">
        <span>Showing {{ displayedRange }} of {{ totalTracks.toLocaleString() }} tracks</span>
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

    <TracksTable
      ref="tableRef"
      :tracks="paginatedTracks"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      :focused-index="focusedIndex"
      @sort="setSortField"
    />

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
</template>
