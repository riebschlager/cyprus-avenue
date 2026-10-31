<script setup lang="ts">
import { usePagination } from '../composables/usePagination'
import PaginationControls from '../components/PaginationControls.vue'
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { Playlist } from '../types/playlist'
import PlaylistCard from './PlaylistCard.vue'
import { generatePlaylistSlug } from '../utils/slug'
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation'

const props = defineProps<{
  playlists: Playlist[]
  searchQuery: string
  autoExpandPlaylist?: Playlist | null
}>()

const router = useRouter()
const expandedPlaylist = ref<string | null>(null)
const cardRefs = ref<InstanceType<typeof PlaylistCard>[]>([])

const { currentPage, itemsPerPage, totalItems: totalPlaylists, totalPages,
  paginatedItems: paginatedPlaylists, displayedRange, changePage } = usePagination(() => props.playlists)

// Watch for auto-expand playlist from URL
watch(() => props.autoExpandPlaylist, (playlist) => {
  if (playlist) {
    expandedPlaylist.value = playlist.date
    // Calculate which page this playlist is on
    const index = props.playlists.findIndex(p => p.date === playlist.date)
    if (index !== -1) {
      currentPage.value = Math.floor(index / itemsPerPage) + 1
    }
  }
}, { immediate: true })

// Reset to first page when search changes
watch(() => props.searchQuery, () => {
  currentPage.value = 1
})

const togglePlaylist = (date: string) => {
  const wasExpanded = expandedPlaylist.value === date
  expandedPlaylist.value = wasExpanded ? null : date

  // Update URL without triggering scroll behavior
  if (wasExpanded) {
    // Collapsed - go back to playlists view
    router.replace('/playlists')
  } else {
    // Expanded - navigate to playlist permalink
    const playlist = props.playlists.find(p => p.date === date)
    if (playlist) {
      const slug = generatePlaylistSlug(playlist.title, playlist.date)
      router.replace(`/playlist/${slug}`)
    }
  }
}

// Keyboard navigation
const { focusedIndex } = useKeyboardNavigation({
  itemCount: totalPlaylists,
  currentPage,
  itemsPerPage,
  onPageChange: changePage,
  onSelect: (index) => {
    const playlist = paginatedPlaylists.value[index]
    if (playlist) {
      togglePlaylist(playlist.date)
    }
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
    <div v-if="playlists.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No playlists found</h3>
      <p class="mt-1 text-sm text-gray-500">
        Try adjusting your search query
      </p>
    </div>

    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-400">
        <div class="flex items-center gap-3">
          <p>
            Showing {{ displayedRange }} of {{ playlists.length }} playlist{{ playlists.length === 1 ? '' : 's' }}
          </p>
          <span class="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500">
            <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400 font-mono text-[10px]">j</kbd>
            <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-gray-400 font-mono text-[10px]">k</kbd>
            to navigate
          </span>
        </div>

        <PaginationControls :current-page="currentPage" :total-pages="totalPages" compact @change="changePage" />
      </div>

      <div class="space-y-3">
        <PlaylistCard
          v-for="(playlist, index) in paginatedPlaylists"
          :ref="(el) => { if (el) cardRefs[index] = el as InstanceType<typeof PlaylistCard> }"
          :key="playlist.date"
          :playlist="playlist"
          :is-expanded="expandedPlaylist === playlist.date"
          :is-focused="focusedIndex === index"
          :search-query="searchQuery"
          @toggle="togglePlaylist(playlist.date)"
        />
      </div>

      <PaginationControls :current-page="currentPage" :total-pages="totalPages" class="mt-6" @change="changePage" />
    </div>
  </div>
</template>
