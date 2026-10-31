<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaylists } from './composables/usePlaylists'
import { useOpenGraph } from './composables/useOpenGraph'
import { useMobileMenu } from './composables/useMobileMenu'
import { useSpotifyAuth } from './features/spotify/useSpotifyAuth'
import ToastContainer from './components/ToastContainer.vue'
import SpotifyActionHost from './features/spotify/SpotifyActionHost.vue'
import SpotifyWebPlayer from './features/spotify/SpotifyWebPlayer.vue'
import Icon from './components/Icon.vue'

const { fetchPlaylists } = usePlaylists()
useOpenGraph()
const { isMenuOpen, toggleMenu, closeMenu } = useMobileMenu()
const { isAuthenticated } = useSpotifyAuth()
const route = useRoute()
const navigation = [
  { to: '/', label: 'Home', exact: true },
  { to: '/playlists', label: 'Shows', match: ['/playlists', '/playlist/'] },
  { to: '/artists', label: 'Artists', match: ['/artists', '/artist/'] },
  { to: '/tracks', label: 'Tracks', match: ['/tracks'] }
]

const isCurrent = (item: typeof navigation[number]) =>
  item.exact ? route.path === item.to : (item.match ?? []).some(prefix => route.path.startsWith(prefix))

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Close menu when route changes
watch(() => route.path, () => {
  closeMenu()
})

onMounted(() => {
  fetchPlaylists()
})
</script>

<template>
  <div>
    <header class="ca-header">
      <div class="ca-header__inner">
        <router-link to="/" class="ca-wordmark">
          <span class="ca-wordmark__name">Cyprus Avenue</span>
          <span class="ca-wordmark__sub">KCUR 89.3 &middot; 1978&ndash;2018</span>
        </router-link>

        <nav class="ca-nav" aria-label="Primary">
          <router-link
            v-for="item in navigation"
            :key="item.to"
            :to="item.to"
            :aria-current="isCurrent(item) ? 'page' : undefined"
          >{{ item.label }}</router-link>
        </nav>

        <div class="ca-header__actions ca-header__burger" style="margin-left: auto;">
          <button
            type="button"
            class="ca-iconbtn"
            @click="toggleMenu"
            :aria-label="isMenuOpen ? 'Close menu' : 'Open menu'"
            :aria-expanded="isMenuOpen"
            aria-controls="mobile-navigation"
          >
            <Icon :name="isMenuOpen ? 'x' : 'menu'" />
          </button>
        </div>
      </div>

      <nav
        v-if="isMenuOpen"
        id="mobile-navigation"
        class="ca-mobilenav"
        aria-label="Mobile"
      >
        <router-link
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          :aria-current="isCurrent(item) ? 'page' : undefined"
        >{{ item.label }}</router-link>
      </nav>
    </header>

    <main class="ca-container ca-main" :class="{ 'ca-main--with-player': isAuthenticated }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <div v-if="isAuthenticated" class="ca-player" data-theme="dark">
      <SpotifyWebPlayer />
    </div>

    <footer class="ca-footer">
      <div class="ca-footer__inner">
        <div class="ca-footer__mark">Cyprus<br />Avenue</div>
        <div class="ca-footer__col">
          <span class="ca-label ca-label--sm">Archive</span>
          <router-link v-for="item in navigation.slice(1)" :key="item.to" :to="item.to">{{ item.label }}</router-link>
        </div>
        <div class="ca-footer__col">
          <span class="ca-label ca-label--sm">Elsewhere</span>
          <a href="https://www.kcur.org/tags/cyprus-avenue" target="_blank" rel="noopener">KCUR</a>
          <a href="https://github.com/riebschlager/cyprus-avenue/" target="_blank" rel="noopener">GitHub</a>
          <button type="button" class="ca-btn ca-btn--link" style="align-self: flex-start;" @click="scrollToTop">
            Back to top <Icon name="arrow-up" />
          </button>
        </div>
        <div class="ca-footer__fine">
          <span class="ca-label ca-label--sm">Playlists &copy; KCUR Kansas City Public Radio</span>
          <span class="ca-label ca-label--sm">
            Archive by&nbsp;<a href="https://the816.com" target="_blank" rel="noopener">Chris Riebschlager</a>
          </span>
        </div>
      </div>
    </footer>

    <SpotifyActionHost />

    <ToastContainer />
  </div>
</template>
