# 如是 (Thus-Note) 项目规划

## 🎯 项目概述

**如是** 是基于 [Liubai](https://github.com/yenche123/liubai) 进行二次开发的个人信息管理系统,致力于提供"如是记录,真实自我"的使用体验。项目核心创新在于实现**原子化信息管理**,将复杂信息拆分为最小可管理单元,支持灵活组合和重用。

- **项目仓库**: https://github.com/poboll/thus-note
- **域名**: idrop.in
- **开源协议**: AGPL-3.0-or-later
- **开发状态**: 品牌化完成,后端本地化迁移进行中
- **学术定位**: 面向多平台的原子化笔记系统设计与实现

## 📋 当前状态

### ✅ 已完成
- [x] 项目重新品牌化 (Liubai → Thus-Note → 如是)
- [x] 目录结构重命名 (`liubai-*` → `thus-*`)
- [x] 核心配置文件更新 (package.json, README.md)
- [x] 项目归属声明 (NOTICE 文件)
- [x] 前端页面信息更新 (index.html)
- [x] 品牌词汇统一替换 ("如是" → "如是")
- [x] 域名更新 (idrop.in)
- [x] Favicon 更新 (使用用户指定的 pic.svg)
- [x] PWA 配置更新 (manifest.json)
- [x] 多语言文件更新 (zh-Hans.json, en.json)
- [x] 数据库类名更新 (ThusNoteDexie → ThusNoteDexie)
- [x] 前端开发环境验证 (http://localhost:5175/)
- [x] 后端迁移架构设计完成
- [x] 详细技术方案文档编写完成

### 🔄 进行中
- [ ] 后端本地化迁移 (LAF云函数 → Node.js + Express)
- [ ] 数据库迁移和验证
- [ ] API兼容性测试
- [ ] 文档站点品牌化更新
- [ ] VS Code 插件品牌化
- [ ] 微信小程序品牌化

### 📅 计划中
- [ ] 原子化信息管理架构实现
- [ ] UI/UX 优化升级
- [ ] 功能扩展和增强
- [ ] 性能优化和监控

## 🏗️ 技术架构

### 当前架构 (LAF云函数)

```
thus-note/
├── thus-frontends/          # 前端项目
│   ├── thus-web/           # Vue 3 + TypeScript Web 应用
│   ├── thus-vscode-extension/  # VS Code 插件
│   └── thus-weixin/        # 微信小程序
├── thus-backends/           # 后端项目
│   ├── thus-laf/          # LAF 云函数 (当前,20+个云函数)
│   └── thus-ffmpeg/       # FFmpeg 服务
├── thus-docs/              # VitePress 文档
└── memory-bank/            # AI 工作区
```

**LAF云函数列表**:
- `user-login.ts` - 用户认证(GitHub/Google/微信/邮箱/手机)
- `sync-get.ts` - 数据同步获取
- `sync-set.ts` - 数据同步设置
- `sync-operate.ts` - 数据同步操作
- `sync-after.ts` - 同步后处理
- `ai-entrance.ts` - AI入口
- `ai-prompt.ts` - AI提示词
- `ai-system-two.ts` - AI系统2
- `file-set.ts` - 文件上传
- `file-utils.ts` - 文件工具
- `people-tasks.ts` - 任务管理
- `service-poly.ts` - 多语言服务
- `service-send.ts` - 发送服务
- `subscribe-plan.ts` - 订阅计划
- `payment-order.ts` - 支付订单
- `webhook-*.ts` - Webhook回调(支付宝/微信/Stripe/七牛)
- `clock-*.ts` - 定时任务

### 目标架构 (本地Node.js)

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
            Express[Express框架]
            Router[API路由层]
            Middleware[中间件层<br/>认证/限流/日志]
            Controllers[控制器层]
            Services[业务逻辑层]
        end
        
        subgraph Workers[后台任务]
            Queue[任务队列<br/>Bull]
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
        Email[邮件服务]
        SMS[短信服务]
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

**目标架构目录结构**:
```
thus-note/
├── thus-frontends/          # 前端项目 (保持不变)
│   ├── thus-web/           # Vue 3 + TypeScript Web 应用
│   ├── thus-vscode-extension/  # VS Code 插件
│   └── thus-weixin/        # 微信小程序
├── thus-backends/           # 后端项目
│   ├── thus-server/        # 新的 Node.js 后端 (主要)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── app.ts
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── utils/
│   │   │   ├── workers/
│   │   │   └── types/
│   │   ├── tests/
│   │   ├── scripts/
│   │   ├── uploads/
│   │   ├── logs/
│   │   └── package.json
│   ├── thus-laf/          # LAF 云函数 (备用/迁移参考)
│   └── thus-ffmpeg/       # FFmpeg 服务
├── thus-docs/              # 文档
├── deployment/             # 部署配置
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── Dockerfile
│   └── nginx/
│       └── nginx.conf
├── plans/                  # 计划文档
│   └── backend-migration-plan.md
└── scripts/                # 工具脚本
```

## 🔧 后端迁移详细方案

### 技术选型

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **Web框架** | Express.js | 成熟稳定,生态丰富,易于迁移 |
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

### API兼容性方案

#### LAF云函数 → RESTful API映射

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

#### 请求/响应格式兼容

**前端请求格式(保持不变)**:
```typescript
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

**后端响应格式(保持不变)**:
```typescript
{
  code: string,  // "0000"表示成功,其他为错误码
  data?: any,
  errMsg?: string
}
```

### 数据库迁移策略

#### MongoDB数据迁移

1. **导出LAF数据库**
   ```bash
   mongodump --uri="mongodb://laf-user:password@laf-host:27017/laf-db" --out=./backup
   ```

2. **导入本地MongoDB**
   ```bash
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

#### Redis状态迁移

| LAF cloud.shared | Redis数据结构 | 说明 |
|-----------------|--------------|------|
| `blocked_ips` | Set `blocked:ips` | IP黑名单 |
| `config` | Hash `config:system` | 系统配置 |
| `rate_limits` | String `rate:${ip}:${window}` | 限流计数 |
| `sessions` | Hash `session:${token}` | 会话信息 |

### 安全性迁移方案

#### 加密机制保持
- **RSA 2048-bit**: 用于客户端加密
- **AES-GCM 256-bit**: 用于数据加密
- **JWT**: 用于会话管理

#### OAuth认证流程
- GitHub OAuth
- Google OAuth
- 微信公众号/小程序 OAuth
- 邮箱验证 (Resend/腾讯SES)
- 手机短信验证 (腾讯SMS)

#### 限流机制
- 60次/分钟 (基于Redis)
- 5次/秒 (基于Redis)
- IP黑名单 (基于Redis)

## 🎯 原子化信息管理架构

### 核心设计理念

原子化信息管理将复杂信息拆分为最小的、语义完整的、独立可管理的信息单元(原子),支持灵活组合、重用、关联和检索。

### 原子化数据模型

```typescript
// 原子化内容单元
interface ContentAtom {
  _id: string
  type: 'text' | 'image' | 'file' | 'tag' | 'status' | 'reference'
  data: any
  metadata: {
    created_at: Date
    updated_at: Date
    author: string
    version: number
  }
  relations: {
    parent?: string
    children: string[]
    references: string[]
  }
}

// 原子化组合
interface Thread {
  _id: string
  atoms: ContentAtom[]
  metadata: {
    title: string
    created_at: Date
    updated_at: Date
    author: string
    tags: string[]
  }
}
```

### 原子化操作API

```typescript
// 原子操作路由
POST /api/atom/create    // 创建原子
POST /api/atom/update    // 更新原子
POST /api/atom/delete    // 删除原子
POST /api/atom/combine   // 组合原子
POST /api/atom/split     // 拆分原子
POST /api/atom/link      // 关联原子
POST /api/atom/search    // 搜索原子
```

## 🚀 迁移实施计划

### 第一阶段: 基础设施搭建 (1-2周)

#### 任务清单
- [ ] 创建thus-server项目结构
- [ ] 配置TypeScript和开发环境
- [ ] 搭建Express基础框架
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

### 第五阶段: 原子化信息管理实现 (2-3周)

#### 任务清单
- [ ] 设计原子化数据模型
- [ ] 实现原子化CRUD操作
- [ ] 实现原子组合和拆分
- [ ] 实现原子关联和引用
- [ ] 实现原子搜索和过滤
- [ ] 优化原子化查询性能
- [ ] 编写原子化功能文档

#### 验收标准
- [ ] 原子化数据模型完整
- [ ] 原子化操作功能正常
- [ ] 性能满足要求
- [ ] 文档完善

## 📊 风险评估与应对

### 主要风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 数据迁移失败 | 高 | 中 | 完整备份、分步迁移、回滚方案 |
| API兼容性问题 | 高 | 中 | 充分测试、兼容性中间件 |
| 性能下降 | 中 | 低 | 性能基准测试、优化查询、缓存 |
| 第三方服务集成问题 | 中 | 中 | 充分测试、降级方案 |
| 开发周期超期 | 中 | 中 | 敏捷开发、里程碑管理 |
| 原子化架构复杂度高 | 中 | 中 | 渐进式实现、充分设计 |

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

## 📈 成功指标

### 技术指标
- [ ] 前端构建成功率 100%
- [ ] API响应时间 < 200ms (P95)
- [ ] 系统可用性 > 99.9%
- [ ] 数据迁移完整性 100%
- [ ] 测试覆盖率 > 80%

### 用户体验指标
- [ ] 页面加载时间 < 3s
- [ ] 功能完整性保持
- [ ] 用户界面一致性
- [ ] 跨平台兼容性
- [ ] 用户无感知迁移

### 学术指标
- [ ] 原子化信息管理模型完整实现
- [ ] 多平台数据同步算法优化
- [ ] 离线优先架构完善
- [ ] AI智能增强功能集成

### 项目指标
- [ ] 代码覆盖率 > 80%
- [ ] 文档完整性
- [ ] 部署自动化
- [ ] 监控告警完善

## 📝 开发规范

### Git提交规范
```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
perf: 性能优化
security: 安全相关
```

### 分支策略
- `main`: 主分支,稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支
- `migration/*`: 迁移相关分支

### 代码审查
- 所有PR需要代码审查
- 自动化测试必须通过
- 文档同步更新
- 性能影响评估

## 🐳 部署方案

### Docker容器化

#### Docker Compose配置
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
      - ./deployment/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./thus-frontends/thus-web/dist:/usr/share/nginx/html
    depends_on:
      - thus-server

volumes:
  mongodb_data:
  redis_data:
  milvus_data:
```

### PM2进程管理

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

## 📚 相关文档

- [后端迁移详细方案](plans/backend-migration-plan.md)
- [学术任务书](renwu.md)
- [前端README](thus-frontends/thus-web/README.md)
- [项目NOTICE](NOTICE)

## 📞 联系方式

- **GitHub**: https://github.com/poboll/thus-note
- **Issues**: https://github.com/poboll/thus-note/issues
- **Discussions**: https://github.com/poboll/thus-note/discussions

---

**更新时间**: 2025年12月  
**项目状态**: 后端迁移进行中  
**维护团队**: Thus-Note Team
