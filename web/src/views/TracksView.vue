<script setup lang="ts">
import { usePagination } from '../composables/usePagination'
import PaginationControls from '../components/PaginationControls.vue'
import ArchiveState from '../components/ArchiveState.vue'
import { usePlaylists } from '../composables/usePlaylists'
import { ref, watch, nextTick } from 'vue'
import { useTracks } from '../composables/useTracks'
import SearchBar from '../components/SearchBar.vue'
import TracksTable from '../components/TracksTable.vue'
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation'
import { useRouter } from 'vue-router'
import { generateArtistSlug } from '../utils/slug'

const { playlists } = usePlaylists()

const router = useRouter()
const { searchQuery, sortField, sortDirection, sortedTracks, setSortField } = useTracks(playlists)
const tableRef = ref<InstanceType<typeof TracksTable> | null>(null)

const { currentPage, itemsPerPage, totalItems: totalTracks, totalPages,
  paginatedItems: paginatedTracks, displayedRange, changePage } = usePagination(sortedTracks)

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
  <ArchiveState>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">All Tracks</h2>
      <p class="text-sm text-gray-400">
        Browse and search all {{ totalTracks.toLocaleString() }} tracks from the archive
      </p>
    </div>

    <div class="mb-6">
      <SearchBar v-model="searchQuery" />
    </div>

    <div class="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-400">
      <div class="flex items-center gap-3">
        <span>Showing {{ displayedRange }} of {{ totalTracks.toLocaleString() }} tracks</span>
        <span class="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500">
          <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400 font-mono text-[10px]">j</kbd>
          <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400 font-mono text-[10px]">k</kbd>
          to navigate
        </span>
      </div>

      <PaginationControls :current-page="currentPage" :total-pages="totalPages" compact @change="changePage" />
    </div>

    <TracksTable
      ref="tableRef"
      :tracks="paginatedTracks"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      :focused-index="focusedIndex"
      @sort="setSortField"
    />

    <PaginationControls :current-page="currentPage" :total-pages="totalPages" class="mt-6" @change="changePage" />
  </ArchiveState>
</template>
