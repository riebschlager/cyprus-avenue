import { ref, computed } from 'vue'
import type { SpotifyAuthState } from '../types/spotify'
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_AUTH_ENDPOINT,
  SPOTIFY_TOKEN_ENDPOINT,
  SPOTIFY_SCOPES
} from '../utils/spotifyConstants'

// Singleton state
const authState = ref<SpotifyAuthState>({
  isAuthenticated: false,
  isAuthenticating: false,
  accessToken: null,
  error: null
})

// Helper functions for PKCE
function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const base64String = btoa(String.fromCharCode(...new Uint8Array(digest)))
  return base64String
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function useSpotifyAuth() {
  const initiateLogin = async (returnPath?: string, modalState?: any) => {
    if (!SPOTIFY_CLIENT_ID) {
      authState.value.error = 'Spotify Client ID not configured'
      return
    }

    authState.value.isAuthenticating = true
    authState.value.error = null

    try {
      // Generate PKCE parameters
      const codeVerifier = generateRandomString(128)
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      const stateRandom = generateRandomString(16)

      // Store in sessionStorage for callback
      sessionStorage.setItem('spotify_code_verifier', codeVerifier)
      sessionStorage.setItem('spotify_state', stateRandom)

      // Store return path and modal state if provided
      if (returnPath) {
        sessionStorage.setItem('spotify_return_path', returnPath)
      }
      if (modalState) {
        sessionStorage.setItem('spotify_modal_state', JSON.stringify(modalState))
      }

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: SPOTIFY_REDIRECT_URI,
        scope: SPOTIFY_SCOPES.join(' '),
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state: stateRandom
      })

      // Redirect to Spotify authorization
      window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`
    } catch (error) {
      authState.value.error =
        error instanceof Error ? error.message : 'Failed to initiate login'
      authState.value.isAuthenticating = false
    }
  }

  const handleOAuthCallback = async (code: string, state: string) => {
    authState.value.isAuthenticating = true
    authState.value.error = null

    try {
      // Verify state parameter (CSRF protection)
      const storedState = sessionStorage.getItem('spotify_state')
      if (state !== storedState) {
        throw new Error('State parameter mismatch - possible CSRF attack')
      }

      const codeVerifier = sessionStorage.getItem('spotify_code_verifier')
      if (!codeVerifier) {
        throw new Error('Code verifier not found in session')
      }

      // Exchange code for access token using PKCE
      const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
          code_verifier: codeVerifier
        }).toString()
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.error_description || 'Failed to obtain access token'
        )
      }

      const data = await response.json()
      authState.value.accessToken = data.access_token
      authState.value.isAuthenticated = true

      // Clean up OAuth session storage (but keep return path and modal state for redirect)
      sessionStorage.removeItem('spotify_code_verifier')
      sessionStorage.removeItem('spotify_state')

      return data.access_token
    } catch (error) {
      authState.value.error =
        error instanceof Error ? error.message : 'Authentication failed'
      authState.value.isAuthenticated = false
      authState.value.accessToken = null
      throw error
    } finally {
      authState.value.isAuthenticating = false
    }
  }

  const logout = () => {
    authState.value.accessToken = null
    authState.value.isAuthenticated = false
    authState.value.error = null
    authState.value.isAuthenticating = false
    sessionStorage.removeItem('spotify_code_verifier')
    sessionStorage.removeItem('spotify_state')
    sessionStorage.removeItem('spotify_return_path')
    sessionStorage.removeItem('spotify_modal_state')
  }

  const getReturnPath = (): string | null => {
    return sessionStorage.getItem('spotify_return_path')
  }

  const getModalState = (): any | null => {
    const state = sessionStorage.getItem('spotify_modal_state')
    return state ? JSON.parse(state) : null
  }

  const clearReturnContext = () => {
    sessionStorage.removeItem('spotify_return_path')
    sessionStorage.removeItem('spotify_modal_state')
  }

  const getAccessToken = (): string | null => {
    return authState.value.accessToken
  }

  const isAuthenticated = computed(() => authState.value.isAuthenticated)
  const isAuthenticating = computed(() => authState.value.isAuthenticating)
  const error = computed(() => authState.value.error)

  return {
    isAuthenticated,
    isAuthenticating,
    error,
    initiateLogin,
    handleOAuthCallback,
    logout,
    getAccessToken,
    getReturnPath,
    getModalState,
    clearReturnContext
  }
}
