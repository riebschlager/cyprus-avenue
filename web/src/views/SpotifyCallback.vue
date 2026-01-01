<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { handleOAuthCallback } = useSpotifyAuth()
const { success, error: showError } = useToast()

onMounted(async () => {
  try {
    // Get authorization code and state from URL
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    if (error) {
      showError(`Spotify authorization failed: ${error}`)
      setTimeout(() => router.push('/'), 2000)
      return
    }

    if (!code || !state) {
      showError('Invalid authorization response from Spotify')
      setTimeout(() => router.push('/'), 2000)
      return
    }

    // Handle the OAuth callback
    await handleOAuthCallback(code, state)
    success('Connected to Spotify!')

    // Redirect to home after short delay
    setTimeout(() => router.push('/'), 1500)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed'
    showError(message)
    setTimeout(() => router.push('/'), 2000)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center">
    <div class="text-center">
      <svg class="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <p class="text-gray-300">Connecting to Spotify...</p>
    </div>
  </div>
</template>
