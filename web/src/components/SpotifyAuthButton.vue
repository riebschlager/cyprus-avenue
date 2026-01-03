<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'
import { useToast } from '../composables/useToast'

const props = defineProps<{
  modalState?: any
}>()

const router = useRouter()
const { isAuthenticated, isAuthenticating, error, initiateLogin } = useSpotifyAuth()
const { error: showError } = useToast()

const handleLogin = async () => {
  try {
    // Pass current route path and modal state to preserve context
    const returnPath = router.currentRoute.value.fullPath
    await initiateLogin(returnPath, props.modalState)
  } catch (err) {
    showError(error.value || 'Failed to connect to Spotify')
  }
}

const buttonText = isAuthenticated.value ? 'Connected to Spotify ✓' : 'Connect to Spotify'
</script>

<template>
  <button
    @click="handleLogin"
    :disabled="isAuthenticating"
    :class="[
      'px-3 py-2 rounded-md text-sm font-medium transition-all duration-300',
      isAuthenticated
        ? 'bg-green-500/20 text-green-300 border border-green-500/50 hover:bg-green-500/30'
        : 'bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30',
      isAuthenticating && 'opacity-50 cursor-not-allowed'
    ]"
    :aria-label="buttonText"
  >
    <span v-if="isAuthenticating" class="flex items-center gap-2">
      <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Connecting...
    </span>
    <span v-else>{{ buttonText }}</span>
  </button>
</template>
