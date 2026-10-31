<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import type { Artist } from '../composables/useArtists'
import StreamingLinks from './StreamingLinks.vue'
import SpotifyPlaylistModal from '../features/spotify/SpotifyPlaylistModal.vue'
import { generatePlaylistSlug } from '../utils/slug'
import { useArtistBios } from '../composables/useArtistBios'
import { stampArchiveDate } from '../utils/archiveDate'
import Icon from './Icon.vue'

const props = defineProps<{
  artist: Artist
  isExpanded: boolean
  isFocused?: boolean
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

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`

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
  <div
    ref="cardRef"
    class="artist"
    :class="{ 'artist--focused': isFocused, 'artist--open': isExpanded }"
  >
    <button
      type="button"
      class="ca-artistrow artist__row"
      :aria-expanded="isExpanded"
      @click="emit('toggle')"
    >
      <span class="ca-artistrow__name">{{ artist.name }}</span>
      <span class="ca-artistrow__stat">
        {{ plural(artist.uniqueSongs.length, 'song') }} &middot; {{ plural(artist.playlistCount, 'show') }}
      </span>
      <Icon name="chevron-down" class="ca-artistrow__go artist__chevron" />
    </button>

    <div v-if="isExpanded" class="artist__detail">
      <div class="artist__intro">
        <div v-if="artist.tags && artist.tags.length > 0" class="artist__tags">
          <button
            v-for="tag in artist.tags.slice(0, 10)"
            :key="tag"
            type="button"
            class="ca-tag ca-tag--sm"
            @click.stop="emit('select-tag', tag)"
          >
            {{ tag.toLowerCase() }}
          </button>
        </div>

        <div v-if="artistBio && artistBio.bioSummary" class="artist__bio">
          <img
            v-if="artistBio.image"
            :src="artistBio.image"
            :alt="artist.name"
            class="artist__image"
            loading="lazy"
          />
          <div class="ca-prose">
            <p class="lastfm-bio">{{ artistBio.bioSummary }}</p>
            <a
              v-if="artistBio.url"
              :href="artistBio.url"
              target="_blank"
              rel="noopener noreferrer"
              class="ca-label ca-label--sm artist__source"
            >
              Biography from Last.fm &nearr;
            </a>
          </div>
        </div>

        <div>
          <button type="button" class="ca-btn ca-btn--secondary ca-btn--sm" @click="showSpotifyModal = true">
            <Icon name="list-plus" />
            Create Spotify playlist
          </button>
        </div>
      </div>

      <div class="artist__split">
        <section>
          <div class="ca-sechead ca-sechead--sm">
            <h4 class="ca-sechead__title">Songs</h4>
            <span class="ca-label">{{ artist.uniqueSongs.length.toLocaleString() }}</span>
          </div>
          <ol class="ca-tracklist">
            <li
              v-for="(song, index) in artist.uniqueSongs"
              :key="song"
              class="ca-track"
            >
              <span class="ca-track__num">{{ index + 1 }}</span>
              <div class="ca-track__main">
                <span class="ca-track__title">{{ song }}</span>
              </div>
              <div class="ca-track__actions">
                <StreamingLinks :artist="artist.name" :song="song" />
              </div>
            </li>
          </ol>
        </section>

        <section>
          <div class="ca-sechead ca-sechead--sm">
            <h4 class="ca-sechead__title">Appears in</h4>
            <span class="ca-label">{{ plural(playlistsWithTracks.length, 'show') }}</span>
          </div>
          <ul class="ca-showlist">
            <li v-for="playlist in playlistsWithTracks" :key="playlist.date">
              <router-link
                :to="getPlaylistUrl(playlist.title, playlist.date)"
                class="ca-showrow ca-showrow--compact"
              >
                <span class="ca-date ca-showrow__date">{{ stampArchiveDate(playlist.date) }}</span>
                <span>
                  <span class="ca-showrow__title">{{ playlist.title }}</span>
                  <span class="artist__played">{{ playlist.songs.join(' · ') }}</span>
                </span>
                <Icon name="arrow-right" class="ca-showrow__go" />
              </router-link>
            </li>
          </ul>
        </section>
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
.artist { border-bottom: var(--rule-hair); }
.artist__row { width: 100%; grid-template-columns: minmax(0,1fr) auto 24px; padding-left: 8px; padding-right: 8px; border: 0; background: none; text-align: left; font: inherit; transition: background var(--dur-fast) var(--ease-out); }
.artist__row:hover { background: var(--bg-sunken); }
.artist--focused .artist__row { background: var(--bg-highlight); box-shadow: inset 3px 0 0 var(--orange-500); }
.artist--open .ca-artistrow__name { font-size: 28px; font-weight: 850; letter-spacing: -0.03em; }
.artist__chevron { transition: transform var(--dur-base) var(--ease-out); }
.artist--open .artist__chevron { transform: rotate(180deg); color: var(--fg-1); }

.artist__detail { display: flex; flex-direction: column; gap: var(--space-8); padding: var(--space-2) 8px var(--space-10); animation: ca-rise var(--dur-base) var(--ease-out); }
.artist__intro { display: flex; flex-direction: column; gap: var(--space-5); max-width: var(--container-text); }
.artist__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.artist__bio { display: flex; gap: var(--space-5); align-items: flex-start; }
.artist__image { width: 80px; height: 80px; flex: none; object-fit: cover; }
.artist__bio .ca-prose { font-size: 16px; color: var(--fg-2); }
.artist__source { display: inline-flex; margin-top: var(--space-2); text-decoration: none; }
.artist__source:hover { color: var(--fg-accent); }

.artist__split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: var(--space-12); align-items: start; }
.artist__split .ca-sechead { justify-content: space-between; }
.artist__played { display: block; margin-top: 4px; font: 400 14px/1.4 var(--font-text); font-style: italic; color: var(--fg-2); }

@media (max-width: 760px) {
  .artist__split { grid-template-columns: 1fr; gap: var(--space-10); }
  .artist--open .ca-artistrow__name { font-size: 24px; }
  .artist__bio { flex-direction: column; }
}
</style>
