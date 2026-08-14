import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pwaOptions = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'favicon-16.png', 'favicon-32.png', 'favicon-180.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
  manifest: {
    short_name: 'GroupGrub',
    name: 'GroupGrub',
    description: 'Lista de compras e plano de refeições partilhado para grupos em férias.',
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
    enabled: false, // PWA off em dev — evita SW cache interferir com HMR
  },
  // Registo manual via virtual:pwa-register/react (ver src/hooks/usePWAUpdate.js) —
  // precisamos do callback onNeedRefresh para mostrar um banner em vez de a app
  // ficar presa numa versão antiga em cache sem o utilizador saber.
  injectRegister: null,
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA(pwaOptions),
  ],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  server: {
    warmup: {
      clientFiles: ['./src/main.jsx', './src/App.jsx'],
    },
  },
  build: {
    // PWA instalável — apenas browsers modernos com Service Worker support.
    // 'esnext' skips legacy syntax transforms (optional chaining, nullish coalescing,
    // async/await, etc.) saving ~5–8% of JS output and improving parse time.
    target: 'esnext',
    // O bundle passava dos 1000 kB num único chunk. Separamos os vendors pesados
    // (jspdf/html2canvas só são precisos ao exportar PDF) para o carregamento
    // inicial ficar leve.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) return 'pdf'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('framer-motion') || id.includes('/motion/')) return 'motion'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
