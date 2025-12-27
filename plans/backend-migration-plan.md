# 如是(Thus-Note)后端迁移架构方案

## 📋 执行摘要

本文档详细说明了从LAF云函数架构迁移到本地Node.js后端的完整技术方案,确保前端无需大幅修改即可正常运行。

---

## 🎯 迁移目标

1. **完全本地化运行**: 摆脱对LAF云平台的依赖
2. **保持API兼容性**: 前端代码无需修改或仅需最小改动
3. **保留核心功能**: 用户认证、数据同步、AI集成、文件处理等
4. **提升性能和可控性**: 本地部署,完全掌控数据和系统
5. **支持学术要求**: 实现原子化信息管理、多平台同步、离线优先

---

## 🏗️ 目标架构设计

### 整体架构图

```mermaid
graph TB
    subgraph Clients[客户端层]
        Web[Web应用<br/>Vue 3 + TypeScript]
        VSCode[VS Code插件]
        Weixin[微信小程序]
    end

    subgraph Frontend[前端层]
        WebApp[thus-web<br/>PWA + 离线优先]
    end

    subgraph Backend[后端层]
        Nginx[Nginx反向代理<br/>静态资源 + API代理]
        
        subgraph NodeServer[Node.js主服务]
            Express[Express/Fastify框架]
            Router[API路由层]
            Middleware[中间件层<br/>认证/限流/日志]
            Controllers[控制器层]
            Services[业务逻辑层]
        end
        
        subgraph Workers[后台任务]
            Queue[任务队列<br/>Bull/Agenda]
            Jobs[定时任务<br/>node-cron]
        end
    end

    subgraph Data[数据层]
        MongoDB[(MongoDB<br/>主数据库)]
        Redis[(Redis<br/>缓存/会话)]
        Milvus[(Milvus<br/>向量数据库)]
        LocalFS[本地文件存储]
    end

    subgraph External[外部服务]
        OpenAI[OpenAI API]
        Qiniu[七牛云CDN]
        Stripe[Stripe支付]
        WeChat[微信API]
        Alipay[支付宝API]
        Email[邮件服务<br/>Resend/腾讯SES]
        SMS[短信服务<br/>腾讯SMS]
    end

    Web --> Nginx
    VSCode --> Nginx
    Weixin --> Nginx
    
    Nginx --> WebApp
    Nginx --> Express
    
    Express --> Router
    Router --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    
    Services --> MongoDB
    Services --> Redis
    Services --> Milvus
    Services --> LocalFS
    Services --> Queue
    
    Queue --> Workers
    Jobs --> Services
    
    Services --> OpenAI
    Services --> Qiniu
    Services --> Stripe
    Services --> WeChat
    Services --> Alipay
    Services --> Email
    Services --> SMS
```

### 技术栈选型

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **Web框架** | Express.js | 成熟稳定,生态丰富,易于迁移 |
| **备选框架** | Fastify | 性能更高,但Express更通用 |
| **语言** | TypeScript | 与LAF云函数保持一致 |
| **数据库** | MongoDB 6.x | 保持不变,直接复用 |
| **缓存** | Redis 7.x | 替代LAF的cloud.shared |
| **向量库** | Milvus 2.x | AI功能必需,保持不变 |
| **任务队列** | Bull (基于Redis) | 异步任务处理 |
| **定时任务** | node-cron | 定时器任务 |
| **ORM/ODM** | Mongoose 8.x | MongoDB操作简化 |
| **认证** | JWT + OAuth2.0 | 保持现有认证方式 |
| **限流** | express-rate-limit | 替代LAF拦截器 |
| **日志** | Winston | 结构化日志 |
| **验证** | Valibot | 与LAF保持一致 |
| **文件上传** | Multer | 本地文件处理 |
| **WebSocket** | ws库 | 实时通信(如需要) |

---

## 🔄 API兼容性方案

### 1. LAF云函数 → RESTful API映射

| LAF云函数 | HTTP路由 | 方法 | 说明 |
|----------|---------|------|------|
| `user-login.ts` | `/api/auth/login` | POST | 用户登录 |
| `user-login.ts` | `/api/auth/github` | POST | GitHub OAuth |
| `user-login.ts` | `/api/auth/google` | POST | Google OAuth |
| `user-login.ts` | `/api/auth/wechat` | POST | 微信OAuth |
| `user-login.ts` | `/api/auth/signup` | POST | 用户注册 |
| `sync-get.ts` | `/api/sync/get` | POST | 获取同步数据 |
| `sync-set.ts` | `/api/sync/set` | POST | 设置同步数据 |
| `sync-operate.ts` | `/api/sync/operate` | POST | 操作同步数据 |
| `sync-after.ts` | `/api/sync/after` | POST | 同步后处理 |
| `ai-entrance.ts` | `/api/ai/entrance` | POST | AI入口 |
| `ai-prompt.ts` | `/api/ai/prompt` | POST | AI提示词 |
| `ai-system-two.ts` | `/api/ai/system-two` | POST | AI系统2 |
| `file-set.ts` | `/api/file/upload` | POST | 文件上传 |
| `file-utils.ts` | `/api/file/*` | * | 文件工具 |
| `people-tasks.ts` | `/api/tasks` | * | 任务管理 |
| `service-poly.ts` | `/api/service/poly` | POST | 多语言服务 |
| `service-send.ts` | `/api/service/send` | POST | 发送服务 |
| `subscribe-plan.ts` | `/api/subscribe/plan` | * | 订阅计划 |
| `payment-order.ts` | `/api/payment/order` | * | 支付订单 |
| `webhook-*.ts` | `/api/webhook/*` | POST | Webhook回调 |

### 2. 请求/响应格式兼容

#### 前端请求格式(保持不变)
```typescript
// 当前前端发送的请求格式
{
  x_liu_language: string,
  x_liu_theme: string,
  x_liu_version: string,
  x_liu_stamp: number,
  x_liu_timezone: string,
  x_liu_client: string,
  x_liu_device: string,
  x_liu_token?: string,
  x_liu_serial?: string,
  // ... 其他业务数据
}
```

#### 后端响应格式(保持不变)
```typescript
{
  code: string,  // "0000"表示成功,其他为错误码
  data?: any,
  errMsg?: string
}
```

### 3. 中间件设计

#### 认证中间件
```typescript
// src/middleware/auth.middleware.ts
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const { x_liu_token, x_liu_serial } = req.body
  
  if (!x_liu_token || !x_liu_serial) {
    return res.json({ code: 'E0001', errMsg: '未登录' })
  }
  
  // 验证token有效性
  const user = await validateToken(x_liu_token, x_liu_serial)
  if (!user) {
    return res.json({ code: 'E0002', errMsg: 'token无效' })
  }
  
  req.user = user
  next()
}
```

#### 限流中间件
```typescript
// src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 最多60次请求
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.json({ code: 'F0001', errMsg: '请求过于频繁' })
  }
})

export const strictLimiter = rateLimit({
  windowMs: 1000, // 1秒
  max: 5, // 最多5次请求
  handler: (req, res) => {
    res.json({ code: 'F0001', errMsg: '请求过于频繁' })
  }
})
```

#### IP拦截中间件
```typescript
// src/middleware/ip-block.middleware.ts
export async function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req)
  
  // 检查IP是否在黑名单中
  const isBlocked = await checkBlockedIP(ip)
  if (isBlocked) {
    return res.json({ code: 'F0004', errMsg: 'IP已被封禁' })
  }
  
  next()
}
```

---

## 🗄️ 数据库迁移策略

### 1. MongoDB数据迁移

#### 迁移步骤
1. **导出LAF数据库**
   ```bash
   # 使用mongodump导出LAF数据库
   mongodump --uri="mongodb://laf-user:password@laf-host:27017/laf-db" --out=./backup
   ```

2. **导入本地MongoDB**
   ```bash
   # 使用mongorestore导入到本地MongoDB
   mongorestore --uri="mongodb://localhost:27017/thus-note" --drop ./backup
   ```

3. **数据验证**
   ```javascript
   // 验证数据完整性
   const collections = await db.listCollections().toArray()
   for (const col of collections) {
     const count = await db.collection(col.name).countDocuments()
     console.log(`${col.name}: ${count} documents`)
   }
   ```

### 2. Redis状态迁移

#### LAF cloud.shared → Redis映射

| LAF cloud.shared | Redis数据结构 | 说明 |
|-----------------|--------------|------|
| `blocked_ips` | Set `blocked:ips` | IP黑名单 |
| `config` | Hash `config:system` | 系统配置 |
| `rate_limits` | String `rate:${ip}:${window}` | 限流计数 |
| `sessions` | Hash `session:${token}` | 会话信息 |

#### Redis初始化脚本
```typescript
// src/scripts/init-redis.ts
import Redis from 'ioredis'

const redis = new Redis()

async function initRedis() {
  // 初始化IP黑名单
  const blockedIPs = await getBlockedIPsFromMongo()
  for (const ip of blockedIPs) {
    await redis.sadd('blocked:ips', ip)
  }
  
  // 初始化系统配置
  const config = await getSystemConfigFromMongo()
  await redis.hset('config:system', config)
  
  console.log('Redis初始化完成')
}

initRedis()
```

### 3. Milvus向量库迁移

Milvus向量数据通常无需迁移,但需要确保:
1. Milvus服务正常运行
2. 连接配置正确
3. 集合(collection)结构兼容

---

## 🔐 安全性迁移方案

### 1. 加密机制保持

#### RSA密钥对生成
```typescript
// src/utils/crypto.ts
import crypto from 'crypto'

export function generateRSAKeyPair(): { publicKey: string, privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })
  
  return { publicKey, privateKey }
}
```

#### AES密钥生成
```typescript
export function generateAESKey(): string {
  return crypto.randomBytes(32).toString('base64')
}
```

### 2. OAuth认证流程

#### GitHub OAuth
```typescript
// src/services/auth/github.service.ts
import { OAuth2Client } from 'google-auth-library'
import axios from 'axios'

export class GitHubAuthService {
  async handleOAuth(code: string) {
    // 1. 用code换取access_token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: 'application/json' } }
    )
    
    // 2. 获取用户信息
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    })
    
    // 3. 下载头像
    const avatar = await this.downloadAvatar(userResponse.data.avatar_url)
    
    // 4. 查找或创建用户
    const user = await this.findOrCreateUser({
      github_id: userResponse.data.id,
      name: userResponse.data.name || userResponse.data.login,
      avatar,
      email: userResponse.data.email
    })
    
    return user
  }
}
```

### 3. Token管理

```typescript
// src/services/token.service.ts
import jwt from 'jsonwebtoken'

export class TokenService {
  generateToken(userId: string): { token: string, serial: string } {
    const serial = crypto.randomBytes(16).toString('hex')
    const token = jwt.sign(
      { userId, serial },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )
    
    return { token, serial }
  }
  
  async validateToken(token: string, serial: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      if (decoded.serial !== serial) {
        return null
      }
      
      const user = await User.findById(decoded.userId)
      return user
    } catch (error) {
      return null
    }
  }
}
```

---

## 📁 项目结构设计

```
thus-backends/thus-server/
├── src/
│   ├── index.ts                 # 应用入口
│   ├── app.ts                   # Express应用配置
│   ├── config/                  # 配置管理
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── milvus.ts
│   ├── middleware/              # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── ip-block.middleware.ts
│   │   ├── error-handler.middleware.ts
│   │   └── logger.middleware.ts
│   ├── routes/                  # 路由定义
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── sync.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── file.routes.ts
│   │   ├── task.routes.ts
│   │   ├── payment.routes.ts
│   │   └── webhook.routes.ts
│   ├── controllers/             # 控制器
│   │   ├── auth.controller.ts
│   │   ├── sync.controller.ts
│   │   ├── ai.controller.ts
│   │   └── ...
│   ├── services/                # 业务逻辑
│   │   ├── auth.service.ts
│   │   ├── sync.service.ts
│   │   ├── ai.service.ts
│   │   ├── file.service.ts
│   │   ├── token.service.ts
│   │   └── encryption.service.ts
│   ├── models/                  # 数据模型
│   │   ├── user.model.ts
│   │   ├── thread.model.ts
│   │   ├── content.model.ts
│   │   └── ...
│   ├── utils/                   # 工具函数
│   │   ├── crypto.ts
│   │   ├── validator.ts
│   │   └── logger.ts
│   ├── workers/                 # 后台任务
│   │   ├── queue.ts
│   │   ├── jobs/
│   │   │   ├── clock-per-min.ts
│   │   │   ├── clock-one-hr.ts
│   │   │   └── clock-half-hr.ts
│   │   └── processors/
│   │       ├── email.processor.ts
│   │       └── sms.processor.ts
│   └── types/                   # TypeScript类型定义
│       └── index.ts
├── tests/                       # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/                     # 脚本工具
│   ├── init-redis.ts
│   ├── migrate-data.ts
│   └── seed-data.ts
├── uploads/                     # 本地上传文件
├── logs/                        # 日志文件
├── .env.example                 # 环境变量示例
├── .env                         # 环境变量(不提交)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 部署方案

### 1. Docker容器化

#### Dockerfile
```dockerfile
# thus-backends/thus-server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY . .

# 构建TypeScript
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/index.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  thus-server:
    build: ./thus-backends/thus-server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/thus-note
      - REDIS_URI=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  milvus:
    image: milvusdb/milvus:v2.5.9
    ports:
      - "19530:19530"
    volumes:
      - milvus_data:/var/lib/milvus

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./thus-frontends/thus-web/dist:/usr/share/nginx/html
    depends_on:
      - thus-server

volumes:
  mongodb_data:
  redis_data:
  milvus_data:
```

### 2. PM2进程管理

#### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'thus-server',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
}
```

### 3. Nginx配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream thus_backend {
        server thus-server:3000;
    }

    # 静态资源
    server {
        listen 80;
        server_name idrop.in;

        # 前端静态文件
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # API代理
        location /api/ {
            proxy_pass http://thus_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

---

## 📊 迁移实施计划

### 第一阶段: 基础设施搭建 (1-2周)

#### 任务清单
- [ ] 创建thus-server项目结构
- [ ] 配置TypeScript和开发环境
- [ ] 搭建Express/Fastify基础框架
- [ ] 配置MongoDB连接
- [ ] 配置Redis连接
- [ ] 配置Milvus连接
- [ ] 实现基础中间件(日志、错误处理)
- [ ] 实现限流和IP拦截中间件
- [ ] 配置环境变量管理
- [ ] 编写基础测试

#### 验收标准
- [ ] 服务可以正常启动
- [ ] MongoDB连接正常
- [ ] Redis连接正常
- [ ] Milvus连接正常
- [ ] 基础中间件工作正常

### 第二阶段: 核心功能迁移 (2-3周)

#### 任务清单
- [ ] 迁移用户认证系统(user-login.ts)
  - [ ] GitHub OAuth
  - [ ] Google OAuth
  - [ ] 微信OAuth
  - [ ] 邮箱验证
  - [ ] 手机短信验证
- [ ] 迁移数据同步系统(sync-*.ts)
  - [ ] sync-get.ts
  - [ ] sync-set.ts
  - [ ] sync-operate.ts
  - [ ] sync-after.ts
- [ ] 迁移AI功能(ai-*.ts)
  - [ ] ai-entrance.ts
  - [ ] ai-prompt.ts
  - [ ] ai-system-two.ts
- [ ] 迁移文件处理(file-*.ts)
- [ ] 迁移任务管理(people-tasks.ts)
- [ ] 迁移支付功能(payment-*.ts, subscribe-*.ts)
- [ ] 迁移webhook处理(webhook-*.ts)

#### 验收标准
- [ ] 所有核心API功能正常
- [ ] 前端可以正常调用所有API
- [ ] 用户认证流程完整
- [ ] 数据同步功能正常
- [ ] AI功能正常

### 第三阶段: 后台任务和优化 (1-2周)

#### 任务清单
- [ ] 实现任务队列(Bull)
- [ ] 迁移定时任务
  - [ ] clock-per-min.ts
  - [ ] clock-one-hr.ts
  - [ ] clock-half-hr.ts
- [ ] 实现邮件发送队列
- [ ] 实现短信发送队列
- [ ] 性能优化
  - [ ] 数据库查询优化
  - [ ] 缓存策略优化
  - [ ] API响应时间优化
- [ ] 监控和日志
  - [ ] 结构化日志
  - [ ] 性能监控
  - [ ] 错误追踪

#### 验收标准
- [ ] 后台任务正常运行
- [ ] 定时任务按时执行
- [ ] API响应时间 < 200ms
- [ ] 系统稳定性 > 99.9%

### 第四阶段: 测试和部署 (1周)

#### 任务清单
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试
- [ ] 端到端测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] Docker容器化
- [ ] 部署到生产环境
- [ ] 数据迁移
- [ ] 灰度发布
- [ ] 全量切换

#### 验收标准
- [ ] 所有测试通过
- [ ] 生产环境稳定运行
- [ ] 数据迁移完整性100%
- [ ] 用户无感知切换

---

## ⚠️ 风险评估与应对

### 主要风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 数据迁移失败 | 高 | 中 | 完整备份、分步迁移、回滚方案 |
| API兼容性问题 | 高 | 中 | 充分测试、兼容性中间件 |
| 性能下降 | 中 | 低 | 性能基准测试、优化查询、缓存 |
| 第三方服务集成问题 | 中 | 中 | 充分测试、降级方案 |
| 开发周期超期 | 中 | 中 | 敏捷开发、里程碑管理 |

### 应对策略

1. **数据安全**
   - 迁移前完整备份
   - 双写验证(同时写入LAF和新后端)
   - 灰度发布,逐步切换流量

2. **回滚方案**
   - 保留LAF云函数运行
   - Nginx快速切换路由
   - 数据库快照恢复

3. **监控告警**
   - 实时监控API响应时间
   - 错误率告警
   - 数据一致性检查

---

## 📈 成功指标

### 技术指标
- [ ] API响应时间 < 200ms (P95)
- [ ] 系统可用性 > 99.9%
- [ ] 数据迁移完整性 100%
- [ ] 测试覆盖率 > 80%
- [ ] 前端无需修改即可运行

### 业务指标
- [ ] 用户无感知迁移
- [ ] 功能完整性100%
- [ ] 数据零丢失
- [ ] 性能不低于原系统

---

## 📚 参考资料

- [Express.js官方文档](https://expressjs.com/)
- [MongoDB官方文档](https://www.mongodb.com/docs/)
- [Redis官方文档](https://redis.io/docs/)
- [Milvus官方文档](https://milvus.io/docs)
- [Docker官方文档](https://docs.docker.com/)
- [PM2文档](https://pm2.keymetrics.io/docs/)

---

**文档版本**: v1.0  
**更新时间**: 2025年12月  
**维护团队**: Thus-Note Team
