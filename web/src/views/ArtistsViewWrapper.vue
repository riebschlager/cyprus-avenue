<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import { useArtists } from '../composables/useArtists'
import ArtistsView from '../components/ArtistsView.vue'
import { findArtistBySlug } from '../utils/slug'

const route = useRoute()
const { playlists } = usePlaylists()
const { artists } = useArtists(playlists.value)

// Track which artist should be auto-expanded from URL
const autoExpandSlug = ref<string | null>(null)

// Watch for slug parameter in route
watch(() => route.params.slug, (slug) => {
  if (typeof slug === 'string') {
    autoExpandSlug.value = slug
  } else {
    autoExpandSlug.value = null
  }
}, { immediate: true })

// Find the artist to auto-expand
const artistToExpand = computed(() => {
  if (!autoExpandSlug.value) return null
  return findArtistBySlug(artists.value, autoExpandSlug.value)
})
</script>

<template>
  <ArtistsView :playlists="playlists" :auto-expand-artist="artistToExpand" />
</template>
