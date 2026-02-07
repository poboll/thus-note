# Thus-Note 生产环境部署完整指南

<div align="center">

**部署目标**: CentOS + 宝塔面板
**域名**: thus.caiths.com
**架构**: Vue 3 前端 + Node.js 后端 + MongoDB + Redis

</div>

---

## 📋 目录

1. [服务器环境准备](#1-服务器环境准备)
2. [数据库配置](#2-数据库配置)
3. [部署方式选择](#3-部署方式选择)
4. [方式A: 本地打包上传部署](#方式a-本地打包上传部署)
5. [方式B: GitHub Actions 自动化部署](#方式b-github-actions-自动化部署)
6. [Nginx 配置](#6-nginx-配置)
7. [SSL 证书配置](#7-ssl-证书配置)
8. [验证与测试](#8-验证与测试)
9. [故障排查](#9-故障排查)
10. [维护与更新](#10-维护与更新)

---

## 1. 服务器环境准备

### 1.1 系统要求

- **操作系统**: CentOS 7/8 或 Rocky Linux
- **内存**: 最低 2GB,推荐 4GB+
- **磁盘**: 最低 20GB,推荐 50GB+
- **网络**: 公网 IP,开放端口 22, 80, 443

### 1.2 宝塔面板安装

如果未安装宝塔,执行以下命令:

```bash
# CentOS 7/8
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh
```

安装完成后,访问宝塔面板 Web 界面。

### 1.3 必需软件安装

在宝塔面板 **软件商店** 安装以下软件:

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| **Nginx** | 1.22+ | Web 服务器和反向代理 |
| **MongoDB** | 5.0+ | 主数据库 |
| **Redis** | 6.0+ | 缓存和会话管理 |
| **PM2 管理器** | 最新版 | Node.js 进程守护 |

#### MongoDB 安装注意事项:
- 如果宝塔软件商店没有 MongoDB,可以使用官方 Docker 镜像:
  ```bash
  docker run -d \
    --name mongodb \
    -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=admin \
    -e MONGO_INITDB_ROOT_PASSWORD=强密码 \
    -v /www/server/mongodb/data:/data/db \
    mongo:7
  ```

#### 安装 pnpm (必需):
```bash
# 在宝塔终端或 SSH 执行
npm install -g pnpm@9
pnpm -v  # 验证安装
```

### 1.4 创建目录结构

```bash
# 创建网站根目录
mkdir -p /www/wwwroot/thus.caiths.com/{frontend,backend}

# 创建后端必要目录
mkdir -p /www/wwwroot/thus.caiths.com/backend/{logs,pids,uploads}

# 创建备份目录
mkdir -p /www/backup/thus-note

# 设置权限
chown -R www:www /www/wwwroot/thus.caiths.com
chmod -R 755 /www/wwwroot/thus.caiths.com
```

---

## 2. 数据库配置

### 2.1 MongoDB 配置

#### 通过宝塔面板配置:

1. 进入 **数据库** → **MongoDB**
2. 点击 **设置** → **访问限制**: 仅允许 `127.0.0.1`
3. 点击 **添加数据库**:
   - 数据库名: `thus-note`
   - 用户名: `thus_user`
   - 密码: `生成强密码` (记录下来)
   - 权限: `readWrite`

4. **测试连接**:
   ```bash
   mongo -u thus_user -p '密码' --authenticationDatabase admin thus-note
   ```

#### 连接字符串:
```
mongodb://thus_user:密码@127.0.0.1:27017/thus-note?authSource=admin
```

### 2.2 Redis 配置

1. 进入 **软件商店** → **Redis** → **设置**
2. 设置 **访问密码** (强密码)
3. **监听地址**: `127.0.0.1` (安全)
4. **端口**: `6379` (默认)

#### 测试连接:
```bash
redis-cli -a '密码'
ping  # 应返回 PONG
```

---

## 3. 部署方式选择

### 🅰️ 方式A: 本地打包上传 (适合首次部署/快速测试)

**优点**: 简单快速,无需配置 CI/CD
**缺点**: 每次更新需手动操作
**适用**: 小团队,更新频率低

### 🅱️ 方式B: GitHub Actions 自动化 (推荐生产环境)

**优点**: 推送代码自动部署,专业可靠
**缺点**: 需要配置 SSH 密钥和 Secrets
**适用**: 长期维护,频繁更新

---

## 方式A: 本地打包上传部署

### A1. 本地构建

```bash
# 进入项目根目录
cd thus-note

# 执行构建脚本
./deploy/build-production.sh
```

构建完成后,会生成:
- `thus-note-production-日期时间.tar.gz` - 压缩包
- `dist/` - 构建产物目录

### A2. 上传到服务器

#### 使用 SCP 上传:
```bash
# 上传压缩包
scp thus-note-production-*.tar.gz root@服务器IP:/root/

# 登录服务器
ssh root@服务器IP

# 解压
cd /root
tar -xzf thus-note-production-*.tar.gz

# 部署前端
rm -rf /www/wwwroot/thus.caiths.com/frontend/*
cp -r frontend/* /www/wwwroot/thus.caiths.com/frontend/

# 部署后端
rm -rf /www/wwwroot/thus.caiths.com/backend/dist
cp -r backend/* /www/wwwroot/thus.caiths.com/backend/
```

#### 或使用宝塔面板上传:
1. 进入 **文件** → `/www/wwwroot/thus.caiths.com/`
2. 上传压缩包并解压
3. 移动文件到对应目录

### A3. 配置环境变量

```bash
cd /www/wwwroot/thus.caiths.com/backend

# 复制环境变量���板
cp .env.example .env

# 编辑配置
nano .env
```

**必需配置**:
```env
# 运行环境
NODE_ENV=production
PORT=3000

# 数据库
MONGODB_URI=mongodb://thus_user:密码@127.0.0.1:27017/thus-note?authSource=admin
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=Redis密码

# JWT 密钥 (生成强随机字符串)
JWT_SECRET=你的超长随机密钥至少32位
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# AI 服务 (可选)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# 文件存储 (可选)
QINIU_ACCESS_KEY=
QINIU_SECRET_KEY=
QINIU_BUCKET=
QINIU_DOMAIN=

# 邮件服务 (可选)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=noreply@example.com
EMAIL_PASS=密码
EMAIL_FROM=Thus-Note <noreply@example.com>
```

### A4. 安装依赖并启动

```bash
cd /www/wwwroot/thus.caiths.com/backend

# 安装生产依赖
pnpm install --production --frozen-lockfile

# 启动服务 (使用 PM2)
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 复制输出的命令并执行

# 查看运行状态
pm2 status
pm2 logs thus-server
```

---

## 方式B: GitHub Actions 自动化部署

### B1. 生成 SSH 密钥

在本地执行:

```bash
# 生成密钥对 (不设置密码)
ssh-keygen -t rsa -b 4096 -C "github-deploy" -f ~/.ssh/thus-note-deploy

# 查看公钥 (添加到服务器)
cat ~/.ssh/thus-note-deploy.pub

# 查看私钥 (添加到 GitHub Secrets)
cat ~/.ssh/thus-note-deploy
```

### B2. 将公钥添加到服务器

```bash
# 方式一: 自动添加
ssh-copy-id -i ~/.ssh/thus-note-deploy.pub root@服务器IP

# 方式二: 手动添加
# 登录服务器,执行:
echo "公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### B3. 配置 GitHub Secrets

1. 进入 GitHub 仓库: `Settings` → `Secrets and variables` → `Actions`
2. 添加以下 Secrets:

| 名称 | 值 | 说明 |
|------|-----|------|
| `SERVER_HOST` | `123.456.789.0` | 服务器 IP |
| `SERVER_USERNAME` | `root` | SSH 用户名 |
| `SERVER_SSH_KEY` | `私钥完整内容` | SSH 私钥 |
| `SERVER_PORT` | `22` | SSH 端口 (可选) |

### B4. 配置服务器环境

```bash
# 创建 .env 文件 (参考方式A的配置)
cd /www/wwwroot/thus.caiths.com/backend
nano .env
```

### B5. 推送代码触发部署

```bash
# 提交代码
git add .
git commit -m "feat: 配置自动化部署"
git push origin main

# GitHub Actions 会自动:
# 1. 构建前端和后端
# 2. 上传到服务器
# 3. 安装依赖
# 4. 重启 PM2 服务
```

查看部署进度: GitHub 仓库 → `Actions` 标签

---

## 6. Nginx 配置

### 6.1 创建网站

1. 宝塔面板 → **网站** → **添加站点**
2. 配置:
   - **域名**: `thus.caiths.com`
   - **根目录**: `/www/wwwroot/thus.caiths.com/frontend`
   - **PHP 版本**: 纯静态
   - **创建 FTP**: 否
   - **创建数据库**: 否

### 6.2 修改配置文件

进入网站设置 → **配置文件**,替换为以下内容:

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name thus.caiths.com;

    # SSL 证书 (宝塔会自动添加)
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/key.pem;

    root /www/wwwroot/thus.caiths.com/frontend;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持
    location /ws/ {
        proxy_pass http://127.0.0.1:3000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
```

### 6.3 测试配置

```bash
nginx -t  # 测试配置文件语法
nginx -s reload  # 重载配置
```

---

## 7. SSL 证书配置

### 7.1 Let's Encrypt 免费证书 (推荐)

1. 网站设置 → **SSL**
2. 选择 **Let's Encrypt**
3. 勾选域名: `thus.caiths.com`
4. 点击 **申请**
5. 开启 **强制 HTTPS**

### 7.2 自动续期

宝塔会自动续期,无需手动操作。

---

## 8. 验证与测试

### 8.1 检查服务状态

```bash
# PM2 状态
pm2 status

# MongoDB
mongo -u thus_user -p --authenticationDatabase admin thus-note
show dbs

# Redis
redis-cli -a 密码
ping

# Nginx
systemctl status nginx
```

### 8.2 访问测试

- **前端**: https://thus.caiths.com
- **健康检查**: https://thus.caiths.com/health
- **API 测试**: https://thus.caiths.com/api/health

### 8.3 功能测试

1. 注册新用户
2. 登录
3. 创建笔记
4. 上传图片
5. 同步数据
6. AI 功能 (如果配置了 API Key)

---

## 9. 故障排查

### 9.1 前端无法访问

```bash
# 检查 Nginx
systemctl status nginx
nginx -t

# 查看错误日志
tail -f /www/wwwlogs/thus.caiths.com.error.log

# 检查文件权限
ls -l /www/wwwroot/thus.caiths.com/frontend/
```

### 9.2 后端 API 502 错误

```bash
# 检查 PM2 状态
pm2 status
pm2 logs thus-server

# 手动启动测试
cd /www/wwwroot/thus.caiths.com/backend
node dist/index.js

# 检查端口占用
netstat -tunlp | grep 3000
```

### 9.3 数据库连接失败

```bash
# 测试 MongoDB
mongo -u thus_user -p密码 --authenticationDatabase admin thus-note

# 检查 Redis
redis-cli -a 密码
ping

# 查看后端日志
pm2 logs thus-server --lines 100
```

### 9.4 内存不足

```bash
# 查看内存使用
free -h

# PM2 内存限制
pm2 start ecosystem.config.js --max-memory-restart 500M

# 添加 Swap (如果内存 < 2GB)
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 10. 维护与更新

### 10.1 查看日志

```bash
# PM2 日志
pm2 logs thus-server
pm2 logs thus-server --lines 100

# Nginx 日志
tail -f /www/wwwlogs/thus.caiths.com.log
tail -f /www/wwwlogs/thus.caiths.com.error.log

# 系统日志
journalctl -u nginx -f
```

### 10.2 备份

```bash
# 数据库备份
mongodump -u thus_user -p密码 --authenticationDatabase admin -d thus-note -o /www/backup/thus-note/db-$(date +%Y%m%d)

# 文件备份
tar -czf /www/backup/thus-note/files-$(date +%Y%m%d).tar.gz /www/wwwroot/thus.caiths.com/backend/uploads

# 自动备份脚本 (crontab)
0 2 * * * /usr/local/bin/backup-thus-note.sh
```

### 10.3 更新应用

**方式A (手动)**:
```bash
# 本地构建
./deploy/build-production.sh

# 上传并解压
scp thus-note-production-*.tar.gz root@服务器:/root/

# 服务器操作
ssh root@服务器
cd /root
tar -xzf thus-note-production-*.tar.gz
cp -r frontend/* /www/wwwroot/thus.caiths.com/frontend/
cp -r backend/dist /www/wwwroot/thus.caiths.com/backend/

# 重启
cd /www/wwwroot/thus.caiths.com/backend
pnpm install --production
pm2 restart thus-server
```

**方式B (自动)**:
```bash
# 推送代码,GitHub Actions 自动部署
git push origin main
```

### 10.4 性能优化

```bash
# PM2 集群模式 (利用多核 CPU)
pm2 delete thus-server
pm2 start ecosystem.config.js -i 4  # 4 个实例

# Redis 持久化
redis-cli CONFIG SET save "900 1 300 10 60 10000"

# MongoDB 索引优化
mongo -u thus_user -p --authenticationDatabase admin thus-note
db.threads.createIndex({userId: 1, createdAt: -1})
db.contents.createIndex({threadId: 1, createdAt: -1})
```

---

## 📞 获取帮助

- **GitHub Issues**: https://github.com/poboll/thus-note/issues
- **文档**: 查看项目 README.md
- **日志分析**: 提供 PM2 日志和 Nginx 错误日志

---

## ✅ 部署检查清单

### 服务器准备
- [ ] 宝塔面板已安装
- [ ] Nginx 已安装
- [ ] MongoDB 已安装并配置
- [ ] Redis 已安装并配置
- [ ] PM2 管理器已安装
- [ ] pnpm 已安装
- [ ] 目录已创建并设置权限

### 数据库配置
- [ ] MongoDB 数据库已创建
- [ ] MongoDB 用户已创建并授权
- [ ] Redis 密码已设置
- [ ] 数据库连接测试通过

### 应用部署
- [ ] 前端文件已部署
- [ ] 后端文件已部署
- [ ] .env 环境变量已配置
- [ ] 后端依赖已安装
- [ ] PM2 服务已启动

### Nginx 配置
- [ ] 网站已创建
- [ ] Nginx 配置已修改
- [ ] 反向代理已配置
- [ ] 配置测试通过

### SSL 证书
- [ ] SSL 证书已申请
- [ ] 强制 HTTPS 已开启
- [ ] HTTPS 访问正常

### 功能测试
- [ ] 前端页面可访问
- [ ] API 接口正常
- [ ] 用户注册/登录正常
- [ ] 数据持久化正常
- [ ] 文件上传正常

### 监控与维护
- [ ] 日志正常输出
- [ ] PM2 监控正常
- [ ] 备份策略已配置
- [ ] 自动更新已配置 (如使用 GitHub Actions)

---

<div align="center">

**部署完成! 🎉**

访问你的应用: https://thus.caiths.com

</div>
