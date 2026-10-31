<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import SpotifyPlaylistModal from '../features/spotify/SpotifyPlaylistModal.vue'
import { downloadAllPlaylists, DOWNLOAD_FORMATS } from '../utils/downloadFormats'
const { stats, playlists } = usePlaylists()
const router = useRouter()
const showAllTracksModal = ref(false)
const uniqueTrackCount = computed(() => new Set(playlists.value.flatMap(p => p.tracks.map(t => JSON.stringify([t.artist, t.song])))).size)
const descriptions = {
  json: 'Structured data format perfect for developers, data analysis, and importing into other applications.',
  csv: 'Spreadsheet-compatible format ideal for Excel, Google Sheets, or database imports.',
  txt: 'Human-readable plain text format for easy reading and printing.'
}
const formats = DOWNLOAD_FORMATS.map(format => ({ ...format, description: descriptions[format.value] }))
</script>

<template>
  <div class="space-y-12">
    <!-- Export to Spotify Section -->
    <div class="bg-green-900/20 rounded-lg shadow-lg p-8 border border-green-700/50">
      <h2 class="text-3xl font-bold text-white mb-6">Export to Spotify</h2>

      <div class="space-y-6">
        <p class="text-gray-300">
          Connect your Spotify account to create playlists directly from the Cyprus Avenue archive.
          You can create a playlist from any individual show or generate a single playlist containing
          all {{ uniqueTrackCount.toLocaleString() }} unique tracks from the entire archive.
        </p>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Individual Playlist Card -->
          <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Create from Show</h3>
            <p class="text-sm text-gray-300 mb-4">
              Choose any Cyprus Avenue episode and create a Spotify playlist with all its tracks.
            </p>
            <button
              @click="router.push('/playlists')"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-auto"
            >
              Browse Shows →
            </button>
          </div>

          <!-- Genre Card -->
          <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
            <h3 class="text-lg font-semibold text-white mb-3">Create from Genre</h3>
            <p class="text-sm text-gray-300 mb-4">
              Filter the archive by musical genre and create a collection of tracks from that style.
            </p>
            <button
              @click="router.push('/artists')"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-auto"
            >
              Browse Genres →
            </button>
          </div>

          <!-- Complete Archive Card -->
          <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Complete Archive</h3>
            <p class="text-sm text-gray-300 mb-4">
              Create one mega-playlist with all unique tracks from the entire archive ({{ uniqueTrackCount.toLocaleString() }} tracks).
            </p>
            <button
              @click="showAllTracksModal = true"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Create Complete Playlist →
            </button>
          </div>
        </div>

        <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-6">
          <p class="text-sm text-green-200">
            💡 <strong>Tip:</strong> You can also add individual shows to Spotify by expanding any playlist
            in the <router-link to="/playlists" class="text-green-300 hover:text-green-200 underline">Playlists</router-link> view,
            or generate <strong>genre or artist-based collections</strong> from the <router-link to="/artists" class="text-green-300 hover:text-green-200 underline">Artists</router-link> page.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal for creating all tracks playlist -->
    <SpotifyPlaylistModal
      :is-open="showAllTracksModal"
      mode="all-tracks"
      @close="showAllTracksModal = false"
    />

    <!-- Download Archive Section -->
    <div class="bg-blue-900/20 rounded-lg shadow-lg p-8 border border-blue-700/50">
      <h2 class="text-3xl font-bold text-white mb-6">Download Archive</h2>

      <div class="space-y-6">
        <p class="text-gray-300">
          Download the complete Cyprus Avenue archive in various formats for offline use, analysis, or archival purposes.
          All {{ (stats.totalPlaylists || 0).toLocaleString() }} playlists with {{ (stats.totalTracks || 0).toLocaleString() }} tracks included.
        </p>

        <div class="grid gap-6 md:grid-cols-3">
          <div v-for="format in formats" :key="format.value" class="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col">
            <h3 class="text-lg font-semibold text-white mb-3">{{ format.label }} Format</h3>
            <p class="text-sm text-gray-300 mb-4 flex-grow">
              {{ format.description }}
            </p>
            <button
              @click="downloadAllPlaylists(playlists, format.value)"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-auto flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {{ format.value.toUpperCase() }}
            </button>
          </div>


        </div>

        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
          <p class="text-sm text-blue-200">
            💡 <strong>Note:</strong> You can also download individual playlists by expanding any show in the
            <router-link to="/playlists" class="text-blue-300 hover:text-blue-200 underline">Playlists</router-link> view
            and clicking the download button.
          </p>
        </div>
      </div>
    </div>

  </div>
</template>
