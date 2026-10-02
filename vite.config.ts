import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const srcMain = path.resolve(__dirname, 'src/main.tsx');
  const rootMain = path.resolve(__dirname, 'main.tsx');

  return {
    plugins: [
      {
        name: 'resolve-entry-fallback',

        resolveId(id) {
          if (
            id === '/src/main.tsx' ||
            id === './src/main.tsx' ||
            id === 'src/main.tsx'
          ) {
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

        // Let vite-plugin-pwa inject the service worker registration script (/registerSW.js).
        injectRegister: 'auto',

        // Generate the production service worker (/sw.js) automatically.
        strategies: 'generateSW',

        // Reuse public/manifest.json directly (linked in index.html) to prevent duplicate manifest files.
        manifest: false,

        includeAssets: [
          'manifest.json',
          'apple-touch-icon.png',
          'favicon.png',
          'icon.svg',
          'icons/icon-192.png',
          'icons/icon-512.png',
        ],

        workbox: {
          // Precache the application shell and static assets.
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2,ttf,json}',
          ],

          // Ensure SPA navigation fallback serves index.html for client routes
          // while excluding API routes and static PWA files.
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/manifest\.json$/,
            /^\/sw\.js$/,
            /^\/registerSW\.js$/,
            /^\/workbox-.*\.js$/,
            /^\/icons\//,
          ],

          // Keep old caches under control.
          cleanupOutdatedCaches: true,

          // Activate updated service workers immediately.
          skipWaiting: true,

          // Take control of open pages immediately.
          clientsClaim: true,

          // Runtime caching rules for production HTTPS deployment.
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
            {
              urlPattern: ({ url }) => {
                return (
                  url.pathname.startsWith('/api/') ||
                  url.pathname.startsWith('/node_modules/') ||
                  url.pathname.startsWith('/@') ||
                  url.hostname !== self.location.hostname
                );
              },
              handler: 'NetworkOnly',
            },
          ],
        },

        devOptions: {
          enabled: false,
        },
      }),
    ],

    define: {
      'process.env.EMAILJS_PUBLIC_KEY': JSON.stringify(
        env.EMAILJS_PUBLIC_KEY ||
          env.VITE_EMAILJS_PUBLIC_KEY ||
          ''
      ),

      'process.env.EMAILJS_SERVICE_ID': JSON.stringify(
        env.EMAILJS_SERVICE_ID ||
          env.VITE_EMAILJS_SERVICE_ID ||
          ''
      ),

      'process.env.EMAILJS_ADMIN_TEMPLATE_ID': JSON.stringify(
        env.EMAILJS_ADMIN_TEMPLATE_ID ||
          env.VITE_EMAILJS_ADMIN_TEMPLATE_ID ||
          env.VITE_EMAILJS_TEMPLATE_ID ||
          ''
      ),

      'process.env.EMAILJS_AUTO_REPLY_TEMPLATE_ID': JSON.stringify(
        env.EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
          env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID ||
          ''
      ),

      'process.env.GOOGLE_SHEETS_WEBHOOK_URL': JSON.stringify(
        env.GOOGLE_SHEETS_WEBHOOK_URL ||
          env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
          ''
      ),

      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        [
          process.env.VITE_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_URL,
          env.VITE_SUPABASE_URL,
          env.NEXT_PUBLIC_SUPABASE_URL,
          env.SUPABASE_URL,
        ]
          .map((v) => (v || '').trim().replace(/^["']|["']$/g, '').trim())
          .find(
            (v) =>
              v.startsWith('http') &&
              !v.includes('YOUR_SUPABASE_') &&
              !v.includes('your-project-id') &&
              !v.includes('placeholder-project')
          ) || 'https://zsbpxqzmkhcvxdvjoabp.supabase.co'
      ),

      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        [
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          process.env.VITE_SUPABASE_ANON_KEY,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          process.env.SUPABASE_PUBLISHABLE_KEY,
          process.env.SUPABASE_ANON_KEY,
          env.VITE_SUPABASE_PUBLISHABLE_KEY,
          env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          env.VITE_SUPABASE_ANON_KEY,
          env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          env.SUPABASE_PUBLISHABLE_KEY,
          env.SUPABASE_ANON_KEY,
        ]
          .map((v) => (v || '').trim().replace(/^["']|["']$/g, '').trim())
          .find(
            (v) =>
              Boolean(v) &&
              !v.startsWith('sb_secret_') &&
              !v.includes('service_role') &&
              !v.includes('YOUR_SUPABASE_') &&
              !v.includes('your-supabase') &&
              !v.includes('placeholder-') &&
              v !== 'undefined' &&
              v !== 'null'
          ) || 'sb_publishable_BC9COvwoI_v9BX5XJocfLg_NCniLoiR'
      ),

      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        [
          process.env.VITE_SUPABASE_ANON_KEY,
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          process.env.SUPABASE_ANON_KEY,
          process.env.SUPABASE_PUBLISHABLE_KEY,
          env.VITE_SUPABASE_ANON_KEY,
          env.VITE_SUPABASE_PUBLISHABLE_KEY,
          env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
          env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
          env.SUPABASE_ANON_KEY,
          env.SUPABASE_PUBLISHABLE_KEY,
        ]
          .map((v) => (v || '').trim().replace(/^["']|["']$/g, '').trim())
          .find(
            (v) =>
              Boolean(v) &&
              !v.startsWith('sb_secret_') &&
              !v.includes('service_role') &&
              !v.includes('YOUR_SUPABASE_') &&
              !v.includes('your-supabase') &&
              !v.includes('placeholder-') &&
              v !== 'undefined' &&
              v !== 'null'
          ) || 'sb_publishable_BC9COvwoI_v9BX5XJocfLg_NCniLoiR'
      ),
    },

    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@supabase/supabase-js',
      ],
    },

    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',

      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {},
    },
  };
});
