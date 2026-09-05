/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the site from /Peek/
export default defineConfig({
  base: '/Peek/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/logo.svg', 'brand/logo-mono.svg', 'brand/wordmark.svg', 'favicon.svg'],
      manifest: {
        id: '/Peek/',
        name: 'Peek — a tiny guessing duel',
        short_name: 'Peek',
        description:
          'Two friends pick secret numbers, then race to find each other\u2019s first. Play face to face on one device or online with a room code.',
        theme_color: '#F7F6F2',
        background_color: '#F7F6F2',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'brand/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'brand/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'brand/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallbackDenylist: [/^\/Peek\/brand\//],
      },
    }),
  ],
  build: {
    target: 'es2020',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
