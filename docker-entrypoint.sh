#!/bin/sh
# Docker 容器启动脚本
# 在运行时将环境变量注入到 env-config.js 中，并配置 Supabase 反向代理

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

# ── 生成 Supabase 反向代理配置 ──────────────────────────────────
# 通过 nginx 代理 Supabase API 请求，避免中国用户直连 Supabase 被 GFW 封锁/限速
# 浏览器 → 用户服务器(nginx) → Supabase，而不是浏览器直连 Supabase
USE_PROXY='false'
if [ -n "${VITE_SUPABASE_URL}" ]; then
  # 提取 Supabase 主机名（去掉协议和路径）
  SUPABASE_HOST=$(echo "${VITE_SUPABASE_URL}" | sed -E 's|https?://([^/]+).*|\1|')

  # 从 /etc/resolv.conf 自动检测 DNS（Docker 内部通常是 127.0.0.11）
  # 回退到公共 DNS（8.8.8.8 1.1.1.1）
  if [ -f /etc/resolv.conf ]; then
    AUTO_RESOLVERS=$(grep '^nameserver' /etc/resolv.conf | head -3 | awk '{print $2}' | tr '\n' ' ' | sed 's/ *$//')
  fi
  RESOLVERS="${AUTO_RESOLVERS:-8.8.8.8 1.1.1.1}"

  cat > /etc/nginx/supabase-proxy.conf << PROXYEOF
# Auto-generated Supabase reverse proxy
# Proxies /supabase-proxy/* -> ${VITE_SUPABASE_URL}/*
location /supabase-proxy/ {
    # DNS 解析器（自动检测 Docker 内部 DNS + 公共 DNS 回退）
    # valid=300s: 每 5 分钟重新解析 DNS（Supabase IP 可能变化）
    resolver ${RESOLVERS} valid=300s ipv6=off;

    # 使用变量触发运行时 DNS 解析（literal URL 只在启动时解析一次）
    set \$supabase_upstream ${VITE_SUPABASE_URL};
    rewrite ^/supabase-proxy/(.*) /\$1 break;
    proxy_pass \$supabase_upstream;

    proxy_ssl_server_name on;
    proxy_set_header Host ${SUPABASE_HOST};
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

    # WebSocket support (required for Supabase Realtime)
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";

    # Timeouts
    proxy_connect_timeout 10s;
    proxy_send_timeout 30s;
    proxy_read_timeout 60s;

    # Don't buffer responses
    proxy_buffering off;
}
PROXYEOF
  USE_PROXY='true'
  echo "   Supabase proxy: /supabase-proxy/ -> ${VITE_SUPABASE_URL}"
  echo "   DNS resolvers: ${RESOLVERS}"
else
  # Create empty config so nginx include doesn't fail
  echo "# No Supabase URL configured, proxy disabled" > /etc/nginx/supabase-proxy.conf
fi

# 生成 env-config.js 文件
cat > /usr/share/nginx/html/env-config.js << EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: '${ESCAPED_URL}',
  VITE_SUPABASE_ANON_KEY: '${ESCAPED_KEY}',
  VITE_SUPABASE_USE_PROXY: '${USE_PROXY}'
};
EOF

echo "✅ Generated env-config.js with runtime environment variables"
echo "   VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:+configured}"

# 启动 Nginx
exec nginx -g 'daemon off;'
