<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import HomeDiscovery from '../components/HomeDiscovery.vue'
import HomeExports from '../components/HomeExports.vue'
import HomeAboutProject from '../components/HomeAboutProject.vue'
const { stats } = usePlaylists()
const router = useRouter()
</script>

<template>
  <div class="space-y-12">
    <!-- Hero Section -->
    <div class="relative py-20 sm:py-28 overflow-hidden rounded-2xl">
      <!-- Background Decorative Elements -->
      <div class="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="relative z-10 text-center px-6">
        <h1 class="text-5xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-gray-400 mb-8 tracking-tight">
          Cyprus Avenue Archive
        </h1>
        <p class="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
          A digital preservation of Bill Shapiro's legendary KCUR radio show,
          celebrating over 40 years of musical discovery and cultural heritage.
        </p>
        <div class="mt-10 flex justify-center gap-4">
          <div class="h-1 w-20 bg-blue-500 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Left Column: About & Marr -->
      <div class="lg:col-span-2 space-y-8">
        <!-- About Cyprus Avenue -->
        <div class="relative rounded-2xl overflow-hidden border border-gray-800/60 shadow-lg h-full">
          <div class="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div class="relative z-10 p-8">
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
        </div>

        <!-- Marr Sound Archive -->
        <div class="relative rounded-2xl overflow-hidden border border-gray-800/60 shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div class="relative z-10 p-8">
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

            <div class="mt-6 p-4 bg-gray-900/70 rounded-lg border border-gray-700">
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
        </div>

        <!-- Archive Statistics -->
        <div class="relative rounded-2xl overflow-hidden border border-gray-800/60 shadow-lg">
          <div class="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div class="relative z-10 p-8">
            <h2 class="text-3xl font-bold text-white mb-6">Archive Statistics</h2>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div class="bg-gray-900/70 rounded-lg p-6 border border-gray-800 border-l-4 border-blue-500">
                <p class="text-sm text-gray-400 mb-2">Total Playlists</p>
                <p class="text-4xl font-bold text-white">{{ stats.totalPlaylists }}</p>
              </div>
              <div class="bg-gray-900/70 rounded-lg p-6 border border-gray-800 border-l-4 border-green-500">
                <p class="text-sm text-gray-400 mb-2">Total Tracks</p>
                <p class="text-4xl font-bold text-white">{{ stats.totalTracks.toLocaleString() }}</p>
              </div>
              <div class="bg-gray-900/70 rounded-lg p-6 border border-gray-800 border-l-4 border-purple-500">
                <p class="text-sm text-gray-400 mb-2">Avg Tracks/Show</p>
                <p class="text-4xl font-bold text-white">{{ stats.avgTracksPerShow.toFixed(1) }}</p>
              </div>
              <div v-if="stats.dateRange" class="bg-gray-900/70 rounded-lg p-6 border border-gray-800 border-l-4 border-orange-500">
                <p class="text-sm text-gray-400 mb-2">Date Range</p>
                <p class="text-lg font-semibold text-white">
                  {{ stats.dateRange.start }}<br>to {{ stats.dateRange.end }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HomeDiscovery />
    </div>

    <HomeAboutProject />

    <HomeExports />

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
