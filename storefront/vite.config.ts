import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE is set to '/chikwafu/' for GitHub Pages, '/' for local dev/preview
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    cssMinify: true,
  },
})
