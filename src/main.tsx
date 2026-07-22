import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouterVite } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    tanstackRouterVite(),
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})