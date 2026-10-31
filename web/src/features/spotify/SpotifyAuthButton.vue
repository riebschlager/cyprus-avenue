<script setup lang="ts">
import type { PendingSpotifyAction } from './pendingAction'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useToast } from '../../composables/useToast'
import Icon from '../../components/Icon.vue'

const props = defineProps<{
  modalState?: PendingSpotifyAction
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

const buttonText = computed(() => isAuthenticated.value ? 'Connected to Spotify' : 'Connect Spotify')
</script>

<template>
  <button
    type="button"
    @click="handleLogin"
    :disabled="isAuthenticating"
    :class="['ca-btn', isAuthenticated ? 'ca-btn--secondary' : 'ca-btn--accent']"
    :aria-label="buttonText"
  >
    <template v-if="isAuthenticating">
      <Icon name="loader-circle" class="spin" />
      Connecting&hellip;
    </template>
    <template v-else>
      <Icon v-if="isAuthenticated" name="check" />
      {{ buttonText }}
    </template>
  </button>
</template>

<style scoped>
.spin { animation: spin 900ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
