<script setup lang="ts">
import { stampArchiveDate } from '../utils/archiveDate'
import { ref, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Playlist } from '../types/playlist'
import DownloadMenu from './DownloadMenu.vue'
import StreamingLinks from './StreamingLinks.vue'
import SpotifyPlaylistModal from '../features/spotify/SpotifyPlaylistModal.vue'
import Icon from './Icon.vue'
import { generateArtistSlug, generatePlaylistSlug } from '../utils/slug'
import { getPublicUrl } from '../utils/urls'
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
const cardRef = ref<HTMLElement | null>(null)
const showSpotifyModal = ref(false)
const copiedTrackIndex = ref<number | null>(null)

// Check for pending Spotify action on mount
onMounted(() => {
  if (props.isExpanded) {
    if (!props.disableScroll) {
      scrollToCard()
      scrollToTrack()
    }

  }
})

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
  const url = getPublicUrl(`/playlist/${slug}?track=${encodeURIComponent(song)}`)
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
    class="show"
    :class="{ 'show--expanded': isExpanded, 'show--focused': isFocused, 'show--compact': compact }"
  >
    <button
      type="button"
      @click="emit('toggle')"
      class="ca-showrow show__row"
      :class="{ 'ca-showrow--compact': compact }"
      :aria-expanded="isExpanded"
    >
      <span class="ca-date ca-showrow__date">{{ stampArchiveDate(playlist.date) }}</span>
      <span class="block min-w-0">
        <span class="ca-showrow__title">{{ playlist.title }}</span>
        <span v-if="playlist.description && !compact && !isExpanded" class="ca-showrow__desc">{{ playlist.description }}</span>
      </span>
      <span class="ca-showrow__count">{{ playlist.tracks.length }} track{{ playlist.tracks.length === 1 ? '' : 's' }}</span>
      <Icon name="chevron-down" class="ca-showrow__go show__chevron" />
    </button>

    <div v-if="isExpanded" class="show__panel">
      <p v-if="playlist.description" class="show__notes">{{ playlist.description }}</p>

      <div class="show__actions">
        <button type="button" @click="showSpotifyModal = true" class="ca-btn ca-btn--secondary" :class="{ 'ca-btn--sm': compact }">
          <Icon name="list-plus" />
          Add to Spotify
        </button>

        <DownloadMenu @download="format => downloadPlaylist(playlist, format)" />
      </div>

      <ol class="ca-tracklist show__tracks" :class="{ 'show__tracks--scroll': compact }">
        <li
          v-for="(track, index) in playlist.tracks"
          :key="index"
          :id="`track-${playlist.date}-${index}`"
          class="ca-track"
          :class="{ 'ca-track--highlight': route.query.track === track.song }"
        >
          <span class="ca-track__num">
            <span class="ca-track__n">{{ String(index + 1).padStart(2, '0') }}</span>
          </span>

          <div class="ca-track__main">
            <span class="ca-track__title">{{ track.song }}</span>
            <router-link :to="`/artist/${generateArtistSlug(track.artist)}`" class="ca-track__artist">
              {{ track.artist }}
            </router-link>
          </div>

          <div class="ca-track__actions">
            <span v-if="!compact" class="ca-tip hidden sm:inline-flex" :class="{ 'ca-tip--open': copiedTrackIndex === index }">
              <button
                type="button"
                @click.stop="copyTrackLink(track.song, index)"
                class="ca-iconbtn ca-iconbtn--sm"
                :class="{ 'ca-reveal': copiedTrackIndex !== index }"
                aria-label="Copy link to track"
              >
                <Icon :name="copiedTrackIndex === index ? 'check' : 'link'" />
              </button>
              <span class="ca-tip__bubble" role="status">{{ copiedTrackIndex === index ? 'Link copied' : 'Copy link' }}</span>
            </span>

            <StreamingLinks :artist="track.artist" :song="track.song" :compact="compact" />
          </div>
        </li>
      </ol>

      <div class="show__foot">
        <span class="ca-label ca-label--sm">Original broadcast &middot; {{ stampArchiveDate(playlist.date, true) }}</span>
        <a
          :href="`mailto:chris@the816.com?subject=Cyprus Avenue Archive - Issue Report&body=Regarding playlist: ${playlist.title} (${playlist.date})%0D%0A%0D%0APlease describe the issue:%0D%0A`"
          class="show__report"
        >
          Report an issue
        </a>
      </div>

      <SpotifyPlaylistModal
        :is-open="showSpotifyModal"
        :playlist="playlist"
        mode="single"
        @close="showSpotifyModal = false"
      />
    </div>
  </div>
</template>

<style scoped>
.show { position: relative; }
.show__row { width: 100%; text-align: left; background: none; border-radius: 0; transition: background var(--dur-fast) var(--ease-out); }
.show__row .ca-showrow__title { display: block; }
.show--focused .show__row { background: var(--bg-sunken); box-shadow: inset 3px 0 0 var(--orange-500); }
.show__chevron { transition: transform var(--dur-base) var(--ease-out), color var(--dur-fast); }
.show__row:hover .show__chevron { transform: translateY(2px); }
.show--expanded .show__chevron,
.show--expanded .show__row:hover .show__chevron { transform: rotate(180deg); color: var(--fg-1); }
.show--expanded .show__row { border-bottom-color: transparent; }
.show--expanded .ca-showrow__title { color: var(--fg-accent); }

.show__panel { display: flex; flex-direction: column; gap: var(--space-6); padding: 0 0 var(--space-10) calc(132px + 24px); border-bottom: var(--rule-hair); }
.show--compact .show__panel { padding-left: 0; gap: var(--space-4); padding-bottom: var(--space-6); }
.show__notes { max-width: var(--container-text); font: var(--type-body); font-size: 18px; color: var(--fg-1); text-wrap: pretty; }
.show--compact .show__notes { font-size: 16px; color: var(--fg-2); }
.show__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
.show__tracks--scroll { max-height: 20rem; overflow-y: auto; }
.show__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); }
.show__report { font: var(--type-ui-s); }

/* The hover play button swap needs a playback handler; keep the track number visible. */
.ca-track:hover .ca-track__num .ca-track__n { display: inline; }

@media (hover: none) {
  .ca-track__actions :deep(.ca-reveal) { opacity: 1; }
}

@media (max-width: 760px) {
  .show__panel { padding-left: 0; }
}
</style>
