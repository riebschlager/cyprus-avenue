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
</script>

<template>
  <ArchiveState>
      <StatsPanel :stats="stats" />

      <!-- Download Archive Button -->
      <div class="mt-6 flex justify-center">
        <DownloadMenu label="Download Complete Archive" @download="format => downloadAllPlaylists(playlists, format)" />
      </div>

      <div class="mt-8">
        <SearchBar v-model="searchQuery" />
      </div>

      <div class="mt-8">
        <PlaylistList
          :playlists="filteredPlaylists"
          :search-query="searchQuery"
          :auto-expand-playlist="playlistToExpand"
        />
      </div>
  </ArchiveState>
</template>
