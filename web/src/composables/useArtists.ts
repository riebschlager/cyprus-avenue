import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { Playlist } from '../types/playlist'
import { useArtistBios } from './useArtistBios'

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
  genres: string[]
}

export function useArtists(playlists: MaybeRefOrGetter<Playlist[]>) {
  const searchQuery = ref('')
  const selectedGenre = ref<string>('')
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

      // Get consolidated genres from artist bio (accessing biosIndex ensures reactivity)
      const bio = biosIndex.value[name]
      const genres = bio?.genres || bio?.tags || []

      artistList.push({
        name,
        tracks: data.tracks,
        uniqueSongs,
        playlistCount: uniquePlaylists.size,
        genres: genres
      })
    })

    // Sort by name
    return artistList.sort((a, b) => a.name.localeCompare(b.name))
  })

  // Get all available genres across all artists
  const availableGenres = computed(() => {
    const genreSet = new Set<string>()
    artists.value.forEach(artist => {
      artist.genres.forEach(genre => genreSet.add(genre))
    })
    return Array.from(genreSet).sort()
  })

  // Filter artists by search query and genre
  const filteredArtists = computed(() => {
    let result = artists.value

    // Filter by genre
    if (selectedGenre.value) {
      result = result.filter(artist => artist.genres.includes(selectedGenre.value))
    }

    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(artist => {
        return artist.name.toLowerCase().includes(query) ||
               artist.uniqueSongs.some(song => song.toLowerCase().includes(query))
      })
    }

    return result
  })

  return {
    searchQuery,
    selectedGenre,
    artists,
    filteredArtists,
    availableGenres
  }
}
