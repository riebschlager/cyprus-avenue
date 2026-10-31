<script setup lang="ts">
import { isWithinArchiveWeek } from '../utils/archiveDate'
import { ref, computed, watch, onMounted } from 'vue'
import { useArtists } from '../composables/useArtists'
import { usePlaylists } from '../composables/usePlaylists'
import { useRouter } from 'vue-router'
import PlaylistCard from './PlaylistCard.vue'
import { generatePlaylistSlug, generateArtistSlug } from '../utils/slug'
import { useArtistBios } from '../composables/useArtistBios'
import type { Playlist } from '../types/playlist'

const { playlists } = usePlaylists()
const { loadBiosIndex, getBio } = useArtistBios()
const router = useRouter()
const { artists } = useArtists(playlists)

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

  const artistArray = artists.value.map(artist => artist.name)
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
  return playlists.value.filter(p => isWithinArchiveWeek(p.date, today))
    .sort((a, b) => b.date.localeCompare(a.date))
})

// Track expanded state for the history cards
const expandedHistoryId = ref<string | null>(null)

// Auto-expand first history playlist by default
watch(thisWeekPlaylists, (newList) => {
  if (newList.length > 0 && !expandedHistoryId.value) {
    const firstPlaylist = newList[0]
    if (firstPlaylist) {
      expandedHistoryId.value = firstPlaylist.date
    }
  }
}, { immediate: true })

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
  const artistArray = artists.value.map(artist => artist.name)
  if (artistArray.length === 0) return

  const randomIndex = Math.floor(Math.random() * artistArray.length)
  const randomArtist = artistArray[randomIndex]

  if (!randomArtist) return

  const slug = generateArtistSlug(randomArtist)

  router.push({ name: 'artist', params: { slug } })
}
</script>

<template>
      <!-- Right Column: This Week in History -->
      <div v-if="thisWeekPlaylists.length > 0" class="lg:col-span-1 h-full">
        <div class="bg-gray-900/40 rounded-lg shadow-lg p-6 border border-blue-900/30 relative overflow-hidden h-full">
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
                        :disable-scroll="true"
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
                                              <p v-if="suggestedArtistBio?.bioSummary" class="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-normal">{{ suggestedArtistBio.bioSummary }}</p>
                                              <p v-else class="text-[10px] text-gray-400 mt-1">Explore their tracks in the archive</p>
                                              <a v-if="suggestedArtistBio?.url" :href="suggestedArtistBio.url" target="_blank" rel="noopener noreferrer" @click.stop class="text-[10px] text-blue-400 hover:underline">Biography from Last.fm</a>
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
</template>
