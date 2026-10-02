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
    // In dev the API runs on :5000 (npm run server). Proxying it into the
    // Vite origin means the browser only ever talks to one host — no CORS,
    // and the same-origin auto-detection in src/lib/api.ts just works.
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:5000', changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    cssMinify: true,
  },
})
