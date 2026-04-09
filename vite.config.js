import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev: proxy /.netlify/functions/horizons → JPL Horizons API directly
      // This mirrors what the Netlify Function does in production
      '/.netlify/functions/horizons': {
        target: 'https://ssd.jpl.nasa.gov',
        changeOrigin: true,
        // Just rewrite the path — Vite preserves the query string automatically
        rewrite: () => '/api/horizons.api',
      },
    },
  },
})
