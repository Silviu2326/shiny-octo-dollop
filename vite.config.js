import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// App version for cache busting - increment this to force cache refresh
const APP_VERSION = '2.0.0'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  build: {
    // Ensure unique hashes on every build for cache busting
    rollupOptions: {
      output: {
        // Add hash to JS files
        entryFileNames: `assets/[name]-[hash]-v${APP_VERSION}.js`,
        chunkFileNames: `assets/[name]-[hash]-v${APP_VERSION}.js`,
        assetFileNames: `assets/[name]-[hash]-v${APP_VERSION}.[ext]`,
      },
    },
  },
})
