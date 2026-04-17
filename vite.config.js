import { defineConfig } from 'vite';
import { resolve } from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        portal: resolve(__dirname, 'portal.html'),
        register: resolve(__dirname, 'register-shop.html'),
      },
    },
  },
  server: {
    port: 9000,
    strictPort: true,
  },
});