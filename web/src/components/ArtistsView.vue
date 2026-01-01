<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useArtists, type Artist } from '../composables/useArtists'
import type { Playlist } from '../types/playlist'
import ArtistCard from './ArtistCard.vue'
import SearchBar from './SearchBar.vue'
import { generateArtistSlug } from '../utils/slug'

const props = defineProps<{
  playlists: Playlist[]
  autoExpandArtist?: Artist | null
}>()

const router = useRouter()
const { searchQuery, filteredArtists } = useArtists(props.playlists)
const expandedArtistIndex = ref<number | null>(null)

// Watch for auto-expand artist from URL
watch(() => props.autoExpandArtist, (artist) => {
  if (artist) {
    const index = filteredArtists.value.findIndex(a => a.name === artist.name)
    if (index !== -1) {
      expandedArtistIndex.value = index
    }
  }
}, { immediate: true })

const toggleArtist = (index: number) => {
  const wasExpanded = expandedArtistIndex.value === index
  expandedArtistIndex.value = wasExpanded ? null : index

  // Update URL without triggering scroll behavior
  if (wasExpanded) {
    // Collapsed - go back to artists view
    router.replace('/artists')
  } else {
    // Expanded - navigate to artist permalink
    const artist = filteredArtists.value[index]
    if (artist) {
      const slug = generateArtistSlug(artist.name)
      router.replace(`/artist/${slug}`)
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

    <!-- Search -->
    <div class="mt-8">
      <SearchBar v-model="searchQuery" placeholder="Search artists or songs..." />
    </div>

    <!-- Artists List -->
    <div class="mt-8 space-y-4">
      <div v-if="filteredArtists.length === 0" class="text-center py-12">
        <p class="text-gray-400">No artists found matching your search.</p>
      </div>

      <ArtistCard
        v-for="(artist, index) in filteredArtists"
        :key="artist.name"
        :artist="artist"
        :is-expanded="expandedArtistIndex === index"
        @toggle="toggleArtist(index)"
      />
    </div>
  </div>
</template>
