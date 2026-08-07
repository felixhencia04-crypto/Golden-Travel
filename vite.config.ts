import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        port: 24678,
        strictPort: false, // Membiarkan Vite otomatis mencari port 24679, dst. jika bentrok
        timeout: 5000 // Menambahkan toleransi timeout untuk HMR
      },
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
  };
});
