# Thus-Note 快速部署指南 (宝塔面板)

## 🎯 部署流程概览

```
GitHub Actions 自动构建 → 下载 Release 包 → 上传到服务器 → 配置并运行
```

---

## 📋 服务器准备

### 1. 宝塔面板软件安装

在宝塔 **软件商店** 安装:

| 软件 | 版本 | 说明 |
|------|------|------|
| **Nginx** | 1.22+ | Web 服务器 |
| **MongoDB** | 5.0+ | 数据库 |
| **Redis** | 6.0+ | 缓存 |
| **PM2 管理器** | 最新版 | Node.js 进程管理 |

### 2. 安装 pnpm (必需)

在宝塔终端或 SSH 执行:

```bash
npm install -g pnpm@9
pnpm -v  # 验证安装
```

### 3. 创建目录

```bash
mkdir -p /www/wwwroot/thus.caiths.com/{frontend,backend}
mkdir -p /www/wwwroot/thus.caiths.com/backend/{logs,pids,uploads}
chown -R www:www /www/wwwroot/thus.caiths.com
```

### 4. 配置数据库

#### MongoDB:
1. 宝塔 → 数据库 → MongoDB → 添加数据库
   - ��据库名: `thus-note`
   - 用户名: `thus_user`
   - 密码: **生成强密码并记录**

#### Redis:
1. 宝塔 → 软件商店 → Redis → 设置
   - 设置访问密码并记录

---

## 🚀 获取构建包

### 方式1: 从 GitHub Release 下载 (推荐)

每次推送代码到 main 分支,GitHub Actions 会自动创建 Release:

1. 访问: https://github.com/poboll/thus-note/releases
2. 下载最新的 `thus-note-日期时间.tar.gz`
3. 验证 SHA256 (可选):
   ```bash
   sha256sum -c thus-note-*.tar.gz.sha256
   ```

### 方式2: 从 Actions 下载

1. 访问: https://github.com/poboll/thus-note/actions
2. 选择最新的成功构建
3. 下载 Artifacts 中的压缩包

---

## 📦 部署步骤

### 1. 上传并解压

```bash
# 上传到服务器 (使用宝塔文件管理或 SCP)
# 解压
tar -xzf thus-note-*.tar.gz
cd thus-note-*  # 或解压后的目录
```

### 2. 部署前端

```bash
# 复制前端文件到网站根目录
cp -r frontend/* /www/wwwroot/thus.caiths.com/frontend/

# 设置权限
chown -R www:www /www/wwwroot/thus.caiths.com/frontend
```

### 3. 部署后端

```bash
# 复制后端文件
cp -r backend/* /www/wwwroot/thus.caiths.com/backend/

# 进入后端目录
cd /www/wwwroot/thus.caiths.com/backend

# 配置环境变��
cp .env.example .env
nano .env  # 或使用宝塔文件编辑器
```

#### .env 配置 (必需):

```env
# 运行环境
NODE_ENV=production
PORT=3000

# 数据库连接
MONGODB_URI=mongodb://thus_user:你的MongoDB密码@127.0.0.1:27017/thus-note?authSource=admin
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=你的Redis密码

# JWT 密钥 (生成强随机字符串,至少32位)
JWT_SECRET=你的超长随机密钥
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# AI 服务 (可选)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# 文件存储 (可选)
QINIU_ACCESS_KEY=
QINIU_SECRET_KEY=
```

#### 安装依赖并启动:

```bash
# 安装生产依赖
pnpm install --production

# 使用 PM2 启动
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 复制输出的命令并执行

# 查看状态
pm2 status
pm2 logs thus-server
```

### 4. 配置 Nginx

#### 在宝塔面板:

1. **网站** → **添加站点**
   - 域名: `thus.caiths.com`
   - 根目录: `/www/wwwroot/thus.caiths.com/frontend`

2. **网站设置** → **配置文件**,添加以下配置:

```nginx
# 前端路由支持
location / {
    try_files $uri $uri/ /index.html;
}

# API 反向代理
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# WebSocket 支持
location /ws/ {
    proxy_pass http://127.0.0.1:3000/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

完整配置参考: [deploy/nginx.conf](nginx.conf)

### 5. 配置 SSL

1. 网站设置 → **SSL**
2. 选择 **Let's Encrypt**
3. 申请免费证书
4. 开启 **强制 HTTPS**

---

## ✅ 验证部署

### 检查服务

```bash
# PM2 状态
pm2 status

# 查看日志
pm2 logs thus-server

# 重启服务
pm2 restart thus-server
```

### 访问测试

- **前端**: https://thus.caiths.com
- **健康检查**: https://thus.caiths.com/health
- **API 测试**: https://thus.caiths.com/api/health

---

## 🔄 更新应用

### 自动方式 (推荐):

1. 本地修改代码
2. 提交并推送到 GitHub:
   ```bash
   git add .
   git commit -m "fix: 修复某个问题"
   git push origin main
   ```
3. GitHub Actions 自动构建并创建 Release
4. 从 Release 下载新版本
5. 重复上面的部署步骤

### 快速更新:

```bash
# 下载新版本解压后
cd thus-note-新版本

# 更新前端
cp -r frontend/* /www/wwwroot/thus.caiths.com/frontend/

# 更新后端
cp -r backend/dist /www/wwwroot/thus.caiths.com/backend/
cd /www/wwwroot/thus.caiths.com/backend
pnpm install --production  # 更新依赖
pm2 restart thus-server    # 重启服务
```

---

## 🐛 故障排查

### 后端启动失败

```bash
# 查看详细日志
pm2 logs thus-server --lines 100

# 检查端口占用
netstat -tunlp | grep 3000

# 手动测试
cd /www/wwwroot/thus.caiths.com/backend
node dist/index.js
```

### 数据库连接失败

```bash
# 测试 MongoDB
mongo -u thus_user -p密码 --authenticationDatabase admin thus-note

# 测试 Redis
redis-cli -a 密码
ping
```

### 前端访问 404

```bash
# 检查文件权限
ls -l /www/wwwroot/thus.caiths.com/frontend/

# 检查 Nginx 配置
nginx -t
```

---

## 📚 相关文档

- **完整部署文档**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Nginx 配置**: [nginx.conf](nginx.conf)
- **GitHub 仓库**: https://github.com/poboll/thus-note

---

## 📝 注意事项

1. ✅ **首次部署**需要配置 `.env` 文件
2. ✅ **JWT_SECRET** 必须是强随机字符串
3. ✅ **数据库密码** 要足够复杂
4. ✅ **定期备份** MongoDB 数据库
5. ✅ 查看 PM2 日志排查问题

---

<div align="center">

**部署成功! 🎉**

访问: https://thus.caiths.com

</div>
