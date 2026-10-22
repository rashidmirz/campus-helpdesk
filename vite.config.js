import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`        -> normal multi-file build in /dist
// `npm run build:single` -> one self-contained HTML file (easy to share / host anywhere)
export default defineConfig({
  base: './',
  plugins: [react(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  server: { port: 5173, host: true },
});
