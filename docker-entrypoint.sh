#!/bin/sh
# Docker 容器启动脚本
# 在运行时将环境变量注入到 env-config.js 中

# 使用 JSON 编码来安全地处理特殊字符
ESCAPED_URL=$(printf '%s' "${VITE_SUPABASE_URL}" | sed 's/\\/\\\\/g; s/"/\\"/g; s/'"'"'/\\'"'"'/g')
ESCAPED_KEY=$(printf '%s' "${VITE_SUPABASE_ANON_KEY}" | sed 's/\\/\\\\/g; s/"/\\"/g; s/'"'"'/\\'"'"'/g')

# 生成 env-config.js 文件
cat > /usr/share/nginx/html/env-config.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: '${ESCAPED_URL}',
  VITE_SUPABASE_ANON_KEY: '${ESCAPED_KEY}'
};
EOF

echo "Generated env-config.js with runtime environment variables"

# 启动 Nginx
exec nginx -g 'daemon off;'
