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
    <p v-if="playlists.length === 0" class="empty">
      <template v-if="searchQuery">No shows match &ldquo;{{ searchQuery }}&rdquo;. Try an artist name.</template>
      <template v-else>No shows found.</template>
    </p>

    <div v-else>
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
        <div class="flex items-center gap-4">
          <span class="ca-label">
            Showing {{ displayedRange }} of {{ playlists.length.toLocaleString() }} show{{ playlists.length === 1 ? '' : 's' }}
          </span>
          <span class="hidden sm:inline-flex items-center gap-1 ca-label ca-label--sm">
            <kbd class="ca-search__kbd">J</kbd>
            <kbd class="ca-search__kbd">K</kbd>
            to navigate
          </span>
        </div>

        <PaginationControls :current-page="currentPage" :total-pages="totalPages" compact @change="changePage" />
      </div>

      <div class="ca-showlist">
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

      <PaginationControls :current-page="currentPage" :total-pages="totalPages" class="mt-10" @change="changePage" />
    </div>
  </div>
</template>

<style scoped>
.empty { padding: var(--space-12) 0; border-top: var(--rule-ink); font: var(--type-body); font-size: 18px; color: var(--fg-2); }
.ca-search__kbd { margin-right: 0; }
</style>
