<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import ArchiveState from '../components/ArchiveState.vue'
import DownloadMenu from '../components/DownloadMenu.vue'
import SearchBar from '../components/SearchBar.vue'
import StatsPanel from '../components/StatsPanel.vue'
import PlaylistList from '../components/PlaylistList.vue'
import { findPlaylistBySlug } from '../utils/slug'
import { downloadAllPlaylists } from '../utils/downloadFormats'
import { parseArchiveDate } from '../utils/archiveDate'

const route = useRoute()
const { playlists, searchQuery, filteredPlaylists, stats } = usePlaylists()

onUnmounted(() => {
  searchQuery.value = ''
})

// Resolve again when either the route or the archive changes (including cold loads).
const playlistToExpand = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' ? findPlaylistBySlug(playlists.value, slug) : null
})

const monthYear = (value: string) =>
  parseArchiveDate(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
</script>

<template>
  <ArchiveState>
    <header class="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pb-10">
      <div class="flex flex-col gap-3">
        <span class="ca-label ca-label--accent">Archive</span>
        <h1 class="ca-page-title">Shows</h1>
        <p v-if="stats.dateRange" class="ca-lede">
          Every recovered playlist, {{ monthYear(stats.dateRange.start) }} to {{ monthYear(stats.dateRange.end) }}.
          Each show aired Saturday night on KCUR 89.3.
        </p>
      </div>
      <DownloadMenu label="Download archive" @download="format => downloadAllPlaylists(playlists, format)" />
    </header>

    <StatsPanel :stats="stats" />

    <div class="mt-12 mb-8">
      <SearchBar v-model="searchQuery" />
    </div>

    <PlaylistList
      :playlists="filteredPlaylists"
      :search-query="searchQuery"
      :auto-expand-playlist="playlistToExpand"
    />
  </ArchiveState>
</template>
