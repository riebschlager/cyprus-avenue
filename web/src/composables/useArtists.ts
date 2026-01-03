import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { Playlist } from '../types/playlist'
import { useArtistBios } from './useArtistBios'
import { normalizeAndFilterTag } from '../utils/tagFilters'

export interface ArtistTrack {
  song: string
  playlistTitle: string
  playlistDate: string
}

export interface Artist {
  name: string
  tracks: ArtistTrack[]
  uniqueSongs: string[]
  playlistCount: number
  tags: string[]
}

export type ArtistSearchFilter = 'artist' | 'song'

export function useArtists(playlists: MaybeRefOrGetter<Playlist[]>) {
  const searchQuery = ref('')
  const searchFilters = ref<ArtistSearchFilter[]>(['artist'])
  const selectedTag = ref<string>('')
  const { biosIndex } = useArtistBios()

  // Build artist map
  const artists = computed(() => {
    const artistMap = new Map<string, { tracks: ArtistTrack[] }>()
    const playlistsValue = toValue(playlists)

    playlistsValue.forEach(playlist => {
      playlist.tracks.forEach(track => {
        const artistName = track.artist
        if (!artistMap.has(artistName)) {
          artistMap.set(artistName, { tracks: [] })
        }

        const entry = artistMap.get(artistName)!
        entry.tracks.push({
          song: track.song,
          playlistTitle: playlist.title,
          playlistDate: playlist.date
        })
      })
    })

    // Convert to Artist array
    const artistList: Artist[] = []
    artistMap.forEach((data, name) => {
      const uniqueSongs = [...new Set(data.tracks.map(t => t.song))]
      const uniquePlaylists = new Set(data.tracks.map(t => `${t.playlistDate}|${t.playlistTitle}`))

      // Get consolidated tags from artist bio (accessing biosIndex ensures reactivity)
      const bio = biosIndex.value[name]
      const rawTags = bio?.tags || bio?.lastfmTags || []
      
      // Normalize and filter tags
      const tagSet = new Set<string>()
      rawTags.forEach(rawTag => {
        const normalized = normalizeAndFilterTag(rawTag)
        if (normalized) {
          tagSet.add(normalized)
        }
      })
      const tags = Array.from(tagSet).sort()

      artistList.push({
        name,
        tracks: data.tracks,
        uniqueSongs,
        playlistCount: uniquePlaylists.size,
        tags: tags
      })
    })

    // Sort by name
    return artistList.sort((a, b) => a.name.localeCompare(b.name))
  })

  // Get all available tags across all artists
  const availableTags = computed(() => {
    const tagSet = new Set<string>()
    artists.value.forEach(artist => {
      artist.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  })

  // Filter artists by search query and tag
  const filteredArtists = computed(() => {
    let result = artists.value

    // Filter by tag
    if (selectedTag.value) {
      result = result.filter(artist => artist.tags.includes(selectedTag.value))
    }

    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(artist => {
        const matchesArtist = searchFilters.value.includes('artist') &&
          artist.name.toLowerCase().includes(query)
        const matchesSong = searchFilters.value.includes('song') &&
          artist.uniqueSongs.some(song => song.toLowerCase().includes(query))
        return matchesArtist || matchesSong
      })
    }

    return result
  })

  return {
    searchQuery,
    searchFilters,
    selectedTag,
    artists,
    filteredArtists,
    availableTags
  }
}
