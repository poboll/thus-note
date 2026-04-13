#!/bin/bash
# ============================================
# 修复微信登录问题 - Member name 缺失
# 服务器: 164.152.42.24
# 项目目录: /www/wwwroot/thus.caiths.com
# ============================================

set -e

PROJECT_DIR="/www/wwwroot/thus.caiths.com"
BACKEND_DIR="$PROJECT_DIR/thus-backends/thus-server"
FILE_PATH="$BACKEND_DIR/src/routes/user-login.ts"

echo "=========================================="
echo "  修复微信登录问题"
echo "=========================================="

cd "$BACKEND_DIR"

echo "[1/5] 备份原文件..."
cp "$FILE_PATH" "$FILE_PATH.backup.$(date +%Y%m%d_%H%M%S)"
echo "  ✅ 已备份到 $FILE_PATH.backup.*"

echo ""
echo "[2/5] 应用代码修复..."

# 使用 sed 修改文件
sed -i '34,52s/if (members.length === 0) {/if (members.length === 0) {\n    const user = await User.findById(userId);/' "$FILE_PATH"
sed -i '44,49s/const member = new Member({/const member = new Member({\n      name: user?.username,/' "$FILE_PATH"

echo "  ✅ 代码已修改"

echo ""
echo "[3/5] 清理构建缓存..."
rm -rf node_modules/.cache dist
echo "  ✅ 缓存已清理"

echo ""
echo "[4/5] 重新构建..."
pnpm run build
echo "  ✅ 构建完成"

echo ""
echo "[5/5] 重启服务..."
pm2 restart thus-server
sleep 2
pm2 status

echo ""
echo "=========================================="
echo "  修复完成"
echo "=========================================="
echo ""
echo "  测试命令:"
echo "  curl http://localhost:3000/health"
echo ""
echo "  查看日志:"
echo "  pm2 logs thus-server --lines 50"
echo ""
echo "=========================================="
