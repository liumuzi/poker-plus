/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'], // 数字/金额/大标题
        body: ['Inter', 'sans-serif'],           // 正文
      },
      colors: {
        // 牌桌深色系 Design Tokens
        felt: {
          900: '#141517', // 最深背景（标签底色）
          800: '#191b1e', // 列表头/区块标题
          700: '#1e2024', // 主背景
          600: '#222428', // 公共牌区背景
          500: '#2b2d31', // 卡片/面板背景
          400: '#303338', // 主分割线
          300: '#3a3d42', // 次级边框
          200: '#4a4d52', // 悬停状态
          muted: '#8e949c', // 弱化文字
        },
        // 筹码/操作颜色 Design Tokens
        chip: {
          gold: '#f5c64b',      // Hero 动作 / 高亮金色
          'gold-dark': '#dbb142', // Hero 气泡边框
        },
      },
    },
  },
  plugins: [],
}
