# GitHub Actions 部署配置说明

## 📋 需要配置的 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets:

### 进入路径:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### 必需的 Secrets:

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP 地址或域名 | `123.456.789.0` |
| `SERVER_USERNAME` | SSH 登录用户名 | `root` 或 `www` |
| `SERVER_SSH_KEY` | SSH 私钥 (完整内容) | 见下方生成方法 |
| `SERVER_PORT` | SSH 端口 (可选,默认 22) | `22` |

---

## 🔑 SSH 密钥生成步骤

### 1. 在本地生成 SSH 密钥对

```bash
# 生成 SSH 密钥 (不设置密码,否则 GitHub Actions 无法使用)
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/thus-note-deploy

# 生成的文件:
# - ~/.ssh/thus-note-deploy     (私钥) → 添加到 GitHub Secrets
# - ~/.ssh/thus-note-deploy.pub (公钥) → 添加到服务器
```

### 2. 将公钥添加到服务器

```bash
# 方式一: 使用 ssh-copy-id (推荐)
ssh-copy-id -i ~/.ssh/thus-note-deploy.pub root@你的服务器IP

# 方式二: 手动复制
cat ~/.ssh/thus-note-deploy.pub
# 复制输出内容,然后在服务器上执行:
# echo "复制的公钥内容" >> ~/.ssh/authorized_keys
```

### 3. 测试 SSH 连接

```bash
ssh -i ~/.ssh/thus-note-deploy root@你的服务器IP

# 如果能成功登录,说明配置正确
```

### 4. 将私钥添加到 GitHub Secrets

```bash
# 查看私钥内容
cat ~/.ssh/thus-note-deploy

# 复制完整输出 (包括 -----BEGIN ... 和 -----END ... 行)
# 添加到 GitHub Secrets 中,名称为: SERVER_SSH_KEY
```

---

## 🚀 使用方法

### 自动部署

推送代码到 `main` 分支时自动触发:

```bash
git add .
git commit -m "feat: 更新功能"
git push origin main
```

GitHub Actions 会自动:
1. 构建前端和后端
2. 部署到服务器
3. 重启 PM2 服务
4. 执行健康检查

### 手动部署

在 GitHub 仓库页面:
1. 进入 `Actions` 标签
2. 选择 `Deploy to Production Server` 工作流
3. 点击 `Run workflow`
4. 选择分支并运行

---

## 📁 服务器目录结构

确保服务器上存在以下目录:

```
/www/wwwroot/thus.caiths.com/
├── frontend/          # 前端静态文件 (自动部署)
└── backend/           # 后端 Node.js 代码 (自动部署)
    ├── dist/          # 编译后的 JS 代码
    ├── logs/          # 日志目录
    ├── pids/          # PID 文件
    ├── uploads/       # 上传文件
    ├── .env           # 环境变量 (需手动配置)
    ├── package.json
    └── ecosystem.config.js
```

**重要**: `.env` 文件需要手动在服务器上创建并配置!

---

## ⚙️ 服务器环境准备

### 1. 安装必要软件 (通过宝塔面板)

- [x] MongoDB 5.0+
- [x] Redis 6.0+
- [x] PM2 管理器 (包含 Node.js 18+)
- [x] Nginx
- [x] pnpm (通过 PM2 终端安装: `npm install -g pnpm`)

### 2. 创建目录

```bash
mkdir -p /www/wwwroot/thus.caiths.com/{frontend,backend}
mkdir -p /www/wwwroot/thus.caiths.com/backend/{logs,pids,uploads}
mkdir -p /www/backup/thus-note
```

### 3. 配置 .env 文件

```bash
cd /www/wwwroot/thus.caiths.com/backend
nano .env
```

必需配置:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://用户:密码@127.0.0.1:27017/thus-note?authSource=admin
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=你的Redis密码
JWT_SECRET=生成一个强随机密钥
```

### 4. 配置 Nginx

参考 `deploy/nginx.conf` 文件,在宝塔面板配置网站。

### 5. 申请 SSL 证书

在宝塔面板申请 Let's Encrypt 免费证书。

---

## 🔍 故障排查

### 部署失败

```bash
# 查看 GitHub Actions 日志
# 在 GitHub 仓库的 Actions 标签查看详细错误信息
```

### SSH 连接失败

```bash
# 在本地测试 SSH 连接
ssh -i ~/.ssh/thus-note-deploy -v root@服务器IP

# 检查服务器 SSH 配置
cat /etc/ssh/sshd_config | grep PubkeyAuthentication
# 确保: PubkeyAuthentication yes
```

### PM2 启动失败

```bash
# 在服务器上手动测试
cd /www/wwwroot/thus.caiths.com/backend
pm2 start ecosystem.config.js
pm2 logs thus-server  # 查看错误日志
```

### 健康检查失败

```bash
# 检查服务是否运行
pm2 status

# 检查后端日志
pm2 logs thus-server

# 测试健康端点
curl http://localhost:3000/health
curl https://thus.caiths.com/health
```

---

## 📝 注意事项

1. **首次部署** 需要手动在服务器配置 `.env` 文件
2. **数据库迁移** 需要手动执行 (如果有)
3. **备份策略** 部署前会自动备份,保留最近 10 个版本
4. **回滚方法** ���果部署失败,可以从备份中恢复:
   ```bash
   cd /www/backup/thus-note
   tar -xzf backend-最新时间戳.tar.gz -C /www/wwwroot/thus.caiths.com/backend
   pm2 restart thus-server
   ```

---

## ✅ 部署检查清单

- [ ] 已配置 GitHub Secrets (4 个)
- [ ] SSH 密钥已添加到服务器
- [ ] 服务器已安装必要软件
- [ ] 服务器目录已创建
- [ ] 后端 .env 文件已配置
- [ ] MongoDB 和 Redis 已启动
- [ ] Nginx 已配置
- [ ] SSL 证书已申请
- [ ] 首次手动部署测试成功

---

需要帮助? 查看完整部署文档: `deploy/DEPLOYMENT.md`
