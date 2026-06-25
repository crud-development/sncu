import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SPA servit de NestJS din frontend/dist. În dev, proxy /api → backend :3000.
export default defineConfig({
  plugins: [react()],
  base: '/app/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
