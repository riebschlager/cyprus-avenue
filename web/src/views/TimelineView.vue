<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 mb-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          Cyprus Avenue Timeline
        </h1>
        <p class="text-lg text-gray-600">
          7.5 years of musical discovery visualized • {{ stats.total }} episodes from {{ formatDate(stats.dateRange.start) }} to {{ formatDate(stats.dateRange.end) }}
        </p>
      </div>
    </div>

    <!-- Controls -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <div class="flex flex-col lg:flex-row gap-4">
          <!-- Type Filters -->
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="type in episodeTypes"
                :key="type"
                @click="toggleTypeFilter(type)"
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  selectedTypes.has(type)
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
                :style="selectedTypes.has(type) ? { backgroundColor: getTypeColor(type) } : {}"
              >
                {{ getTypeLabel(type) }}
                <span class="ml-1 opacity-75">({{ stats.byType[type] || 0 }})</span>
              </button>
              <button
                v-if="selectedTypes.size > 0"
                @click="clearFilters"
                class="px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-white hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <!-- Artist Search -->
          <div class="lg:w-64">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Search by Artist
            </label>
            <input
              v-model="artistSearch"
              type="text"
              placeholder="e.g., Bob Dylan"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center gap-4 text-sm text-gray-600">
            <span>
              Showing <strong>{{ filteredTimelineItems.length }}</strong> of <strong>{{ stats.total }}</strong> episodes
            </span>
            <button
              @click="jumpToRandomEpisode"
              class="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium"
            >
              🎲 Random Episode
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Artists Swimlanes -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <h2 class="text-lg font-semibold text-gray-900 mb-3">
          Most Featured Artists
        </h2>
        <div class="space-y-2">
          <div
            v-for="artist in topArtists.slice(0, 5)"
            :key="artist.artist"
            class="flex items-center gap-3 text-sm"
          >
            <div class="w-40 font-medium text-gray-700 truncate">
              {{ artist.artist }}
            </div>
            <div class="flex-1 bg-gray-100 rounded-full h-2 relative overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                :style="{ width: `${(artist.count / topArtists[0].count) * 100}%` }"
              ></div>
            </div>
            <div class="w-16 text-right text-gray-600">
              {{ artist.count }}×
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline Container -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <div
          ref="timelineContainer"
          class="timeline-container"
          style="height: 400px;"
        ></div>
        <div class="mt-4 text-sm text-gray-500 text-center">
          💡 Drag to pan • Scroll to zoom • Click episode for details
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div class="bg-white rounded-lg shadow-sm p-4">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
        <div class="flex flex-wrap gap-4">
          <div
            v-for="type in episodeTypes"
            :key="type"
            class="flex items-center gap-2"
          >
            <div
              class="w-4 h-4 rounded"
              :style="{ backgroundColor: getTypeColor(type) }"
            ></div>
            <span class="text-sm text-gray-700">{{ getTypeLabel(type) }}</span>
          </div>
        </div>
        <p class="mt-3 text-xs text-gray-500">
          Circle size indicates number of tracks in each episode
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Timeline } from 'vis-timeline/standalone';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { useTimelineData } from '../composables/useTimelineData';
import type { EpisodeType } from '../types/timeline';

const router = useRouter();
const timelineContainer = ref<HTMLElement | null>(null);

// Filters
const selectedTypes = ref<Set<EpisodeType>>(new Set());
const artistSearch = ref('');

// Get timeline data
const {
  filteredTimelineItems,
  topArtists,
  stats,
  getTypeColor,
  getTypeLabel
} = useTimelineData(selectedTypes, artistSearch);

const episodeTypes: EpisodeType[] = ['tribute', 'best-of', 'single-artist', 'themed'];

let timeline: Timeline | null = null;

// Initialize timeline
onMounted(() => {
  if (!timelineContainer.value) return;

  // Create dataset
  const items = new DataSet(
    filteredTimelineItems.value.map(item => ({
      id: item.id,
      content: '',
      start: item.start,
      title: `${item.title}\n${item.trackCount} tracks\nClick to view →`,
      type: 'point',
      className: `timeline-item ${item.className}`,
      style: `background-color: ${getTypeColor(item.type)}; border-color: ${getTypeColor(item.type)};`
    }))
  );

  // Timeline options
  const options = {
    width: '100%',
    height: '400px',
    margin: {
      item: 10
    },
    zoomMin: 1000 * 60 * 60 * 24 * 30, // 1 month
    zoomMax: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
    moveable: true,
    zoomable: true,
    orientation: 'top',
    showCurrentTime: false,
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap'
    }
  };

  // Create timeline
  timeline = new Timeline(timelineContainer.value, items, options);

  // Handle clicks
  timeline.on('select', (properties) => {
    if (properties.items.length > 0) {
      const itemId = properties.items[0];
      router.push(`/playlist/${itemId}`);
    }
  });

  // Fit all items in view
  timeline.fit();
});

// Update timeline when filters change
watch([filteredTimelineItems], () => {
  if (!timeline) return;

  const items = new DataSet(
    filteredTimelineItems.value.map(item => ({
      id: item.id,
      content: '',
      start: item.start,
      title: `${item.title}\n${item.trackCount} tracks\nClick to view →`,
      type: 'point',
      className: `timeline-item ${item.className}`,
      style: `background-color: ${getTypeColor(item.type)}; border-color: ${getTypeColor(item.type)};`
    }))
  );

  timeline.setItems(items);
  timeline.fit();
});

// Filter functions
function toggleTypeFilter(type: EpisodeType) {
  if (selectedTypes.value.has(type)) {
    selectedTypes.value.delete(type);
  } else {
    selectedTypes.value.add(type);
  }
  // Trigger reactivity
  selectedTypes.value = new Set(selectedTypes.value);
}

function clearFilters() {
  selectedTypes.value.clear();
  artistSearch.value = '';
  selectedTypes.value = new Set();
}

function jumpToRandomEpisode() {
  const items = filteredTimelineItems.value;
  if (items.length === 0) return;

  const randomItem = items[Math.floor(Math.random() * items.length)];
  router.push(`/playlist/${randomItem.slug}`);
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
</script>

<style>
/* Timeline styling */
.vis-timeline {
  border: none !important;
  font-family: inherit;
}

.vis-item {
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.vis-item:hover {
  transform: scale(1.2);
}

.vis-item.vis-selected {
  transform: scale(1.3);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.vis-tooltip {
  background-color: rgba(0, 0, 0, 0.9) !important;
  color: white !important;
  border: none !important;
  border-radius: 6px !important;
  padding: 8px 12px !important;
  font-size: 13px !important;
  white-space: pre-line !important;
}

.vis-time-axis .vis-text {
  color: #4b5563;
  font-size: 12px;
}

.vis-panel.vis-background {
  background-color: #f9fafb;
}
</style>
