<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useToast } from '../../composables/useToast'
import Icon from '../../components/Icon.vue'

const router = useRouter()
const { handleOAuthCallback, restorePendingAction, clearReturnContext } = useSpotifyAuth()
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
      clearReturnContext()
      setTimeout(() => router.push('/'), 2000)
      return
    }

    if (!code || !state) {
      showError('Invalid authorization response from Spotify')
      clearReturnContext()
      setTimeout(() => router.push('/'), 2000)
      return
    }

    // Handle the OAuth callback
    await handleOAuthCallback(code, state)
    success('Connected to Spotify!')

    const returnPath = restorePendingAction()

    // Redirect to the page the user was on
    setTimeout(() => router.push(returnPath), 1500)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed'
    showError(message)
    clearReturnContext()
    setTimeout(() => router.push('/'), 2000)
  }
})
</script>

<template>
  <div class="callback">
    <Icon name="loader-circle" class="callback__spin" />
    <p class="ca-label">Connecting to Spotify&hellip;</p>
  </div>
</template>

<style scoped>
.callback { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-4); min-height: 50vh; }
.callback__spin { font-size: 32px; color: var(--fg-1); animation: spin 900ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
