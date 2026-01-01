<script setup lang="ts">
import { usePlaylists } from '../composables/usePlaylists'
import { useRouter } from 'vue-router'

const { stats } = usePlaylists()
const router = useRouter()
</script>

<template>
  <div class="space-y-12">
    <!-- Hero Section -->
    <div class="text-center">
      <h1 class="text-5xl font-bold text-white mb-4">Cyprus Avenue Archive</h1>
      <p class="text-xl text-gray-300 max-w-3xl mx-auto">
        A comprehensive digital archive of playlists from KCUR's legendary Cyprus Avenue radio show,
        preserving nearly 8 years of musical cultural heritage curated by Bill Shapiro.
      </p>
    </div>

    <!-- About Cyprus Avenue -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6">About Cyprus Avenue</h2>

      <div class="space-y-4 text-gray-300">
        <p>
          Cyprus Avenue was a Saturday night institution on KCUR 89.3 FM in Kansas City,
          featuring "the world of popular music from gospel to rock - from country to reggae -
          from a different point of view."
        </p>

        <p>
          For over 40 years (1978-2018), Bill Shapiro—a Kansas City tax attorney by day and
          music enthusiast by night—curated unique playlists introducing listeners to both
          classic and contemporary artists across all genres. His eclectic taste and deep
          knowledge of music made Cyprus Avenue a beloved show for generations of Kansas City listeners.
        </p>

        <p>
          Bill Shapiro passed away in January 2020 at age 82, but his musical legacy lives on
          through this archive. The show was named after Van Morrison's iconic song "Cyprus Avenue"
          from the 1968 album <em>Astral Weeks</em>.
        </p>
      </div>
    </div>

    <!-- Archive Statistics -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6">Archive Statistics</h2>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-blue-500">
          <p class="text-sm text-gray-400 mb-2">Total Playlists</p>
          <p class="text-4xl font-bold text-white">{{ stats.totalPlaylists }}</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-green-500">
          <p class="text-sm text-gray-400 mb-2">Total Tracks</p>
          <p class="text-4xl font-bold text-white">{{ stats.totalTracks.toLocaleString() }}</p>
        </div>
        <div class="bg-gray-900 rounded-lg p-6 border-l-4 border-purple-500">
          <p class="text-sm text-gray-400 mb-2">Avg Tracks/Show</p>
          <p class="text-4xl font-bold text-white">{{ stats.avgTracksPerShow.toFixed(1) }}</p>
        </div>
        <div v-if="stats.dateRange" class="bg-gray-900 rounded-lg p-6 border-l-4 border-orange-500">
          <p class="text-sm text-gray-400 mb-2">Date Range</p>
          <p class="text-lg font-semibold text-white">
            {{ stats.dateRange.start }}<br>to {{ stats.dateRange.end }}
          </p>
        </div>
      </div>

      <div class="text-gray-300 space-y-4">
        <p>
          This archive preserves <strong class="text-white">{{ stats.totalPlaylists }} playlists</strong> spanning
          nearly 8 years, containing <strong class="text-white">{{ stats.totalTracks.toLocaleString() }} tracks</strong>
          across all genres.
        </p>

        <p>
          Many of these playlists (100+ from 2009-2017) are no longer easily accessible on
          KCUR's website, making this archive a valuable cultural preservation effort for
          Kansas City's musical heritage.
        </p>
      </div>
    </div>

    <!-- About This Project -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6">About This Project</h2>

      <div class="space-y-4 text-gray-300">
        <p>
          This digital archive was created to preserve and make accessible the musical legacy
          of Cyprus Avenue. The playlists were painstakingly collected from various sources,
          parsed, and structured into a searchable database.
        </p>

        <div class="bg-gray-900 rounded-lg p-6 mt-6">
          <h3 class="text-xl font-semibold text-white mb-4">Features</h3>
          <ul class="space-y-2 text-gray-300">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Browse Playlists:</strong> View all {{ stats.totalPlaylists }} archived playlists with full track listings</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Search Everything:</strong> Find playlists, artists, or songs across the entire archive</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Spotify Integration:</strong> Direct links to listen to tracks on Spotify (89.9% match rate)</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Album Artwork:</strong> View album covers for tracks found on Spotify</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Sortable Track View:</strong> Browse and sort all tracks by artist, song, playlist, or date</span>
            </li>
          </ul>
        </div>

        <p class="mt-6">
          This project was built with modern web technologies and designed to honor Bill Shapiro's
          legacy while making his curated playlists accessible to music lovers everywhere.
        </p>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg shadow-lg p-8 border border-blue-700/50 text-center">
      <h2 class="text-3xl font-bold text-white mb-4">Start Exploring</h2>
      <p class="text-gray-300 mb-6 max-w-2xl mx-auto">
        Dive into {{ stats.totalPlaylists }} playlists and discover {{ stats.totalTracks.toLocaleString() }}
        tracks from Bill Shapiro's eclectic musical journey.
      </p>
      <div class="flex gap-4 justify-center flex-wrap">
        <button
          @click="router.push('/playlists')"
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Browse Playlists
        </button>
        <button
          @click="router.push('/artists')"
          class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
        >
          Browse Artists
        </button>
        <button
          @click="router.push('/tracks')"
          class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          View All Tracks
        </button>
      </div>
    </div>
  </div>
</template>
