<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from '../../composables/usePlaylists'
import { useToast } from '../../composables/useToast'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useSpotifyPlayback } from './useSpotifyPlayback'
import { takePendingAction, type PlaylistAction } from './pendingAction'
import SpotifyPlaylistModal from './SpotifyPlaylistModal.vue'
const route = useRoute()
const { isAuthenticated } = useSpotifyAuth()
const { playlists, fetchPlaylists } = usePlaylists()
const { playTrack } = useSpotifyPlayback()
const { error: showError } = useToast()
const restored = ref<PlaylistAction | null>(null)
const show = computed(() => {
  const action = restored.value
  return action?.mode === 'single' ? playlists.value.find(p => p.date === action.playlistSlug) : undefined
})
watch([isAuthenticated, () => route.path], async ([authenticated, path]) => {
  if (!authenticated || path === '/auth/callback') return
  const action = takePendingAction()
  if (!action) return
  try {
    if (action.action === 'playback') await playTrack(action.spotifyUri)
    else {
      await fetchPlaylists()
      if (action.mode === 'single' && !playlists.value.some(p => p.date === action.playlistSlug)) throw new Error('The show for your Spotify playlist could not be found.')
      restored.value = action
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not restore Spotify action. Try again.')
  }
}, { immediate: true })
</script>
<template>
  <SpotifyPlaylistModal v-if="restored" :is-open="true" :resume="true" :mode="restored.mode" :playlist="show"
    :tag="restored.mode === 'tag' ? restored.tag : undefined"
    :artist-name="restored.mode === 'artist' ? restored.artistName : undefined" @close="restored = null" />
</template>
