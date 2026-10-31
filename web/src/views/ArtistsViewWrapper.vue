<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import { useArtists } from '../composables/useArtists'
import { useArtistBios } from '../composables/useArtistBios'
import ArtistsView from '../components/ArtistsView.vue'
import { findArtistBySlug } from '../utils/slug'

const route = useRoute()
const { playlists, loading, error, fetchPlaylists } = usePlaylists()
const { loadBiosIndex } = useArtistBios()

onMounted(() => {
  fetchPlaylists()
  loadBiosIndex()
})

// Compute artists reactively from playlists - pass ref, not value
const { artists } = useArtists(playlists)

// Resolve again when either the route or the archive changes (including cold loads).
const artistToExpand = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' ? findArtistBySlug(artists.value, slug) : null
})
</script>

<template>
  <div>
    <div v-if="loading && playlists.length === 0" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-950/50 border border-red-800 rounded-lg p-4">
      <p class="text-red-300">{{ error }}</p>
    </div>

    <ArtistsView v-else :playlists="playlists" :auto-expand-artist="artistToExpand" />
  </div>
</template>
