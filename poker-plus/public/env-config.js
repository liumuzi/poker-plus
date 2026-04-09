// 运行时环境变量配置
// 此文件在 Docker 容器启动时由 docker-entrypoint.sh 自动生成
// 本地开发时可以使用 .env 文件，Vite 会在构建时处理

window.__ENV__ = {
  // 这些值会在 Docker 启动时被替换为实际的环境变量
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: ''
};
