import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    // GitHub Pages serves the site from /cyprus-avenue/. Override with BASE_PATH
    // (e.g. BASE_PATH=/ for a custom domain). Dev server always uses /.
    base: command === 'build' ? (process.env.BASE_PATH ?? '/cyprus-avenue/') : '/',
    define: {
      'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(env.VITE_SPOTIFY_CLIENT_ID || env.SPOTIFY_CLIENT_ID || '')
    }
  }
})
