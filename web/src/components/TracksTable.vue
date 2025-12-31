<script setup lang="ts">
import type { TrackWithPlaylist, SortField, SortDirection } from '../composables/useTracks'

defineProps<{
  tracks: TrackWithPlaylist[]
  sortField: SortField
  sortDirection: SortDirection
}>()

const emit = defineEmits<{
  sort: [field: SortField]
}>()

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const getSortIcon = (field: SortField, currentField: SortField, direction: SortDirection) => {
  if (field !== currentField) {
    return '↕'
  }
  return direction === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="emit('sort', 'artist')"
            >
              <div class="flex items-center gap-2">
                Artist
                <span class="text-gray-400">{{ getSortIcon('artist', sortField, sortDirection) }}</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="emit('sort', 'song')"
            >
              <div class="flex items-center gap-2">
                Song
                <span class="text-gray-400">{{ getSortIcon('song', sortField, sortDirection) }}</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="emit('sort', 'playlistTitle')"
            >
              <div class="flex items-center gap-2">
                Playlist
                <span class="text-gray-400">{{ getSortIcon('playlistTitle', sortField, sortDirection) }}</span>
              </div>
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              @click="emit('sort', 'playlistDate')"
            >
              <div class="flex items-center gap-2">
                Date
                <span class="text-gray-400">{{ getSortIcon('playlistDate', sortField, sortDirection) }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(track, index) in tracks"
            :key="`${track.playlistDate}-${index}`"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ track.artist }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
              {{ track.song }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
              {{ track.playlistTitle }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(track.playlistDate) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="tracks.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No tracks found</h3>
      <p class="mt-1 text-sm text-gray-500">
        Try adjusting your search query
      </p>
    </div>
  </div>
</template>
