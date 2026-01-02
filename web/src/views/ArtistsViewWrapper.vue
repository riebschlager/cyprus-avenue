<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import { useArtists } from '../composables/useArtists'
import { useOpenGraph } from '../composables/useOpenGraph'
import ArtistsView from '../components/ArtistsView.vue'
import { findArtistBySlug } from '../utils/slug'

const route = useRoute()
const { playlists, loading, error, fetchPlaylists } = usePlaylists()
const { setOpenGraphTags, getArtistOG, getDefaultOG } = useOpenGraph()

onMounted(() => {
  fetchPlaylists()
})

// Compute artists reactively from playlists - pass ref, not value
const { artists } = useArtists(playlists)

// Track which artist should be auto-expanded from URL
const autoExpandSlug = ref<string | null>(null)

// Watch for slug parameter in route
watch(() => route.params.slug, (slug) => {
  if (typeof slug === 'string') {
    autoExpandSlug.value = slug
    // Update OG tags when viewing a specific artist
    const artist = findArtistBySlug(artists.value, slug)
    if (artist) {
      const trackCount = artist.appearances.length
      setOpenGraphTags(getArtistOG(artist.name, trackCount))
    }
  } else {
    autoExpandSlug.value = null
    setOpenGraphTags(getDefaultOG())
  }
}, { immediate: true })

// Find the artist to auto-expand - this computed will react to changes in artists
const artistToExpand = computed(() => {
  if (!autoExpandSlug.value || !artists.value || artists.value.length === 0) return null
  return findArtistBySlug(artists.value, autoExpandSlug.value)
})

// Update page title when viewing a specific artist
watch(artistToExpand, (artist) => {
  if (artist) {
    document.title = `${artist.name} - Cyprus Avenue Archive`
  } else {
    document.title = 'Artists - Cyprus Avenue Archive'
  }
}, { immediate: true })
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-950/50 border border-red-800 rounded-lg p-4">
      <p class="text-red-300">{{ error }}</p>
    </div>

    <ArtistsView v-else :playlists="playlists" :auto-expand-artist="artistToExpand" />
  </div>
</template>
