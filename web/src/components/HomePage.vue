<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePlaylists } from '../composables/usePlaylists'
import { useRouter } from 'vue-router'
import SpotifyPlaylistModal from './SpotifyPlaylistModal.vue'
import PlaylistCard from './PlaylistCard.vue'
import { generatePlaylistSlug, generateArtistSlug } from '../utils/slug'
import { useArtistBios } from '../composables/useArtistBios'
import type { Playlist } from '../types/playlist'

const { stats, playlists } = usePlaylists()
const { loadBiosIndex, getBio } = useArtistBios()
const router = useRouter()
const showAllTracksModal = ref(false)

// Suggested content
const suggestedPlaylist = ref<Playlist | null>(null)
const suggestedArtist = ref<string | null>(null)
const suggestedArtistBio = computed(() => suggestedArtist.value ? getBio(suggestedArtist.value) : null)

const refreshSuggestions = () => {
  if (playlists.value.length === 0) return

  // Random Playlist
  const randomPlaylistIndex = Math.floor(Math.random() * playlists.value.length)
  const randomPlaylist = playlists.value[randomPlaylistIndex]
  if (randomPlaylist) {
    suggestedPlaylist.value = randomPlaylist
  }

  // Random Artist
  const artists = new Set<string>()
  playlists.value.forEach(p => {
    p.tracks.forEach(t => {
      if (t.artist) artists.add(t.artist)
    })
  })
  const artistArray = Array.from(artists)
  if (artistArray.length > 0) {
    const randomArtistIndex = Math.floor(Math.random() * artistArray.length)
    const randomArtist = artistArray[randomArtistIndex]
    if (randomArtist) {
      suggestedArtist.value = randomArtist
    }
  }
}

// Watch for playlists to load
watch(playlists, () => {
  if (!suggestedPlaylist.value) {
    refreshSuggestions()
  }
}, { immediate: true })

onMounted(async () => {
  await loadBiosIndex()
  
  if (playlists.value.length > 0) {
    refreshSuggestions()
  }

  // Check for pending Spotify action after OAuth redirect
  const pendingAction = sessionStorage.getItem('spotify_pending_action')
  if (pendingAction) {
    try {
      const action = JSON.parse(pendingAction)
      // Check if this was the all-tracks modal
      if (action.mode === 'all-tracks') {
        showAllTracksModal.value = true
        sessionStorage.removeItem('spotify_pending_action')
      }
    } catch (err) {
      console.error('Failed to parse pending Spotify action', err)
      sessionStorage.removeItem('spotify_pending_action')
    }
  }
})

const navigateToSuggestedPlaylist = () => {
  if (!suggestedPlaylist.value) return
  const slug = generatePlaylistSlug(suggestedPlaylist.value.title, suggestedPlaylist.value.date)
  router.push({ name: 'playlist', params: { slug } })
}

const navigateToSuggestedArtist = () => {
  if (!suggestedArtist.value) return
  const slug = generateArtistSlug(suggestedArtist.value)
  router.push({ name: 'artist', params: { slug } })
}

// Logic for "This Week in History"
const thisWeekPlaylists = computed(() => {
  const today = new Date()
  const currentMonth = today.getMonth() // 0-11
  const currentDate = today.getDate() // 1-31

  // Define "This Week" as +/- 3 days from today
  return playlists.value.filter(p => {
    if (!p.date) return false
    const pDate = new Date(p.date)
    
    // Normalize both dates to the same leap year (2000) to handle Feb 29 correctly
    const target = new Date(2000, currentMonth, currentDate)
    const check = new Date(2000, pDate.getMonth(), pDate.getDate())
    
    // Calculate difference in days
    const diffTime = Math.abs(target.getTime() - check.getTime())
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    
    // Check direct difference OR wrap-around difference (for Dec/Jan boundary)
    // 366 because 2000 is a leap year
    return diffDays <= 3 || (366 - diffDays) <= 3
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Track expanded state for the history cards
const expandedHistoryId = ref<string | null>(null)
const toggleHistoryCard = (date: string) => {
  expandedHistoryId.value = expandedHistoryId.value === date ? null : date
}

const navigateToRandomPlaylist = () => {
  if (playlists.value.length === 0) return
  
  const randomIndex = Math.floor(Math.random() * playlists.value.length)
  const randomPlaylist = playlists.value[randomIndex]
  
  if (!randomPlaylist) return

  const slug = generatePlaylistSlug(randomPlaylist.title, randomPlaylist.date)
  
  router.push({ name: 'playlist', params: { slug } })
}

const navigateToRandomArtist = () => {
  // Collect all unique artists
  const artists = new Set<string>()
  playlists.value.forEach(p => {
    p.tracks.forEach(t => {
      if (t.artist) artists.add(t.artist)
    })
  })
  
  const artistArray = Array.from(artists)
  if (artistArray.length === 0) return
  
  const randomIndex = Math.floor(Math.random() * artistArray.length)
  const randomArtist = artistArray[randomIndex]
  
  if (!randomArtist) return

  const slug = generateArtistSlug(randomArtist)
  
  router.push({ name: 'artist', params: { slug } })
}
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
        <div class="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700 h-full">
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

          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>

      <!-- Right Column: This Week in History -->
      <div v-if="thisWeekPlaylists.length > 0" class="lg:col-span-1 h-full">
        <div class="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 rounded-lg shadow-lg p-6 border border-blue-700/50 relative overflow-hidden h-full">
          <!-- Decorative background element -->
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl"></div>
          
          <div class="relative z-10 flex flex-col h-full">
            <div class="flex items-center gap-3 mb-4">
              <span class="text-xl">📅</span>
              <h2 class="text-2xl font-bold text-white leading-tight">This Week in History</h2>
            </div>
            
            <p class="text-gray-300 text-sm mb-6">
              Shows broadcast during this week in years past.
            </p>

                    <div class="space-y-4 flex-grow">
                      <PlaylistCard
                        v-for="playlist in thisWeekPlaylists"
                        :key="playlist.date"
                        :playlist="playlist"
                        :search-query="''"
                        :is-expanded="expandedHistoryId === playlist.date"
                        :compact="true"
                        @toggle="toggleHistoryCard(playlist.date)"
                      />
                    </div>
            <div class="mt-8 pt-6 border-t border-white/10">
              <h3 class="text-lg font-semibold text-white mb-4">From the Archive</h3>
              
              <div class="space-y-4 mb-6">
                                        <!-- Suggested Playlist -->
                                        <div 
                                          v-if="suggestedPlaylist"
                                          @click="navigateToSuggestedPlaylist"
                                          class="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition cursor-pointer border border-white/5 hover:border-blue-500/30 group relative"
                                        >
                                          <div class="text-xs text-blue-300 uppercase tracking-wider mb-2">Suggested Playlist</div>
                                          <div class="flex gap-3">
                                            <div class="flex-shrink-0 w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-500/20">
                                              <span class="text-xl">💿</span>
                                            </div>
                                            <div class="flex-1 min-w-0 pr-6">
                                              <div class="font-medium text-white group-hover:text-blue-200 transition-colors leading-tight">{{ suggestedPlaylist.title }}</div>
                                              <div class="text-[10px] text-gray-400 mt-1">{{ suggestedPlaylist.date }} &middot; {{ suggestedPlaylist.tracks.length }} tracks</div>
                                            </div>
                                          </div>
                                          <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                          </div>
                                        </div>
                            
                                        <!-- Suggested Artist -->
                                        <div 
                                          v-if="suggestedArtist"
                                          @click="navigateToSuggestedArtist"
                                          class="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition cursor-pointer border border-white/5 hover:border-purple-500/30 group relative"
                                        >
                                          <div class="text-xs text-purple-300 uppercase tracking-wider mb-2">Suggested Artist</div>
                                          
                                          <div class="flex gap-3">
                                            <div v-if="suggestedArtistBio?.image" class="flex-shrink-0">
                                              <img :src="suggestedArtistBio.image" :alt="suggestedArtist" class="w-12 h-12 rounded-lg object-cover shadow-md" />
                                            </div>
                                            <div v-else class="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                                              <span class="text-xl">🎤</span>
                                            </div>
                                            
                                            <div class="flex-1 min-w-0 pr-6">
                                              <div class="font-medium text-white group-hover:text-purple-200 transition-colors text-lg leading-tight">{{ suggestedArtist }}</div>
                                              <p v-if="suggestedArtistBio?.bioSummary" class="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-normal" v-html="suggestedArtistBio.bioSummary"></p>
                                              <p v-else class="text-[10px] text-gray-400 mt-1">Explore their tracks in the archive</p>
                                            </div>
                                          </div>
                                          <div class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                          </div>
                                        </div>
                            
              </div>

              <div class="space-y-4">
                <div class="flex flex-wrap gap-2 justify-center">
                  <button 
                    @click="navigateToRandomPlaylist"
                    class="flex-1 px-3 py-2 bg-blue-600/50 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors border border-blue-500/30 whitespace-nowrap"
                  >
                    🎲 Surprise Playlist
                  </button>
                  <button 
                    @click="navigateToRandomArtist"
                    class="flex-1 px-3 py-2 bg-purple-600/50 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors border border-purple-500/30 whitespace-nowrap"
                  >
                    🎤 Surprise Artist
                  </button>
                </div>
                <button 
                  @click="refreshSuggestions"
                  class="w-full text-xs text-gray-400 hover:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Suggestions
                </button>
              </div>
            </div>
          </div>
        </div>
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

        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
          <p class="text-sm text-blue-200">
            💡 <strong>Tip:</strong> You can also add individual shows to Spotify by expanding any playlist
            in the <router-link to="/playlists" class="text-blue-400 hover:text-blue-300 underline">Playlists</router-link> view, 
            or generate <strong>genre or artist-based collections</strong> from the <router-link to="/artists" class="text-blue-400 hover:text-blue-300 underline">Artists</router-link> page.
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
