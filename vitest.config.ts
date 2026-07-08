import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Unit/component tests (F1): jsdom, no tailwind plugin — styles are irrelevant
// to behavior and slow the run down.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    css: false,
    restoreMocks: true,
  },
})
