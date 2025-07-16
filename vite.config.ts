import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    __dirname: 'undefined'
  },
  server: {
    host: true,
    port: 5173
  },
  optimizeDeps: {
    exclude: ['@capacitor/core'],
    include: ['country-state-city']
  }
})
