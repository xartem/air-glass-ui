import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Admin SPA is built by the publisher and shipped as static assets (A2 T8, E2 §3).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Overridable for standalone hosting (demo build: VITE_BASE=/).
  base: process.env.VITE_BASE ?? '/admin-assets/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
