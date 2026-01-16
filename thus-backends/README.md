# Thus-Note 后端服务

<div align="center">

  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../LICENSE)

</div>

## 📋 概述

Thus-Note 后端服务包含多个独立的后端项目，为 Thus-Note 前端应用提供完整的数据服务、API 接口和辅助功能。

### 项目列表

| 项目 | 描述 | 状态 | 端口 |
|------|------|------|------|
| [thus-server](./thus-server/) | Node.js + Express + TypeScript 主服务器 | ✅ 活跃 | 3000 |
| [thus-laf](./thus-laf/) | LAF 云函数后端（已废弃） | ⚠️ 已废弃 | - |
| [thus-ffmpeg](./thus-ffmpeg/) | FFmpeg 视频处理服务 | ✅ 活跃 | 3001 |

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis >= 6.0
- Docker（可选，用于容器化部署）

### 安装依赖

```bash
# 安装所有后端项目依赖
cd thus-backends

# 安装 thus-server
cd thus-server
npm install

# 安装 thus-ffmpeg
cd ../thus-ffmpeg
npm install
```

### 配置环境变量

每个项目都有独立的环境变量配置文件：

```bash
# thus-server
cd thus-server
cp .env.example .env
# 编辑 .env 文件

# thus-ffmpeg
cd ../thus-ffmpeg
cp .env.example .env
# 编辑 .env 文件
```

### 启动服务

#### 方式一：Docker Compose（推荐）

```bash
# 启动所有后端服务
cd thus-backends/thus-server
docker-compose up -d

# 查看日志
docker-compose logs -f
```

#### 方式二：手动启动

```bash
# 启动 thus-server
cd thus-backends/thus-server
npm run dev

# 启动 thus-ffmpeg（新终端）
cd thus-backends/thus-ffmpeg
npm run dev
```

### 验证安装

```bash
# 检查 thus-server 健康状态
curl http://localhost:3000/health

# 检查 thus-ffmpeg 健康状态
curl http://localhost:3001/health
```

## 📂 项目结构

```
thus-backends/
├── thus-server/              # 主服务器（Node.js + Express + TypeScript）
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # API 路由
│   │   ├── middleware/      # 中间件
│   │   ├── services/        # 业务逻辑
│   │   ├── utils/           # 工具函数
│   │   ├── validators/      # 数据验证
│   │   └── types/           # TypeScript 类型
│   ├── tests/               # 测试文件
│   ├── logs/                # 日志文件
│   ├── uploads/             # 上传文件
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── INSTALL.md           # 安装指南
│   ├── QUICK_START.md       # 快速开始
│   ├── USER_GUIDE.md        # 用户指南
│   └── README.md
├── thus-laf/                # LAF 云函数（已废弃）
│   ├── cloud-functions/     # 云函数代码
│   ├── types/               # 类型定义
│   └── LICENSE
└── thus-ffmpeg/             # FFmpeg 服务
    ├── app.js               # 应用入口
    ├── package.json
    ├── nodeman.json         # Nodeman 配置
    └── README.md
```

## 🔧 技术栈

### thus-server

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >= 18 | JavaScript 运行时 |
| TypeScript | ^5.3 | 类型安全 |
| Express | ^4.18 | Web 框架 |
| MongoDB | ^8.0 | 主数据库 |
| Mongoose | ^8.0 | MongoDB ODM |
| Redis | ^5.3 | 缓存和会话 |
| JWT | ^9.0 | 身份验证 |
| Socket.io | ^4.7 | 实时通信 |
| Winston | ^3.11 | 日志管理 |
| Joi | ^17.11 | 数据验证 |
| Bcrypt | ^5.1 | 密码加密 |

### thus-ffmpeg

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >= 18 | JavaScript 运行时 |
| Express | ^4.18 | Web 框架 |
| FFmpeg | - | 视频处理 |
| fluent-ffmpeg | - | FFmpeg Node.js 封装 |

## 📡 API 端点

### thus-server 主要 API

#### 认证 API
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

#### 笔记 API
- `GET /api/threads` - 获取笔记列表
- `GET /api/threads/:id` - 获取笔记详情
- `POST /api/threads` - 创建笔记
- `PUT /api/threads/:id` - 更新笔记
- `DELETE /api/threads/:id` - 删除笔记
- `POST /api/threads/:id/archive` - 归档笔记
- `GET /api/threads/search` - 搜索笔记

#### 内容 API
- `GET /api/contents` - 获取内容列表
- `GET /api/contents/latest/:threadId` - 获取最新内容
- `GET /api/contents/history/:threadId` - 获取内容历史
- `POST /api/contents` - 创建内容
- `PUT /api/contents/:id` - 更新内容
- `DELETE /api/contents/:id` - 删除内容

#### 评论 API
- `GET /api/comments` - 获取评论列表
- `GET /api/comments/:parentId/replies` - 获取评论回复
- `POST /api/comments` - 创建评论
- `PUT /api/comments/:id` - 更新评论
- `DELETE /api/comments/:id` - 删除评论

#### 同步 API
- `POST /api/sync/get` - 获取数据
- `POST /api/sync/set` - 设置数据
- `POST /api/sync/operate` - 操作数据

#### 设置 API
- `GET /api/settings` - 获取用户设置
- `PUT /api/settings` - 更新用户设置
- `PUT /api/settings/notifications` - 更新通知设置
- `PUT /api/settings/language` - 更新语言设置
- `PUT /api/settings/theme` - 更新主题设置

#### 文件 API
- `POST /api/files/upload` - 上传文件
- `GET /api/files` - 获取文件列表
- `GET /api/files/:id` - 获取文件详情
- `GET /api/files/:id/download` - 下载文件
- `DELETE /api/files/:id` - 删除文件

#### AI API
- `POST /api/ai/prompt` - AI 提示
- `POST /api/ai/summarize` - AI 总结
- `POST /api/ai/analyze` - AI 分析
- `POST /api/ai/translate` - AI 翻译
- `POST /api/ai/code` - AI 代码生成
- `POST /api/ai/chat` - AI 问答

#### 监控端点
- `GET /health` - 健康检查
- `GET /health/db` - 数据库状态
- `GET /metrics` - Prometheus 指标

### thus-ffmpeg API

- `POST /api/ffmpeg/process` - 处理视频
- `POST /api/ffmpeg/convert` - 转换视频格式
- `POST /api/ffmpeg/extract` - 提取音频
- `GET /health` - 健康检查

## 🧪 测试

### thus-server 测试

```bash
cd thus-backends/thus-server

# 运行集成测试
bash tests/integration-test.sh

# 或使用 Python 测试
python3 tests/integration_test.py

# 运行单元测试
npm test
```

### thus-ffmpeg 测试

```bash
cd thus-backends/thus-ffmpeg

# 运行测试
npm test
```

## 🔐 安全

### 认证与授权

- JWT 令牌认证
- OAuth 2.0 第三方登录
- 密码 bcrypt 加密
- 请求速率限制
- CORS 配置

### 数据保护

- MongoDB 连接加密
- 敏感数据加密存储
- 请求参数验证
- SQL 注入防护
- XSS 攻击防护

### 环境变量

所有敏感信息都通过环境变量配置，不要将 `.env` 文件提交到版本控制。

## 🚢 部署

### Docker 部署

```bash
cd thus-backends/thus-server

# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 手动部署

```bash
cd thus-backends/thus-server

# 安装生产依赖
npm install --production

# 构建项目
npm run build

# 启动服务
npm start
```

### 环境变量配置

生产环境需要配置以下环境变量：

| 变量名 | 说明 | 必填 |
|--------|------|------|
| NODE_ENV | 运行环境 | 是 |
| PORT | 服务端口 | 是 |
| MONGODB_URI | MongoDB 连接字符串 | 是 |
| REDIS_HOST | Redis 主机 | 是 |
| REDIS_PORT | Redis 端口 | 是 |
| JWT_SECRET | JWT 密钥 | 是 |
| JWT_ACCESS_EXPIRES | 访问令牌过期时间 | 否 |
| JWT_REFRESH_EXPIRES | 刷新令牌过期时间 | 否 |
| OPENAI_API_KEY | OpenAI API 密钥 | 否 |
| ANTHROPIC_API_KEY | Anthropic API 密钥 | 否 |
| EMAIL_HOST | SMTP 服务器 | 否 |
| EMAIL_USER | SMTP 用户名 | 否 |
| EMAIL_PASS | SMTP 密码 | 否 |

## 🐛 故障排除

### MongoDB 连接失败

```bash
# 检查 MongoDB 是否运行
ps aux | grep mongod

# 检查连接字符串
echo $MONGODB_URI

# 测试连接
mongosh "mongodb://localhost:27017/thus-note"
```

### Redis 连接失败

```bash
# 检查 Redis 是否运行
redis-cli ping

# 启动 Redis
redis-server
```

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 依赖安装失败

```bash
# 清除缓存并重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 📚 相关文档

- [thus-server 安装指南](./thus-server/INSTALL.md)
- [thus-server 快速开始](./thus-server/QUICK_START.md)
- [thus-server 用户指南](./thus-server/USER_GUIDE.md)
- [thus-server 详细文档](./thus-server/README.md)
- [thus-ffmpeg 文档](./thus-ffmpeg/README.md)

## 📝 开发规范

### Git 提交规范

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

- 所有 PR 需要代码审查
- 自动化测试必须通过
- 文档同步更新

## 🔄 迁移说明

### 从 LAF 云函数迁移到 thus-server

本项目已完成从 LAF 云函数到自建 Node.js 服务器的迁移。旧的 `thus-laf` 目录已保留作为参考，但不再维护。

迁移详情请参考：
- [迁移计划](../internal/docs/plans/backend-migration-plan.md)
- [本地实现计划](../internal/docs/plans/local-nodejs-implementation-plan.md)

## 📞 联系方式

- **GitHub Issues**: https://github.com/poboll/thus-note/issues
- **GitHub Discussions**: https://github.com/poboll/thus-note/discussions
- **Email**: support@thus-note.example.com

## 📄 许可证

本项目基于 [AGPL-3.0](../LICENSE) 开源协议。

---

<div align="center">
  <p>Made with ❤️ by Thus-Note Team</p>
  <p>© 2024 Thus-Note. All rights reserved.</p>
</div>
