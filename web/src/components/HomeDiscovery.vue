<script setup lang="ts">
import { isWithinArchiveWeek, stampArchiveDate } from '../utils/archiveDate'
import { ref, computed, watch, onMounted } from 'vue'
import { useArtists } from '../composables/useArtists'
import { usePlaylists } from '../composables/usePlaylists'
import { useRouter } from 'vue-router'
import PlaylistCard from './PlaylistCard.vue'
import { generatePlaylistSlug, generateArtistSlug } from '../utils/slug'
import { useArtistBios } from '../composables/useArtistBios'
import type { Playlist } from '../types/playlist'
import Icon from './Icon.vue'

const { playlists } = usePlaylists()
const { loadBiosIndex, getBio } = useArtistBios()
const router = useRouter()
const { artists } = useArtists(playlists)

// Suggested content
const suggestedPlaylist = ref<Playlist | null>(null)
const suggestedArtist = ref<string | null>(null)
const suggestedArtistBio = computed(() => suggestedArtist.value ? getBio(suggestedArtist.value) : null)

const refreshSuggestions = () => {
  if (playlists.value.length === 0) return

  // Random Playlist
  const randomPlaylistIndex = Math.floor(Math.random() * playlists.value.length)
  const randomPlaylist = playlists.value[randomPlaylistIndex]
  if (randomPlaylist) {
    suggestedPlaylist.value = randomPlaylist
  }

  const artistArray = artists.value.map(artist => artist.name)
  if (artistArray.length > 0) {
    const randomArtistIndex = Math.floor(Math.random() * artistArray.length)
    const randomArtist = artistArray[randomArtistIndex]
    if (randomArtist) {
      suggestedArtist.value = randomArtist
    }
  }
}

// Watch for playlists to load
watch(playlists, () => {
  if (!suggestedPlaylist.value) {
    refreshSuggestions()
  }
}, { immediate: true })

onMounted(async () => {
  await loadBiosIndex()

  if (playlists.value.length > 0) {
    refreshSuggestions()
  }


})

const navigateToSuggestedPlaylist = () => {
  if (!suggestedPlaylist.value) return
  const slug = generatePlaylistSlug(suggestedPlaylist.value.title, suggestedPlaylist.value.date)
  router.push({ name: 'playlist', params: { slug } })
}

const navigateToSuggestedArtist = () => {
  if (!suggestedArtist.value) return
  const slug = generateArtistSlug(suggestedArtist.value)
  router.push({ name: 'artist', params: { slug } })
}

// Logic for "This Week in History"
const thisWeekPlaylists = computed(() => {
  const today = new Date()
  return playlists.value.filter(p => isWithinArchiveWeek(p.date, today))
    .sort((a, b) => b.date.localeCompare(a.date))
})

// Track expanded state for the history cards
const expandedHistoryId = ref<string | null>(null)

// Auto-expand first history playlist by default
watch(thisWeekPlaylists, (newList) => {
  if (newList.length > 0 && !expandedHistoryId.value) {
    const firstPlaylist = newList[0]
    if (firstPlaylist) {
      expandedHistoryId.value = firstPlaylist.date
    }
  }
}, { immediate: true })

const toggleHistoryCard = (date: string) => {
  expandedHistoryId.value = expandedHistoryId.value === date ? null : date
}

const navigateToRandomPlaylist = () => {
  if (playlists.value.length === 0) return

  const randomIndex = Math.floor(Math.random() * playlists.value.length)
  const randomPlaylist = playlists.value[randomIndex]

  if (!randomPlaylist) return

  const slug = generatePlaylistSlug(randomPlaylist.title, randomPlaylist.date)

  router.push({ name: 'playlist', params: { slug } })
}

const navigateToRandomArtist = () => {
  const artistArray = artists.value.map(artist => artist.name)
  if (artistArray.length === 0) return

  const randomIndex = Math.floor(Math.random() * artistArray.length)
  const randomArtist = artistArray[randomIndex]

  if (!randomArtist) return

  const slug = generateArtistSlug(randomArtist)

  router.push({ name: 'artist', params: { slug } })
}

const todayStamp = new Date()
  .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  .toUpperCase()

const suggestedPlaylistHref = computed(() => suggestedPlaylist.value
  ? router.resolve({ name: 'playlist', params: { slug: generatePlaylistSlug(suggestedPlaylist.value.title, suggestedPlaylist.value.date) } }).href
  : '#')

const suggestedArtistHref = computed(() => suggestedArtist.value
  ? router.resolve({ name: 'artist', params: { slug: generateArtistSlug(suggestedArtist.value) } }).href
  : '#')
</script>

<template>
  <aside v-if="thisWeekPlaylists.length > 0" class="discovery">
    <!-- This week in history -->
    <section>
      <div class="ca-sechead ca-sechead--sm">
        <div class="ca-sechead__left">
          <h2 class="ca-sechead__title">This week in history</h2>
        </div>
        <span class="ca-label ca-label--sm">Near {{ todayStamp }}</span>
      </div>

      <p class="discovery__note">Shows broadcast during this week in years past.</p>

      <div class="flex flex-col gap-4">
        <PlaylistCard
          v-for="playlist in thisWeekPlaylists"
          :key="playlist.date"
          :playlist="playlist"
          :search-query="''"
          :is-expanded="expandedHistoryId === playlist.date"
          :compact="true"
          :disable-scroll="true"
          @toggle="toggleHistoryCard(playlist.date)"
        />
      </div>
    </section>

    <!-- From the archive -->
    <section>
      <div class="ca-sechead ca-sechead--sm">
        <div class="ca-sechead__left">
          <h2 class="ca-sechead__title">From the archive</h2>
        </div>
        <button type="button" class="ca-btn ca-btn--link discovery__refresh" @click="refreshSuggestions">
          <Icon name="shuffle" /> Refresh
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <a
          v-if="suggestedPlaylist"
          :href="suggestedPlaylistHref"
          class="ca-showcard ca-showcard--feature"
          @click.prevent="navigateToSuggestedPlaylist"
        >
          <div class="ca-showcard__top">
            <span class="ca-label ca-label--ink">Suggested show</span>
            <span class="ca-date">{{ stampArchiveDate(suggestedPlaylist.date) }}</span>
          </div>
          <div class="ca-showcard__title discovery__feature-title">{{ suggestedPlaylist.title }}</div>
          <div class="flex items-center justify-between gap-3">
            <span class="ca-label ca-label--ink ca-label--sm">{{ suggestedPlaylist.tracks.length }} tracks</span>
            <Icon name="arrow-right" class="discovery__go" />
          </div>
        </a>

        <div v-if="suggestedArtist" class="discovery__artist">
          <span class="ca-label ca-label--accent">Suggested artist</span>
          <a
            :href="suggestedArtistHref"
            class="discovery__artist-name"
            @click.prevent="navigateToSuggestedArtist"
          >{{ suggestedArtist }}</a>
          <p v-if="suggestedArtistBio?.bioSummary" class="discovery__artist-bio">{{ suggestedArtistBio.bioSummary }}</p>
          <p v-else class="discovery__artist-bio">Explore their tracks in the archive.</p>
          <a
            v-if="suggestedArtistBio?.url"
            :href="suggestedArtistBio.url"
            target="_blank"
            rel="noopener noreferrer"
            class="ca-label ca-label--sm discovery__source"
          >Biography from Last.fm &nearr;</a>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="ca-btn ca-btn--secondary ca-btn--sm" @click="navigateToRandomPlaylist">
            <Icon name="shuffle" /> Surprise show
          </button>
          <button type="button" class="ca-btn ca-btn--secondary ca-btn--sm" @click="navigateToRandomArtist">
            <Icon name="shuffle" /> Surprise artist
          </button>
        </div>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.discovery {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}
.discovery__note {
  margin-bottom: var(--space-4);
  font: 400 15px/1.5 var(--font-text);
  color: var(--fg-2);
}
.discovery__refresh { font-size: 13px; }
.discovery__feature-title { font-size: 32px; }
.discovery__go { font-size: 18px; transition: transform var(--dur-base) var(--ease-out); }
.ca-showcard--feature:hover .discovery__go { transform: translateX(3px); }

.discovery__artist {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: var(--rule-ink);
}
.discovery__artist-name {
  font: 800 26px/1.08 var(--font-display);
  letter-spacing: -0.025em;
  color: var(--fg-1);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-out);
}
.discovery__artist-name:hover { color: var(--fg-accent); }
.discovery__artist-bio {
  font: 400 16px/1.5 var(--font-text);
  color: var(--fg-2);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.discovery__source { align-self: flex-start; }
</style>
