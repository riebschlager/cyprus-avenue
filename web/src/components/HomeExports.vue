<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import SpotifyPlaylistModal from '../features/spotify/SpotifyPlaylistModal.vue'
import { downloadAllPlaylists, DOWNLOAD_FORMATS } from '../utils/downloadFormats'
import Icon from './Icon.vue'
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
  <div>
    <!-- Export to Spotify -->
    <section class="ca-section">
      <div class="ca-sechead">
        <div class="ca-sechead__left">
          <span class="ca-label ca-label--accent">03</span>
          <h2 class="ca-sechead__title">Export to Spotify</h2>
        </div>
      </div>

      <p class="ca-lede exports__intro">
        Connect your Spotify account to create playlists directly from the Cyprus Avenue archive.
        You can create a playlist from any individual show or generate a single playlist containing
        all {{ uniqueTrackCount.toLocaleString() }} unique tracks from the entire archive.
      </p>

      <div class="exports__grid">
        <div class="exports__card">
          <h3 class="exports__title">Create from show</h3>
          <p class="exports__desc">
            Choose any Cyprus Avenue episode and create a Spotify playlist with all its tracks.
          </p>
          <button type="button" class="ca-btn ca-btn--secondary" @click="router.push('/playlists')">
            Browse shows <Icon name="arrow-right" />
          </button>
        </div>

        <div class="exports__card">
          <h3 class="exports__title">Create from genre</h3>
          <p class="exports__desc">
            Filter the archive by musical genre and create a collection of tracks from that style.
          </p>
          <button type="button" class="ca-btn ca-btn--secondary" @click="router.push('/artists')">
            Browse genres <Icon name="arrow-right" />
          </button>
        </div>

        <div class="exports__card">
          <h3 class="exports__title">Complete archive</h3>
          <p class="exports__desc">
            Create one mega-playlist with all unique tracks from the entire archive ({{ uniqueTrackCount.toLocaleString() }} tracks).
          </p>
          <button type="button" class="ca-btn ca-btn--primary" @click="showAllTracksModal = true">
            <Icon name="list-plus" /> Create complete playlist
          </button>
        </div>
      </div>

      <p class="exports__tip">
        <span class="ca-label ca-label--accent">Tip</span>
        You can also add individual shows to Spotify by expanding any playlist
        in the <router-link to="/playlists">Shows</router-link> view,
        or generate genre or artist-based collections from the <router-link to="/artists">Artists</router-link> page.
      </p>
    </section>

    <SpotifyPlaylistModal
      :is-open="showAllTracksModal"
      mode="all-tracks"
      @close="showAllTracksModal = false"
    />

    <!-- Download archive -->
    <section class="ca-section">
      <div class="ca-sechead">
        <div class="ca-sechead__left">
          <span class="ca-label ca-label--accent">04</span>
          <h2 class="ca-sechead__title">Download the archive</h2>
        </div>
      </div>

      <p class="ca-lede exports__intro">
        Download the complete Cyprus Avenue archive in various formats for offline use, analysis, or archival purposes.
        All {{ (stats.totalPlaylists || 0).toLocaleString() }} playlists with {{ (stats.totalTracks || 0).toLocaleString() }} tracks included.
      </p>

      <div class="exports__grid">
        <div v-for="format in formats" :key="format.value" class="exports__card">
          <div class="flex items-baseline justify-between gap-3">
            <h3 class="exports__title">{{ format.label }}</h3>
            <span class="ca-label ca-label--sm">.{{ format.value }}</span>
          </div>
          <p class="exports__desc">{{ format.description }}</p>
          <button type="button" class="ca-btn ca-btn--secondary" @click="downloadAllPlaylists(playlists, format.value)">
            <Icon name="download" /> Download {{ format.value.toUpperCase() }}
          </button>
        </div>
      </div>

      <p class="exports__tip">
        <span class="ca-label ca-label--accent">Note</span>
        You can also download individual playlists by expanding any show in the
        <router-link to="/playlists">Shows</router-link> view
        and clicking the download button.
      </p>
    </section>
  </div>
</template>

<style scoped>
.exports__intro { margin-bottom: var(--space-8); }
.exports__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-8);
}
.exports__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: var(--rule-ink);
}
.exports__card .ca-btn { align-self: flex-start; margin-top: auto; }
.exports__title {
  font: 800 22px/1.1 var(--font-display);
  letter-spacing: -0.02em;
  color: var(--fg-1);
}
.exports__desc {
  flex: 1;
  font: 400 16px/1.5 var(--font-text);
  color: var(--fg-2);
}
.exports__tip {
  margin-top: var(--space-8);
  padding-top: var(--space-4);
  border-top: var(--rule-hair);
  max-width: var(--container-text);
  font: 400 15px/1.5 var(--font-text);
  color: var(--fg-2);
}
.exports__tip .ca-label { margin-right: var(--space-2); }

@media (max-width: 900px) {
  .exports__grid { grid-template-columns: minmax(0, 1fr); gap: var(--space-6); }
}
</style>
