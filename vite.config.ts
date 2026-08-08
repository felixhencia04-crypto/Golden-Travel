import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: {
        ignored: [
          '**/uploads/**',
          '**/public/uploads/**',
          '**/storage/**',
          '**/logs/**',
          '**/*.sqlite',
          '**/*.db',
          '**/*.log',
          '**/*.png',
          '**/*.jpg',
          '**/*.jpeg',
          '**/*.pdf',
          '**/*.cjs',
          '**/tmp/**',
        ],
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdfjs-dist')) {
                return 'vendor-pdf';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('xlsx') || id.includes('jszip')) {
                return 'vendor-data';
              }
            }
          },
        },
      },
    },
  };
});
