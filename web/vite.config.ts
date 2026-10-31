import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    // The custom domain serves the site at /. Override BASE_PATH for subpath deployments.
    base: command === 'build' ? (process.env.BASE_PATH ?? '/') : '/',
    define: {
      'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(env.VITE_SPOTIFY_CLIENT_ID || env.SPOTIFY_CLIENT_ID || '')
    }
  }
})
