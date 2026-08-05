import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pwaOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'favicon-16.png', 'favicon-32.png', 'favicon-180.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
  manifest: {
    name: 'Férias Celorico',
    short_name: 'Férias',
    description: 'Lista de compras e refeições para as férias',
    theme_color: '#04070d',
    background_color: '#04070d',
    display: 'standalone',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'portrait',
    start_url: '/?source=pwa',
    scope: '/',
    lang: 'pt-PT',
    categories: ['utilities', 'productivity'],
    icons: [
      // Core PWA icons (PNG)
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      // iOS App Store / Add to Home Screen
      { src: 'apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      // Android Play Store
      { src: 'play-store-icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-styles',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-fonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        }
      },
      {
        urlPattern: /^https:\/\/api\.groq\.com/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'groq-api',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 6 },
        }
      },
      {
        urlPattern: /^https:\/\/[^.]+\.supabase\.co/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 60 },
        }
      },
    ],
    cleanupOutdatedCaches: true,
  },
  devOptions: {
    enabled: true,
  },
  injectRegister: 'auto',
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA(pwaOptions),
  ],
  build: {
    // O bundle passava dos 1000 kB num único chunk. Separamos os vendors pesados
    // (jspdf/html2canvas só são precisos ao exportar PDF) para o carregamento
    // inicial ficar leve.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) return 'pdf'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
