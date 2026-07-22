import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// 1. Altere a importação para o novo nome padrão
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    // 2. Substitua a chamada antiga pelo novo nome
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
})
