import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@hillpointe/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/version': 'http://localhost:3000',
      '/status': 'http://localhost:3000',
      '/prospects': 'http://localhost:3000',
      '/units': 'http://localhost:3000',
      '/tasks': 'http://localhost:3000',
      '/activity': 'http://localhost:3000',
      '/tours': 'http://localhost:3000',
    },
  },
})
