# 如是(Thus-Note) 快速开始指南

## 🚀 5 分钟快速开始

### 步骤 1: 启动服务（2 分钟）

```bash
# 1. 启动 MongoDB 和 Redis
cd thus-backends/thus-server
docker-compose up -d

# 2. 启动后端服务器
npm run dev

# 3. 在另一个终端启动前端服务器
cd ../../thus-frontends/thus-web
pnpm dev
```

### 步骤 2: 打开浏览器（1 分钟）

访问: **http://localhost:5175**

### 步骤 3: 登录（2 分钟）

#### 方式一：使用测试账号登录

1. 点击"登录"按钮
2. 输入邮箱：`test@example.com`
3. 输入密码：`TestPassword123!`
4. 点击"登录"按钮

#### 方式二：创建新账号

1. 点击"注册"按钮
2. 输入邮箱、用户名、密码
3. 点击"注册"按钮
4. 自动登录

#### 方式三：使用 GitHub 登录

1. 点击"GitHub"登录按钮
2. 授权 GitHub 应用
3. 自动跳转并登录

---

## 📱 登录后的功能

登录成功后，您可以：

### 1. 创建笔记

1. 点击"新建"按钮
2. 输入标题和内容
3. 点击"保存"按钮

### 2. 管理笔记

- **查看笔记**: 点击笔记列表中的任意笔记
- **编辑笔记**: 点击笔记编辑按钮
- **删除笔记**: 点击笔记删除按钮
- **搜索笔记**: 使用搜索框搜索笔记

### 3. 使用 AI 功能

1. 打开任意笔记
2. 点击"AI 助手"按钮
3. 输入问题或选择功能
4. 查看 AI 回复

### 4. 同步数据

- **自动同步**: 数据会自动同步到云端
- **手动同步**: 点击"同步"按钮手动同步

### 5. 设置

1. 点击右上角头像
2. 选择"设置"
3. 修改语言、主题、通知等

---

## 🔑 API 快速测试

### 1. 创建测试用户

```bash
curl -X POST http://localhost:3000/api/auth/create-test-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

### 2. 登录

```bash
curl -X POST http://localhost:3000/api/auth/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
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
    "spaceMemberList": []
  }
}
```

### 3. 使用 Token 访问 API

```bash
# 获取线程列表
curl -X GET http://localhost:3000/api/threads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 创建线程
curl -X POST http://localhost:3000/api/threads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一个线程",
    "content": "这是一个测试线程"
  }'
```

---

## 🧪 运行测试

### 运行登录流程测试

```bash
cd thus-backends/thus-server
node tests/login-flow-test.js
```

**预期结果：** 100% 通过（18/18）

### 运行完整功能测试

```bash
cd thus-backends/thus-server
node tests/complete-test.js
```

**预期结果：** 51.06% 通过（24/47）

---

## 📊 服务状态检查

### 检查后端服务

```bash
# 健康检查
curl http://localhost:3000/health

# 数据库状态
curl http://localhost:3000/health/db
```

### 检查前端服务

访问: http://localhost:5175

---

## 🛠️ 故障排除

### 问题 1: 无法连接到数据库

**解决方案：**

```bash
# 检查 MongoDB 是否运行
docker ps | grep mongo

# 重启 MongoDB
docker-compose restart mongo

# 检查 Redis 是否运行
docker ps | grep redis

# 重启 Redis
docker-compose restart redis
```

### 问题 2: 无法登录

**解决方案：**

1. 检查后端服务是否运行
2. 检查数据库连接
3. 查看后端日志
4. 使用测试账号登录

### 问题 3: Token 过期

**解决方案：**

```bash
# 刷新 Token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 问题 4: AI 功能不可用

**解决方案：**

在 `.env` 文件中配置 AI API Keys：

```env
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key
```

---

## 📚 更多文档

- [完整使用指南](USER_GUIDE.md)
- [登录流程测试结果](LOGIN_FLOW_TEST_RESULTS.md)
- [测试指南](TESTING_GUIDE.md)
- [实现总结](IMPLEMENTATION_SUMMARY.md)
- [环境变量配置](.env.example)

---

## 🆘 获取帮助

如果遇到问题：

1. 查看日志文件
2. 检查环境变量配置
3. 运行测试脚本验证功能
4. 查看常见问题部分

---

**快速开始版本**: 1.0  
**最后更新**: 2026-01-16  
**维护者**: Thus-Note Team
