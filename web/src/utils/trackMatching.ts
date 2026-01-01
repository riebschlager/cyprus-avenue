import type { Track } from '../types/playlist'
import type { SpotifyTrackMatch } from '../types/spotify'
import type { SpotifyIndex } from '../composables/useStreamingLinks'
import { SpotifyApiClient } from './spotifyApi'

interface TrackMatcherType {
  matchTrack(track: Track): Promise<SpotifyTrackMatch>
  matchTracks(tracks: Track[]): Promise<SpotifyTrackMatch[]>
  getUrisFromMatches(matches: SpotifyTrackMatch[]): {
    uris: string[]
    notFound: Array<{ artist: string; song: string }>
  }
}

export function TrackMatcher(
  spotifyIndex: SpotifyIndex,
  apiClient: ReturnType<typeof SpotifyApiClient>
): TrackMatcherType {
  async function matchTrack(track: Track): Promise<SpotifyTrackMatch> {
    // First, try to find in the pre-indexed tracks
    const indexKey = `${track.artist}|${track.song}`
    const indexed = spotifyIndex[indexKey]

    if (indexed && (indexed.confidence === 'high' || indexed.confidence === 'medium')) {
      return {
        artist: track.artist,
        song: track.song,
        spotifyId: indexed.spotifyId,
        spotifyUri: `spotify:track:${indexed.spotifyId}`,
        confidence: indexed.confidence
      }
    }

    // Fallback to API search
    try {
      const result = await apiClient.searchTrack(track.artist, track.song)
      if (result) {
        return {
          artist: track.artist,
          song: track.song,
          spotifyId: result.id,
          spotifyUri: result.uri,
          confidence: 'low'
        }
      }
    } catch (error) {
      console.warn(`Failed to search for ${track.artist} - ${track.song}`, error)
    }

    return {
      artist: track.artist,
      song: track.song,
      spotifyId: null,
      spotifyUri: null,
      confidence: 'not_found'
    }
  }

  return {
    async matchTrack(track: Track): Promise<SpotifyTrackMatch> {
      return matchTrack(track)
    },

    async matchTracks(tracks: Track[]): Promise<SpotifyTrackMatch[]> {
      const matches: SpotifyTrackMatch[] = []

      for (const track of tracks) {
        const match = await matchTrack(track)
        matches.push(match)
        // Add delay between search requests to avoid rate limiting
        // Most tracks are in the index, but for fallback searches we need protection
        // 100ms per search is conservative but necessary for mega-playlist creation
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      return matches
    },

    getUrisFromMatches(matches: SpotifyTrackMatch[]): {
      uris: string[]
      notFound: Array<{ artist: string; song: string }>
    } {
      const uris: string[] = []
      const notFound: Array<{ artist: string; song: string }> = []

      for (const match of matches) {
        if (match.spotifyUri) {
          uris.push(match.spotifyUri)
        } else {
          notFound.push({
            artist: match.artist,
            song: match.song
          })
        }
      }

      return { uris, notFound }
    }
  }
}

export function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>()
  const unique: Track[] = []

  for (const track of tracks) {
    const key = `${track.artist}|${track.song}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(track)
    }
  }

  return unique
}
