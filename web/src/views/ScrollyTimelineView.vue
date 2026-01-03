<template>
  <div class="scrolly-timeline bg-gray-950 text-white">
    <!-- Hero Section -->
    <section class="h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950">
      <div class="text-center px-4">
        <h1 class="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          7.5 Years
        </h1>
        <p class="text-2xl md:text-3xl text-gray-300 mb-8">
          on Cyprus Avenue
        </p>
        <div class="text-gray-400 animate-bounce">
          ↓ Scroll to explore
        </div>
      </div>
    </section>

    <!-- Chapter 1: The Beginning -->
    <section class="min-h-screen flex items-center justify-center relative">
      <div class="max-w-4xl mx-auto px-4 py-20">
        <div
          class="chapter-step transition-all duration-1000"
          :class="activeChapter >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
        >
          <div class="text-sm text-blue-400 mb-4 font-semibold tracking-wide uppercase">December 12, 2009</div>
          <h2 class="text-5xl md:text-6xl font-bold mb-6">Where It All Began</h2>
          <p class="text-xl text-gray-300 mb-8 leading-relaxed">
            The archive opens with "Cyprus Avenue's Top Music Picks of 2009,"
            featuring {{ firstPlaylist?.tracks.length || 10 }} carefully curated tracks from artists like
            Eilen Jewell, Bob Dylan, and Rosanne Cash.
          </p>
          <div v-if="firstPlaylist" class="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center gap-4 mb-4">
              <div class="text-4xl">📻</div>
              <div>
                <div class="font-semibold">{{ firstPlaylist.title }}</div>
                <div class="text-sm text-gray-400">{{ formatDate(firstPlaylist.date) }}</div>
              </div>
            </div>
            <div class="text-sm text-gray-400">
              Top picks: {{ firstPlaylist.tracks.slice(0, 3).map(t => t.artist).join(', ') }}...
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Chapter 2: The Golden Era -->
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 to-blue-950/20">
      <div class="max-w-4xl mx-auto px-4 py-20">
        <div
          class="chapter-step transition-all duration-1000"
          :class="activeChapter >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
        >
          <div class="text-sm text-blue-400 mb-4 font-semibold tracking-wide uppercase">2013-2017</div>
          <h2 class="text-5xl md:text-6xl font-bold mb-6">The Golden Era</h2>
          <p class="text-xl text-gray-300 mb-8 leading-relaxed">
            The archive truly blossomed from 2013 onwards, with <strong class="text-white">{{ stats.total }}</strong> episodes
            spanning themes from artist tributes to genre explorations.
          </p>

          <!-- Year-by-year breakdown -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div
              v-for="year in yearBreakdown"
              :key="year.year"
              class="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
            >
              <div class="text-3xl font-bold text-blue-400">{{ year.count }}</div>
              <div class="text-sm text-gray-400">{{ year.year }}</div>
            </div>
          </div>

          <p class="text-lg text-gray-400">
            Peak year: <strong class="text-white">{{ peakYear.year }}</strong> with <strong class="text-white">{{ peakYear.count }}</strong> episodes
          </p>
        </div>
      </div>
    </section>

    <!-- Chapter 3: Bill's Favorites -->
    <section class="min-h-screen flex items-center justify-center">
      <div class="max-w-4xl mx-auto px-4 py-20">
        <div
          class="chapter-step transition-all duration-1000"
          :class="activeChapter >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
        >
          <div class="text-sm text-purple-400 mb-4 font-semibold tracking-wide uppercase">Most Featured</div>
          <h2 class="text-5xl md:text-6xl font-bold mb-6">Bill's Favorites</h2>
          <p class="text-xl text-gray-300 mb-8 leading-relaxed">
            Certain artists became Cyprus Avenue staples, appearing again and again across the years.
          </p>

          <div class="space-y-4">
            <div
              v-for="(artist, index) in topArtists.slice(0, 8)"
              :key="artist.artist"
              class="flex items-center gap-4 bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors"
            >
              <div class="text-2xl font-bold text-purple-400 w-8">{{ index + 1 }}</div>
              <div class="flex-1">
                <div class="font-semibold text-lg">{{ artist.artist }}</div>
                <div class="text-sm text-gray-400">
                  {{ artist.count }} appearance{{ artist.count !== 1 ? 's' : '' }}
                  • First: {{ formatDate(artist.dates[0]) }}
                  <span v-if="artist.dates.length > 1">
                    • Last: {{ formatDate(artist.dates[artist.dates.length - 1]) }}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold text-purple-400">{{ artist.count }}×</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Chapter 4: Tributes & Memorials -->
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 to-red-950/20">
      <div class="max-w-4xl mx-auto px-4 py-20">
        <div
          class="chapter-step transition-all duration-1000"
          :class="activeChapter >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
        >
          <div class="text-sm text-red-400 mb-4 font-semibold tracking-wide uppercase">Remembering</div>
          <h2 class="text-5xl md:text-6xl font-bold mb-6">Tributes & Memorials</h2>
          <p class="text-xl text-gray-300 mb-8 leading-relaxed">
            Bill honored legendary artists through tribute episodes, celebrating their lasting impact on music.
          </p>

          <div class="grid md:grid-cols-2 gap-4">
            <div
              v-for="tribute in tributeEpisodes.slice(0, 6)"
              :key="tribute.slug"
              class="bg-gray-800/50 rounded-lg p-6 border border-red-700/30 hover:border-red-500/50 transition-colors cursor-pointer"
              @click="router.push(`/playlist/${tribute.slug}`)"
            >
              <div class="text-sm text-red-400 mb-2">{{ formatDate(tribute.start) }}</div>
              <div class="font-semibold text-lg mb-2">{{ tribute.title }}</div>
              <div class="text-sm text-gray-400">{{ tribute.trackCount }} tracks</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Chapter 5: The Archive Today -->
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-950/20 to-gray-950">
      <div class="max-w-4xl mx-auto px-4 py-20">
        <div
          class="chapter-step transition-all duration-1000"
          :class="activeChapter >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'"
        >
          <div class="text-sm text-green-400 mb-4 font-semibold tracking-wide uppercase">Preserved</div>
          <h2 class="text-5xl md:text-6xl font-bold mb-6">The Archive Today</h2>
          <p class="text-xl text-gray-300 mb-8 leading-relaxed">
            Nearly 8 years of musical heritage, preserved and searchable for future generations.
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <div class="text-4xl font-bold text-blue-400 mb-2">{{ stats.total }}</div>
              <div class="text-sm text-gray-400">Episodes</div>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <div class="text-4xl font-bold text-purple-400 mb-2">{{ (stats.totalTracks || 0).toLocaleString() }}</div>
              <div class="text-sm text-gray-400">Tracks</div>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <div class="text-4xl font-bold text-green-400 mb-2">{{ topArtists.length }}</div>
              <div class="text-sm text-gray-400">Artists</div>
            </div>
            <div class="bg-gray-800/50 rounded-lg p-6 border border-gray-700 text-center">
              <div class="text-4xl font-bold text-red-400 mb-2">7.5</div>
              <div class="text-sm text-gray-400">Years</div>
            </div>
          </div>

          <div class="text-center">
            <p class="text-lg text-gray-300 mb-6">
              Ready to explore the archive?
            </p>
            <div class="flex flex-wrap gap-4 justify-center">
              <button
                @click="router.push('/playlists')"
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
              >
                Browse All Playlists
              </button>
              <button
                @click="router.push('/timeline')"
                class="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold transition-colors"
              >
                Interactive Timeline
              </button>
              <button
                @click="router.push('/artists')"
                class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Browse Artists
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final Section: Call to Action -->
    <section class="h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900">
      <div class="text-center px-4">
        <h2 class="text-5xl md:text-6xl font-bold mb-6">
          Start Exploring
        </h2>
        <p class="text-xl text-gray-400 mb-8">
          {{ stats.total }} episodes • {{ (stats.totalTracks || 0).toLocaleString() }} tracks • 7.5 years
        </p>
        <button
          @click="router.push('/playlists')"
          class="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-bold text-lg transition-colors"
        >
          Explore the Archive →
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import scrollama from 'scrollama';
import { useTimelineData } from '../composables/useTimelineData';
import { usePlaylists } from '../composables/usePlaylists';

const router = useRouter();

// Refs for scroll tracking
const activeChapter = ref(-1);

// Get data
const { playlists } = usePlaylists();
const { allTimelineItems, topArtists, stats } = useTimelineData();

// Computed data
const firstPlaylist = computed(() => {
  const sorted = [...playlists.value].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  return sorted[0];
});

const yearBreakdown = computed(() => {
  const years = new Map<number, number>();

  allTimelineItems.value.forEach(item => {
    const year = item.start.getFullYear();
    years.set(year, (years.get(year) || 0) + 1);
  });

  return Array.from(years.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
});

const peakYear = computed(() => {
  const breakdown = yearBreakdown.value;
  if (breakdown.length === 0) return { year: 2013, count: 0 };

  return breakdown.reduce((max, curr) =>
    curr.count > max.count ? curr : max
  );
});

const tributeEpisodes = computed(() => {
  return allTimelineItems.value.filter(item => item.type === 'tribute');
});

const stats2 = computed(() => {
  return {
    ...stats.value,
    totalTracks: playlists.value.reduce((sum, p) => sum + p.tracks.length, 0)
  };
});

// Setup scrollama
let scroller: any = null;

onMounted(() => {
  // Setup scrollama instance
  scroller = scrollama();

  scroller
    .setup({
      step: '.chapter-step',
      offset: 0.5,
      debug: false
    })
    .onStepEnter((response: any) => {
      // Update active chapter based on step index
      activeChapter.value = response.index;
    });

  // Setup resize listener
  window.addEventListener('resize', scroller.resize);
});

onUnmounted(() => {
  if (scroller) {
    scroller.destroy();
  }
  window.removeEventListener('resize', scroller.resize);
});

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}
</script>

<style scoped>
.scrolly-timeline {
  scroll-behavior: smooth;
}

/* Smooth gradient transitions */
section {
  transition: background 0.5s ease;
}
</style>
