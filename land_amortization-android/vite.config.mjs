import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // relative paths for Cordova webview
  build: {
    outDir: 'www',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
  },
});
