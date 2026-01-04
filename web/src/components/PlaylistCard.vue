<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Playlist } from '../types/playlist'
import StreamingLinks from './StreamingLinks.vue'
import SpotifyPlaylistModal from './SpotifyPlaylistModal.vue'
import { useStreamingLinks } from '../composables/useStreamingLinks'
import { generateArtistSlug, generatePlaylistSlug } from '../utils/slug'
import { downloadPlaylist } from '../utils/downloadFormats'

const props = defineProps<{
  playlist: Playlist
  isExpanded: boolean
  searchQuery: string
  compact?: boolean
  disableScroll?: boolean
  isFocused?: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const { getTrackData } = useStreamingLinks()
const cardRef = ref<HTMLElement | null>(null)
const showSpotifyModal = ref(false)
const copiedTrackIndex = ref<number | null>(null)
const showDownloadMenu = ref(false)

// Check for pending Spotify action on mount
onMounted(() => {
  if (props.isExpanded) {
    if (!props.disableScroll) {
      scrollToCard()
      scrollToTrack()
    }

    // Check if we should auto-reopen the Spotify modal after OAuth redirect
    const pendingAction = sessionStorage.getItem('spotify_pending_action')
    if (pendingAction) {
      try {
        const action = JSON.parse(pendingAction)
        // Check if this is the playlist that should have the modal opened
        if (action.mode === 'single' && action.playlistSlug === props.playlist.date) {
          showSpotifyModal.value = true
        }
      } catch (err) {
        console.error('Failed to parse pending Spotify action', err)
        sessionStorage.removeItem('spotify_pending_action')
      }
    }
  }
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const getAlbumArt = (artist: string, song: string): string | null => {
  const trackData = getTrackData(artist, song)
  return trackData?.albumArt || null
}

const scrollToCard = () => {
  if (props.disableScroll) return
  if (cardRef.value) {
    nextTick(() => {
      // If we have a track deep link, don't scroll to card top, let the track scrolling handle it
      if (route.query.track && props.playlist.tracks.some(t => t.song === route.query.track)) {
        return
      }

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

const copyTrackLink = async (song: string, index: number) => {
  const slug = generatePlaylistSlug(props.playlist.title, props.playlist.date)
  const url = `${window.location.origin}/playlist/${slug}?track=${encodeURIComponent(song)}`
  try {
    await navigator.clipboard.writeText(url)
    copiedTrackIndex.value = index
    setTimeout(() => {
      copiedTrackIndex.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link', err)
  }
}

const scrollToTrack = () => {
  const trackName = route.query.track as string
  if (!trackName) return

  const index = props.playlist.tracks.findIndex(t => t.song === trackName)
  if (index === -1) return

  nextTick(() => {
    const trackElement = document.getElementById(`track-${props.playlist.date}-${index}`)
    if (trackElement) {
      trackElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Add a temporary highlight animation class if needed, or just rely on the static highlight
    }
  })
}

// Scroll to top of card when expanded via toggle
watch(() => props.isExpanded, (newVal) => {
  if (newVal) {
    scrollToCard()
    // Small delay to ensure DOM is rendered before scrolling to track
    setTimeout(scrollToTrack, 100)
  }
})
</script>

<template>
  <div
    ref="cardRef"
    class="bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border"
    :class="[
      isFocused
        ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-blue-500/20'
        : 'border-gray-700'
    ]"
  >
    <button
      @click="emit('toggle')"
      class="w-full text-left flex items-start justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors"
      :class="[compact ? 'px-4 py-3' : 'px-4 py-4 sm:px-6']"
    >
      <div class="flex-1 min-w-0">
        <!-- Compact or Mobile Layout -->
        <div v-if="compact" class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300">
              {{ playlist.date }}
            </span>
            <span class="text-[10px] text-gray-400">
              {{ playlist.tracks.length }} tracks
            </span>
          </div>
          <h3 class="text-base font-semibold text-white leading-tight">
            {{ playlist.title }}
          </h3>
        </div>
        
        <!-- Standard Layout (Responsive) -->
        <div v-else class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-500/20 text-blue-300 flex-shrink-0">
              {{ playlist.date }}
            </span>
            <h3 class="text-base sm:text-lg font-semibold text-white leading-tight sm:truncate">
              {{ playlist.title }}
            </h3>
          </div>
          <span class="text-[10px] sm:text-xs text-gray-400 flex-shrink-0 hidden sm:block">
            {{ playlist.tracks.length }} track{{ playlist.tracks.length === 1 ? '' : 's' }}
          </span>
        </div>
      </div>
      <svg
        class="ml-2 h-5 w-5 text-gray-400 transition-transform flex-shrink-0 mt-1"
        :class="{ 'rotate-180': isExpanded }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="isExpanded" class="px-4 sm:px-6 pb-4 border-t border-gray-700">
      <!-- Description -->
      <div v-if="playlist.description" class="mt-4 mb-4 pb-4 border-b border-gray-700">
        <p class="text-sm text-gray-300 leading-relaxed">{{ playlist.description }}</p>
      </div>

      <!-- Track List -->
      <div class="mt-4">
        <h4 class="text-sm font-semibold text-white mb-3">Track List</h4>
        <div 
          class="space-y-2"
          :class="{ 
            'max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-black/20': compact 
          }"
        >
          <div
            v-for="(track, index) in playlist.tracks"
            :key="index"
            :id="`track-${playlist.date}-${index}`"
            class="flex items-start rounded transition-colors duration-300"
            :class="[
              route.query.track === track.song ? 'bg-blue-900/40 border border-blue-500/30' : 'hover:bg-gray-700/50',
              compact ? 'gap-2 py-2 px-2' : 'gap-2 sm:gap-3 py-2 px-2 sm:px-3'
            ]"
          >
            <span 
              class="text-gray-500 font-mono"
              :class="[
                compact ? 'min-w-[1.5rem] text-xs mt-0.5' : 'min-w-[1.25rem] sm:min-w-[2rem] text-xs sm:text-sm mt-0.5 sm:mt-0'
              ]"
            >
              {{ index + 1 }}.
            </span>

            <!-- Album Art (only loads when expanded) -->
            <div v-if="getAlbumArt(track.artist, track.song)" class="flex-shrink-0">
              <img
                :src="getAlbumArt(track.artist, track.song)!"
                :alt="`${track.song} by ${track.artist}`"
                class="rounded shadow-sm object-cover"
                :class="[compact ? 'w-10 h-10' : 'w-10 h-10 sm:w-12 sm:h-12']"
                loading="lazy"
              />
            </div>
            <div v-else class="flex-shrink-0 bg-gray-700 rounded flex items-center justify-center" :class="[compact ? 'w-10 h-10' : 'w-10 h-10 sm:w-12 sm:h-12']">
              <svg class="text-gray-500" :class="[compact ? 'w-5 h-5' : 'w-5 h-5 sm:w-6 sm:h-6']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-medium text-white break-words leading-tight" :class="[compact ? 'text-xs' : 'text-xs sm:text-sm']">{{ track.song }}</p>
              <router-link
                :to="`/artist/${generateArtistSlug(track.artist)}`"
                class="text-gray-400 leading-tight mt-0.5 inline-block hover:text-blue-300 transition-colors"
                :class="[compact ? 'text-[10px]' : 'text-[10px] sm:text-xs']"
              >
                {{ track.artist }}
              </router-link>
            </div>
            
            <!-- Actions: Share & Stream -->
            <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                v-if="!compact"
                @click.stop="copyTrackLink(track.song, index)"
                class="hidden sm:block p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-600 transition-colors relative"
                title="Copy link to track"
              >
                <svg v-if="copiedTrackIndex === index" class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                
                <!-- Tooltip -->
                <span 
                  v-if="copiedTrackIndex === index" 
                  class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-black rounded shadow whitespace-nowrap z-10"
                >
                  Copied!
                </span>
              </button>

              <StreamingLinks :artist="track.artist" :song="track.song" :compact="compact" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-4 border-t border-gray-700 space-y-3">
        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-2">
          <!-- Spotify Creation Button -->
          <button
            @click="showSpotifyModal = true"
            class="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/50 font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>🎧</span>
            {{ compact ? 'Add to Spotify' : 'Add this Playlist to Spotify' }}
          </button>

          <!-- Download Button with Dropdown -->
          <div class="relative">
            <button
              @click="showDownloadMenu = !showDownloadMenu"
              class="w-full sm:w-auto bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>

            <!-- Download Format Menu -->
            <div
              v-if="showDownloadMenu"
              @click="showDownloadMenu = false"
              class="absolute right-0 mt-2 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10"
            >
              <button
                @click="downloadPlaylist(playlist, 'json')"
                class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors rounded-t-lg"
              >
                JSON
              </button>
              <button
                @click="downloadPlaylist(playlist, 'csv')"
                class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
              >
                CSV
              </button>
              <button
                @click="downloadPlaylist(playlist, 'txt')"
                class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors rounded-b-lg"
              >
                Text
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          :class="[
            'flex gap-3',
            compact
              ? 'flex-col items-start'
              : 'flex-col sm:flex-row sm:items-center sm:justify-between'
          ]"
        >
          <p :class="[compact ? 'text-[10px]' : 'text-[10px] sm:text-xs', 'text-gray-400']">
            Original broadcast: {{ formatDate(playlist.date) }}
          </p>
          <a
            :href="`mailto:chris@the816.com?subject=Cyprus Avenue Archive - Issue Report&body=Regarding playlist: ${playlist.title} (${playlist.date})%0D%0A%0D%0APlease describe the issue:%0D%0A`"
            :class="[compact ? 'text-[10px]' : 'text-[10px] sm:text-xs', 'text-blue-400 hover:text-blue-300 underline']"
          >
            Report an issue
          </a>
        </div>
      </div>

      <!-- Spotify Playlist Modal -->
      <SpotifyPlaylistModal
        :is-open="showSpotifyModal"
        :playlist="playlist"
        mode="single"
        @close="showSpotifyModal = false"
      />
    </div>
  </div>
</template>
