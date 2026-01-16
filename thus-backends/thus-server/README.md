# 如是(Thus-Note) 后端服务

## 📋 概述

如是(Thus-Note)后端是基于Node.js + Express + TypeScript构建的本地服务，支持MongoDB和Redis，提供完整的REST API接口。

## 🚀 快速开始

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

编辑`.env`文件，配置必要的变量。最小配置需要：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# MongoDB配置（使用OrbStack的MongoDB）
MONGODB_URI=mongodb://localhost:27017/thus-note

# Redis配置（使用Docker的Redis）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_SECRET=thus-note-jwt-secret-key-development-only
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# 前端URL
FRONTEND_URL=http://localhost:5175

# 日志级别
LOG_LEVEL=info
```

### 3. 启动Redis（使用Docker）

```bash
cd thus-backends/thus-server
docker-compose up -d redis
```

### 4. 启动服务

```bash
npm run dev
```

服务将在 http://localhost:3000 启动

### 5. 验证安装

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

## 📂 项目结构

```
thus-backends/thus-server/
├── src/
│   ├── config/              # 配置文件
│   │   ├── database.ts       # MongoDB配置
│   │   ├── redis.ts          # Redis配置
│   │   ├── ai.ts            # AI服务配置
│   │   ├── oauth.ts         # OAuth配置
│   │   ├── email.ts         # 邮件服务配置
│   │   ├── sms.ts           # 短信服务配置
│   │   ├── logger.ts        # 日志配置
│   │   └── sentry.ts       # Sentry配置
│   ├── models/              # 数据模型
│   │   ├── User.ts          # 用户模型
│   │   ├── Thread.ts        # 笔记/任务/日历/看板模型
│   │   ├── Content.ts       # 内容模型（原子化）
│   │   ├── Comment.ts       # 评论模型
│   │   ├── Task.ts          # 任务模型
│   │   └── Token.ts         # Token模型（JWT）
│   ├── routes/              # API路由
│   │   ├── auth.ts          # 认证API
│   │   ├── threads.ts       # 笔记API
│   │   ├── contents.ts      # 内容API
│   │   ├── comments.ts      # 评论API
│   │   ├── sync.ts          # 同步API
│   │   ├── settings.ts      # 设置API
│   │   ├── files.ts         # 文件API
│   │   └── ai.ts            # AI API
│   ├── middleware/          # 中间件
│   │   ├── auth.ts          # 认证中间件
│   │   └── security.ts      # 安全中间件
│   ├── services/            # 服务类
│   │   ├── aiService.ts     # AI服务
│   │   ├── emailService.ts  # 邮件服务
│   │   ├── smsService.ts    # 短信服务
│   │   ├── cacheService.ts  # 缓存服务
│   │   ├── exportService.ts # 导出服务
│   │   ├── importService.ts  # 导入服务
│   │   ├── searchService.ts  # 搜索服务
│   │   ├── websocketService.ts # WebSocket服务
│   │   └── monitorService.ts # 监控服务
│   ├── utils/              # 工具类
│   │   ├── password.ts       # 密码工具
│   │   ├── encryption.ts    # 加密工具
│   │   └── jwt.ts          # JWT工具
│   ├── validators/          # 验证器
│   │   ├── auth.validator.ts  # 认证验证
│   │   └── thread.validator.ts # 笔记验证
│   ├── types/              # 类型定义
│   │   └── api.types.ts      # API类型
│   └── index.ts            # 主入口
├── tests/                 # 测试文件
│   ├── integration-test.sh  # Bash测试脚本
│   └── integration_test.py  # Python测试脚本
├── uploads/                # 文件上传目录
├── logs/                  # 日志目录
├── package.json
├── tsconfig.json
├── .env.example
├── .env
├── INSTALL.md              # 安装指南
├── IMPLEMENTATION_SUMMARY.md # 实现总结
├── INTEGRATION_TEST_PLAN.md # 集成测试计划
└── FEATURE_EXPANSION_PLAN.md # 功能扩展计划
```

## 🔧 配置说明

### 环境变量

所有环境变量在`.env`文件中配置。以下是完整的环境变量列表：

#### 服务器配置
- `PORT`: 服务器端口（默认：3000）
- `NODE_ENV`: 运行环境（development/production）
- `CORS_ORIGIN`: CORS允许的源（默认：*）

#### 数据库配置
- `MONGODB_URI`: MongoDB连接字符串
- `REDIS_HOST`: Redis主机（默认：localhost）
- `REDIS_PORT`: Redis端口（默认：6379）
- `REDIS_PASSWORD`: Redis密码
- `REDIS_DB`: Redis数据库编号（默认：0）

#### JWT配置
- `JWT_SECRET`: JWT签名密钥
- `JWT_ACCESS_EXPIRES`: 访问令牌过期时间（默认：15m）
- `JWT_REFRESH_EXPIRES`: 刷新令牌过期时间（默认：7d）

#### AI服务配置（可选）
- `OPENAI_API_KEY`: OpenAI API密钥
- `OPENAI_BASE_URL`: OpenAI API基础URL
- `OPENAI_DEFAULT_MODEL`: 默认OpenAI模型（gpt-3.5-turbo）
- `ANTHROPIC_API_KEY`: Anthropic API密钥
- `ANTHROPIC_BASE_URL`: Anthropic API基础URL
- `ANTHROPIC_DEFAULT_MODEL`: 默认Claude模型（claude-3-sonnet-20240229）
- `GEMINI_API_KEY`: Gemini API密钥
- `GEMINI_DEFAULT_MODEL`: 默认Gemini模型（gemini-pro）

#### OAuth配置（可选）
- `GITHUB_CLIENT_ID`: GitHub客户端ID
- `GITHUB_CLIENT_SECRET`: GitHub客户端密钥
- `GITHUB_CALLBACK_URL`: GitHub回调URL
- `GOOGLE_CLIENT_ID`: Google客户端ID
- `GOOGLE_CLIENT_SECRET`: Google客户端密钥
- `GOOGLE_CALLBACK_URL`: Google回调URL
- `WECHAT_APP_ID`: 微信应用ID
- `WECHAT_APP_SECRET`: 微信应用密钥
- `WECHAT_CALLBACK_URL`: 微信回调URL

#### 邮件服务配置（可选）
- `EMAIL_HOST`: SMTP服务器主机
- `EMAIL_PORT`: SMTP端口
- `EMAIL_SECURE`: 是否使用SSL
- `EMAIL_USER`: SMTP用户名
- `EMAIL_PASS`: SMTP密码
- `EMAIL_FROM`: 发件人地址

#### 短信服务配置（可选）
- `TENCENT_SMS_SECRET_ID`: 腾讯云Secret ID
- `TENCENT_SMS_SECRET_KEY`: 腾讯云Secret Key
- `TENCENT_SMS_REGION`: 腾讯云区域
- `TENCENT_SMS_APP_ID`: 腾讯云应用ID
- `TENCENT_SMS_SIGN_NAME`: 短信签名
- `TENCENT_SMS_TEMPLATE_ID`: 短信模板ID

#### Sentry配置（可选）
- `SENTRY_DSN`: Sentry DSN
- `SENTRY_TRACES_SAMPLE_RATE`: 采样率
- `SENTRY_PROFILES_SAMPLE_RATE`: 采样率

#### MeiliSearch配置（可选）
- `MEILISEARCH_HOST`: MeiliSearch主机
- `MEILISEARCH_API_KEY`: MeiliSearch API密钥

#### 其他配置
- `FRONTEND_URL`: 前端URL
- `LOG_LEVEL`: 日志级别（debug/info/warn/error）

## 📡 API端点

### 认证API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/email` - 邮箱登录
- `POST /api/auth/phone` - 手机登录
- `POST /api/auth/github` - GitHub OAuth
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/wechat/gzh` - 微信公众号登录
- `POST /api/auth/wechat/mini` - 微信小程序登录
- `POST /api/auth/refresh` - 刷新令牌
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 笔记API
- `GET /api/threads` - 获取笔记列表
- `GET /api/threads/:id` - 获取笔记详情
- `POST /api/threads` - 创建笔记
- `PUT /api/threads/:id` - 更新笔记
- `DELETE /api/threads/:id` - 删除笔记
- `POST /api/threads/:id/archive` - 归档笔记
- `GET /api/threads/search` - 搜索笔记

### 内容API
- `GET /api/contents` - 获取内容列表
- `GET /api/contents/latest/:threadId` - 获取最新内容
- `GET /api/contents/history/:threadId` - 获取内容历史
- `POST /api/contents` - 创建内容
- `PUT /api/contents/:id` - 更新内容
- `POST /api/contents/:id/blocks` - 添加内容块
- `PUT /api/contents/:id/blocks/:index` - 更新内容块
- `DELETE /api/contents/:id/blocks/:index` - 删除内容块
- `DELETE /api/contents/:id` - 删除内容

### 评论API
- `GET /api/comments` - 获取评论列表
- `GET /api/comments/:parentId/replies` - 获取评论回复
- `POST /api/comments` - 创建评论
- `PUT /api/comments/:id` - 更新评论
- `DELETE /api/comments/:id` - 删除评论

### 同步API
- `POST /api/sync/get` - 获取数据
- `POST /api/sync/set` - 设置数据
- `POST /api/sync/operate` - 操作数据

### 设置API
- `GET /api/settings` - 获取用户设置
- `PUT /api/settings` - 更新用户设置
- `PUT /api/settings/notifications` - 更新通知设置
- `PUT /api/settings/language` - 更新语言设置
- `PUT /api/settings/theme` - 更新主题设置
- `PUT /api/settings/timezone` - 更新时区设置

### 文件API
- `POST /api/files/upload` - 上传文件
- `GET /api/files` - 获取文件列表
- `GET /api/files/:id` - 获取文件详情
- `GET /api/files/:id/download` - 下载文件
- `DELETE /api/files/:id` - 删除文件

### AI API
- `POST /api/ai/prompt` - AI提示
- `POST /api/ai/summarize` - AI总结
- `POST /api/ai/analyze` - AI分析
- `POST /api/ai/translate` - AI翻译
- `POST /api/ai/code` - AI代码生成
- `POST /api/ai/chat` - AI问答

### 监控端点
- `GET /health` - 健康检查
- `GET /health/db` - 数据库状态
- `GET /metrics` - Prometheus指标

## 🧪 测试

### 运行集成测试

**Bash测试**：
```bash
cd thus-backends/thus-server
bash tests/integration-test.sh
```

**Python测试**：
```bash
cd thus-backends/thus-server
python3 tests/integration_test.py
```

### 单元测试

```bash
npm test
```

## 🔐 构建和部署

### 构建

```bash
npm run build
```

### 生产环境启动

```bash
npm start
```

### Docker部署

```bash
# 构建镜像
docker build -t thus-note-server .

# 运行容器
docker run -p 3000:3000 --env-file .env thus-note-server
```

## 📚 相关文档

- [安装指南](INSTALL.md)
- [实现总结](IMPLEMENTATION_SUMMARY.md)
- [完整实现总结](IMPLEMENTATION_COMPLETE_SUMMARY.md)
- [集成测试计划](INTEGRATION_TEST_PLAN.md)
- [功能扩展计划](FEATURE_EXPANSION_PLAN.md)

## 🐛 故障排除

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

如果被占用，可以修改`.env`中的`PORT`变量。

### 依赖安装失败

清除npm缓存并重新安装：

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 开发规范

### Git提交规范

```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 分支策略

- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

### 代码审查

- 所有PR需要代码审查
- 自动化测试必须通过
- 文档同步更新

## 📞 技术栈

- **Node.js**: >=18
- **Express**: ^4.18.2
- **TypeScript**: ^5.3.3
- **MongoDB**: ^8.0.3 (Mongoose ODM)
- **Redis**: ^5.3.4 (ioredis)
- **JWT**: ^9.0.2 (jsonwebtoken)
- **Helmet**: ^7.1.1
- **Rate Limiting**: ^7.1.5
- **Bcrypt**: ^5.1.1
- **Joi**: ^17.11.0
- **Winston**: ^3.11.0
- **Prometheus**: prom-client
- **Socket.io**: ^4.7.4

## 📝 许可证

AGPL-3.0-or-later

---

**更新时间**: 2026年1月14日
**文档版本**: v1.0
**维护者**: Thus-Note Team
