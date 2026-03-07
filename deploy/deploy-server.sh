#!/bin/bash
# ============================================
# Thus-Note 服务器部署脚本
# 服务器: 164.152.42.24
# 项目目录: /www/wwwroot/thus.caiths.com
# ============================================

set -e

PROJECT_DIR="/www/wwwroot/thus.caiths.com"
BACKEND_DIR="$PROJECT_DIR/thus-backends/thus-server"
FRONTEND_DIR="$PROJECT_DIR/thus-frontends/thus-web"

echo "=========================================="
echo "  Thus-Note 部署脚本"
echo "=========================================="

# ---- 第0步: 检查环境 ----
echo ""
echo "[0/7] 检查服务器环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先通过宝塔安装 Node.js >= 18"
    exit 1
fi
echo "  Node.js: $(node -v)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "  安装 pnpm..."
    npm install -g pnpm
fi
echo "  pnpm: $(pnpm -v)"

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "  安装 PM2..."
    npm install -g pm2
fi
echo "  PM2: $(pm2 -v)"

# ---- 第1步: 检查 MongoDB ----
echo ""
echo "[1/7] 检查 MongoDB..."

# 检查 MongoDB 是否在运行
if command -v mongosh &> /dev/null; then
    MONGO_STATUS=$(mongosh --eval "db.runCommand({ping:1})" --quiet 2>/dev/null && echo "running" || echo "stopped")
elif command -v mongo &> /dev/null; then
    MONGO_STATUS=$(mongo --eval "db.runCommand({ping:1})" --quiet 2>/dev/null && echo "running" || echo "stopped")
elif docker ps 2>/dev/null | grep -q mongo; then
    MONGO_STATUS="running (docker)"
else
    MONGO_STATUS="unknown"
fi
echo "  MongoDB 状态: $MONGO_STATUS"

# 检查 Docker 中的 MongoDB
if docker ps -a 2>/dev/null | grep -q mongo; then
    echo "  Docker MongoDB 容器:"
    docker ps -a --filter "name=mongo" --format "  {{.Names}} - {{.Status}}"
fi

# 尝试获取 MongoDB 连接信息
if [ -f /etc/mongod.conf ]; then
    echo "  MongoDB 配置文件: /etc/mongod.conf"
    MONGO_PORT=$(grep -E "^\s*port:" /etc/mongod.conf 2>/dev/null | awk '{print $2}' || echo "27017")
    echo "  MongoDB 端口: $MONGO_PORT"
fi

# ---- 第2步: 检查 Redis ----
echo ""
echo "[2/7] 检查 Redis..."

if command -v redis-cli &> /dev/null; then
    REDIS_PING=$(redis-cli ping 2>/dev/null || echo "failed")
    echo "  Redis 状态: $REDIS_PING"
elif docker ps 2>/dev/null | grep -q redis; then
    echo "  Redis 运行在 Docker 中"
else
    echo "  ⚠️  Redis 未检测到，应用会在无 Redis 模式下运行（已有降级处理）"
fi

# ---- 第3步: 检查端口占用 ----
echo ""
echo "[3/7] 检查端口占用..."

check_port() {
    local port=$1
    local name=$2
    if ss -tlnp 2>/dev/null | grep -q ":${port} " || netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
        echo "  ⚠️  端口 $port ($name) 已被占用:"
        ss -tlnp 2>/dev/null | grep ":${port} " || netstat -tlnp 2>/dev/null | grep ":${port} "
        return 1
    else
        echo "  ✅ 端口 $port ($name) 可用"
        return 0
    fi
}

check_port 3000 "后端API"
check_port 27017 "MongoDB"
check_port 6379 "Redis"

# ---- 第4步: 拉取最新代码 ----
echo ""
echo "[4/7] 更新代码..."

cd "$PROJECT_DIR"

if [ -d ".git" ]; then
    echo "  Git 仓库检测到，拉取最新代码..."
    git stash 2>/dev/null || true
    git pull origin main
    echo "  ✅ 代码已更新"
else
    echo "  ⚠️  非 Git 仓库，跳过代码拉取"
    echo "  请手动同步代码: rsync -avz --exclude 'node_modules' --exclude '.env' --exclude 'dist' --exclude 'logs' ./ root@164.152.42.24:$PROJECT_DIR/"
fi

# ---- 第5步: 配置后端 ----
echo ""
echo "[5/7] 配置后端..."

cd "$BACKEND_DIR"

# 创建必要目录
mkdir -p logs uploads pids

# 安装依赖
echo "  安装后端依赖..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 构建 TypeScript
echo "  构建后端..."
pnpm run build

# 配置 .env (如果不存在则从 example 复制)
if [ ! -f .env ]; then
    echo "  创建 .env 文件..."
    cp .env.example .env
    echo "  ⚠️  请编辑 $BACKEND_DIR/.env 配置数据库和邮件信息"
fi

# 确保 .env 中有邮件配置
if ! grep -q "EMAIL_HOST=smtp.office365.com" .env 2>/dev/null; then
    echo ""
    echo "  ⚠️  检测到邮件配置可能缺失，请确认 .env 中包含以下配置:"
    echo "  EMAIL_HOST=smtp.office365.com"
    echo "  EMAIL_PORT=587"
    echo "  EMAIL_SECURE=false"
    echo "  EMAIL_USER=i@caiths.com"
    echo "  EMAIL_PASS=<你的邮箱密码>"
    echo "  EMAIL_FROM=i@caiths.com"
fi

# 确保 .env 权限安全
chmod 600 .env

echo "  ✅ 后端配置完成"

# ---- 第6步: 构建前端 ----
echo ""
echo "[6/7] 构建前端..."

cd "$FRONTEND_DIR"

# 安装依赖
echo "  安装前端依赖..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# 创建生产环境 .env
if [ ! -f .env.production ]; then
    cat > .env.production << 'ENVEOF'
VITE_APP_NAME=Thus-Note
VITE_API_DOMAIN=https://thus.caiths.com
VITE_LOGIN_WAYS=email,password,github,google,wechat
VITE_CONNECTORS=01
ENVEOF
    echo "  ✅ 创建 .env.production"
fi

# 构建前端
echo "  构建前端 (这可能需要几分钟)..."
pnpm run build

# 将构建产物复制到 nginx 目录
NGINX_ROOT="/www/wwwroot/thus.caiths.com/frontend"
mkdir -p "$NGINX_ROOT"
rm -rf "$NGINX_ROOT"/*
cp -r dist/* "$NGINX_ROOT"/
echo "  ✅ 前端构建产物已复制到 $NGINX_ROOT"

# ---- 第7步: 启动服务 ----
echo ""
echo "[7/7] 启动后端服务..."

cd "$BACKEND_DIR"

# 停止旧进程
pm2 delete thus-server 2>/dev/null || true

# 启动新进程
pm2 start ecosystem.config.js

# 配置 PM2 日志轮转 (省磁盘)
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 10M 2>/dev/null || true
pm2 set pm2-logrotate:retain 3 2>/dev/null || true
pm2 set pm2-logrotate:compress true 2>/dev/null || true

# 保存 PM2 进程列表 (开机自启)
pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "=========================================="
echo "  部署完成"
echo "=========================================="
echo ""
echo "  后端状态:"
pm2 status
echo ""
echo "  测试命令:"
echo "  curl http://localhost:3000/health"
echo "  curl -X POST http://localhost:3000/api/test/send-email -H 'Content-Type: application/json' -d '{\"email\":\"caiths@icloud.com\",\"type\":\"verification\"}'"
echo ""
echo "  日志查看:"
echo "  pm2 logs thus-server --lines 50"
echo ""
echo "  ⚠️  别忘了:"
echo "  1. 检查 $BACKEND_DIR/.env 中的 MONGODB_URI 和邮件配置"
echo "  2. 在宝塔面板中更新 Nginx 配置 (参考 deploy/nginx.conf)"
echo "  3. 重载 Nginx: nginx -s reload"
echo "=========================================="
