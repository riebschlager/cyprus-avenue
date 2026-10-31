<script setup lang="ts">
import { onMounted } from 'vue'
import { usePlaylists } from '../composables/usePlaylists'
const { playlists, loading, error, fetchPlaylists } = usePlaylists()
onMounted(fetchPlaylists)
</script>

<template>
  <div>
    <div v-if="loading && playlists.length === 0" role="status" aria-label="Loading archive" class="archive-loading">
      <span class="ca-eq ca-eq--playing" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
      <span class="ca-label">Loading archive</span>
    </div>
    <div v-else-if="error" role="alert" class="archive-error">
      <p>{{ error }}</p>
    </div>
    <slot v-else />
  </div>
</template>

<style scoped>
.archive-loading { display: flex; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-16) 0; }
.archive-error { padding: var(--space-4) var(--space-5); border-left: 4px solid var(--status-error); background: var(--status-error-bg); color: var(--status-error); font: var(--type-ui); }
</style>
