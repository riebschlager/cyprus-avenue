<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PlaylistAction } from './pendingAction'
import type { Playlist } from '../../types/playlist'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useSpotifyPlaylistCreation } from './useSpotifyPlaylistCreation'
import { usePlaylists } from '../../composables/usePlaylists'
import { useToast } from '../../composables/useToast'
import SpotifyAuthButton from './SpotifyAuthButton.vue'
import PlaylistCreationProgress from './PlaylistCreationProgress.vue'
import TrackMatchingSummary from './TrackMatchingSummary.vue'
import Icon from '../../components/Icon.vue'

export type ModalMode = 'closed' | 'authenticated' | 'playlist-selection' | 'creating' | 'success' | 'error'

const props = defineProps<{
  isOpen: boolean
  resume?: boolean
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
const totalArchiveTracks = computed(() => playlists.value.reduce((sum, p) => sum + p.tracks.length, 0))

// Create modal state object to preserve context through OAuth flow
const modalState = computed<PlaylistAction | undefined>(() => {
  if (props.mode === 'single' && props.playlist) return { action: 'create-playlist', mode: 'single', playlistSlug: props.playlist.date }
  if (props.mode === 'tag' && props.tag) return { action: 'create-playlist', mode: 'tag', tag: props.tag }
  if (props.mode === 'artist' && props.artistName) return { action: 'create-playlist', mode: 'artist', artistName: props.artistName }
  if (props.mode === 'all-tracks') return { action: 'create-playlist', mode: 'all-tracks' }
  return undefined
})

const handleCreatePlaylist = async () => {
  if (!props.playlist && props.mode !== 'all-tracks' && props.mode !== 'tag' && props.mode !== 'artist') {
    showError('No source selected')
    return
  }

  let result = null
  if (props.mode === 'single' && props.playlist) result = await createPlaylistFromArchivePlaylist(props.playlist)
  else if (props.mode === 'all-tracks') result = await createPlaylistFromAllTracks(playlists.value)
  else if (props.mode === 'tag' && props.tag) result = await createPlaylistFromTag(props.tag, playlists.value)
  else if (props.mode === 'artist' && props.artistName) result = await createPlaylistFromArtist(props.artistName, playlists.value)
  else { showError('No source selected'); return }

  if (result) {
    success(`Playlist created with ${result.tracksAdded} tracks!`)
    if (result.tracksFailed > 0) warning(`${result.tracksFailed} tracks not found on Spotify`)
  } else showError(creationError.value || 'Failed to create playlist')
}

const handleClose = () => {
  // Reset state when modal closes
  if (creationState.value !== 'idle') {
    resetState()
  }
  emit('close')
}

let resumed = false
watch([() => props.isOpen, isAuthenticated], ([open, authenticated]) => {
  if (open && authenticated && props.resume && !resumed) {
    resumed = true
    void handleCreatePlaylist()
  }
}, { immediate: true })
</script>

<template>
  <div v-if="isOpen" class="ca-scrim" @click.self="handleClose">
    <div class="ca-dialog modal" role="dialog" aria-modal="true" aria-labelledby="spotify-modal-title">
      <div class="ca-dialog__head">
        <div>
          <span class="ca-label">Spotify</span>
          <h2 id="spotify-modal-title" class="ca-dialog__title">
            {{ isSuccess ? 'Playlist created' : isError ? 'Something went wrong' : 'Add to Spotify' }}
          </h2>
        </div>
        <button type="button" class="ca-iconbtn" @click="handleClose" aria-label="Close">
          <Icon name="x" />
        </button>
      </div>

      <div class="ca-dialog__body modal__body">
        <!-- Not authenticated -->
        <template v-if="!isAuthenticated && !isLoading && !isSuccess && !isError">
          <p>Connect your Spotify account to turn Cyprus Avenue shows into playlists.</p>
          <div><SpotifyAuthButton :modal-state="modalState" /></div>
        </template>

        <!-- Authenticated, ready to create -->
        <template v-else-if="isAuthenticated && !isLoading && !isSuccess && !isError">
          <div v-if="playlist" class="modal__source">
            <span class="ca-label ca-label--sm">Show &middot; {{ playlist.tracks.length }} tracks</span>
            <p class="modal__source-title">{{ playlist.title }}</p>
          </div>

          <div v-if="mode === 'all-tracks'" class="modal__source">
            <span class="ca-label ca-label--sm">
              Complete archive &middot; {{ playlists.length.toLocaleString() }} shows &middot; {{ totalArchiveTracks.toLocaleString() }} tracks
            </span>
            <p class="modal__source-title">All unique tracks</p>
          </div>

          <div v-if="mode === 'tag' && tag" class="modal__source">
            <span class="ca-label ca-label--sm">Tag</span>
            <p class="modal__source-title">{{ tag }}</p>
            <p class="modal__note">Every track in the archive with this tag.</p>
          </div>

          <div v-if="mode === 'artist' && artistName" class="modal__source">
            <span class="ca-label ca-label--sm">Artist</span>
            <p class="modal__source-title">{{ artistName }}</p>
            <p class="modal__note">Every track by this artist in the archive.</p>
          </div>

          <p class="modal__note">Tracks that aren&rsquo;t on Spotify will be skipped.</p>
        </template>

        <PlaylistCreationProgress
          v-if="isLoading"
          :progress="creationProgress"
          :is-creating="isLoading"
        />

        <TrackMatchingSummary
          v-if="isSuccess && creationResult"
          :result="creationResult"
        />

        <div v-if="isError" class="modal__error" role="alert">
          <Icon name="circle-alert" />
          <p>{{ creationError }}</p>
        </div>
      </div>

      <div v-if="isAuthenticated && !isLoading && !isSuccess && !isError" class="ca-dialog__foot">
        <button type="button" class="ca-btn ca-btn--ghost" @click="handleClose">Cancel</button>
        <button type="button" class="ca-btn ca-btn--accent" :disabled="isLoading" @click="handleCreatePlaylist">
          <Icon name="list-plus" /> Create playlist
        </button>
      </div>
      <div v-else-if="isError" class="ca-dialog__foot">
        <button type="button" class="ca-btn ca-btn--secondary" @click="handleClose">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal { max-height: calc(100vh - 48px); overflow-y: auto; }
.modal__body { display: flex; flex-direction: column; gap: var(--space-5); }
.modal__source { padding-top: var(--space-3); border-top: var(--rule-ink); }
.modal__source-title { margin-top: 6px; font: 700 20px/1.2 var(--font-display); letter-spacing: -0.02em; color: var(--fg-1); }
.modal__note { font: var(--type-ui-s); color: var(--fg-3); }
.modal__source .modal__note { margin-top: 4px; }
.modal__error { display: flex; gap: 10px; align-items: flex-start; padding: var(--space-3) var(--space-4); background: var(--status-error-bg); color: var(--status-error); font: var(--type-ui); }
.modal__error .ca-icon { font-size: 18px; margin-top: 1px; }
</style>
