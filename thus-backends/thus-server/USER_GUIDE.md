# 如是(Thus-Note) 使用指南

## 📋 目录

1. [快速开始](#快速开始)
2. [启动服务](#启动服务)
3. [登录方式](#登录方式)
4. [基本功能](#基本功能)
5. [API 测试](#api-测试)
6. [常见问题](#常见问题)

---

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **MongoDB**: >= 6.0.0
- **Redis**: >= 7.0.0

### 安装依赖

```bash
# 安装后端依赖
cd thus-backends/thus-server
pnpm install

# 安装前端依赖
cd ../../thus-frontends/thus-web
pnpm install
```

---

## 🔧 启动服务

### 1. 启动 MongoDB 和 Redis

**方式一：使用 Docker Compose（推荐）**

```bash
cd thus-backends/thus-server
docker-compose up -d
```

**方式二：手动启动**

```bash
# 启动 MongoDB
mongod --dbpath /path/to/data

# 启动 Redis
redis-server
```

### 2. 启动后端服务器

```bash
cd thus-backends/thus-server

# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

**后端服务器将在 http://localhost:3000 启动**

### 3. 启动前端服务器

```bash
cd thus-frontends/thus-web

# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm preview
```

**前端服务器将在 http://localhost:5175 启动**

### 4. 验证服务状态

访问以下 URL 验证服务是否正常：

- **后端健康检查**: http://localhost:3000/health
- **数据库状态**: http://localhost:3000/health/db
- **前端应用**: http://localhost:5175

---

## 🔑 登录方式

### 方式一：邮箱密码登录

**步骤：**

1. 打开浏览器，访问 http://localhost:5175
2. 点击"登录"按钮
3. 选择"邮箱"标签
4. 输入邮箱和密码
5. 点击"登录"按钮

**API 调用示例：**

```bash
curl -X POST http://localhost:3000/api/auth/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "YourPassword123!"
  }'
```

**响应示例：**

```json
{
  "code": "0000",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "serial_id": "refresh_token_here",
    "theme": "light",
    "language": "zh-Hans",
    "spaceMemberList": [],
    "open_id": null,
    "github_id": null
  }
}
```

### 方式二：GitHub OAuth 登录

**步骤：**

1. 打开浏览器，访问 http://localhost:5175
2. 点击"登录"按钮
3. 点击"GitHub"登录按钮
4. 授权 GitHub 应用
5. 自动跳转回应用并完成登录

**API 调用示例：**

```bash
# 1. 获取 GitHub OAuth URL
curl http://localhost:3000/api/auth/github/url

# 响应
{
  "code": "0000",
  "data": {
    "url": "https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=xxx&scope=user:email&state=xxx",
    "state": "random_state"
  }
}

# 2. 用户授权后，使用 code 登录
curl -X POST http://localhost:3000/api/auth/github \
  -H "Content-Type: application/json" \
  -d '{
    "code": "github_auth_code_here"
  }'
```

### 方式三：Google OAuth 登录

**步骤：**

1. 打开浏览器，访问 http://localhost:5175
2. 点击"登录"按钮
3. 点击"Google"登录按钮
4. 选择 Google 账号
5. 授权应用
6. 自动跳转回应用并完成登录

**API 调用示例：**

```bash
# 1. 获取 Google OAuth URL
curl http://localhost:3000/api/auth/google/url

# 响应
{
  "code": "0000",
  "data": {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&redirect_uri=xxx&response_type=code&scope=openid%20email%20profile&state=xxx",
    "state": "random_state"
  }
}

# 2. 用户授权后，使用 id_token 登录
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "google_id_token_here"
  }'
```

### 方式四：微信公众号 OAuth 登录

**步骤：**

1. 在微信中打开应用链接
2. 点击"微信登录"按钮
3. 授权公众号
4. 自动完成登录

**API 调用示例：**

```bash
# 1. 获取微信公众号 OAuth URL
curl http://localhost:3000/api/auth/wechat/url

# 响应
{
  "code": "0000",
  "data": {
    "url": "https://open.weixin.qq.com/connect/oauth2/authorize?appid=xxx&redirect_uri=xxx&response_type=code&scope=snsapi_userinfo&state=xxx#wechat_redirect",
    "state": "random_state"
  }
}

# 2. 用户授权后，使用 code 登录
curl -X POST http://localhost:3000/api/auth/wechat/gzh \
  -H "Content-Type: application/json" \
  -d '{
    "code": "wechat_auth_code_here"
  }'
```

### 方式五：验证码登录

**步骤：**

1. 打开浏览器，访问 http://localhost:5175
2. 点击"登录"按钮
3. 选择"邮箱"或"手机"标签
4. 输入邮箱或手机号
5. 点击"发送验证码"
6. 输入收到的验证码
7. 点击"登录"按钮

**API 调用示例：**

```bash
# 1. 发送验证码
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EMAIL",
    "identifier": "test@example.com"
  }'

# 响应
{
  "code": "0000",
  "data": {
    "message": "验证码已发送",
    "expiresIn": 300
  }
}

# 2. 使用验证码登录
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EMAIL",
    "identifier": "test@example.com",
    "code": "123456"
  }'
```

---

## 📱 基本功能

### 1. 线程管理

**获取线程列表**

```bash
curl -X GET http://localhost:3000/api/threads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**创建线程**

```bash
curl -X POST http://localhost:3000/api/threads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一个线程",
    "content": "这是一个测试线程",
    "type": "note"
  }'
```

**获取线程详情**

```bash
curl -X GET http://localhost:3000/api/threads/THREAD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**更新线程**

```bash
curl -X PUT http://localhost:3000/api/threads/THREAD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题"
  }'
```

**删除线程**

```bash
curl -X DELETE http://localhost:3000/api/threads/THREAD_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. 用户设置

**获取用户设置**

```bash
curl -X GET http://localhost:3000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**更新用户设置**

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "en",
    "theme": "dark"
  }'
```

**更新通知设置**

```bash
curl -X PUT http://localhost:3000/api/settings/notifications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": true,
    "push": false
  }'
```

### 3. 数据同步

**同步获取**

```bash
curl -X POST http://localhost:3000/api/sync/get \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "atoms": [
      {
        "taskType": "thread_list",
        "taskId": "test-1",
        "limit": 10
      }
    ]
  }'
```

**同步设置**

```bash
curl -X POST http://localhost:3000/api/sync/set \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "atoms": [
      {
        "taskType": "thread-post",
        "taskId": "test-2",
        "thread": {
          "title": "测试线程",
          "type": "note"
        }
      }
    ]
  }'
```

### 4. AI 功能

**AI 聊天**

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "你好"
      }
    ],
    "model": "gpt-3.5-turbo"
  }'
```

**AI 内容分析**

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "这是一段需要分析的文本",
    "analysisType": "sentiment"
  }'
```

**AI 翻译**

```bash
curl -X POST http://localhost:3000/api/ai/translate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello World",
    "targetLanguage": "中文"
  }'
```

**AI 代码生成**

```bash
curl -X POST http://localhost:3000/api/ai/code \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "创建一个简单的计算器函数",
    "language": "JavaScript"
  }'
```

---

## 🧪 API 测试

### 使用测试脚本

**运行登录流程测试：**

```bash
cd thus-backends/thus-server
node tests/login-flow-test.js
```

**运行完整功能测试：**

```bash
cd thus-backends/thus-server
node tests/complete-test.js
```

### 使用 Postman 或 Insomnia

1. 导入 API 端点
2. 设置环境变量：
   - `BASE_URL`: http://localhost:3000
   - `TOKEN`: 从登录接口获取的 token
3. 使用 `Authorization: Bearer {{TOKEN}}` 头进行认证

### 使用 curl 命令

所有 API 都可以使用 curl 命令测试，参考上面的示例。

---

## ❓ 常见问题

### Q1: 如何创建测试用户？

**A:** 使用创建测试用户接口：

```bash
curl -X POST http://localhost:3000/api/auth/create-test-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### Q2: 如何获取当前用户信息？

**A:** 使用获取用户信息接口：

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Q3: Token 过期了怎么办？

**A:** 使用刷新 token 接口：

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Q4: 如何登出？

**A:** 使用登出接口：

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Q5: 如何配置 AI 功能？

**A:** 在 `.env` 文件中配置 AI API Keys：

```env
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### Q6: 如何配置 OAuth？

**A:** 在 `.env` 文件中配置 OAuth 应用信息：

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:5175/auth/github/callback

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5175/auth/google/callback

# 微信公众号 OAuth
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_REDIRECT_URI=http://localhost:5175/auth/wechat/callback
```

### Q7: 如何配置邮件发送？

**A:** 在 `.env` 文件中配置 SMTP：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Q8: 如何配置短信发送？

**A:** 在 `.env` 文件中配置腾讯云 SMS：

```env
TENCENT_SMS_SECRET_ID=your-secret-id
TENCENT_SMS_SECRET_KEY=your-secret-key
TENCENT_SMS_APP_ID=your-app-id
TENCENT_SMS_SIGN_NAME=your-sign-name
TENCENT_SMS_TEMPLATE_ID=your-template-id
```

### Q9: 数据库连接失败怎么办？

**A:** 检查以下几点：

1. MongoDB 是否正在运行
2. MongoDB 连接字符串是否正确
3. 端口是否被占用
4. 防火墙是否阻止连接

```bash
# 检查 MongoDB 状态
ps aux | grep mongod

# 检查端口占用
lsof -i :27017
```

### Q10: Redis 连接失败怎么办？

**A:** 检查以下几点：

1. Redis 是否正在运行
2. Redis 连接字符串是否正确
3. 端口是否被占用

```bash
# 检查 Redis 状态
ps aux | grep redis

# 检查端口占用
lsof -i :6379

# 测试 Redis 连接
redis-cli ping
```

---

## 📚 相关文档

- [完整测试结果](LOGIN_FLOW_TEST_RESULTS.md)
- [测试指南](TESTING_GUIDE.md)
- [实现总结](IMPLEMENTATION_SUMMARY.md)
- [环境变量配置](.env.example)

---

## 🆘 获取帮助

如果遇到问题，请：

1. 查看日志文件
2. 检查环境变量配置
3. 运行测试脚本验证功能
4. 查看常见问题部分

---

**文档版本**: 1.0  
**最后更新**: 2026-01-16  
**维护者**: Thus-Note Team
