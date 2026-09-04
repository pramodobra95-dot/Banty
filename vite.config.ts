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
    build: {
      target: 'esnext',
      minify: 'esbuild' as const,
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      // Express owns the HTTP server, so Vite cannot provide a compatible HMR WebSocket.
      // Keep the dev middleware client-free to prevent the preview from connecting to a
      // WebSocket endpoint that does not exist.
      hmr: false,
      watch: null,
    },
  };
});
