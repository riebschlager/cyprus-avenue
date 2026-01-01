import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import PlaylistsView from '../views/PlaylistsView.vue'
import TracksViewWrapper from '../views/TracksViewWrapper.vue'
import ArtistsViewWrapper from '../views/ArtistsViewWrapper.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/playlists',
      name: 'playlists',
      component: PlaylistsView
    },
    {
      path: '/playlist/:slug',
      name: 'playlist',
      component: PlaylistsView,
      props: true
    },
    {
      path: '/tracks',
      name: 'tracks',
      component: TracksViewWrapper
    },
    {
      path: '/artists',
      name: 'artists',
      component: ArtistsViewWrapper
    },
    {
      path: '/artist/:slug',
      name: 'artist',
      component: ArtistsViewWrapper,
      props: true
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

export default router
