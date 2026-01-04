<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Playlist } from '../types/playlist'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'
import { useSpotifyPlaylistCreation } from '../composables/useSpotifyPlaylistCreation'
import { usePlaylists } from '../composables/usePlaylists'
import { useToast } from '../composables/useToast'
import SpotifyAuthButton from './SpotifyAuthButton.vue'
import PlaylistCreationProgress from './PlaylistCreationProgress.vue'
import TrackMatchingSummary from './TrackMatchingSummary.vue'

export type ModalMode = 'closed' | 'authenticated' | 'playlist-selection' | 'creating' | 'success' | 'error'

const props = defineProps<{
  isOpen: boolean
  playlist?: Playlist
  tag?: string
  artistName?: string
  mode?: 'single' | 'all-tracks' | 'tag' | 'artist'
}>()

const emit = defineEmits<{
  close: []
}>()

const { isAuthenticated } = useSpotifyAuth()
const {
  creationState,
  creationProgress,
  creationResult,
  creationError,
  createPlaylistFromArchivePlaylist,
  createPlaylistFromAllTracks,
  createPlaylistFromTag,
  createPlaylistFromArtist,
  resetState
} = useSpotifyPlaylistCreation()
const { playlists } = usePlaylists()
const { success, error: showError, warning } = useToast()

const isLoading = computed(() => creationState.value === 'creating')
const isSuccess = computed(() => creationState.value === 'completed')
const isError = computed(() => creationState.value === 'error')

// Create modal state object to preserve context through OAuth flow
const modalState = computed(() => ({
  action: 'create-playlist',
  mode: props.mode,
  playlistSlug: props.playlist?.date,
  tag: props.tag,
  artistName: props.artistName
}))

const getPendingAction = () => {
  const raw = sessionStorage.getItem('spotify_pending_action')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (err) {
    sessionStorage.removeItem('spotify_pending_action')
    return null
  }
}

const matchesPendingAction = (action: any): boolean => {
  if (!action || action.action !== 'create-playlist' || action.mode !== props.mode) {
    return false
  }

  if (props.mode === 'single') {
    return action.playlistSlug && action.playlistSlug === props.playlist?.date
  }
  if (props.mode === 'tag') {
    return action.tag && action.tag === props.tag
  }
  if (props.mode === 'artist') {
    return action.artistName && action.artistName === props.artistName
  }
  return props.mode === 'all-tracks'
}

const consumePendingAction = async () => {
  const action = getPendingAction()
  if (!matchesPendingAction(action)) return
  try {
    await handleCreatePlaylist()
    sessionStorage.removeItem('spotify_pending_action')
  } catch (err) {
    console.error('Failed to consume pending playlist action', err)
  }
}

const handleCreatePlaylist = async () => {
  if (!props.playlist && props.mode !== 'all-tracks' && props.mode !== 'tag' && props.mode !== 'artist') {
    showError('No source selected')
    return
  }

  if (props.mode === 'single' && props.playlist) {
    const result = await createPlaylistFromArchivePlaylist(props.playlist)
    if (result) {
      success(`Playlist created with ${result.tracksAdded} tracks!`)
      if (result.tracksFailed > 0) {
        warning(`${result.tracksFailed} tracks not found on Spotify`)
      }
    } else {
      showError(creationError.value || 'Failed to create playlist')
    }
  } else if (props.mode === 'all-tracks') {
    if (playlists.value.length === 0) {
      showError('No playlists available')
      return
    }
    const result = await createPlaylistFromAllTracks(playlists.value)
    if (result) {
      success(`Playlist created with ${result.tracksAdded} tracks!`)
      if (result.tracksFailed > 0) {
        warning(`${result.tracksFailed} tracks not found on Spotify`)
      }
    } else {
      showError(creationError.value || 'Failed to create playlist')
    }
  } else if (props.mode === 'tag' && props.tag) {
    const result = await createPlaylistFromTag(props.tag, playlists.value)
    if (result) {
      success(`Playlist created with ${result.tracksAdded} tracks!`)
      if (result.tracksFailed > 0) {
        warning(`${result.tracksFailed} tracks not found on Spotify`)
      }
    } else {
      showError(creationError.value || 'Failed to create playlist')
    }
  } else if (props.mode === 'artist' && props.artistName) {
    const result = await createPlaylistFromArtist(props.artistName, playlists.value)
    if (result) {
      success(`Playlist created with ${result.tracksAdded} tracks!`)
      if (result.tracksFailed > 0) {
        warning(`${result.tracksFailed} tracks not found on Spotify`)
      }
    } else {
      showError(creationError.value || 'Failed to create playlist')
    }
  }
}

const handleClose = () => {
  // Reset state when modal closes
  if (creationState.value !== 'idle') {
    resetState()
  }
  const pendingAction = getPendingAction()
  if (matchesPendingAction(pendingAction)) {
    sessionStorage.removeItem('spotify_pending_action')
  }
  emit('close')
}

watch(
  [() => props.isOpen, isAuthenticated, creationState],
  ([isOpen, authenticated, state]) => {
    if (!isOpen || !authenticated || state !== 'idle') return
    consumePendingAction().catch((err) => {
      console.error('Failed to resume pending playlist action', err)
    })
  }
)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div
      @click="handleClose"
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
    />

    <!-- Modal -->
    <div class="relative bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">
          {{ isSuccess ? 'Success!' : isError ? 'Error' : 'Create Spotify Playlist' }}
        </h2>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-300 transition-colors"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-4">
        <!-- Not Authenticated -->
        <div v-if="!isAuthenticated && !isLoading && !isSuccess && !isError" class="space-y-4">
          <p class="text-sm text-gray-300">
            Connect your Spotify account to create playlists from Cyprus Avenue episodes.
          </p>
          <SpotifyAuthButton :modal-state="modalState" />
        </div>

        <!-- Authenticated - Ready to Create -->
        <div v-else-if="isAuthenticated && !isLoading && !isSuccess && !isError" class="space-y-4">
          <div v-if="playlist" class="bg-gray-700/50 rounded-lg p-3">
            <p class="text-xs text-gray-400 mb-1">Selected Playlist</p>
            <p class="text-sm font-semibold text-white">{{ playlist.title }}</p>
            <p class="text-xs text-gray-400">{{ playlist.tracks.length }} tracks</p>
          </div>

          <div v-if="mode === 'all-tracks'" class="bg-gray-700/50 rounded-lg p-3">
            <p class="text-xs text-gray-400 mb-1">Complete Archive</p>
            <p class="text-sm font-semibold text-white">All Unique Tracks</p>
            <p class="text-xs text-gray-400">~{{ playlists.length }} shows with {{ (playlists.flatMap(p => p.tracks).length) }} total tracks</p>
          </div>

          <div v-if="mode === 'tag' && tag" class="bg-gray-700/50 rounded-lg p-3">
            <p class="text-xs text-gray-400 mb-1">Tag Based Playlist</p>
            <p class="text-sm font-semibold text-white">{{ tag.charAt(0).toUpperCase() + tag.slice(1) }}</p>
            <p class="text-xs text-gray-400">Tracks tagged with this tag in the archive</p>
          </div>

          <div v-if="mode === 'artist' && artistName" class="bg-gray-700/50 rounded-lg p-3">
            <p class="text-xs text-gray-400 mb-1">Artist Based Playlist</p>
            <p class="text-sm font-semibold text-white">{{ artistName }}</p>
            <p class="text-xs text-gray-400">All tracks by this artist in the archive</p>
          </div>

          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p class="text-xs text-blue-300">
              <strong>Note:</strong> Tracks not found on Spotify will be skipped.
            </p>
          </div>

          <button
            @click="handleCreatePlaylist"
            :disabled="isLoading"
            class="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {{ isLoading ? 'Creating...' : 'Create Playlist' }}
          </button>
        </div>

        <!-- Creating -->
        <PlaylistCreationProgress
          v-if="isLoading"
          :progress="creationProgress"
          :is-creating="isLoading"
        />

        <!-- Success -->
        <TrackMatchingSummary
          v-if="isSuccess && creationResult"
          :result="creationResult"
        />

        <!-- Error -->
        <div v-if="isError" class="space-y-4">
          <div class="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
            <p class="text-sm font-semibold text-red-300 mb-2">✕ Error</p>
            <p class="text-sm text-red-200">{{ creationError }}</p>
          </div>
          <button
            @click="handleClose"
            class="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
