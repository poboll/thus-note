#!/bin/bash

# 微信登录功能部署脚本
# 用于部署到 thus.caiths.com

set -e

echo "=========================================="
echo "微信登录功能部署脚本"
echo "=========================================="

# 1. 清理旧的备份文件
echo "1. 清理备份文件..."
rm -f src/routes/user-login.ts.bak*
rm -f src/index.ts.bak*

# 2. 构建项目
echo "2. 构建项目..."
npm run build

# 3. 检查环境变量
echo "3. 检查环境变量..."
if [ ! -f .env ]; then
    echo "错误: .env 文件不存在"
    exit 1
fi

# 检查必需的环境变量
required_vars=("WECHAT_APPID" "AUTH_SERVICE_URL" "AUTH_SERVICE_SECRET")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env; then
        echo "警告: .env 中缺少 ${var}"
    fi
done

echo ""
echo "=========================================="
echo "本地构建完成！"
echo "=========================================="
echo ""
echo "接下来需要在服务器上执行以下步骤："
echo ""
echo "1. 连接到服务器："
echo "   ssh user@thus.caiths.com"
echo ""
echo "2. 备份当前代码："
echo "   cd /path/to/thus-note"
echo "   tar -czf backup-\$(date +%Y%m%d-%H%M%S).tar.gz thus-backends/thus-server"
echo ""
echo "3. 上传新代码："
echo "   # 在本地执行"
echo "   rsync -avz --exclude node_modules --exclude dist thus-backends/thus-server/ user@thus.caiths.com:/path/to/thus-note/thus-backends/thus-server/"
echo ""
echo "4. 在服务器上安装依赖并构建："
echo "   cd /path/to/thus-note/thus-backends/thus-server"
echo "   npm install"
echo "   npm run build"
echo ""
echo "5. 更新环境变量："
echo "   nano .env"
echo "   # 添加以下变量："
echo "   # WECHAT_APPID=your_wechat_appid"
echo "   # WECHAT_APP_SECRET=your_wechat_app_secret"
echo "   # AUTH_SERVICE_URL=https://auth.caiths.com"
echo "   # AUTH_SERVICE_SECRET=your_auth_service_secret"
echo ""
echo "6. 清理旧日志（可选）："
echo "   rm -rf logs/*"
echo "   rm -rf uploads/*  # 谨慎操作，会删除所有上传文件"
echo ""
echo "7. 重启服务："
echo "   pm2 restart thus-server"
echo "   # 或"
echo "   npm start"
echo ""
echo "8. 查看日志："
echo "   pm2 logs thus-server"
echo "   # 或"
echo "   tail -f logs/combined.log"
echo ""
echo "=========================================="
