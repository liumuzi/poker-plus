#!/bin/bash
# 502 Bad Gateway 诊断脚本
# 在服务器上运行此脚本来排查问题

set -e

echo "================================================"
echo "  Poker+ 502 Bad Gateway 诊断工具"
echo "================================================"
echo ""

# 1. 检查 Docker 是否运行
echo "【1】检查 Docker 服务状态..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker 服务未运行！请先启动 Docker。"
    exit 1
fi
echo "✅ Docker 服务正常运行"
echo ""

# 2. 查找 poker 相关容器
echo "【2】查找 Poker+ 容器..."
POKER_CONTAINERS=$(docker ps -a --filter "name=poker" --format "{{.ID}} {{.Names}} {{.Status}}" 2>/dev/null || true)
if [ -z "$POKER_CONTAINERS" ]; then
    echo "❌ 未找到 poker 相关容器！"
    echo "   请确认在 Dokploy 中部署成功。"
    echo ""
else
    echo "找到以下容器："
    echo "$POKER_CONTAINERS"
    echo ""
fi

# 3. 检查容器健康状态
echo "【3】检查容器健康状态..."
for CONTAINER_ID in $(docker ps -a --filter "name=poker" -q 2>/dev/null); do
    CONTAINER_NAME=$(docker inspect --format='{{.Name}}' "$CONTAINER_ID" | sed 's/\///')
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "no-healthcheck")
    RUNNING_STATUS=$(docker inspect --format='{{.State.Running}}' "$CONTAINER_ID")
    
    echo "容器: $CONTAINER_NAME"
    echo "  - 运行状态: $RUNNING_STATUS"
    echo "  - 健康状态: $HEALTH_STATUS"
    
    if [ "$HEALTH_STATUS" = "unhealthy" ]; then
        echo "  ❌ 容器不健康！最近的健康检查日志："
        docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' "$CONTAINER_ID" | head -5
    fi
    
    if [ "$RUNNING_STATUS" = "false" ]; then
        echo "  ❌ 容器未运行！最近的日志："
        docker logs --tail 20 "$CONTAINER_ID"
    fi
    echo ""
done

# 4. 测试容器内部连通性
echo "【4】测试容器内部连通性..."
for CONTAINER_ID in $(docker ps --filter "name=poker" -q 2>/dev/null); do
    CONTAINER_NAME=$(docker inspect --format='{{.Name}}' "$CONTAINER_ID" | sed 's/\///')
    echo "测试容器 $CONTAINER_NAME 的 /health 端点..."
    
    HEALTH_RESULT=$(docker exec "$CONTAINER_ID" wget -qO- http://127.0.0.1/health 2>&1 || echo "FAILED")
    if [ "$HEALTH_RESULT" = "ok" ]; then
        echo "  ✅ /health 端点响应正常: $HEALTH_RESULT"
    else
        echo "  ❌ /health 端点响应异常: $HEALTH_RESULT"
    fi
    
    # 测试主页
    MAIN_RESULT=$(docker exec "$CONTAINER_ID" wget -qO- http://127.0.0.1/ 2>&1 | head -1 || echo "FAILED")
    if echo "$MAIN_RESULT" | grep -q "<!doctype html>"; then
        echo "  ✅ 主页响应正常"
    else
        echo "  ❌ 主页响应异常"
    fi
    echo ""
done

# 5. 检查 Traefik 容器
echo "【5】检查 Traefik 反向代理..."
TRAEFIK_CONTAINER=$(docker ps --filter "name=traefik" -q 2>/dev/null | head -1)
if [ -z "$TRAEFIK_CONTAINER" ]; then
    echo "❌ 未找到 Traefik 容器！"
    echo "   Dokploy 通常会自动运行 Traefik。请检查 Dokploy 状态。"
else
    echo "✅ Traefik 容器正在运行: $TRAEFIK_CONTAINER"
    echo ""
    echo "Traefik 最近的路由相关日志："
    docker logs --tail 30 "$TRAEFIK_CONTAINER" 2>&1 | grep -iE "poker|502|bad gateway|error|router" | tail -10 || echo "(无相关日志)"
fi
echo ""

# 6. 检查 Docker 网络
echo "【6】检查 Docker 网络配置..."
echo "Poker 容器所在的网络："
for CONTAINER_ID in $(docker ps --filter "name=poker" -q 2>/dev/null); do
    CONTAINER_NAME=$(docker inspect --format='{{.Name}}' "$CONTAINER_ID" | sed 's/\///')
    NETWORKS=$(docker inspect --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$CONTAINER_ID")
    echo "  $CONTAINER_NAME: $NETWORKS"
done
echo ""
echo "Traefik 容器所在的网络："
if [ -n "$TRAEFIK_CONTAINER" ]; then
    TRAEFIK_NETWORKS=$(docker inspect --format='{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$TRAEFIK_CONTAINER")
    echo "  traefik: $TRAEFIK_NETWORKS"
fi
echo ""

# 7. 检查端口
echo "【7】检查端口监听..."
echo "容器暴露的端口："
docker ps --filter "name=poker" --format "{{.Names}}: {{.Ports}}" 2>/dev/null || echo "(无)"
echo ""

# 8. 建议
echo "================================================"
echo "  诊断建议"
echo "================================================"
echo ""
echo "如果以上检查都正常但仍然 502，请尝试："
echo ""
echo "1. 在 Dokploy 中重新部署应用（点击 Redeploy）"
echo ""
echo "2. 确保 Poker 容器和 Traefik 在同一个 Docker 网络"
echo "   在 Dokploy 设置中检查网络配置"
echo ""
echo "3. 检查域名配置"
echo "   确保域名正确指向此服务器，且 HTTPS 已启用"
echo ""
echo "4. 查看完整的 Traefik 日志"
echo "   docker logs \$(docker ps -q -f name=traefik) 2>&1 | tail -100"
echo ""
echo "5. 如果使用自定义端口，确保 Dokploy 中配置的端口与 Dockerfile 一致（默认 80）"
echo ""
