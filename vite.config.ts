import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  resolve: { alias: { $lib: fileURLToPath(new URL('./src/lib', import.meta.url)) } },
  server: {
    port: 1420,
    strictPort: true,
    host: host || '127.0.0.1',
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**', '**/crates/**', '**/target/**'] },
  },
  build: {
    // chrome111: the web view of Android the page needs, which the app looks for
    // before it starts the page (LEAST_WEB_VIEW in StartActivity.kt): the two
    // are changed together.
    // safari15 is below what the page needs of a web view (Safari 16.4,
    // shell/web-view.ts), so that an older one still reads the page that
    // says so.
    target: ['es2022', 'safari15', 'chrome111'],
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // The words of a language in one chunk, fetched when the language is
        // first spoken (src/lib/i18n). English, and the words of documents in
        // every language, are part of the program itself.
        manualChunks(id) {
          const m = /\/locales\/([^/]+)\/([^/]+)\.ftl/.exec(id);
          if (m && m[1] !== 'en' && m[2] !== 'document') return `words-${m[1]}`;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test-setup.ts'],
  },
});
