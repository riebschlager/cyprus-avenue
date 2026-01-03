import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import PlaylistsView from '../views/PlaylistsView.vue'
import TracksViewWrapper from '../views/TracksViewWrapper.vue'
import ArtistsViewWrapper from '../views/ArtistsViewWrapper.vue'
import TimelineView from '../views/TimelineView.vue'
import ScrollyTimelineView from '../views/ScrollyTimelineView.vue'
import SpotifyCallback from '../views/SpotifyCallback.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { title: 'Cyprus Avenue Archive' }
    },
    {
      path: '/playlists',
      name: 'playlists',
      component: PlaylistsView,
      meta: { title: 'Playlists - Cyprus Avenue Archive' }
    },
    {
      path: '/playlist/:slug',
      name: 'playlist',
      component: PlaylistsView,
      props: true,
      meta: { title: 'Playlist - Cyprus Avenue Archive' }
    },
    {
      path: '/tracks',
      name: 'tracks',
      component: TracksViewWrapper,
      meta: { title: 'All Tracks - Cyprus Avenue Archive' }
    },
    {
      path: '/artists',
      name: 'artists',
      component: ArtistsViewWrapper,
      meta: { title: 'Artists - Cyprus Avenue Archive' }
    },
    {
      path: '/artist/:slug',
      name: 'artist',
      component: ArtistsViewWrapper,
      props: true,
      meta: { title: 'Artist - Cyprus Avenue Archive' }
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: TimelineView,
      meta: { title: 'Timeline - Cyprus Avenue Archive' }
    },
    {
      path: '/story',
      name: 'story',
      component: ScrollyTimelineView,
      meta: { title: 'The Story - Cyprus Avenue Archive' }
    },
    {
      path: '/auth/callback',
      name: 'spotify-callback',
      component: SpotifyCallback,
      meta: { title: 'Connecting to Spotify - Cyprus Avenue Archive' }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // If navigating within the same component (e.g., expanding/collapsing), don't scroll
    if (to.matched[0]?.components?.default === from.matched[0]?.components?.default) {
      return false // Maintain current scroll position
    }

    // If there's a saved position (browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }

    // Otherwise scroll to top for new pages
    return { top: 0 }
  }
})

// Update page title on route change
router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'Cyprus Avenue Archive'
})

export default router
