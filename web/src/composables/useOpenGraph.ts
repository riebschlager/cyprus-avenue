import { watch } from 'vue'
import { useRoute } from 'vue-router'
import cyprusAvenueImage from '../assets/cyprus-avenue.jpg'

export interface OpenGraphData {
  title: string
  description: string
  image?: string
  url: string
  type?: string
  author?: string
  publishDate?: string
}

const BASE_URL = 'https://cyprus-avenue.netlify.app'
const DEFAULT_IMAGE = `${BASE_URL}${cyprusAvenueImage}`
const DEFAULT_DESCRIPTION = 'A searchable archive of Cyprus Avenue radio show playlists from KCUR, featuring over 1,500 tracks across 125 shows.'

/**
 * Composable for managing OpenGraph meta tags for social sharing
 * Updates dynamically as the route changes
 */
export function useOpenGraph() {
  const route = useRoute()

  const setOpenGraphTags = (data: OpenGraphData) => {
    const tags: Record<string, string> = {
      'og:title': data.title,
      'og:description': data.description,
      'og:image': data.image || DEFAULT_IMAGE,
      'og:url': data.url,
      'og:type': data.type || 'website',
      'og:author': data.author || 'Chris Riebschlager',
      'og:publish_date': data.publishDate || '2026-01-01',
      'twitter:card': 'summary_large_image',
      'twitter:title': data.title,
      'twitter:description': data.description,
      'twitter:image': data.image || DEFAULT_IMAGE,
    }

    for (const [property, content] of Object.entries(tags)) {
      let element = document.querySelector(`meta[property="${property}"]`) ||
                    document.querySelector(`meta[name="${property}"]`)

      if (!element) {
        element = document.createElement('meta')
        if (property.startsWith('og:') || property.startsWith('twitter:')) {
          element.setAttribute('property', property)
        } else {
          element.setAttribute('name', property)
        }
        document.head.appendChild(element)
      }

      element.setAttribute('content', content)
    }
  }

  const getPlaylistOG = (playlist: any) => {
    const url = `${BASE_URL}/playlist/${playlist.slug}`
    return {
      title: `${playlist.title} - Cyprus Avenue Archive`,
      description: `${playlist.tracks?.length || 0} tracks from this Cyprus Avenue episode (${playlist.date})`,
      url,
      type: 'music.playlist',
    }
  }

  const getArtistOG = (artist: string, trackCount: number) => {
    const slug = artist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const url = `${BASE_URL}/artist/${slug}`
    return {
      title: `${artist} - Cyprus Avenue Archive`,
      description: `${trackCount} track appearance${trackCount !== 1 ? 's' : ''} in Cyprus Avenue playlist archive`,
      url,
      type: 'music.musician',
    }
  }

  const getDefaultOG = () => {
    const url = BASE_URL + route.path
    const titles: Record<string, string> = {
      '/': 'Cyprus Avenue Archive',
      '/playlists': 'All Playlists - Cyprus Avenue Archive',
      '/tracks': 'All Tracks - Cyprus Avenue Archive',
      '/artists': 'All Artists - Cyprus Avenue Archive',
    }

    const title = titles[route.path] || 'Cyprus Avenue Archive'

    return {
      title,
      description: DEFAULT_DESCRIPTION,
      url,
    }
  }

  // Watch route changes to update OG tags
  watch(() => route.path, () => {
    // Default behavior - components can override this
    setOpenGraphTags(getDefaultOG())
  }, { immediate: true })

  return {
    setOpenGraphTags,
    getPlaylistOG,
    getArtistOG,
    getDefaultOG,
  }
}
