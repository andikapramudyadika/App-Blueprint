import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  optimizeDeps: { entries: ['index.html'] },
  build: { rollupOptions: { output: { manualChunks: { markdown: ['react-markdown', 'remark-gfm'], motion: ['motion/react'], export: ['jszip'], validation: ['zod'], storage: ['dexie'] } } } },
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
    manifest: {
      name: 'App Blueprint', short_name: 'Blueprint', lang: 'id',
      description: 'Ubah ide aplikasi menjadi spesifikasi yang siap dibangun.',
      theme_color: '#167867', background_color: '#f7f8fa', display: 'standalone',
      start_url: './', scope: './',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], maximumFileSizeToCacheInBytes: 3000000, navigateFallback: 'index.html' },
  })],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
