# 构建阶段
# 使用 node:20-slim 而不是 alpine，因为 alpine 中 npm ci 可能静默失败
FROM node:20-slim AS builder
WORKDIR /app

# 定义构建时环境变量（Vite 需要在构建时嵌入这些值）
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# 设置环境变量供 npm run build 使用
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# 复制 package.json 和 package-lock.json
COPY poker-plus/package*.json ./

# 安装依赖
RUN npm install

# 复制源代码并构建
COPY poker-plus/ .
RUN npm run build

# 生产运行阶段
FROM nginx:alpine

# 将构建产物复制到 Nginx 的网页目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 覆盖默认的 Nginx 配置（用于支持 React 的单页应用路由）
# 从 builder 阶段复制，因为多阶段构建的第二阶段无法直接访问构建上下文
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
