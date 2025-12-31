<script setup lang="ts">
import { ref } from 'vue'
import { useArtists } from '../composables/useArtists'
import type { Playlist } from '../types/playlist'
import ArtistCard from './ArtistCard.vue'
import SearchBar from './SearchBar.vue'

const props = defineProps<{
  playlists: Playlist[]
}>()

const { searchQuery, filteredArtists } = useArtists(props.playlists)
const expandedArtistIndex = ref<number | null>(null)

const toggleArtist = (index: number) => {
  expandedArtistIndex.value = expandedArtistIndex.value === index ? null : index
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
