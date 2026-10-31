import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets load cleanly on GitHub Pages subpaths and custom domains
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
