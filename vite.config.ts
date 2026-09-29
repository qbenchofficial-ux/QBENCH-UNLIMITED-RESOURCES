import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
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
