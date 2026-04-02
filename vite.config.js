import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 自定义 Vite 插件：为关键字体添加 preload 提示
// 让浏览器在解析 CSS 之前就开始下载字体，减少一次网络往返
function fontPreloadPlugin() {
  return {
    name: 'font-preload',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const criticalPatterns = ['inter-latin-400', 'inter-latin-700', 'bebas-neue'];
        const tags = [];
        for (const fileName of Object.keys(ctx.bundle)) {
          if (fileName.endsWith('.woff2') && criticalPatterns.some(p => fileName.includes(p))) {
            tags.push({
              tag: 'link',
              attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: '/' + fileName, crossorigin: '' },
              injectTo: 'head-prepend',
            });
          }
        }
        return tags;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), fontPreloadPlugin()],
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
