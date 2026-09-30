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

        // Let vite-plugin-pwa inject the registration.
        injectRegister: 'auto',

        // Generate the service worker automatically.
        strategies: 'generateSW',

        manifestFilename: 'manifest.webmanifest',

        includeAssets: [
          'apple-touch-icon.png',
          'icon.svg',
          'icons/icon-192.png',
          'icons/icon-512.png',
        ],

        manifest: {
          id: '/',
          name: 'QBench – Unlimited Resources',
          short_name: 'QBench Resources',

          description:
            'QBench Unlimited Resources – useful study materials, digital tools, learning resources and productivity content in one place.',

          start_url: '/',
          scope: '/',

          display: 'standalone',
          orientation: 'portrait',

          theme_color: '#4CAF50',
          background_color: '#FFFFFF',

          lang: 'en-IN',
          dir: 'ltr',

          categories: [
            'education',
            'productivity',
            'utilities',
          ],

          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },

            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },

        workbox: {
          // Cache the application shell and static assets.
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2,ttf}',
          ],

          // Do not treat API routes as SPA navigation.
          navigateFallbackDenylist: [
            /^\/api\//,
          ],

          // Keep old caches under control.
          cleanupOutdatedCaches: true,

          // Activate updated service workers immediately.
          skipWaiting: true,

          // Take control of open pages immediately.
          clientsClaim: true,

          // Do not cache external/API responses by default.
          runtimeCaching: [
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
        env.VITE_SUPABASE_URL ||
          env.SUPABASE_URL ||
          'https://zsbpxqzmkhcvxdvjoabp.supabase.co'
      ),

      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          env.SUPABASE_PUBLISHABLE_KEY ||
          env.VITE_SUPABASE_ANON_KEY ||
          env.SUPABASE_ANON_KEY ||
          ''
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
