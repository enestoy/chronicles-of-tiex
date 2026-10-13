import { defineConfig } from 'vite';
export default defineConfig({
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
