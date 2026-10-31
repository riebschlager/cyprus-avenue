<script setup lang="ts">
import type { PlaylistCreationResult } from './spotify'
import Icon from '../../components/Icon.vue'

defineProps<{
  result: PlaylistCreationResult
}>()
</script>

<template>
  <div class="summary">
    <div>
      <span class="ca-label ca-label--accent"><Icon name="check" /> Playlist created &middot; {{ result.tracksAdded }} tracks</span>
      <p class="summary__name">{{ result.playlistName }}</p>
    </div>

    <div class="ca-stats summary__stats">
      <div class="ca-stat">
        <span class="ca-label ca-label--sm">Tracks added</span>
        <span class="ca-stat__value">{{ result.tracksAdded.toLocaleString() }}</span>
      </div>
      <div v-if="result.tracksFailed > 0" class="ca-stat">
        <span class="ca-label ca-label--sm">Not found</span>
        <span class="ca-stat__value">{{ result.tracksFailed.toLocaleString() }}</span>
      </div>
    </div>

    <div v-if="result.notFound.length > 0">
      <span class="ca-label">Not on Spotify &middot; {{ result.notFound.length }}</span>
      <ul class="summary__missing">
        <li v-for="(track, i) in result.notFound.slice(0, 5)" :key="i">
          <span class="summary__song">{{ track.song }}</span>
          <span class="summary__artist">{{ track.artist }}</span>
        </li>
        <li v-if="result.notFound.length > 5" class="summary__more">
          and {{ result.notFound.length - 5 }} more
        </li>
      </ul>
    </div>

    <a
      :href="result.playlistUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="ca-btn ca-btn--primary ca-btn--block"
    >
      Open in Spotify <Icon name="arrow-right" />
    </a>
  </div>
</template>

<style scoped>
.summary { display: flex; flex-direction: column; gap: var(--space-6); }
.summary__name { margin-top: 6px; font: 700 20px/1.2 var(--font-display); letter-spacing: -0.02em; color: var(--fg-1); }
.summary__stats .ca-stat__value { font-size: 40px; }
.summary__missing { list-style: none; margin: 8px 0 0; padding: 0; max-height: 200px; overflow-y: auto; border-top: var(--rule-ink); }
.summary__missing li { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; border-bottom: var(--rule-hair); }
.summary__song { font: 600 14px/1.3 var(--font-ui); color: var(--fg-1); }
.summary__artist { font: 400 13px/1.3 var(--font-ui); color: var(--fg-2); }
.summary__more { font: var(--type-meta); text-transform: uppercase; letter-spacing: var(--tracking-label); color: var(--fg-3); }
</style>
