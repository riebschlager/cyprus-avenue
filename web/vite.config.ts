import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  // GitHub Pages serves the site from /cyprus-avenue/. Override with BASE_PATH
  // (e.g. BASE_PATH=/ for a custom domain). Dev server always uses /.
  base: command === 'build' ? (process.env.BASE_PATH ?? '/cyprus-avenue/') : '/',
  define: {
    'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(process.env.SPOTIFY_CLIENT_ID)
  }
}))
