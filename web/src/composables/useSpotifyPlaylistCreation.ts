import { ref, computed } from 'vue'
import type { Playlist } from '../types/playlist'
import type { PlaylistCreationResult, CreationProgress } from '../types/spotify'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useStreamingLinks } from './useStreamingLinks'
import { SpotifyApiClient } from '../utils/spotifyApi'
import { TrackMatcher, deduplicateTracks } from '../utils/trackMatching'
import { PLAYLIST_NAME_INDIVIDUAL, PLAYLIST_NAME_ALL_TRACKS } from '../utils/spotifyConstants'

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
  const { getAccessToken } = useSpotifyAuth()
  const { spotifyIndex } = useStreamingLinks()

  const resetState = () => {
    creationState.value = 'idle'
    creationProgress.value = {
      currentTrackIndex: 0,
      totalTracks: 0,
      currentTrackName: '',
      currentArtist: '',
      playlistName: ''
    }
    creationResult.value = null
    creationError.value = null
  }

  const createPlaylistFromArchivePlaylist = async (
    playlist: Playlist
  ): Promise<PlaylistCreationResult | null> => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      creationError.value = 'Not authenticated with Spotify'
      creationState.value = 'error'
      return null
    }

    const apiClient = SpotifyApiClient(accessToken)
    const matcher = TrackMatcher(spotifyIndex.value, apiClient)

    try {
      creationState.value = 'creating'
      const playlistName = PLAYLIST_NAME_INDIVIDUAL(playlist.date)
      creationProgress.value.playlistName = playlistName

      // Get current user
      const user = await apiClient.getCurrentUser()

      // Create Spotify playlist with archive playlist title as description
      const spotifyPlaylist = await apiClient.createPlaylist(user.id, playlistName, false, playlist.title)

      // Match and add tracks
      creationProgress.value.totalTracks = playlist.tracks.length
      const trackMatches: any[] = []
      for (let i = 0; i < playlist.tracks.length; i++) {
        const track = playlist.tracks[i]!
        creationProgress.value.currentTrackIndex = i
        creationProgress.value.currentTrackName = track.song
        creationProgress.value.currentArtist = track.artist

        const match = await matcher.matchTrack(track)
        trackMatches.push(match)

        // Add delay between matches to avoid rate limiting
        // 150ms per track = ~6.7 requests/second, well below Spotify's limit
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      const { uris, notFound } = matcher.getUrisFromMatches(trackMatches)

      if (uris.length > 0) {
        await apiClient.addTracksToPlaylist(spotifyPlaylist.id, uris)
      }

      creationState.value = 'completed'
      const result: PlaylistCreationResult = {
        success: true,
        playlistId: spotifyPlaylist.id,
        playlistUrl: spotifyPlaylist.external_urls.spotify,
        playlistName,
        tracksAdded: uris.length,
        tracksFailed: notFound.length,
        notFound
      }

      creationResult.value = result
      return result
    } catch (error) {
      creationState.value = 'error'
      const message = error instanceof Error ? error.message : 'Unknown error'
      creationError.value = message
      console.error('Playlist creation error:', error)
      return null
    }
  }

  const createPlaylistFromAllTracks = async (
    playlists: Playlist[]
  ): Promise<PlaylistCreationResult | null> => {
    resetState()
    const accessToken = getAccessToken()
    if (!accessToken) {
      creationError.value = 'Not authenticated with Spotify'
      creationState.value = 'error'
      return null
    }

    const apiClient = SpotifyApiClient(accessToken)
    // For mega-playlist, skip API searches and use only pre-indexed tracks
    // This dramatically reduces request count and time (from 4-5 min to 30-60 sec)
    const matcher = TrackMatcher(spotifyIndex.value, apiClient, true)

    try {
      creationState.value = 'creating'
      const playlistName = PLAYLIST_NAME_ALL_TRACKS
      creationProgress.value.playlistName = playlistName

      // Collect all tracks and deduplicate
      const allTracks = playlists.flatMap(p => p.tracks)
      const uniqueTracks = deduplicateTracks(allTracks)

      // Get current user
      const user = await apiClient.getCurrentUser()

      // Create Spotify playlist with count of unique shows
      const description = `All unique tracks from ${playlists.length} Cyprus Avenue shows`
      const spotifyPlaylist = await apiClient.createPlaylist(user.id, playlistName, false, description)

      // Match and add tracks
      creationProgress.value.totalTracks = uniqueTracks.length
      const trackMatches: any[] = []
      for (let i = 0; i < uniqueTracks.length; i++) {
        const track = uniqueTracks[i]!
        creationProgress.value.currentTrackIndex = i
        creationProgress.value.currentTrackName = track.song
        creationProgress.value.currentArtist = track.artist

        const match = await matcher.matchTrack(track)
        trackMatches.push(match)

        // Minimal delay for UI responsiveness since we're only doing index lookups (no API calls)
        // This keeps the progress bar responsive without blocking the event loop
        await new Promise(resolve => setTimeout(resolve, 1))
      }

      const { uris, notFound } = matcher.getUrisFromMatches(trackMatches)

      if (uris.length > 0) {
        await apiClient.addTracksToPlaylist(spotifyPlaylist.id, uris)
      }

      creationState.value = 'completed'
      const result: PlaylistCreationResult = {
        success: true,
        playlistId: spotifyPlaylist.id,
        playlistUrl: spotifyPlaylist.external_urls.spotify,
        playlistName,
        tracksAdded: uris.length,
        tracksFailed: notFound.length,
        notFound
      }

      creationResult.value = result
      return result
    } catch (error) {
      creationState.value = 'error'
      const message = error instanceof Error ? error.message : 'Unknown error'
      creationError.value = message
      console.error('Playlist creation error:', error)
      return null
    }
  }

  const cancelCreation = () => {
    if (creationState.value === 'creating') {
      creationState.value = 'idle'
      creationError.value = 'Playlist creation cancelled'
      resetState()
    }
  }

  return {
    creationState: computed(() => creationState.value),
    creationProgress: computed(() => creationProgress.value),
    creationResult: computed(() => creationResult.value),
    creationError: computed(() => creationError.value),
    createPlaylistFromArchivePlaylist,
    createPlaylistFromAllTracks,
    cancelCreation,
    resetState
  }
}
