import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Admin SPA is built by the publisher and shipped as static assets (A2 T8, E2 §3).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/admin-assets/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
