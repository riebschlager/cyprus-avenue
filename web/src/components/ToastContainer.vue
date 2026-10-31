<script setup lang="ts">
import { useToast } from '../composables/useToast'
import { useSpotifyAuth } from '../features/spotify/useSpotifyAuth'
import Toast from './Toast.vue'

const { toasts, removeToast } = useToast()
// The fixed player occupies the bottom edge when connected to Spotify.
const { isAuthenticated } = useSpotifyAuth()
</script>

<template>
  <div class="toasts" :class="{ 'toasts--above-player': isAuthenticated }" aria-live="polite">
    <TransitionGroup name="toast" tag="div" class="toasts__stack">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast"
        @close="removeToast(toast.id)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts { position: fixed; right: var(--gutter); bottom: var(--space-6); z-index: var(--z-toast); pointer-events: none; }
.toasts--above-player { bottom: calc(var(--player-h) + var(--space-4)); }
.toasts__stack { display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); pointer-events: auto; }

.toast-enter-active,
.toast-leave-active { transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
.toast-enter-from { opacity: 0; transform: translateY(8px); }
.toast-leave-to { opacity: 0; transform: translateX(8px); }

@media (max-width: 760px) {
  .toasts { left: var(--gutter-mobile); right: var(--gutter-mobile); }
  .toasts__stack { align-items: stretch; }
  .toasts__stack :deep(.ca-toast) { min-width: 0; max-width: none; }
}
</style>
