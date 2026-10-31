import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from './usePlaylists'
import { useArtists, type Artist } from './useArtists'
import type { Playlist } from '../types/playlist'
import { findArtistBySlug, findPlaylistBySlug, generateArtistSlug, generatePlaylistSlug } from '../utils/slug'
import { getPublicUrl } from '../utils/urls'

export interface OpenGraphData {
  title: string
  description: string
  url: string
  type?: string
}

const DEFAULT_DESCRIPTION = 'A searchable archive of Cyprus Avenue radio show playlists from KCUR.'

export function getRouteMetadata(
  path: string, slug: unknown, playlists: Playlist[], artists: Artist[], tag?: unknown
): OpenGraphData {
  if (path.startsWith('/playlist/') && typeof slug === 'string') {
    const playlist = findPlaylistBySlug(playlists, slug)
    if (playlist) return {
      title: `${playlist.title} - Cyprus Avenue Archive`,
      description: `${playlist.tracks.length} tracks from this Cyprus Avenue episode (${playlist.date})`,
      url: getPublicUrl(`/playlist/${generatePlaylistSlug(playlist.title, playlist.date)}`),
      type: 'music.playlist'
    }
  }
  if (path.startsWith('/artist/') && typeof slug === 'string') {
    const artist = findArtistBySlug(artists, slug)
    if (artist) return {
      title: `${artist.name} - Cyprus Avenue Archive`,
      description: `${artist.tracks.length} track appearance${artist.tracks.length !== 1 ? 's' : ''} in Cyprus Avenue playlist archive`,
      url: getPublicUrl(`/artist/${generateArtistSlug(artist.name)}`),
      type: 'music.musician'
    }
  }
  const titles: Record<string, string> = {
    '/': 'Cyprus Avenue Archive',
    '/playlists': 'Playlists - Cyprus Avenue Archive',
    '/tracks': 'All Tracks - Cyprus Avenue Archive',
    '/artists': 'Artists - Cyprus Avenue Archive',
    '/auth/callback': 'Connecting to Spotify - Cyprus Avenue Archive'
  }
  if (typeof tag === 'string' && tag && (path === '/artists' || path.startsWith('/artist/'))) {
    const label = tag.replace(/\+/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    return { title: `${label} Artists - Cyprus Avenue Archive`, description: DEFAULT_DESCRIPTION, url: getPublicUrl(`${path}?tag=${encodeURIComponent(tag)}`) }
  }
  return { title: titles[path] || 'Cyprus Avenue Archive', description: DEFAULT_DESCRIPTION, url: getPublicUrl(path) }
}

function setMetadata(data: OpenGraphData) {
  document.title = data.title
  const image = getPublicUrl('/cyprus-avenue.jpg')
  const tags: Record<string, string> = {
    'description': data.description,
    'og:title': data.title,
    'og:description': data.description,
    'og:image': image,
    'og:url': data.url,
    'og:type': data.type || 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': image
  }
  // Episodes have date-only archive dates, not article publication timestamps.
  document.querySelector('meta[name="article:published_time"], meta[property="article:published_time"]')?.remove()
  for (const [property, content] of Object.entries(tags)) {
    let element = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(property.startsWith('og:') ? 'property' : 'name', property)
      document.head.appendChild(element)
    }
    element.setAttribute('content', content)
  }
}

/** Called once by App: route changes and asynchronous record resolution share one owner. */
export function useOpenGraph() {
  const route = useRoute()
  const { playlists } = usePlaylists()
  const { artists } = useArtists(playlists)
  watchEffect(() => {
    setMetadata(getRouteMetadata(route.path, route.params.slug, playlists.value, artists.value, route.query.tag))
  })
}
