import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const srcMain = path.resolve(__dirname, 'src/main.tsx');
  const rootMain = path.resolve(__dirname, 'main.tsx');

  return {
    plugins: [
      {
        name: 'resolve-entry-fallback',
        resolveId(id) {
          if (id === '/src/main.tsx' || id === './src/main.tsx' || id === 'src/main.tsx') {
            if (fs.existsSync(srcMain)) return srcMain;
            if (fs.existsSync(rootMain)) return rootMain;
          }
          return null;
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'manifest.json',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'SSC Prep 2026–27',
          short_name: 'SSC Prep',
          description:
            'Complete SSC 2026–27 study platform with notes, topic-wise MCQs, timed mock tests, scoring analytics, and offline access.',
          theme_color: '#00685b',
          background_color: '#faf9f9',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-192x192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    define: {
      'process.env.EMAILJS_PUBLIC_KEY': JSON.stringify(
        env.EMAILJS_PUBLIC_KEY || env.VITE_EMAILJS_PUBLIC_KEY || ''
      ),
      'process.env.EMAILJS_SERVICE_ID': JSON.stringify(
        env.EMAILJS_SERVICE_ID || env.VITE_EMAILJS_SERVICE_ID || ''
      ),
      'process.env.EMAILJS_ADMIN_TEMPLATE_ID': JSON.stringify(
        env.EMAILJS_ADMIN_TEMPLATE_ID || env.VITE_EMAILJS_ADMIN_TEMPLATE_ID || env.VITE_EMAILJS_TEMPLATE_ID || ''
      ),
      'process.env.EMAILJS_AUTO_REPLY_TEMPLATE_ID': JSON.stringify(
        env.EMAILJS_AUTO_REPLY_TEMPLATE_ID || env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID || ''
      ),
      'process.env.GOOGLE_SHEETS_WEBHOOK_URL': JSON.stringify(
        env.GOOGLE_SHEETS_WEBHOOK_URL || env.VITE_GOOGLE_SHEETS_WEBHOOK_URL || ''
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
