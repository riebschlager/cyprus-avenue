<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import type { Artist } from '../composables/useArtists'
import StreamingLinks from './StreamingLinks.vue'
import SpotifyPlaylistModal from './SpotifyPlaylistModal.vue'
import { generatePlaylistSlug } from '../utils/slug'
import { useArtistBios } from '../composables/useArtistBios'

const props = defineProps<{
  artist: Artist
  isExpanded: boolean
}>()

const emit = defineEmits<{
  toggle: []
  'select-tag': [tag: string]
}>()

const cardRef = ref<HTMLElement | null>(null)
const showSpotifyModal = ref(false)

// Artist bio functionality
const { loadBiosIndex, getBio, indexLoaded } = useArtistBios()
const artistBio = computed(() => getBio(props.artist.name))

// Generate playlist permalink
const getPlaylistUrl = (title: string, date: string) => {
  const slug = generatePlaylistSlug(title, date)
  return `/playlist/${slug}`
}

// Group tracks by playlist
const playlistsWithTracks = computed(() => {
  const playlistMap = new Map<string, { date: string; title: string; songs: string[] }>()

  props.artist.tracks.forEach(track => {
    const key = `${track.playlistDate}|${track.playlistTitle}`
    if (!playlistMap.has(key)) {
      playlistMap.set(key, {
        date: track.playlistDate,
        title: track.playlistTitle,
        songs: []
      })
    }
    playlistMap.get(key)!.songs.push(track.song)
  })

  // Convert to array and sort by date (newest first)
  return Array.from(playlistMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  )
})

const scrollToCard = () => {
  if (cardRef.value) {
    nextTick(() => {
      const header = document.querySelector('header')
      const collapsedHeaderHeight = 100 // Target offset for collapsed state
      const currentHeaderHeight = header?.clientHeight || collapsedHeaderHeight
      
      // Calculate how much the content will shift if header collapses
      const heightDifference = Math.max(0, currentHeaderHeight - collapsedHeaderHeight)
      
      const elementPosition = cardRef.value!.getBoundingClientRect().top + window.scrollY
      
      // Adjust target: remove the extra height that will disappear upon scrolling
      const offsetPosition = elementPosition - heightDifference - collapsedHeaderHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    })
  }
}

// Scroll to card when expanded via URL (on mount)
onMounted(async () => {
  // Load artist bios index (lazy load)
  if (!indexLoaded.value) {
    await loadBiosIndex()
  }

  if (props.isExpanded) {
    scrollToCard()

    // Check for pending Spotify action after OAuth redirect
    const pendingAction = sessionStorage.getItem('spotify_pending_action')
    if (pendingAction) {
      try {
        const action = JSON.parse(pendingAction)
        // Check if this is the artist that should have the modal opened
        if (action.mode === 'artist' && action.artistName === props.artist.name) {
          showSpotifyModal.value = true
          sessionStorage.removeItem('spotify_pending_action')
        }
      } catch (err) {
        console.error('Failed to parse pending Spotify action', err)
        sessionStorage.removeItem('spotify_pending_action')
      }
    }
  }
})

// Scroll to top of card when expanded via toggle
watch(() => props.isExpanded, (newVal) => {
  if (newVal) {
    scrollToCard()
  }
})
</script>

<template>
  <div ref="cardRef" class="bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-700">
    <button
      @click="emit('toggle')"
      class="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
    >
      <div class="flex-1 min-w-0 flex items-center justify-between mr-4">
        <h3 class="text-lg font-semibold text-white">
          {{ artist.name }}
        </h3>
        <div class="flex gap-4 items-center">
          <div class="hidden sm:flex gap-4 text-xs text-gray-400">
            <span>{{ artist.uniqueSongs.length }} unique song{{ artist.uniqueSongs.length === 1 ? '' : 's' }}</span>
            <span>{{ artist.playlistCount }} playlist{{ artist.playlistCount === 1 ? '' : 's' }}</span>
          </div>
        </div>
      </div>
      <svg
        class="h-5 w-5 text-gray-400 transition-transform flex-shrink-0"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="isExpanded" class="px-6 pb-4 border-t border-gray-700">
      <!-- Actions Section (Only shown if NO bio, otherwise it's in the bio header) -->
      <div v-if="!artistBio || !artistBio.bioSummary" class="mt-4 pb-4 border-b border-gray-700 flex justify-end">
        <button
          @click="showSpotifyModal = true"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs font-medium transition-colors"
        >
          <span>🎧</span>
          Create {{ artist.name }} Playlist on Spotify
        </button>
      </div>

      <!-- Artist Bio Section -->
      <div v-if="artistBio && artistBio.bioSummary" class="mt-4 pb-4 border-b border-gray-700">
        <div class="flex items-center justify-between mb-3 gap-4">
          <h4 class="text-sm font-semibold text-white flex items-center gap-2">
            <span>About</span>
            <a
              v-if="artistBio.url"
              :href="artistBio.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-gray-400 hover:text-blue-400 transition-colors"
              title="View on Last.fm"
            >
              <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </h4>
          
          <button
            @click="showSpotifyModal = true"
            class="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            <span>🎧</span>
            Create {{ artist.name }} Playlist on Spotify
          </button>
        </div>
        
        <div class="flex gap-4">
          <!-- Artist Image -->
          <div v-if="artistBio.image" class="flex-shrink-0">
            <img
              :src="artistBio.image"
              :alt="artist.name"
              class="w-24 h-24 rounded-lg object-cover shadow-lg"
              loading="lazy"
            />
          </div>
          <!-- Bio Text -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-300 leading-relaxed lastfm-bio" v-html="artistBio.bioSummary"></p>
            <div v-if="artistBio.listeners && artistBio.playcount" class="mt-3 flex gap-4 text-xs text-gray-400">
              <span>{{ artistBio.listeners.toLocaleString() }} listeners</span>
              <span>{{ artistBio.playcount.toLocaleString() }} plays</span>
            </div>
          </div>
        </div>
      </div>



      <!-- Tags Section (Consolidated from Last.fm + Spotify) -->
      <div v-if="artist.tags && artist.tags.length > 0" class="mt-4 pb-4 border-b border-gray-700">
        <h4 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span>Tags</span>
          <span v-if="artistBio && artistBio.tagSources" class="text-xs font-normal text-gray-500">
            ({{ artistBio.tagSources.total }} from {{ artistBio.tagSources.lastfm + artistBio.tagSources.spotifyArtist + artistBio.tagSources.spotifyTracks > artistBio.tagSources.lastfm ? 'multiple sources' : 'Last.fm' }})
          </span>
        </h4>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in artist.tags.slice(0, 10)"
            :key="tag"
            @click.stop="emit('select-tag', tag)"
            class="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <!-- Unique Songs Section -->
      <div class="mt-4">
        <h4 class="text-sm font-semibold text-white mb-3">Unique Songs</h4>
        <div class="space-y-2">
          <div
            v-for="(song, index) in artist.uniqueSongs"
            :key="index"
            class="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-700/50"
          >
            <span class="text-sm text-gray-500 font-mono min-w-[2rem]">{{ index + 1 }}.</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white">{{ song }}</p>
            </div>
            <div class="flex-shrink-0">
              <StreamingLinks :artist="artist.name" :song="song" />
            </div>
          </div>
        </div>
      </div>

      <!-- Playlists Section -->
      <div class="mt-6 pt-4 border-t border-gray-700">
        <h4 class="text-sm font-semibold text-white mb-3">Appears In</h4>
        <div class="space-y-3">
          <div
            v-for="(playlist, index) in playlistsWithTracks"
            :key="index"
            class="py-2 px-3 rounded hover:bg-gray-700/50"
          >
            <router-link
              :to="getPlaylistUrl(playlist.title, playlist.date)"
              class="flex items-baseline gap-2 mb-2 hover:opacity-80 transition-opacity"
            >
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300">
                {{ playlist.date }}
              </span>
              <p class="text-sm text-blue-400 hover:text-blue-300 transition-colors">{{ playlist.title }}</p>
            </router-link>
            <ul class="ml-[4.5rem] space-y-1">
              <li
                v-for="(song, songIndex) in playlist.songs"
                :key="songIndex"
                class="text-xs text-gray-500"
              >
                {{ song }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Artist Playlist Modal -->
    <SpotifyPlaylistModal
      :is-open="showSpotifyModal"
      :artist-name="artist.name"
      mode="artist"
      @close="showSpotifyModal = false"
    />
  </div>
</template>

<style scoped>
/* Style the Last.fm "Read more" link that comes in the v-html */
:deep(.lastfm-bio a) {
  color: #60a5fa; /* blue-400 */
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 500;
  transition: color 0.2s;
  display: inline-flex;
  items-center: center;
  gap: 0.25rem;
}

:deep(.lastfm-bio a:hover) {
  color: #93c5fd; /* blue-300 */
}

/* Add an external link icon after the link */
:deep(.lastfm-bio a::after) {
  content: "";
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  margin-left: 0.25rem;
  background-color: currentColor;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' /%3E%3C/svg%3E");
  mask-size: contain;
  mask-repeat: no-repeat;
  vertical-align: middle;
}
</style>
