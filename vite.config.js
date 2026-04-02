import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Chart library — only used by EquityScreen and ProfitChart
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
              return 'vendor-charts';
            }
            // Animation library
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // Core React runtime
            if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
