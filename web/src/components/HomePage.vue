<script setup lang="ts">
import { ref } from 'vue'
import { usePlaylists } from '../composables/usePlaylists'
import { useRouter } from 'vue-router'
import SpotifyPlaylistModal from './SpotifyPlaylistModal.vue'

const { stats } = usePlaylists()
const router = useRouter()
const showAllTracksModal = ref(false)
</script>

<template>
  <div class="space-y-12">
    <!-- Hero Section -->
    <div class="text-center">
      <h1 class="text-5xl font-bold text-white mb-4">Cyprus Avenue Archive</h1>
      <p class="text-xl text-gray-300 max-w-3xl mx-auto">
        A digital archive of playlists from KCUR's legendary Cyprus Avenue radio show,
        preserving nearly 8 years of musical cultural heritage curated by Bill Shapiro.
      </p>
    </div>

    <!-- About Cyprus Avenue -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6">About Cyprus Avenue</h2>

      <div class="space-y-4 text-gray-300">
        <p>
          Cyprus Avenue was a Saturday evening institution on KCUR 89.3 FM in Kansas City,
          featuring "the world of popular music from gospel to rock - from country to reggae -
          from a different point of view." 
          The show was named after Van Morrison's iconic song "Cyprus Avenue"
          from the 1968 album <em>Astral Weeks</em>.
        </p>

        <p>
          For over 40 years (1978-2018), Bill Shapiro—a Kansas City tax and estate planner by day and
          music enthusiast by night—curated unique playlists introducing listeners to both
          classic and contemporary artists across all genres. A native of Kansas City, Missouri,
          Shapiro received his law degree from the University of Michigan and practiced law since 1962.
        </p>

        <p>
          Beyond the radio, Shapiro was the author of two definitive music guides, both published
          by Andrews & McMeel:
          <a href="https://www.amazon.com/dp/0836279476" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300"><em>The CD Rock and Roll Library</em></a> (1988) and
          <a href="https://www.amazon.com/dp/0836262174" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300"><em>The Rock and Roll Review</em></a> (1991).
          His taste and deep knowledge of music made Cyprus Avenue a beloved show for generations of Kansas City listeners.
        </p>

        <p>
          Bill Shapiro passed away in January 2020 at age 82, but his musical legacy lives on. Read more about his life and impact at 
          <a href="https://www.kcur.org/community/2020-01-23/bill-shapiro-longtime-host-of-kcurs-cyprus-avenue-dies-at-82" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300">KCUR</a>.
        </p>
      </div>
    </div>

    <!-- Marr Sound Archive -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6">Marr Sound Archive</h2>

      <div class="space-y-4 text-gray-300">
        <p>
          More recordings appear to be available as part of the <strong>Marr Sound Archive</strong> at the
          University of Missouri Kansas City.
        </p>

        <p>
          The archive was founded by Professor Gaylord Marr, who specialized in sound recordings.
          This collection contains audio recordings of the "Cyprus Avenue" radio program aired on KCUR-FM in Kansas City, Missouri.
        </p>

        <div class="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
          <p class="mb-2">
            <strong>Access the Collection:</strong>
          </p>
          <a
            href="https://finding-aids.library.umkc.edu/repositories/2/resources/415/collection_organization"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 hover:text-blue-300 underline break-words"
          >
            Marr Sound Archive: Cyprus Avenue Collection
          </a>
          <p class="mt-2 text-sm text-gray-400">
            Please contact the Marr Sound Archive directly regarding research, borrowing, and access to these materials.
          </p>
        </div>
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
    </div>

    <!-- Quick Links -->
    <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg shadow-lg p-8 border border-blue-700/50">
      <h2 class="text-3xl font-bold text-white mb-6">Explore the Archive</h2>

      <!-- Featured Story Link -->
      <button
        @click="router.push('/story')"
        class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg p-8 mb-6 transition-all text-left group border border-purple-500/50"
      >
        <div class="flex items-center gap-4">
          <div class="text-5xl">📖</div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">The Story of Cyprus Avenue</h3>
            <p class="text-purple-100">Scroll through 7.5 years of musical discovery • A narrative journey</p>
          </div>
          <div class="text-white opacity-50 group-hover:opacity-100 transition-opacity text-2xl">→</div>
        </div>
      </button>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <button
          @click="router.push('/playlists')"
          class="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-6 transition-colors text-left group"
        >
          <div class="text-3xl mb-3">📻</div>
          <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">Browse Playlists</h3>
          <p class="text-sm text-gray-400">View all {{ stats.totalPlaylists }} archived shows</p>
        </button>

        <button
          @click="router.push('/timeline')"
          class="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-6 transition-colors text-left group"
        >
          <div class="text-3xl mb-3">📊</div>
          <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">Timeline View</h3>
          <p class="text-sm text-gray-400">Visualize 7.5 years of discovery</p>
        </button>

        <button
          @click="router.push('/artists')"
          class="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-6 transition-colors text-left group"
        >
          <div class="text-3xl mb-3">🎤</div>
          <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">Browse Artists</h3>
          <p class="text-sm text-gray-400">Explore by featured artists</p>
        </button>

        <button
          @click="router.push('/tracks')"
          class="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg p-6 transition-colors text-left group"
        >
          <div class="text-3xl mb-3">🎵</div>
          <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">All Tracks</h3>
          <p class="text-sm text-gray-400">Search and sort {{ (stats.totalTracks || 0).toLocaleString() }} songs</p>
        </button>
      </div>
    </div>

    <!-- About This Project -->
    <div class="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
      <h2 class="text-3xl font-bold text-white mb-6">About This Project</h2>

      <div class="space-y-4 text-gray-300">
        <p>
          This project originally began in 2018 as a manual preservation effort. At the time, the work 
          consisted primarily of copying and pasting as many playlists as possible from the KCUR website before they 
          disappeared. You can read more about the original motivation in this 2018 blog post: 
          <a href="https://riebschlager.medium.com/the-cyprus-avenue-preservation-project-5fa0a3894c3a" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300">The Cyprus Avenue Preservation Project</a>.
        </p>

        <p>
          The inspiration back then was a growing nostalgia for human-curated music in an era where streaming 
          services and algorithmically generated playlists were already beginning to dominate. Now in 2026, 
          with the incredible advancement of AI and coding tools, I chose to re-ignite this project.
        </p>

        <p>
          Over the course of just a few days, I used these modern tools alongside my background in software 
          development to build this archive—automatedly parsing the original text files and searching the 
          KCUR website for any shows I had previously missed. It is my hope to both preserve a small piece 
          of Kansas City history and to "swim against the tide" of algorithmic listening by appreciating 
          the curation of a true musicologist.
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
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Interactive Timeline:</strong> Visualize 7.5 years of musical discovery across {{ stats.totalPlaylists }} episodes</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Export to Spotify:</strong> Create Spotify playlists from any archive show or from all unique tracks</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 p-6 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <p class="text-gray-200">
            This project is <strong class="text-white">open source</strong> and hosted on
            <a href="https://github.com/riebschlager/cyprus-avenue/" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">GitHub</a>.
            I welcome any edits, suggestions, or corrections to the archive. You can contact me directly at
            <a href="mailto:chris@the816.com" class="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">chris@the816.com</a>.
          </p>
        </div>
      </div>
    </div>

    <!-- Export to Spotify Section -->
    <div class="bg-green-900/20 rounded-lg shadow-lg p-8 border border-green-700/50">
      <h2 class="text-3xl font-bold text-white mb-6">Export to Spotify</h2>

      <div class="space-y-6">
        <p class="text-gray-300">
          Connect your Spotify account to create playlists directly from the Cyprus Avenue archive.
          You can create a playlist from any individual show or generate a single playlist containing
          all {{ (stats.totalTracks || 0).toLocaleString() }} unique tracks from the entire archive.
        </p>

        <div class="grid gap-6 md:grid-cols-2">
          <!-- Individual Playlist Card -->
          <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Create from Show</h3>
            <p class="text-sm text-gray-300 mb-4">
              Choose any Cyprus Avenue episode and create a Spotify playlist with all its tracks.
            </p>
            <button
              @click="router.push('/playlists')"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Browse Shows →
            </button>
          </div>

          <!-- Complete Archive Card -->
          <div class="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Complete Archive</h3>
            <p class="text-sm text-gray-300 mb-4">
              Create one mega-playlist with all unique tracks from the entire archive ({{ (stats.totalTracks || 0).toLocaleString() }} tracks).
            </p>
            <button
              @click="showAllTracksModal = true"
              class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Create Complete Playlist →
            </button>
          </div>
        </div>

        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p class="text-sm text-blue-200">
            💡 <strong>Tip:</strong> You can also add individual shows to Spotify by expanding any playlist
            in the <router-link to="/playlists" class="text-blue-400 hover:text-blue-300 underline">Playlists</router-link> view
            and clicking the "🎧 Add to Spotify" button.
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
