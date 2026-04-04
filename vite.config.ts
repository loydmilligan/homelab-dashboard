import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const buildNumber = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '') + '-' +
  require('child_process').execSync('git rev-parse --short HEAD').toString().trim();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
  },
  server: {
    port: 3088,
    host: true,
    allowedHosts: ['shost.mattmariani.com'],
    proxy: {
      '/api': 'http://localhost:3090',
    },
  },
  build: {
    outDir: 'dist',
  },
})
