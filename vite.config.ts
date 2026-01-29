import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/WayVstore/', // Set this to your repo name
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // ...existing code...
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
