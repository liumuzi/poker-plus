# 构建阶段
FROM node:20-slim AS builder
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产运行阶段
FROM nginx:alpine

# 将构建产物复制到 Nginx 的网页目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 覆盖默认的 Nginx 配置（用于支持 React 的单页应用路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]