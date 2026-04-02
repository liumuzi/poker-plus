import React from 'react'
import ReactDOM from 'react-dom/client'
// 首屏关键字体：仅加载 Inter 400/700 + Bebas Neue（首页渲染必需）
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/bebas-neue/latin-400.css'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// 延迟加载非关键字体权重 — 首屏渲染后异步加载，减少初始传输体积
setTimeout(() => {
  import('@fontsource/inter/latin-600.css')
  import('@fontsource/inter/latin-900.css')
}, 100)