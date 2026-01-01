<script setup lang="ts">
import { usePlaylists } from '../composables/usePlaylists'
import TracksView from '../components/TracksView.vue'

const { playlists } = usePlaylists()
</script>

<template>
  <TracksView :playlists="playlists" />
</template>
