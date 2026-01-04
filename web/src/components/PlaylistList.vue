<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
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

// Pagination
const itemsPerPage = 20
const currentPage = ref(1)

const totalPlaylists = computed(() => props.playlists.length)
const totalPages = computed(() => Math.ceil(totalPlaylists.value / itemsPerPage))

const paginatedPlaylists = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.playlists.slice(start, end)
})

const displayedRange = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1
  const end = Math.min(currentPage.value * itemsPerPage, totalPlaylists.value)
  if (totalPlaylists.value === 0) return '0'
  return `${start}-${end}`
})

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

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
      <div class="flex items-center justify-between text-sm text-gray-400">
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
</template>
