#!/bin/bash

# 服务器端部署脚本
# 在 thus.caiths.com 服务器上执行

set -e

echo "=========================================="
echo "服务器端部署 - thus.caiths.com"
echo "=========================================="

# 获取项目路径
PROJECT_DIR=$(pwd)
echo "当前目录: $PROJECT_DIR"

# 1. 停止服务
echo ""
echo "1. 停止服务..."
if command -v pm2 &> /dev/null; then
    pm2 stop thus-server || true
else
    echo "PM2 未安装，跳过停止服务"
fi

# 2. 备份当前代码
echo ""
echo "2. 备份当前代码..."
BACKUP_DIR="../backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/thus-server-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf $BACKUP_FILE . --exclude=node_modules --exclude=dist --exclude=logs --exclude=uploads
echo "备份已保存到: $BACKUP_FILE"

# 3. 清理旧文件和日志
echo ""
echo "3. 清理旧文件和日志..."
read -p "是否清理日志文件？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf logs/*
    echo "日志已清理"
fi

read -p "是否清理上传文件？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf uploads/*
    echo "上传文件已清理"
fi

# 清理备份文件
rm -f src/routes/*.bak*
rm -f src/*.bak*

# 4. 安装依赖
echo ""
echo "4. 安装依赖..."
npm install

# 5. 构建项目
echo ""
echo "5. 构建项目..."
npm run build

# 6. 检查环境变量
echo ""
echo "6. 检查环境变量..."
if [ ! -f .env ]; then
    echo "警告: .env 文件不存在，请创建"
    exit 1
fi

# 检查必需的环境变量
required_vars=("MONGODB_URI" "REDIS_HOST" "JWT_SECRET" "WECHAT_APPID" "AUTH_SERVICE_URL" "AUTH_SERVICE_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "警告: 以下环境变量缺失:"
    printf '  - %s\n' "${missing_vars[@]}"
    echo ""
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 7. 启动服务
echo ""
echo "7. 启动服务..."
if command -v pm2 &> /dev/null; then
    pm2 start npm --name "thus-server" -- start || pm2 restart thus-server
    echo "服务已通过 PM2 启动"
else
    echo "PM2 未安装，请手动启动服务: npm start"
fi

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "查看日志:"
echo "  pm2 logs thus-server"
echo ""
echo "查看状态:"
echo "  pm2 status"
echo ""
echo "重启服务:"
echo "  pm2 restart thus-server"
echo ""
echo "=========================================="
