import { ref, computed } from 'vue'
import type { Playlist } from '../../types/playlist'
import type { PlaylistCreationResult, CreationProgress, SpotifyTrackMatch } from './spotify'
import { useStreamingLinks } from '../../composables/useStreamingLinks'
import { useArtistBios } from '../../composables/useArtistBios'
import { SpotifyApiClient } from './spotifyApi'
import { TrackMatcher } from './trackMatching'
import { selectShow, selectArchive, selectArtist, selectTag, type TrackSelection } from './trackSelection'

const creationState = ref<'idle' | 'creating' | 'completed' | 'error'>('idle')
const creationProgress = ref<CreationProgress>({
  currentTrackIndex: 0,
  totalTracks: 0,
  currentTrackName: '',
  currentArtist: '',
  playlistName: ''
})
const creationResult = ref<PlaylistCreationResult | null>(null)
const creationError = ref<string | null>(null)

export function useSpotifyPlaylistCreation() {
  const { spotifyIndex, loadSpotifyIndex } = useStreamingLinks()
  const { biosIndex, loadBiosIndex, error: biosError } = useArtistBios()
  const resetState = () => {
    if (creationState.value === 'creating') return
    creationState.value = 'idle'
    creationProgress.value = { currentTrackIndex: 0, totalTracks: 0, currentTrackName: '', currentArtist: '', playlistName: '' }
    creationResult.value = null
    creationError.value = null
  }

  const runCreation = async (select: () => TrackSelection | Promise<TrackSelection>): Promise<PlaylistCreationResult | null> => {
    if (creationState.value === 'creating') return null
    resetState()
    creationState.value = 'creating'
    let created: { id: string; url: string } | null = null
    let added = 0
    try {
      await loadSpotifyIndex()
      const selection = await select()
      if (!selection.tracks.length) throw new Error('No tracks available for this selection.')
      const api = SpotifyApiClient()
      const matcher = TrackMatcher(spotifyIndex.value, api, selection.skipApiSearch)
      creationProgress.value.playlistName = selection.name
      creationProgress.value.totalTracks = selection.tracks.length
      const user = await api.getCurrentUser()
      const playlist = await api.createPlaylist(user.id, selection.name, false, selection.description)
      created = { id: playlist.id, url: playlist.external_urls.spotify }
      const matches: SpotifyTrackMatch[] = []
      for (const [index, track] of selection.tracks.entries()) {
        Object.assign(creationProgress.value, { currentTrackIndex: index, currentTrackName: track.song, currentArtist: track.artist })
        matches.push(await matcher.matchTrack(track))
        await new Promise(resolve => setTimeout(resolve, selection.delayMs))
      }
      const { uris, notFound } = matcher.getUrisFromMatches(matches)
      await api.addTracksToPlaylist(playlist.id, uris, count => { added = count })
      creationResult.value = {
        success: true, playlistId: playlist.id, playlistUrl: playlist.external_urls.spotify,
        playlistName: selection.name, tracksAdded: uris.length, tracksFailed: notFound.length, notFound
      }
      creationState.value = 'completed'
      return creationResult.value
    } catch (error) {
      creationState.value = 'error'
      creationError.value = (error instanceof Error ? error.message : 'Playlist creation failed')
        + (created ? ` Playlist already created with ${added} tracks: ${created.url}. Check it before creating another.` : '')
      return null
    }
  }
  return {
    creationState: computed(() => creationState.value),
    creationProgress: computed(() => creationProgress.value),
    creationResult: computed(() => creationResult.value),
    creationError: computed(() => creationError.value),
    createPlaylistFromArchivePlaylist: (playlist: Playlist) => runCreation(() => selectShow(playlist)),
    createPlaylistFromAllTracks: (playlists: Playlist[]) => runCreation(() => selectArchive(playlists)),
    createPlaylistFromArtist: (artist: string, playlists: Playlist[]) => runCreation(() => selectArtist(artist, playlists)),
    createPlaylistFromTag: (tag: string, playlists: Playlist[]) => runCreation(async () => {
      await loadBiosIndex()
      if (biosError.value) throw new Error('Artist tags unavailable. Try again after reloading artist data.')
      return selectTag(tag, playlists, biosIndex.value)
    }),
    resetState
  }
}
