import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/gym-habit-tracker/',
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'VVQ · Vũ Vinh Quang · Gym Habit Tracker',
        short_name: 'VQ Tracker',
        description: 'Vũ Vinh Quang personal gym and habit tracker',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        
        start_url: '/gym-habit-tracker/',
        scope: '/gym-habit-tracker/',
        icons: [
          {
            src: '/vq-logo.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/vq-logo.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
})