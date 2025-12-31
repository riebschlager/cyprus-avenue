<script setup lang="ts">
import { computed } from 'vue'
import type { Playlist } from '../types/playlist'
import { useTracks } from '../composables/useTracks'
import SearchBar from './SearchBar.vue'
import TracksTable from './TracksTable.vue'

const props = defineProps<{
  playlists: Playlist[]
}>()

const { searchQuery, sortField, sortDirection, sortedTracks, setSortField } = useTracks(props.playlists)

const totalTracks = computed(() => sortedTracks.value.length)
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">All Tracks</h2>
      <p class="text-sm text-gray-400">
        Browse and search all {{ totalTracks.toLocaleString() }} tracks from the archive
      </p>
    </div>

    <div class="mb-6">
      <SearchBar v-model="searchQuery" />
    </div>

    <div class="mb-4 text-sm text-gray-400">
      Showing {{ sortedTracks.length.toLocaleString() }} track{{ sortedTracks.length === 1 ? '' : 's' }}
    </div>

    <TracksTable
      :tracks="sortedTracks"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      @sort="setSortField"
    />
  </div>
</template>
