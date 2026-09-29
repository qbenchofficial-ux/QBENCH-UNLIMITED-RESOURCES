import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

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
