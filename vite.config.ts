import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* A Pages projekt-oldal alkonyvtarban fut (/voltlab1008/), helyben a gyokerben.
   A BASE_PATH-ot a GitHub Actions allitja be; enelkul is mukodik. */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? process.env.BASE_PATH || '/voltlab1008/' : '/',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
}));
