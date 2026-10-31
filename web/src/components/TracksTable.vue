<script setup lang="ts">
import { stampArchiveDate } from '../utils/archiveDate'
import type { TrackWithPlaylist, SortField, SortDirection } from '../composables/useTracks'
import StreamingLinks from './StreamingLinks.vue'
import Icon from './Icon.vue'
import { generatePlaylistSlug, generateArtistSlug } from '../utils/slug'

defineProps<{
  tracks: TrackWithPlaylist[]
  sortField: SortField
  sortDirection: SortDirection
  focusedIndex?: number | null
}>()

const emit = defineEmits<{
  sort: [field: SortField]
}>()

const columns: { field: SortField; label: string }[] = [
  { field: 'artist', label: 'Artist' },
  { field: 'song', label: 'Song' },
  { field: 'playlistTitle', label: 'Show' },
  { field: 'playlistDate', label: 'Date' }
]

const ariaSort = (field: SortField, currentField: SortField, direction: SortDirection) => {
  if (field !== currentField) return 'none'
  return direction === 'asc' ? 'ascending' : 'descending'
}

const getArtistUrl = (name: string) => {
  return `/artist/${generateArtistSlug(name)}`
}

const getPlaylistUrl = (title: string, date: string) => {
  return `/playlist/${generatePlaylistSlug(title, date)}`
}
</script>

<template>
  <div class="tracks">
    <div class="tracks__scroll">
      <table class="tracks__table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.field"
              scope="col"
              :class="`tracks__col--${col.field}`"
              :aria-sort="ariaSort(col.field, sortField, sortDirection)"
            >
              <button
                type="button"
                class="tracks__sort ca-label"
                :class="{ 'ca-label--ink': sortField === col.field }"
                @click="emit('sort', col.field)"
              >
                {{ col.label }}
                <Icon
                  v-if="sortField === col.field"
                  name="arrow-up"
                  :class="{ 'tracks__sort-icon--desc': sortDirection === 'desc' }"
                />
              </button>
            </th>
            <th scope="col" class="tracks__col--actions">
              <span class="ca-label">Listen</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(track, index) in tracks"
            :key="track.id"
            :data-index="index"
            class="tracks__row"
            :class="{ 'tracks__row--focused': focusedIndex === index }"
          >
            <td class="tracks__artist">
              <router-link :to="getArtistUrl(track.artist)">{{ track.artist }}</router-link>
            </td>
            <td class="tracks__song">{{ track.song }}</td>
            <td class="tracks__show">
              <router-link :to="getPlaylistUrl(track.playlistTitle, track.playlistDate)">
                {{ track.playlistTitle }}
              </router-link>
            </td>
            <td class="tracks__date">
              <span class="ca-date">{{ stampArchiveDate(track.playlistDate) }}</span>
            </td>
            <td class="tracks__actions">
              <StreamingLinks :artist="track.artist" :song="track.song" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="tracks.length === 0" class="tracks__empty">
      <h3 class="ca-sechead__title">No tracks found</h3>
      <p>Try an artist name or a song title.</p>
    </div>
  </div>
</template>

<style scoped>
.tracks__scroll { overflow-x: auto; }
.tracks__table { width: 100%; border-collapse: collapse; border-top: var(--rule-ink); }
.tracks__table th { padding: 12px 12px 8px 0; text-align: left; border-bottom: var(--rule-hair); white-space: nowrap; }
.tracks__sort { gap: 4px; padding: 0; border: 0; background: none; cursor: pointer; transition: color var(--dur-fast) var(--ease-out); }
.tracks__sort:hover { color: var(--fg-1); }
.tracks__sort .ca-icon { font-size: 12px; transition: transform var(--dur-fast) var(--ease-out); }
.tracks__sort-icon--desc { transform: rotate(180deg); }
.tracks__col--actions { text-align: right; padding-right: 0; }

.tracks__row { transition: background var(--dur-fast) var(--ease-out); }
.tracks__row:hover { background: var(--bg-sunken); }
.tracks__row--focused { background: var(--bg-highlight); box-shadow: inset 3px 0 0 var(--orange-500); }
.tracks__row--focused:hover { background: var(--orange-100); }
.tracks__row td { height: var(--row-h); padding: 6px 12px 6px 0; border-bottom: var(--rule-hair); vertical-align: middle; }
.tracks__row td:first-child { padding-left: 8px; }

.tracks__artist a { font: 600 15px/1.3 var(--font-ui); letter-spacing: -0.01em; color: var(--fg-1); text-decoration: none; }
.tracks__song { font: 400 15px/1.3 var(--font-ui); color: var(--fg-1); }
.tracks__show a { font: 400 14px/1.3 var(--font-ui); color: var(--fg-2); text-decoration: none; }
.tracks__artist a:hover, .tracks__show a:hover { color: var(--fg-accent); text-decoration: underline; }
.tracks__date { white-space: nowrap; }
.tracks__actions { text-align: right; white-space: nowrap; }
.tracks__row td.tracks__actions { padding-right: 4px; }

.tracks__empty { display: flex; flex-direction: column; gap: 8px; padding: var(--space-12) 0; border-bottom: var(--rule-hair); }
.tracks__empty p { font: var(--type-body); color: var(--fg-2); }

@media (max-width: 760px) {
  .tracks__col--playlistTitle, .tracks__show,
  .tracks__col--playlistDate, .tracks__date { display: none; }
}
</style>
