# Design Document

## Overview

本设计文档描述了如是记录(Thus-Note)系统的UI美化、全局错误处理、登录方式优化、微信小程序自动记录笔记功能以及功能完整性检查的技术实现方案。

系统采用Vue 3 + TypeScript前端和Node.js + Express后端架构。设计重点包括：
- 创建统一的全局错误处理组件
- 优化登录页面的默认行为和用户体验
- 实现微信小程序消息接收的Webhook端点
- 提升整体UI的视觉效果和一致性
- 建立完整的功能测试框架

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Frontend (Vue 3)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Error Modal  │  │ Login Page   │  │ UI Components│      │
│  │  Component   │  │  (Enhanced)  │  │  (Styled)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                 │                                  │
│         └─────────────────┴──────────────┐                  │
│                                           │                  │
│                    ┌──────────────────────▼─────────┐       │
│                    │   API Request Layer            │       │
│                    │   (thus-req.ts)                │       │
│                    └──────────────┬─────────────────┘       │
└───────────────────────────────────┼──────────────────────────┘
                                    │ HTTPS
                    ┌───────────────▼─────────────────┐
                    │   Backend API (Express)         │
                    │                                  │
                    │  ┌────────────────────────┐     │
                    │  │  Auth Routes           │     │
                    │  │  - Email/Password      │     │
                    │  │  - Verification Code   │     │
                    │  │  - OAuth (GitHub, etc) │     │
                    │  └────────────────────────┘     │
                    │                                  │
                    │  ┌────────────────────────┐     │
                    │  │  WeChat Webhook        │     │
                    │  │  - Message Receiver    │     │
                    │  │  - Note Creator        │     │
                    │  └────────────────────────┘     │
                    │                                  │
                    │  ┌────────────────────────┐     │
                    │  │  Error Middleware      │     │
                    │  │  - Standardized Errors │     │
                    │  └────────────────────────┘     │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │   MongoDB Database           │
                    │   - Users                    │
                    │   - Threads (Notes)          │
                    │   - Contents                 │
                    └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              WeChat MiniProgram                              │
│  ┌──────────────────────────────────────────────┐           │
│  │  Message Sender                               │           │
│  │  - Text, Image, Voice                        │           │
│  └──────────────┬───────────────────────────────┘           │
└─────────────────┼────────────────────────────────────────────┘
                  │ HTTPS Webhook
                  │
                  ▼
        Backend Webhook Endpoint
```

### Data Flow

#### 1. Error Handling Flow
```
API Request → Error Occurs → Error Interceptor → 
Error Modal Component → Display to User → User Dismisses
```

#### 2. Login Flow (Email/Password)
```
User Enters Credentials → Frontend Validation → 
POST /api/auth/email → Backend Validation → 
JWT Token Generation → Return User Data → 
Store Token → Redirect to App
```

#### 3. WeChat Note Creation Flow
```
User Sends Message in MiniProgram → 
POST /api/wechat/webhook → Verify Request → 
Parse Message Type → Create Thread → 
Create Content → Return Success
```

## Components and Interfaces

### Frontend Components

#### 1. Global Error Modal Component

**Location**: `thus-frontends/thus-web/src/components/common/ErrorModal.vue`

**Props**:
```typescript
interface ErrorModalProps {
  visible: boolean;
  errorType: 'network' | 'business' | 'validation' | 'auth' | 'unknown';
  errorCode: string;
  errorMessage: string;
  details?: string;
}
```

**Emits**:
```typescript
interface ErrorModalEmits {
  (e: 'close'): void;
  (e: 'retry'): void;
}
```

**Features**:
- 根据错误类型显示不同的图标和颜色
- 支持多语言错误消息
- 提供重试和关闭按钮
- 自动消失选项（可配置）
- 响应式设计，适配移动端和桌面端

#### 2. Error Handling Composable

**Location**: `thus-frontends/thus-web/src/hooks/useErrorHandler.ts`

```typescript
interface ErrorHandler {
  showError: (error: ApiError) => void;
  clearError: () => void;
  errorState: Ref<ErrorState | null>;
}

interface ErrorState {
  type: 'network' | 'business' | 'validation' | 'auth' | 'unknown';
  code: string;
  message: string;
  details?: string;
}

interface ApiError {
  code: string;
  errMsg?: string;
  data?: any;
}
```

**Usage**:
```typescript
const { showError, clearError, errorState } = useErrorHandler();

// In API call
const result = await thusReq.request('/api/endpoint', body);
if (result.code !== '0000') {
  showError(result);
}
```

#### 3. Enhanced Login Page

**Location**: `thus-frontends/thus-web/src/pages/level1/login-page/lp-main/lp-main.vue`

**State**:
```typescript
interface LoginPageState {
  current: 1 | 2; // 1: Email/Phone, 2: Third Party
  btnOne: 'email' | 'phone';
  emailLoginMethod: 'password' | 'code'; // Default: 'password'
  emailVal: string;
  passwordVal: string;
  phoneVal: string;
  smsVal: string;
  emailEnabled: boolean;
  phoneEnabled: boolean;
  isSendingEmail: boolean;
  isLoggingByPhone: boolean;
}
```

**Default Behavior**:
- `current` 默认为 `1` (Email/Phone tab)
- `btnOne` 默认为 `'email'`
- `emailLoginMethod` 默认为 `'password'`
- 显示邮箱密码登录表单作为首选
- 提供切换到验证码登录的按钮
- 保留第三方登录选项在第二个tab

### Backend API Endpoints

#### 1. WeChat Webhook Endpoint

**Route**: `POST /api/wechat/webhook`

**Request Headers**:
```typescript
{
  'Content-Type': 'application/json',
  'X-WeChat-Signature': string, // 微信签名
  'X-WeChat-Timestamp': string, // 时间戳
  'X-WeChat-Nonce': string,     // 随机数
}
```

**Request Body**:
```typescript
interface WeChatWebhookRequest {
  userId: string;           // 用户ID
  messageType: 'text' | 'image' | 'voice';
  content?: string;         // 文本内容
  mediaId?: string;         // 图片/语音的媒体ID
  mediaUrl?: string;        // 媒体文件URL
  timestamp: number;        // 消息时间戳
}
```

**Response**:
```typescript
interface WeChatWebhookResponse {
  code: string;
  data?: {
    threadId: string;
    contentId: string;
  };
  errMsg?: string;
}
```

**Success Response** (200):
```json
{
  "code": "0000",
  "data": {
    "threadId": "507f1f77bcf86cd799439011",
    "contentId": "507f1f77bcf86cd799439012"
  }
}
```

**Error Responses**:
- 400: Invalid request format
- 401: Invalid signature
- 404: User not found
- 500: Internal server error

#### 2. Enhanced Auth Endpoints

**Existing Endpoints** (No changes to API contract):
- `POST /api/auth/email` - Email/Password login
- `POST /api/auth/verify-code` - Verification code login
- `POST /api/auth/github` - GitHub OAuth
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/wechat/gzh` - WeChat Official Account

**Frontend Changes**:
- Login page defaults to email/password method
- Verification code login available via toggle button
- Third-party login options remain accessible

## Data Models

### WeChat Message Model

```typescript
interface WeChatMessage {
  userId: string;
  messageType: 'text' | 'image' | 'voice';
  content?: string;
  mediaId?: string;
  mediaUrl?: string;
  timestamp: number;
}
```

### Thread (Note) Model

**Existing Model** (No changes):
```typescript
interface Thread {
  _id: ObjectId;
  userId: ObjectId;
  spaceId: ObjectId;
  title?: string;
  content: string;
  contentType: 'text' | 'image' | 'voice' | 'mixed';
  tags: string[];
  status: 'active' | 'archived' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}
```

### Error Response Model

```typescript
interface ErrorResponse {
  code: string;
  errMsg: string;
  data?: any;
}

// Error Code Categories
type ErrorCode = 
  | `F${string}` // Frontend errors (F0001, F0002, etc.)
  | `B${string}` // Backend errors (B0001, B0500, etc.)
  | `C${string}` // Client errors (C0001, C0002, etc.)
  | `E${string}` // Business logic errors (E4009, etc.)
  | '0000';      // Success
```

## Data Models

### Error Code Mapping

```typescript
const ERROR_CODES = {
  // Success
  '0000': { type: 'success', message: 'Success' },
  
  // Frontend Errors (F)
  'F0002': { type: 'network', message: 'Request timeout' },
  'F0003': { type: 'network', message: 'Request aborted' },
  
  // Backend Errors (B)
  'B0001': { type: 'network', message: 'Server unavailable' },
  'B0500': { type: 'network', message: 'Internal server error' },
  
  // Client Errors (C)
  'C0001': { type: 'unknown', message: 'Unknown error' },
  'C0002': { type: 'auth', message: 'Authentication failed' },
  
  // Business Logic Errors (E)
  'E4009': { type: 'business', message: 'Decryption error' },
  
  // Validation Errors (V)
  'V0001': { type: 'validation', message: 'Invalid input' },
  'V0002': { type: 'validation', message: 'Missing required field' },
} as const;
```

## Correctness Properties

*属性(Property)是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证的正确性保证之间的桥梁。*

### Property 1: API错误统一处理

*对于任何*失败的API请求（网络错误、业务错误、验证错误），Error_Modal组件应该显示包含正确错误类型、错误代码和错误消息的弹窗。

**Validates: Requirements 2.1, 2.3, 2.4**

### Property 2: 错误弹窗关闭清除状态

*对于任何*显示的错误弹窗，当用户点击关闭按钮时，错误状态应该被清除，弹窗应该消失。

**Validates: Requirements 2.5**

### Property 3: 多语言错误消息支持

*对于任何*错误代码和任何支持的语言设置，Error_Modal应该显示该语言的错误消息。

**Validates: Requirements 2.7**

### Property 4: 邮箱密码登录验证

*对于任何*有效的邮箱和密码组合，Backend_API应该验证凭据并返回包含访问令牌和刷新令牌的成功响应。

**Validates: Requirements 3.2**

### Property 5: 第三方登录OAuth启动

*对于任何*支持的第三方登录提供商（GitHub、Google、WeChat），点击对应按钮应该启动正确的OAuth认证流程。

**Validates: Requirements 3.4**

### Property 6: 微信消息自动创建笔记

*对于任何*有效的微信消息（文本、图片、语音），Webhook端点应该接收消息并创建对应类型的Note，返回包含threadId和contentId的成功响应。

**Validates: Requirements 4.1, 4.2, 4.3, 4.7**

### Property 7: 无效消息格式错误处理

*对于任何*无效的消息格式（缺少必需字段、错误的类型等），Webhook端点应该返回描述性的错误响应，不创建笔记。

**Validates: Requirements 4.6**

## Error Handling

### Error Categories

系统定义以下错误类别：

1. **Network Errors (F/B类)**: 网络连接失败、超时、服务器不可用
2. **Authentication Errors (C类)**: 令牌过期、未授权访问
3. **Business Logic Errors (E类)**: 业务规则违反、数据不一致
4. **Validation Errors (V类)**: 输入验证失败、格式错误
5. **Unknown Errors**: 未分类的错误

### Error Handling Strategy

#### Frontend Error Handling

1. **API请求拦截器**:
   - 在`thus-req.ts`中捕获所有API错误
   - 将错误代码映射到错误类型
   - 触发全局错误处理器

2. **全局错误处理器**:
   - 使用`useErrorHandler` composable
   - 维护错误状态
   - 触发Error_Modal显示

3. **Error_Modal组件**:
   - 根据错误类型显示不同样式
   - 支持多语言消息
   - 提供关闭和重试选项

#### Backend Error Handling

1. **统一错误响应格式**:
```typescript
{
  code: string,      // 错误代码
  errMsg: string,    // 错误消息
  data?: any         // 可选的额外数据
}
```

2. **错误中间件**:
   - 捕获所有未处理的异常
   - 记录错误日志
   - 返回标准化错误响应

3. **Webhook签名验证**:
   - 验证X-WeChat-Signature头
   - 使用时间戳防止重放攻击
   - 无效签名返回401错误

### Error Recovery

1. **自动重试**: 网络错误支持自动重试（最多3次）
2. **令牌刷新**: 401错误自动尝试刷新令牌
3. **降级处理**: 某些非关键功能失败时继续运行
4. **用户引导**: 错误消息提供明确的解决建议

## Testing Strategy

### Dual Testing Approach

系统采用单元测试和属性测试相结合的策略：

#### Unit Tests

**目的**: 验证特定示例、边缘情况和错误条件

**覆盖范围**:
- 登录页面默认显示邮箱密码表单（Requirement 3.1）
- 点击验证码登录切换表单（Requirement 3.3）
- 登录页面显示所有登录选项（Requirement 3.5）
- 网络错误显示特定提示（Requirement 2.2）
- Webhook签名验证拒绝无效请求（Requirement 4.8）

**工具**: Jest + Vue Test Utils (前端), Jest + Supertest (后端)

#### Property-Based Tests

**目的**: 验证通用属性在所有输入下都成立

**配置**:
- 使用fast-check库（JavaScript/TypeScript）
- 每个属性测试最少100次迭代
- 每个测试标记对应的设计属性

**覆盖范围**:
- Property 1: API错误统一处理
- Property 2: 错误弹窗关闭清除状态
- Property 3: 多语言错误消息支持
- Property 4: 邮箱密码登录验证
- Property 5: 第三方登录OAuth启动
- Property 6: 微信消息自动创建笔记
- Property 7: 无效消息格式错误处理

**标记格式**:
```typescript
// Feature: ui-improvements-and-wechat-notes, Property 1: API错误统一处理
test('property: API errors show correct error modal', () => {
  fc.assert(
    fc.property(
      fc.record({
        code: fc.string(),
        errMsg: fc.string(),
      }),
      async (error) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

**目的**: 验证系统各部分协同工作

**覆盖范围**:
- 完整的登录流程（前端→后端→数据库）
- 微信Webhook端到端流程
- 错误处理端到端流程

**工具**: Playwright (E2E), Supertest (API)

### Test Organization

```
thus-frontends/thus-web/
├── src/
│   └── components/
│       └── common/
│           ├── ErrorModal.vue
│           └── __tests__/
│               ├── ErrorModal.spec.ts        # Unit tests
│               └── ErrorModal.property.ts    # Property tests

thus-backends/thus-server/
├── src/
│   └── routes/
│       ├── wechat.ts
│       └── __tests__/
│           ├── wechat.spec.ts               # Unit tests
│           └── wechat.property.ts           # Property tests
└── tests/
    └── integration/
        ├── login-flow.test.ts
        └── wechat-webhook.test.ts
```

### Test Data Generation

**Property Tests使用的生成器**:

```typescript
// 错误代码生成器
const errorCodeGen = fc.oneof(
  fc.constant('F0002'),
  fc.constant('B0001'),
  fc.constant('C0002'),
  fc.constant('E4009'),
  fc.string({ minLength: 5, maxLength: 5 })
);

// 微信消息生成器
const wechatMessageGen = fc.record({
  userId: fc.hexaString({ minLength: 24, maxLength: 24 }),
  messageType: fc.constantFrom('text', 'image', 'voice'),
  content: fc.option(fc.string()),
  mediaId: fc.option(fc.string()),
  mediaUrl: fc.option(fc.webUrl()),
  timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
});

// 登录凭据生成器
const credentialsGen = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 32 }),
});
```

## Implementation Notes

### UI Styling Guidelines

1. **颜色方案**:
   - 主色调: `var(--main-normal)`
   - 成功: `#10b981`
   - 警告: `#f59e0b`
   - 错误: `#ef4444`
   - 信息: `#3b82f6`

2. **动画**:
   - 过渡时间: 200-300ms
   - 缓动函数: `cubic-bezier(0.4, 0, 0.2, 1)`
   - 错误弹窗淡入淡出

3. **响应式断点**:
   - 移动端: < 768px
   - 平板: 768px - 1024px
   - 桌面: > 1024px

### Security Considerations

1. **Webhook签名验证**:
```typescript
function verifyWeChatSignature(
  signature: string,
  timestamp: string,
  nonce: string,
  body: string
): boolean {
  const token = process.env.WECHAT_WEBHOOK_TOKEN;
  const arr = [token, timestamp, nonce, body].sort();
  const str = arr.join('');
  const hash = crypto.createHash('sha1').update(str).digest('hex');
  return hash === signature;
}
```

2. **时间戳验证**:
   - 拒绝超过5分钟的请求
   - 防止重放攻击

3. **速率限制**:
   - Webhook端点: 100请求/分钟/用户
   - 登录端点: 5次失败后锁定5分钟

### Performance Considerations

1. **错误弹窗**:
   - 使用Vue Teleport避免z-index问题
   - 懒加载，仅在需要时渲染

2. **Webhook处理**:
   - 异步处理消息
   - 使用消息队列处理高并发
   - 媒体文件异步下载

3. **登录页面**:
   - 预加载第三方OAuth脚本
   - 表单验证防抖（300ms）

## Deployment Considerations

### Environment Variables

**Frontend** (`.env`):
```bash
VITE_API_DOMAIN=https://api.thus-note.com/
VITE_WECHAT_APP_ID=wx1234567890abcdef
```

**Backend** (`.env`):
```bash
# WeChat Configuration
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_app_secret
WECHAT_WEBHOOK_TOKEN=your_webhook_token

# OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Database Migrations

无需数据库迁移，使用现有的Thread和Content模型。

### Monitoring

1. **错误监控**:
   - 前端: Sentry集成
   - 后端: Winston日志 + Sentry

2. **Webhook监控**:
   - 请求成功率
   - 平均响应时间
   - 失败原因分布

3. **登录监控**:
   - 各登录方式使用率
   - 登录成功/失败率
   - 平均登录时间
