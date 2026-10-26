import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const rel = process.env.RELATIVE_BASE === '1'

export default defineConfig({
  base: rel ? './' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.ts',
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
      manifest: {
        name: 'Golee: beba água com amigos',
        short_name: 'Golee',
        description: 'Cada copo é um gole. Quem toma o Maior Gole do Dia?',
        lang: 'pt-BR',
        start_url: rel ? './' : '/',
        scope: rel ? './' : '/',
        display: 'standalone',
        background_color: '#f3f9fc',
        theme_color: '#2f9be8',
        icons: [
          { src: rel ? 'icon-192.png' : '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: rel ? 'icon-512.png' : '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: rel ? 'icon-512.png' : '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
