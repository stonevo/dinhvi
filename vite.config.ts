/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Định Vị',
        short_name: 'Định Vị',
        description: 'Nhật ký tự định vị định kỳ theo 64 quẻ, 384 hào.',
        lang: 'vi',
        display: 'standalone',
        start_url: './',
        scope: './',
        background_color: '#faf9f5',
        theme_color: '#faf9f5',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      injectManifest: {
        // Dữ liệu quẻ nằm trong public/data — precache để dùng offline.
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
