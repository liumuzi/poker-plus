// 运行时环境变量配置
// 此文件在 Docker 容器启动时由 docker-entrypoint.sh 自动生成
// 本地开发时可以使用 .env 文件，Vite 会在构建时处理

window.__ENV__ = {
  // 这些值会在 Docker 启动时被替换为实际的环境变量
  // 如果看到这些占位符值，说明运行时注入未生效
  VITE_SUPABASE_URL: 'RUNTIME_INJECTION_REQUIRED',
  VITE_SUPABASE_ANON_KEY: 'RUNTIME_INJECTION_REQUIRED'
};
