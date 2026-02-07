# Thus-Note 部署文件说明

本目录包含 Thus-Note 项目的所有部署配置文件和文档。

## 📁 文件清单

| 文件/脚本 | 说明 | 用途 |
|-----------|------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 📘 **完整部署指南** | 从零开始的详细部署教程,包含宝塔面板配置 |
| [build-production.sh](./build-production.sh) | 🏗️ **生产环境构建脚本** | 在本地构建前端和后端,生成部署包 |
| [nginx.conf](./nginx.conf) | ⚙️ **Nginx 配置示例** | 用于宝塔面板的 Nginx 反向代理配置 |
| [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) | 🤖 **GitHub Actions 配置指南** | 自动化部署的详细设置教程 |

## 🚀 快速开始

### 方式一: 本地打包上传部署 (推荐新手)

1. **本地构建**:
   ```bash
   cd thus-note
   ./deploy/build-production.sh
   ```

2. **上传到服务器**:
   - 将生成的 `thus-note-production-*.tar.gz` 上传到服务器
   - 解压并部署到对应目录

3. **查看完整步骤**: [DEPLOYMENT.md - 方式A](./DEPLOYMENT.md#方式a-本地打包上传部署)

### 方式二: GitHub Actions 自动化部署 (推荐生产环境)

1. **配置 SSH 密钥**: 参考 [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
2. **添加 GitHub Secrets**: 在仓库设置中配置服务器信息
3. **推送代码**: `git push origin main` 即可自动部署

---

## 📚 详细文档

### [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南

**包含内容**:
- ✅ 服务器环境准备 (CentOS + 宝塔)
- ✅ MongoDB 和 Redis 安装配置
- ✅ 两种部署方式的详细步骤
- ✅ Nginx 反向代理配置
- ✅ SSL 证书申请
- ✅ 故障排查和维护
- ✅ 完整的部署检查清单

**适用场景**: 首次部署、全面了解部署流程

### [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - 自动化部署指南

**包含内容**:
- ✅ SSH 密钥生成和配置
- ✅ GitHub Secrets 设置
- ✅ 工作流使用方法
- ✅ 故障排查

**适用场景**: 配置 CI/CD 自动化部署

---

## 🛠️ 配置文件

### PM2 配置

位置: `thus-backends/thus-server/ecosystem.config.js`

PM2 进程管理配置,包��:
- 集群模式配置
- 自动重启策略
- 日志管理
- 内存限制

### Nginx 配置

位置: `deploy/nginx.conf`

包含:
- 前端静态文件托管
- API 反向代理
- WebSocket 支持
- 缓存策略
- 安全头配置

### GitHub Actions 工作流

位置: `.github/workflows/deploy.yml`

自动化流程:
1. 检出代码
2. 安装依赖
3. 构建前后端
4. 上传到服务器
5. 重启服务
6. 健康检查

---

## 🗂️ 服务器目录结构

```
/www/wwwroot/thus.caiths.com/
├── frontend/              # 前端静态文件
│   ├── index.html
│   ├── assets/
│   └── ...
└── backend/               # 后端 Node.js 代码
    ├── dist/              # 编译后的代码
    ├── logs/              # 日志目录
    ├── pids/              # PID 文件
    ├── uploads/           # 用户上传文件
    ├── .env               # 环境变量 (需手动配置)
    ├── package.json
    └── ecosystem.config.js
```

---

## 💾 数据库要求

### MongoDB
- **版本**: 5.0+
- **用途**: 主数据库,存储用户数据、笔记、内容等
- **配置**: 通过宝塔面板安装

### Redis
- **版本**: 6.0+
- **用途**: 缓存和会话管理
- **配置**: 通过宝塔面板安装

---

## 🔐 环境变量配置

后端需要配置 `.env` 文件,主要包含:

```env
# 运行环境
NODE_ENV=production
PORT=3000

# 数据库
MONGODB_URI=mongodb://用户:密码@127.0.0.1:27017/thus-note?authSource=admin
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=密码

# JWT 密钥
JWT_SECRET=超长随机密钥

# AI 服务 (可选)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

详细配置说明: [DEPLOYMENT.md - 配置环境变量](./DEPLOYMENT.md#a3-配置环境变量)

---

## ✅ 部署前检查清单

- [ ] 服务器已安装宝塔面板
- [ ] 已安装 Nginx, MongoDB, Redis, PM2
- [ ] 已创建必要的目录结构
- [ ] MongoDB 数据库已创建并授权
- [ ] Redis 已设置密码
- [ ] 域名 DNS 已正确解析
- [ ] 防火墙已开放 80, 443 端口

---

## 🆘 获取帮助

### 文档
- [完整部署指南](./DEPLOYMENT.md)
- [GitHub Actions 设置](./GITHUB_ACTIONS_SETUP.md)
- [项目 README](../README.md)

### 社区支持
- **GitHub Issues**: https://github.com/poboll/thus-note/issues
- **GitHub Discussions**: https://github.com/poboll/thus-note/discussions

### 常见问题
- [故障排查](./DEPLOYMENT.md#9-故障排查)
- [维护与更新](./DEPLOYMENT.md#10-维护与更新)

---

## 📝 更新日志

- **2025-02-07**: 创建部署文档和配置文件
  - 添加完整部署指南
  - 添加 GitHub Actions 自动化部署
  - 添加 Nginx 和 PM2 配置示例

---

<div align="center">

**部署愉快! 🚀**

有问题欢迎提 Issue

</div>
