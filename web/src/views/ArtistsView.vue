<script setup lang="ts">
import { usePagination } from '../composables/usePagination'
import PaginationControls from '../components/PaginationControls.vue'
import ArchiveState from '../components/ArchiveState.vue'
import { usePlaylists } from '../composables/usePlaylists'
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useArtistBios } from '../composables/useArtistBios'
import { useArtists } from '../composables/useArtists'
import ArtistCard from '../components/ArtistCard.vue'
import Icon from '../components/Icon.vue'
import SearchBar from '../components/SearchBar.vue'
import SpotifyPlaylistModal from '../features/spotify/SpotifyPlaylistModal.vue'
import { findArtistBySlug, generateArtistSlug } from '../utils/slug'
import { normalizeAndFilterTag } from '../utils/tagFilters'
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation'

const { playlists } = usePlaylists()

const { loadBiosIndex } = useArtistBios()
onMounted(loadBiosIndex)
const router = useRouter()
const route = useRoute()
const { artists, searchQuery, searchFilters, selectedTag, filteredArtists, availableTags } = useArtists(playlists)
const expandedArtistName = ref<string | null>(null)
const showTagPlaylistModal = ref(false)
const bannerRef = ref<HTMLElement | null>(null)
const cardRefs = ref<InstanceType<typeof ArtistCard>[]>([])

const { currentPage, itemsPerPage, totalItems: totalArtists, totalPages,
  paginatedItems: paginatedArtists, displayedRange, changePage } = usePagination(filteredArtists)

const totalSongs = computed(() => filteredArtists.value.reduce((sum, a) => sum + a.uniqueSongs.length, 0))

// Sync URL query to selectedTag
watch(() => route.query.tag, (tag) => {
  if (typeof tag === 'string') {
    selectedTag.value = normalizeAndFilterTag(tag.replace(/\+/g, ' ')) || ''
  } else {
    selectedTag.value = ''
  }
}, { immediate: true })

// Reset to first page when search changes
watch([searchQuery, selectedTag], () => {
  currentPage.value = 1
})

const artistToExpand = computed(() => typeof route.params.slug === 'string'
  ? findArtistBySlug(artists.value, route.params.slug) : null)
watch([artistToExpand, filteredArtists], ([artist]) => {
  expandedArtistName.value = artist?.name ?? null
  const index = filteredArtists.value.findIndex(a => a.name === artist?.name)
  if (index >= 0) currentPage.value = Math.floor(index / itemsPerPage) + 1
}, { immediate: true })

const handleTagSelect = (tag: string) => {
  // Collapse currently expanded artist
  expandedArtistName.value = null

  // Update URL to reflect tag state
  router.push({ query: { ...route.query, tag } })

  // Wait for banner to render and scroll to it
  nextTick(() => {
    if (bannerRef.value) {
      const header = document.querySelector('header')
      const headerHeight = header?.clientHeight || 80
      const elementPosition = bannerRef.value.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - headerHeight - 24 // 24px buffer

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  })
}

const clearTag = () => {
  const query = { ...route.query }
  delete query.tag
  router.push({ query })
}

const toggleArtist = (index: number) => {
  const artist = filteredArtists.value[index]
  if (!artist) return
  const wasExpanded = expandedArtistName.value === artist.name
  expandedArtistName.value = wasExpanded ? null : artist.name

  // Update URL without triggering scroll behavior
  if (wasExpanded) {
    // Collapsed - go back to artists view
    router.replace({ path: '/artists', query: route.query })
  } else {
    // Expanded - navigate to artist permalink
    const artist = filteredArtists.value[index]
    if (artist) {
      const slug = generateArtistSlug(artist.name)
      router.replace({ path: `/artist/${slug}`, query: route.query })
    }
  }
}

// Keyboard navigation
const { focusedIndex } = useKeyboardNavigation({
  itemCount: totalArtists,
  currentPage,
  itemsPerPage,
  onPageChange: changePage,
  onSelect: (index) => {
    // Convert page-local index to global index
    const globalIndex = (currentPage.value - 1) * itemsPerPage + index
    toggleArtist(globalIndex)
  }
})

// Scroll focused item into view
watch(focusedIndex, async (index) => {
  if (index !== null) {
    await nextTick()
    const card = cardRefs.value[index]
    if (card?.$el) {
      const rect = card.$el.getBoundingClientRect()
      const headerHeight = 100
      if (rect.top < headerHeight || rect.bottom > window.innerHeight) {
        window.scrollTo({
          top: window.scrollY + rect.top - headerHeight - 20,
          behavior: 'smooth'
        })
      }
    }
  }
})
</script>

<template>
  <ArchiveState>
    <header class="page-head">
      <span class="ca-label ca-label--accent">Index</span>
      <h1 class="ca-page-title">Artists</h1>
      <p class="ca-lede">Everyone Bill Shapiro played on the recovered shows. Tags come from Last.fm and Spotify.</p>
    </header>

    <div class="ca-stats">
      <div class="ca-stat">
        <span class="ca-stat__value">{{ filteredArtists.length.toLocaleString() }}</span>
        <span class="ca-label">Artists</span>
      </div>
      <div class="ca-stat">
        <span class="ca-stat__value">{{ totalSongs.toLocaleString() }}</span>
        <span class="ca-label">Songs</span>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="filters">
      <div class="flex-1 min-w-0">
        <SearchBar
          v-model="searchQuery"
          v-model:filters="searchFilters"
          :filter-options="[
            { id: 'artist', label: 'Artists' },
            { id: 'song', label: 'Songs' }
          ]"
          placeholder="Search artists or songs"
        />
      </div>

      <label class="ca-select filters__tag">
        <span class="sr-only">Filter by tag</span>
        <select
          :value="selectedTag"
          @change="(e) => handleTagSelect((e.target as HTMLSelectElement).value)"
        >
          <option value="">All tags</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>
        <Icon name="chevron-down" />
      </label>
    </div>

    <!-- Active Tag Indicator -->
    <section v-if="selectedTag" ref="bannerRef" class="tag-banner">
      <div class="tag-banner__text">
        <span class="ca-label">Tag</span>
        <h2 class="tag-banner__title">{{ selectedTag }}</h2>
      </div>
      <div class="tag-banner__actions">
        <button type="button" class="ca-btn ca-btn--secondary" @click="showTagPlaylistModal = true">
          <Icon name="list-plus" />
          Create Spotify playlist
        </button>
        <button type="button" class="ca-btn ca-btn--ghost" @click="clearTag">
          <Icon name="x" />
          Clear tag
        </button>
      </div>
    </section>

    <!-- Artists List -->
    <div class="mt-10">
      <div v-if="filteredArtists.length === 0" class="empty">
        <p>No artists match your search. Try a different name or tag.</p>
      </div>

      <div v-else>
        <div class="list-meta">
          <div class="flex items-center gap-4">
            <span class="ca-label">{{ displayedRange }} of {{ totalArtists.toLocaleString() }} artists</span>
            <span class="ca-label ca-label--sm list-meta__keys">
              <kbd class="ca-search__kbd">J</kbd>
              <kbd class="ca-search__kbd">K</kbd>
              to navigate
            </span>
          </div>

          <PaginationControls :current-page="currentPage" :total-pages="totalPages" compact @change="changePage" />
        </div>

        <div class="artist-list">
          <ArtistCard
            v-for="(artist, i) in paginatedArtists"
            :ref="(el) => { if (el) cardRefs[i] = el as InstanceType<typeof ArtistCard> }"
            :key="artist.name"
            :artist="artist"
            :is-expanded="expandedArtistName === artist.name"
            :is-focused="focusedIndex === i"
            @toggle="toggleArtist((currentPage - 1) * itemsPerPage + i)"
            @select-tag="handleTagSelect"
          />
        </div>

        <PaginationControls :current-page="currentPage" :total-pages="totalPages" class="mt-8" @change="changePage" />
      </div>
    </div>

    <!-- Tag Playlist Modal -->
    <SpotifyPlaylistModal
      :is-open="showTagPlaylistModal"
      :tag="selectedTag"
      mode="tag"
      @close="showTagPlaylistModal = false"
    />
  </ArchiveState>
</template>

<style scoped>
.page-head { display: flex; flex-direction: column; gap: var(--space-3); padding-bottom: var(--space-8); }

.filters { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--space-3); margin-top: var(--space-10); }
.filters__tag { width: 240px; }
.filters__tag select { width: 100%; }

.tag-banner { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--space-4); margin-top: var(--space-8); padding: var(--space-6); background: var(--orange-500); color: var(--ink-900); }
.tag-banner .ca-label { color: var(--ink-900); }
.tag-banner__text { display: flex; flex-direction: column; gap: var(--space-2); }
.tag-banner__title { font: var(--fw-black) var(--fs-display-m)/var(--lh-tight) var(--font-display); letter-spacing: var(--tracking-display); }
.tag-banner__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.tag-banner .ca-btn--secondary { border-color: var(--ink-900); color: var(--ink-900); }
.tag-banner .ca-btn--secondary:hover { background: var(--ink-900); color: var(--orange-500); }
.tag-banner .ca-btn--ghost:hover { background: var(--orange-600); }

.list-meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.list-meta__keys { gap: 4px; color: var(--fg-3); }
.list-meta__keys kbd { margin: 0; }

.artist-list { border-top: var(--rule-ink); }

.empty { padding: var(--space-12) 0; border-top: var(--rule-ink); }
.empty p { font: var(--type-body); color: var(--fg-2); }

@media (max-width: 760px) {
  .filters__tag { width: 100%; }
  .list-meta__keys { display: none; }
  .tag-banner { padding: var(--space-5); }
  .tag-banner__title { font-size: 32px; }
}
</style>
