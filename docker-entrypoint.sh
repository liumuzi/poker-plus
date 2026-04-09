#!/bin/sh
# Docker 容器启动脚本
# 在运行时将环境变量注入到 env-config.js 中

# 生成 env-config.js 文件
cat > /usr/share/nginx/html/env-config.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: '${VITE_SUPABASE_URL}',
  VITE_SUPABASE_ANON_KEY: '${VITE_SUPABASE_ANON_KEY}'
};
EOF

echo "Generated env-config.js with runtime environment variables"

# 启动 Nginx
exec nginx -g 'daemon off;'
