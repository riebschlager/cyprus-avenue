<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Playlist } from '../types/playlist'
import PlaylistCard from './PlaylistCard.vue'
import { generatePlaylistSlug } from '../utils/slug'

const props = defineProps<{
  playlists: Playlist[]
  searchQuery: string
  autoExpandPlaylist?: Playlist | null
}>()

const router = useRouter()
const expandedPlaylist = ref<string | null>(null)

// Watch for auto-expand playlist from URL
watch(() => props.autoExpandPlaylist, (playlist) => {
  if (playlist) {
    expandedPlaylist.value = playlist.date
  }
}, { immediate: true })

const togglePlaylist = (date: string) => {
  const wasExpanded = expandedPlaylist.value === date
  expandedPlaylist.value = wasExpanded ? null : date

  // Update URL
  if (wasExpanded) {
    // Collapsed - go back to playlists view
    router.push('/playlists')
  } else {
    // Expanded - navigate to playlist permalink
    const playlist = props.playlists.find(p => p.date === date)
    if (playlist) {
      const slug = generatePlaylistSlug(playlist.title, playlist.date)
      router.push(`/playlist/${slug}`)
    }
  }
}
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
      <p class="text-sm text-gray-600">
        Showing {{ playlists.length }} playlist{{ playlists.length === 1 ? '' : 's' }}
      </p>

      <div class="space-y-3">
        <PlaylistCard
          v-for="playlist in playlists"
          :key="playlist.date"
          :playlist="playlist"
          :is-expanded="expandedPlaylist === playlist.date"
          :search-query="searchQuery"
          @toggle="togglePlaylist(playlist.date)"
        />
      </div>
    </div>
  </div>
</template>
