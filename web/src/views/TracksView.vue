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
    <header class="page-head">
      <span class="ca-label ca-label--accent">Index</span>
      <h1 class="ca-page-title">Tracks</h1>
      <p class="ca-lede">
        Every song played on the recovered shows, {{ totalTracks.toLocaleString() }} in all.
      </p>
    </header>

    <div class="mb-6">
      <SearchBar v-model="searchQuery" />
    </div>

    <div class="list-meta">
      <div class="flex items-center gap-4">
        <span class="ca-label">{{ displayedRange }} of {{ totalTracks.toLocaleString() }} tracks</span>
        <span class="ca-label ca-label--sm list-meta__keys">
          <kbd class="ca-search__kbd">J</kbd>
          <kbd class="ca-search__kbd">K</kbd>
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

    <PaginationControls :current-page="currentPage" :total-pages="totalPages" class="mt-8" @change="changePage" />
  </ArchiveState>
</template>

<style scoped>
.page-head { display: flex; flex-direction: column; gap: var(--space-3); padding-bottom: var(--space-8); }
.list-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.list-meta__keys { gap: 4px; color: var(--fg-3); }
.list-meta__keys kbd { margin: 0; }
@media (max-width: 760px) { .list-meta__keys { display: none; } }
</style>
