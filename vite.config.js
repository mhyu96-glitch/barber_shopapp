import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        portal: resolve(__dirname, 'portal.html'),
        register: resolve(__dirname, 'register-shop.html'),
        'queue-display': resolve(__dirname, 'queue-display.html'),
      },
    },
  },
  server: {
    port: 9000,
    strictPort: true,
  },
});
