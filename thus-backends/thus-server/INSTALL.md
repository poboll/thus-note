# 如是(Thus-Note) 后端安装指南

## 📦 前置要求

- Node.js >= 18
- MongoDB (OrbStack或本地安装)
- Redis (Docker或本地安装)
- npm 或 pnpm

## 🚀 快速安装

### 1. 安装依赖

```bash
cd thus-backends/thus-server
npm install
```

### 2. 配置环境变量

复制`.env.example`到`.env`：

```bash
cp .env.example .env
```

编辑`.env`文件，配置必要的变量：

```env
# 服务器配置
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# MongoDB配置
MONGODB_URI=mongodb://localhost:27017/thus-note

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=your-secret-key-change-in-production
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# AI服务配置（可选）
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo

ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=
ANTHROPIC_DEFAULT_MODEL=claude-3-sonnet-20240229

GEMINI_API_KEY=
GEMINI_DEFAULT_MODEL=gemini-pro

# OAuth配置（可选）
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_CALLBACK_URL=http://localhost:3000/api/auth/wechat/callback

# 邮件服务配置（可选）
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@thus-note.com

# 短信服务配置（可选）
TENCENT_SMS_SECRET_ID=
TENCENT_SMS_SECRET_KEY=
TENCENT_SMS_REGION=ap-guangzhou
TENCENT_SMS_APP_ID=
TENCENT_SMS_SIGN_NAME=如是笔记
TENCENT_SMS_TEMPLATE_ID=

# Sentry配置（可选）
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# MeiliSearch配置（可选）
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=

# 前端URL
FRONTEND_URL=http://localhost:5175

# 日志级别
LOG_LEVEL=info
```

### 3. 启动服务

```bash
npm run dev
```

服务将在 http://localhost:3000 启动

### 4. 验证安装

访问健康检查端点：

```bash
curl http://localhost:3000/health
```

应该返回：

```json
{
  "status": "ok",
  "message": "Thus-Note Server is running",
  "timestamp": "2026-01-14T...",
  "connections": {
    "mongodb": true,
    "redis": true
  },
  "uptime": ...
}
```

## 📋 功能清单

### 核心功能
- ✅ 用户认证（注册、登录、登出、刷新令牌）
- ✅ 笔记管理（创建、获取、更新、删除、搜索）
- ✅ 内容管理（创建、获取、更新、删除、内容块管理）
- ✅ 评论管理（创建、获取、更新、删除、回复）
- ✅ 任务管理（创建、获取、更新、删除、子任务）
- ✅ 数据同步（sync-get、sync-set、sync-operate）
- ✅ 用户设置（获取、更新）
- ✅ 文件上传下载

### AI功能
- ✅ AI提示（支持OpenAI、Claude、Gemini）
- ✅ AI总结
- ✅ AI分析
- ✅ AI翻译
- ✅ AI代码生成
- ✅ AI问答

### 安全功能
- ✅ JWT认证
- ✅ 密码哈希和验证
- ✅ 请求频率限制
- ✅ XSS防护
- ✅ SQL注入防护
- ✅ Helmet安全头

### 性能功能
- ✅ Redis缓存
- ✅ Winston日志
- ✅ Prometheus监控
- ✅ Sentry错误追踪

### 高级功能
- ✅ WebSocket实时通知
- ✅ 数据导出（JSON、CSV、Excel、Markdown）
- ✅ 数据导入（JSON）
- ✅ 全文搜索（MeiliSearch）

## 🔧 故障排除

### MongoDB连接失败

检查MongoDB是否运行：

```bash
# OrbStack
orb status

# 本地MongoDB
brew services list | grep mongodb
```

### Redis连接失败

检查Redis是否运行：

```bash
# Docker
docker ps | grep redis

# 本地Redis
redis-cli ping
```

### 端口被占用

检查端口3000是否被占用：

```bash
lsof -i :3000
```

如果被占用，可以修改`.env`中的`PORT`变量或停止占用端口的进程。

### 依赖安装失败

清除npm缓存并重新安装：

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 相关文档

- [实现总结](IMPLEMENTATION_SUMMARY.md)
- [完整实现总结](IMPLEMENTATION_COMPLETE_SUMMARY.md)
- [集成测试计划](INTEGRATION_TEST_PLAN.md)
- [功能扩展计划](FEATURE_EXPANSION_PLAN.md)
- [前后端集成测试](../FRONTEND_BACKEND_INTEGRATION_TEST.md)

## 🎯 下一步

1. 运行集成测试
2. 修复发现的问题
3. 应用安全中间件
4. 应用验证中间件
5. 优化性能
6. 部署到生产环境

---

**更新时间**: 2026年1月14日
**文档版本**: v1.0
**维护者**: Thus-Note Team
