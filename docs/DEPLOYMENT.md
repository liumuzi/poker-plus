# 部署指南

本文档介绍如何使用 Docker + Dokploy 部署 Poker+，以及如何排查 HTTPS 相关问题。

---

## 架构概览

```
浏览器 ──HTTPS──▶ Traefik（Dokploy 内置反向代理）──HTTP──▶ Nginx 容器（端口 80）
                    ↑ TLS 在此终止
                    ↑ Let's Encrypt 证书
```

- **Traefik**：Dokploy 使用 Traefik 作为反向代理，负责 TLS 终止和证书管理
- **Nginx 容器**：只需监听 HTTP 80 端口，不需要自行配置 SSL 证书
- **安全头**：由 `nginx.conf` 统一添加（HSTS、X-Content-Type-Options 等）

---

## Dokploy 部署步骤

### 1. 在 Dokploy 中创建服务

1. 在 Dokploy 面板中新建一个 **Application**
2. 选择 Git 仓库并关联本项目
3. 构建方式选择 **Dockerfile**（项目根目录已包含 `Dockerfile`）

### 2. 开启 HTTPS

1. 进入应用的 **Domains** 配置
2. 添加你的域名（例如 `your-domain.example.com`）
3. 勾选 **HTTPS** 并选择 **Let's Encrypt**
4. 确保证书类型为 **Let's Encrypt (Production)**，而非 Staging

### 3. 部署

点击 **Deploy** 按钮，Dokploy 会自动：
- 拉取代码并执行 `docker build`
- 配置 Traefik 路由和 TLS 证书
- 启动容器并绑定域名

---

## HTTPS 排查清单

如果浏览器仍然显示"连接不安全"，请按以下步骤逐一排查：

### ✅ 1. 确认域名 DNS 已正确解析

```bash
# 查询域名是否指向你的服务器 IP
nslookup your-domain.example.com
# 或
dig your-domain.example.com
```

- DNS A 记录必须指向你的云服务器公网 IP
- 如果使用腾讯云 DNS，需在腾讯云控制台的 **DNS 解析** 中配置
- DNS 修改后可能需要几分钟到几小时生效

### ✅ 2. 确认服务器防火墙放行 80 和 443 端口

Let's Encrypt 使用 **HTTP-01 验证**，需要通过 80 端口访问你的服务器来验证域名所有权。

**腾讯云安全组配置：**

1. 进入腾讯云控制台 → **云服务器** → **安全组**
2. 确认入站规则中包含：
   - TCP 端口 **80**（HTTP）— Let's Encrypt 验证必需
   - TCP 端口 **443**（HTTPS）— 正常 HTTPS 访问必需
3. 如果之前仅开放了 443，**必须同时开放 80**

**服务器本地防火墙（如有）：**

```bash
# 检查 iptables
sudo iptables -L -n | grep -E '80|443'

# 或检查 firewalld
sudo firewall-cmd --list-ports

# 如需放行
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### ✅ 3. 清除腾讯云之前配置的 SSL 证书

如果你之前在腾讯云上手动配置过 SSL 证书（例如通过腾讯云 CDN 或负载均衡器），可能会与 Dokploy 的 Let's Encrypt 证书冲突。

**需要检查和清理的地方：**

1. **腾讯云 CDN**：如果域名接入了腾讯云 CDN，CDN 会在边缘节点终止 TLS，可能使用的是旧证书
   - 进入 **CDN 控制台** → **域名管理** → 检查是否有该域名
   - 如果有，需要**关闭 CDN** 或更新 CDN 证书

2. **腾讯云负载均衡器 (CLB)**：如果流量经过 CLB，CLB 可能配置了 SSL 证书
   - 进入 **负载均衡控制台** → 检查是否有配置
   - 如果有，移除 SSL 配置或直接绕过 CLB

3. **腾讯云 SSL 证书管理**：旧证书不会自动影响服务器，但确认没有通过其他方式绑定到你的域名

4. **服务器上的旧 Nginx 实例**：如果之前直接在服务器上安装过 Nginx 并配置了 SSL
   ```bash
   # 检查是否有独立运行的 Nginx（Docker 外部的）
   sudo systemctl status nginx
   # 如果正在运行且不是 Docker 的 Nginx，停止它
   sudo systemctl stop nginx
   sudo systemctl disable nginx
   ```

### ✅ 4. 检查 Dokploy / Traefik 证书状态

```bash
# 查看 Traefik 日志，确认证书是否签发成功
docker logs $(docker ps -q -f name=traefik) 2>&1 | grep -i "acme\|certificate\|letsencrypt"

# 常见错误：
# - "acme: error 403" → 域名验证失败，检查 DNS 和防火墙
# - "acme: error: too many certificates" → 短时间内申请过多，等待一小时
# - "TLS handshake error" → 证书未正确加载
```

### ✅ 5. 确认未使用 Let's Encrypt Staging 环境

Dokploy 中有 Staging 和 Production 两种 Let's Encrypt 选项：
- **Staging**：签发的是测试证书，浏览器**不信任**，会显示不安全
- **Production**：签发的是正式证书，浏览器信任

确认 Dokploy 中使用的是 **Production** 环境。

### ✅ 6. 验证 HTTPS 是否真正生效

```bash
# 检查证书信息
curl -vI https://your-domain.example.com 2>&1 | grep -A 5 "SSL certificate"

# 检查证书签发者（应为 Let's Encrypt）
echo | openssl s_client -servername your-domain.example.com -connect your-domain.example.com:443 2>/dev/null | openssl x509 -noout -issuer -dates
# 期望输出：issuer= /C=US/O=Let's Encrypt/CN=...
```

如果看到的 issuer 不是 Let's Encrypt，说明有其他地方（腾讯云 CDN / 旧 Nginx / CLB）在拦截 HTTPS 流量。

### ✅ 7. 检查混合内容 (Mixed Content)

即使 HTTPS 证书有效，如果页面中加载了 HTTP 资源，浏览器也可能显示"不安全"。

打开浏览器开发者工具（F12）→ **Console** 页签，查找类似以下警告：

```
Mixed Content: The page at 'https://...' was loaded over HTTPS,
but requested an insecure resource 'http://...'
```

> 本项目的外部资源（Google Fonts）已使用 HTTPS，正常情况下不会有混合内容问题。

---

## Bad Gateway (502) 排查

如果访问网站时看到 **502 Bad Gateway** 错误，说明 Traefik（反向代理）无法从后端容器获取响应。

### 🔧 快速诊断脚本

我们提供了一个诊断脚本，可以自动检查常见问题：

```bash
# 在服务器上下载并运行诊断脚本
curl -sL https://raw.githubusercontent.com/liumuzi/poker-plus/main/scripts/diagnose.sh | bash
```

或者手动检查以下各项：

### ✅ 1. 检查容器是否正在运行

```bash
# 查看所有容器状态
docker ps -a | grep poker

# 如果容器状态为 Exited 或 Restarting，查看日志
docker logs <容器ID>
```

常见容器崩溃原因：
- 构建失败（`npm ci` 或 `npm run build` 出错）
- nginx 配置语法错误

### ✅ 2. 检查 Docker 镜像构建是否成功

在 Dokploy 面板中查看 **Deployments** 页签，确认最近一次部署的构建日志没有报错。

常见构建失败原因：
- `npm ci` 失败：服务器无法访问 npm registry（检查网络/防火墙）
- `npm run build` 失败：代码有编译错误

### ✅ 3. 检查容器健康状态

```bash
# 查看容器健康检查状态
docker inspect --format='{{.State.Health.Status}}' <容器ID>

# 查看最近的健康检查结果
docker inspect --format='{{json .State.Health}}' <容器ID> | python3 -m json.tool
```

状态说明：
- `healthy` — 容器正常运行
- `unhealthy` — nginx 未正常响应，需要查看容器日志
- `starting` — 容器正在启动，等待几秒后再次检查

### ✅ 4. 手动测试容器连通性

```bash
# 进入容器测试 nginx 是否正常响应
docker exec <容器ID> wget -qO- http://localhost/health
# 期望输出：ok

# 测试 nginx 配置是否有效
docker exec <容器ID> nginx -t
```

### ✅ 5. 检查 Traefik 路由配置

```bash
# 查看 Traefik 日志中的路由信息
docker logs $(docker ps -q -f name=traefik) 2>&1 | grep -i "poker\|502\|bad gateway\|error"

# 检查 Traefik 是否发现了后端容器
docker logs $(docker ps -q -f name=traefik) 2>&1 | tail -50
```

### ✅ 6. 确认端口映射正确

Dokploy/Traefik 默认连接容器的 `EXPOSE` 端口（本项目为 **80**）。如果在 Dokploy 中手动修改过端口配置，请确认与 Dockerfile 中的 `EXPOSE 80` 一致。

### ✅ 7. 检查 Docker 网络（最常见原因）

**502 Bad Gateway 最常见的原因是 Traefik 和应用容器不在同一个 Docker 网络中。**

```bash
# 查看 Poker 容器所在网络
docker inspect <poker容器ID> | grep -A 10 "Networks"

# 查看 Traefik 容器所在网络
docker inspect $(docker ps -q -f name=traefik) | grep -A 10 "Networks"
```

**解决方法：**

在 Dokploy 中，进入应用设置 → **Advanced** → **Network**，确保选择与 Traefik 相同的网络（通常是 `dokploy-network`）。

### ✅ 8. 强制重新部署

如果以上检查都正常，尝试在 Dokploy 中：

1. 点击 **Stop** 停止当前部署
2. 点击 **Redeploy** 重新部署
3. 等待构建完成后检查是否正常

---

## Nginx 安全配置说明

本项目的 `nginx.conf` 已包含以下安全配置：

| 响应头 | 作用 |
|--------|------|
| `Strict-Transport-Security` (HSTS) | 告知浏览器后续只使用 HTTPS 访问（仅在反向代理为 HTTPS 时生效） |
| `X-Content-Type-Options: nosniff` | 防止浏览器 MIME 类型嗅探 |
| `X-Frame-Options: SAMEORIGIN` | 防止页面被嵌入到其他网站的 iframe 中 |
| `Referrer-Policy` | 控制跳转时 Referrer 信息的发送策略 |
| `Permissions-Policy` | 限制浏览器 API 权限（摄像头、麦克风、定位） |

### HSTS 工作原理

```
浏览器 ──HTTPS──▶ Traefik
                    │
                    ▼ X-Forwarded-Proto: https
                  Nginx
                    │ 检测到 X-Forwarded-Proto = https
                    ▼ 添加 Strict-Transport-Security 头
                  响应返回浏览器
                    │
                    ▼ 浏览器记住：以后只用 HTTPS 访问此站点
```

`nginx.conf` 中使用条件判断，只有当反向代理通过 `X-Forwarded-Proto: https` 告知当前连接为 HTTPS 时，才会添加 HSTS 头。这样在本地开发（HTTP）时不会受影响。

---

## 常见问题

### Q: 为什么不直接在 Nginx 容器中配置 SSL？

A: Dokploy 使用 Traefik 作为统一的反向代理来管理 TLS 证书。在这种架构下：
- Traefik 负责 TLS 终止和证书自动续期
- 后端容器（Nginx）只需处理 HTTP
- 避免每个容器都需要管理证书

### Q: 之前在腾讯云配置过证书，需要删除吗？

A: 腾讯云上的证书本身不需要删除，但需要确认：
- 域名的 DNS 直接解析到你的服务器 IP（而非腾讯云 CDN）
- 没有其他服务（CDN、CLB）拦截 443 端口的流量
- 服务器上没有另外运行的 Nginx/Apache 占用 80/443 端口

### Q: Let's Encrypt 证书多久续期一次？

A: Let's Encrypt 证书有效期为 90 天。Traefik 会自动在到期前续期，无需手动操作。确保 80 端口始终可访问，否则续期会失败。

### Q: 如何强制 HTTP 跳转到 HTTPS？

A: 在 Dokploy 的域名设置中勾选 **HTTPS Redirect** 选项即可。Traefik 会自动将 HTTP 请求 301 重定向到 HTTPS。
