#!/bin/bash

###############################################################################
# Thus-Note 生产环境构建脚本
# 用途: 在本地构建前端和后端,准备部署到服务器
#
# 使用方法:
#   chmod +x build-production.sh
#   ./build-production.sh
#
# 输出:
#   - dist/frontend/ (前端静态文件)
#   - dist/backend/  (后端 Node.js 代码)
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"

echo_info "=== Thus-Note 生产环境构建开始 ==="
echo_info "项目根目录: $PROJECT_ROOT"
echo_info "构建输出目录: $DIST_DIR"

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo_error "Node.js 版本过低! 需要 >= 18, 当前版本: $(node -v)"
    exit 1
fi
echo_info "Node.js 版本检查通过: $(node -v)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo_error "pnpm 未安装! 请先安装: npm install -g pnpm"
    exit 1
fi
echo_info "pnpm 版本: $(pnpm -v)"

# 清理旧的构建产物
echo_info "清理旧的构建产物..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/frontend"
mkdir -p "$DIST_DIR/backend"

###############################################################################
# 构建前端
###############################################################################
echo_info ""
echo_info "=== 开始构建前端 (Vue 3) ==="
cd "$PROJECT_ROOT/thus-frontends/thus-web"

# 安装依赖
echo_info "安装前端依赖..."
pnpm install --frozen-lockfile

# 构建
echo_info "构建前端..."
pnpm build

# 复制构建产物
echo_info "复制前端构建产物到 dist/frontend/..."
cp -r dist/* "$DIST_DIR/frontend/"

# 显示构建产物大小
FRONTEND_SIZE=$(du -sh "$DIST_DIR/frontend" | cut -f1)
echo_info "前端构建完成! 大小: $FRONTEND_SIZE"

###############################################################################
# 构建后端
###############################################################################
echo_info ""
echo_info "=== 开始构建后端 (Node.js + TypeScript) ==="
cd "$PROJECT_ROOT/thus-backends/thus-server"

# 安装依赖
echo_info "安装后端依赖..."
pnpm install --frozen-lockfile

# 构建 TypeScript
echo_info "编译 TypeScript..."
pnpm build

# 复制构建产物和必要文件
echo_info "复制后端文件到 dist/backend/..."
cp -r dist "$DIST_DIR/backend/"
cp package.json "$DIST_DIR/backend/"
cp pnpm-lock.yaml "$DIST_DIR/backend/"
cp ecosystem.config.js "$DIST_DIR/backend/" 2>/dev/null || echo_warn "ecosystem.config.js 不存在,跳过"

# 复制 .env.example (提醒用户配置环境变量)
cp .env.example "$DIST_DIR/backend/.env.example"
echo_warn "请记得在服务器上配置 .env 文件!"

# 创建必要的目录
mkdir -p "$DIST_DIR/backend/logs"
mkdir -p "$DIST_DIR/backend/pids"
mkdir -p "$DIST_DIR/backend/uploads"

# 显示构建产物大小
BACKEND_SIZE=$(du -sh "$DIST_DIR/backend" | cut -f1)
echo_info "后端构建完成! 大小: $BACKEND_SIZE"

###############################################################################
# 生成部署说明
###############################################################################
echo_info ""
echo_info "=== 生成部署说明文件 ==="
cat > "$DIST_DIR/DEPLOY_README.md" << 'EOF'
# Thus-Note 部署指南

## 📦 构建产物说明

- `frontend/` - 前端静态文件 (Vue 3)
- `backend/` - 后端 Node.js 代码

## 🚀 部署步骤 (CentOS + 宝塔)

### 1. 服务器准备

在宝塔面板安装以下软件:
- MongoDB 5.0+
- Redis 6.0+
- PM2 管理器 (Node.js 18+)
- Nginx

### 2. 上传文件

将构建产物上传到服务器:
```bash
# 前端文件上传到
/www/wwwroot/thus.caiths.com/frontend/

# 后端文件上传到
/www/wwwroot/thus.caiths.com/backend/
```

### 3. 配置后端环境变量

在服务器后端目录创建 `.env` 文件:
```bash
cd /www/wwwroot/thus.caiths.com/backend
cp .env.example .env
nano .env  # 编辑配置
```

必需配置项:
- `MONGODB_URI` - MongoDB 连接字符串
- `REDIS_HOST` - Redis 主机
- `REDIS_PASSWORD` - Redis 密码
- `JWT_SECRET` - JWT 密钥

### 4. 安装后端依赖

```bash
cd /www/wwwroot/thus.caiths.com/backend
pnpm install --production
```

### 5. 启动后端服务

使用宝塔 PM2 管理器或命令行:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. 配置 Nginx

参考 `../deploy/nginx.conf` 配置宝塔网站的 Nginx。

### 7. 配置 SSL

在宝塔面板申请 Let's Encrypt 免费证书。

## ✅ 验证部署

- 访问: https://thus.caiths.com
- 检查健康状态: https://thus.caiths.com/health
- 查看后端日志: `pm2 logs thus-server`

## 🔧 故障排查

```bash
# 查看 PM2 进程状态
pm2 status

# 查看后端日志
pm2 logs thus-server

# 重启后端
pm2 restart thus-server

# 检查 MongoDB
mongo

# 检查 Redis
redis-cli ping
```
EOF

echo_info "部署说明已生成: $DIST_DIR/DEPLOY_README.md"

###############################################################################
# 打包构建产物
###############################################################################
echo_info ""
echo_info "=== 打包构建产物 ==="
cd "$PROJECT_ROOT"
PACKAGE_NAME="thus-note-production-$(date +%Y%m%d-%H%M%S).tar.gz"

tar -czf "$PACKAGE_NAME" -C dist .

PACKAGE_SIZE=$(du -sh "$PACKAGE_NAME" | cut -f1)
echo_info "打包完成: $PACKAGE_NAME (大小: $PACKAGE_SIZE)"

###############################################################################
# 完成
###############################################################################
echo_info ""
echo_info "=== 构建完成! ==="
echo_info "前端大小: $FRONTEND_SIZE"
echo_info "后端大小: $BACKEND_SIZE"
echo_info "压缩包: $PACKAGE_NAME ($PACKAGE_SIZE)"
echo_info ""
echo_info "下一步:"
echo_info "1. 将 $PACKAGE_NAME 上传到服务器"
echo_info "2. 解压: tar -xzf $PACKAGE_NAME"
echo_info "3. 按照 DEPLOY_README.md 进行部署"
echo_info ""
echo_info "✨ 部署愉快!"
