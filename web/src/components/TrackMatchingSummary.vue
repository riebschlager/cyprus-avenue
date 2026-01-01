<script setup lang="ts">
import type { PlaylistCreationResult } from '../types/spotify'

defineProps<{
  result: PlaylistCreationResult
}>()
</script>

<template>
  <div class="space-y-4">
    <!-- Success Message -->
    <div class="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-green-300 mb-2">✓ Playlist Created Successfully!</h3>
      <p class="text-sm text-green-200">{{ result.playlistName }}</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3">
      <div class="bg-gray-700/50 rounded-lg p-3">
        <p class="text-xs text-gray-400 mb-1">Tracks Added</p>
        <p class="text-lg font-semibold text-green-400">{{ result.tracksAdded }}</p>
      </div>
      <div v-if="result.tracksFailed > 0" class="bg-gray-700/50 rounded-lg p-3">
        <p class="text-xs text-gray-400 mb-1">Not Found</p>
        <p class="text-lg font-semibold text-yellow-400">{{ result.tracksFailed }}</p>
      </div>
    </div>

    <!-- Warning about missing tracks -->
    <div v-if="result.notFound.length > 0" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
      <p class="text-xs font-semibold text-yellow-300 mb-2">
        ⚠ {{ result.notFound.length }} track{{ result.notFound.length !== 1 ? 's' : '' }} not found on Spotify:
      </p>
      <div class="text-xs text-yellow-200 space-y-1 max-h-40 overflow-y-auto">
        <div v-for="(track, i) in result.notFound.slice(0, 5)" :key="i" class="text-xs text-yellow-200">
          {{ track.artist }} - {{ track.song }}
        </div>
        <div v-if="result.notFound.length > 5" class="text-xs text-yellow-200 italic">
          ...and {{ result.notFound.length - 5 }} more
        </div>
      </div>
    </div>

    <!-- Open on Spotify Link -->
    <a
      :href="result.playlistUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-center text-sm transition-colors"
    >
      Open in Spotify →
    </a>
  </div>
</template>
