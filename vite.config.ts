import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /ATS-checker/, so assets need that base.
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/ATS-checker/' : '/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
