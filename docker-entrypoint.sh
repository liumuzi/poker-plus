#!/bin/sh
# Docker 容器启动脚本
# 在运行时将环境变量注入到 env-config.js 中

# 检查必需的环境变量
if [ -z "${VITE_SUPABASE_URL}" ]; then
  echo "⚠️  WARNING: VITE_SUPABASE_URL 环境变量未设置！社区功能和用户系统将无法使用。"
  echo "   请在 Docker 启动时设置: docker run -e VITE_SUPABASE_URL=https://xxx.supabase.co ..."
fi
if [ -z "${VITE_SUPABASE_ANON_KEY}" ]; then
  echo "⚠️  WARNING: VITE_SUPABASE_ANON_KEY 环境变量未设置！社区功能和用户系统将无法使用。"
  echo "   请在 Docker 启动时设置: docker run -e VITE_SUPABASE_ANON_KEY=your-anon-key ..."
fi

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

echo "✅ Generated env-config.js with runtime environment variables"
echo "   VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:+configured}"

# 启动 Nginx
exec nginx -g 'daemon off;'
