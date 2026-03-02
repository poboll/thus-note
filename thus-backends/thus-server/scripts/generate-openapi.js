#!/usr/bin/env node
/**
 * OpenAPI 3.0 Spec Generator for Thus-Note Backend
 * Generates openapi.json from route/model definitions
 */

const fs = require('fs');
const path = require('path');

// ─── Common Response Schemas ────────────────────────────────────────────────
const SuccessResponse = (dataSchema) => ({
  description: '操作成功',
  content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string', example: '0000' }, data: dataSchema } } } }
});

const ErrorResponse = (desc = '请求失败') => ({
  description: desc,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
});

const PaginatedResponse = (itemRef) => ({
  type: 'object',
  properties: {
    items: { type: 'array', items: { $ref: `#/components/schemas/${itemRef}` } },
    pagination: { $ref: '#/components/schemas/Pagination' }
  }
});

const bearerSecurity = [{ bearerAuth: [] }];
const adminSecurity = [{ bearerAuth: [] }];

// ─── Build Spec ─────────────────────────────────────────────────────────────
const spec = {
  openapi: '3.0.0',
  info: {
    title: '如是 (Thus-Note) API',
    description: '如是笔记后端 RESTful API 完整文档。支持笔记管理、AI 智能助手、多端同步、文件管理等功能。',
    version: '1.0.0',
    contact: { name: 'Thus-Note Team', url: 'https://github.com/poboll/thus-note' },
    license: { name: 'AGPL-3.0', url: 'https://www.gnu.org/licenses/agpl-3.0.html' }
  },
  servers: [
    { url: 'https://thus.caiths.com', description: '生产环境' },
    { url: 'http://localhost:3000', description: '本地开发' }
  ],
  tags: [
    { name: '认证', description: '用户注册、登录、OAuth、令牌管理' },
    { name: '统一登录', description: '兼容旧版的统一登录入口' },
    { name: '用户设置(兼容)', description: '兼容旧版的用户设置入口' },
    { name: '笔记', description: '笔记/线程 CRUD 操作' },
    { name: '内容', description: '笔记内容块管理' },
    { name: '评论', description: '笔记评论管理' },
    { name: '同步', description: '多端数据同步' },
    { name: '设置', description: '用户个人设置' },
    { name: '文件', description: '文件上传、下载、管理' },
    { name: 'AI', description: 'AI 智能助手功能' },
    { name: '任务', description: '任务管理' },
    { name: '政策', description: '服务条款与隐私政策' },
    { name: '版本', description: '应用版本检查' },
    { name: '微信', description: '微信 Webhook 和消息处理' },
    { name: '开放连接', description: '第三方账号绑定' },
    { name: '管理后台', description: '系统管理（需要管理员权限）' },
    { name: '订阅', description: '订阅计划管理' },
    { name: '支付', description: '支付订单处理' },
    { name: '测试', description: '测试和调试端点' },
    { name: '健康检查', description: '服务健康状态' }
  ],

  // ─── Paths ──────────────────────────────────────────────────────────────
  paths: {
    // ── Health Check ──
    '/health': {
      get: {
        tags: ['健康检查'], operationId: 'healthCheck', summary: '服务健康检查',
        responses: { 200: SuccessResponse({ type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' }, timestamp: { type: 'string' }, connections: { type: 'object', properties: { mongodb: { type: 'boolean' }, redis: { type: 'boolean' } } }, uptime: { type: 'number' } } }) }
      }
    },
    '/health/db': {
      get: {
        tags: ['健康检查'], operationId: 'dbHealthCheck', summary: '数据库连接状态',
        responses: { 200: SuccessResponse({ type: 'object', properties: { mongodb: { type: 'string' }, redis: { type: 'string' } } }) }
      }
    },

    // ── Auth ──
    '/api/auth/github/url': {
      get: { tags: ['认证'], operationId: 'getGithubUrl', summary: '获取 GitHub OAuth 授权 URL', responses: { 200: SuccessResponse({ type: 'object', properties: { url: { type: 'string' } } }) } }
    },
    '/api/auth/github': {
      post: {
        tags: ['认证'], operationId: 'githubLogin', summary: 'GitHub OAuth 登录',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string', description: 'GitHub OAuth 授权码' }, client_key: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }), 401: ErrorResponse('认证失败') }
      }
    },
    '/api/auth/google/url': {
      get: { tags: ['认证'], operationId: 'getGoogleUrl', summary: '获取 Google OAuth 授权 URL', responses: { 200: SuccessResponse({ type: 'object', properties: { url: { type: 'string' } } }) } }
    },
    '/api/auth/google': {
      post: {
        tags: ['认证'], operationId: 'googleLogin', summary: 'Google OAuth 登录',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string' }, client_key: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }), 401: ErrorResponse('认证失败') }
      }
    },
    '/api/auth/wechat/url': {
      get: { tags: ['认证'], operationId: 'getWechatUrl', summary: '获取微信 OAuth 授权 URL', responses: { 200: SuccessResponse({ type: 'object', properties: { url: { type: 'string' } } }) } }
    },
    '/api/auth/wechat/gzh': {
      post: {
        tags: ['认证'], operationId: 'wechatGzhLogin', summary: '微信公众号登录',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string' }, client_key: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }) }
      }
    },
    '/api/auth/wechat/mini': {
      post: {
        tags: ['认证'], operationId: 'wechatMiniLogin', summary: '微信小程序登录',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['code'], properties: { code: { type: 'string' }, client_key: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }) }
      }
    },
    '/api/auth/email': {
      post: {
        tags: ['认证'], operationId: 'emailLogin', summary: '邮箱密码登录',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' }, client_key: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }), 401: ErrorResponse('邮箱或密码错误') }
      }
    },
    '/api/auth/phone': {
      post: {
        tags: ['认证'], operationId: 'phoneLogin', summary: '手机验证码登录',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['phone', 'code'], properties: { phone: { type: 'string' }, code: { type: 'string', minLength: 6, maxLength: 6 } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }) }
      }
    },
    '/api/auth/send-code': {
      post: {
        tags: ['认证'], operationId: 'sendVerificationCode', summary: '发送验证码',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type', 'identifier'], properties: { type: { type: 'string', enum: ['EMAIL', 'PHONE'] }, identifier: { type: 'string', description: '邮箱或手机号' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'string' }, expiresIn: { type: 'integer', example: 300 } } }), 429: ErrorResponse('发送频率过高') }
      }
    },
    '/api/auth/verify-code': {
      post: {
        tags: ['认证'], operationId: 'verifyCodeLogin', summary: '验证码登录',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['type', 'identifier', 'code'], properties: { type: { type: 'string', enum: ['EMAIL', 'PHONE'] }, identifier: { type: 'string' }, code: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }) }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['认证'], operationId: 'register', summary: '用户注册',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'email', 'password'], properties: { username: { type: 'string', minLength: 2, maxLength: 50 }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8, maxLength: 128, description: '需包含大小写字母、数字、特殊字符' } } } } } },
        responses: { 201: SuccessResponse({ type: 'object', properties: { user: { type: 'object', properties: { id: { type: 'string' }, username: { type: 'string' }, email: { type: 'string' } } }, token: { type: 'string' }, serial_id: { type: 'string' } } }), 409: ErrorResponse('邮箱已注册') }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['认证'], operationId: 'refreshToken', summary: '刷新访问令牌',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { token: { type: 'string' }, refreshToken: { type: 'string' } } }), 401: ErrorResponse('刷新令牌无效') }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['认证'], operationId: 'logout', summary: '用户登出', security: bearerSecurity,
        responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'string' } } }) }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['认证'], operationId: 'getCurrentUser', summary: '获取当前用户信息', security: bearerSecurity,
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/User' }), 401: ErrorResponse('未授权') }
      }
    },
    '/api/auth/create-test-user': {
      post: {
        tags: ['认证'], operationId: 'createTestUser', summary: '创建测试用户（仅开发环境）',
        responses: { 201: SuccessResponse({ $ref: '#/components/schemas/LoginResponse' }) }
      }
    },

    // ── Unified Login (Legacy) ──
    '/user-login': {
      post: {
        tags: ['统一登录'], operationId: 'unifiedLogin', summary: '统一登录入口（兼容旧版）',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['operateType'], properties: { operateType: { type: 'string', enum: ['init', 'email', 'email_code', 'phone', 'phone_code', 'github', 'google', 'wechat', 'users_select'], description: '操作类型' }, email: { type: 'string' }, phone: { type: 'string' }, code: { type: 'string' }, client_key: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },

    // ── User Settings (Legacy) ──
    '/user-settings': {
      post: {
        tags: ['用户设置(兼容)'], operationId: 'unifiedUserSettings', summary: '统一用户设置入口（兼容旧版）', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['operateType'], properties: { operateType: { type: 'string', enum: ['enter', 'latest', 'membership', 'logout'] } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },

    // ── Threads ──
    '/api/threads': {
      get: {
        tags: ['笔记'], operationId: 'getThreads', summary: '获取笔记列表', security: bearerSecurity,
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['note', 'task', 'calendar', 'kanban', 'drawing'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'archived', 'deleted'] } },
          { name: 'tag', in: 'query', schema: { type: 'string', maxLength: 50 } },
          { name: 'keyword', in: 'query', schema: { type: 'string', maxLength: 100 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 } }
        ],
        responses: { 200: SuccessResponse(PaginatedResponse('Thread')) }
      },
      post: {
        tags: ['笔记'], operationId: 'createThread', summary: '创建笔记', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title'], properties: { type: { type: 'string', enum: ['note', 'task', 'calendar', 'kanban', 'drawing'], default: 'note' }, title: { type: 'string', minLength: 1, maxLength: 200 }, description: { type: 'string', maxLength: 10000 }, tags: { type: 'array', items: { type: 'string', maxLength: 50 }, maxItems: 10 }, isPublic: { type: 'boolean', default: false }, settings: { type: 'object' } } } } } },
        responses: { 201: SuccessResponse({ $ref: '#/components/schemas/Thread' }) }
      }
    },
    '/api/threads/{id}': {
      get: {
        tags: ['笔记'], operationId: 'getThread', summary: '获取单个笔记', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Thread' }), 404: ErrorResponse('笔记不存在') }
      },
      put: {
        tags: ['笔记'], operationId: 'updateThread', summary: '更新笔记', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string', maxLength: 200 }, description: { type: 'string', maxLength: 10000 }, tags: { type: 'array', items: { type: 'string' } }, status: { type: 'string', enum: ['active', 'archived', 'deleted'] }, content: { type: 'string', maxLength: 100000 } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Thread' }) }
      },
      delete: {
        tags: ['笔记'], operationId: 'deleteThread', summary: '删除笔记（软删除）', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'string' } } }) }
      }
    },
    '/api/threads/{id}/archive': {
      post: {
        tags: ['笔记'], operationId: 'archiveThread', summary: '归档笔记', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Thread' }) }
      }
    },
    '/api/threads/search': {
      get: {
        tags: ['笔记'], operationId: 'searchThreads', summary: '搜索笔记', security: bearerSecurity,
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['note', 'task', 'calendar', 'kanban', 'drawing'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { 200: SuccessResponse(PaginatedResponse('Thread')) }
      }
    },

    // ── Contents ──
    '/api/contents': {
      get: {
        tags: ['内容'], operationId: 'getContents', summary: '获取内容列表', security: bearerSecurity,
        parameters: [
          { name: 'threadId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { 200: SuccessResponse(PaginatedResponse('Content')) }
      },
      post: {
        tags: ['内容'], operationId: 'createContent', summary: '创建内容', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['threadId', 'blocks'], properties: { threadId: { type: 'string' }, blocks: { type: 'array', items: { $ref: '#/components/schemas/ContentBlock' } }, isEncrypted: { type: 'boolean', default: false }, encryptedData: { type: 'string' } } } } } },
        responses: { 201: SuccessResponse({ $ref: '#/components/schemas/Content' }) }
      }
    },
    '/api/contents/latest/{threadId}': {
      get: {
        tags: ['内容'], operationId: 'getLatestContent', summary: '获取笔记最新内容', security: bearerSecurity,
        parameters: [{ name: 'threadId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Content' }) }
      }
    },
    '/api/contents/history/{threadId}': {
      get: {
        tags: ['内容'], operationId: 'getContentHistory', summary: '获取内容版本历史', security: bearerSecurity,
        parameters: [
          { name: 'threadId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: { 200: SuccessResponse({ type: 'array', items: { $ref: '#/components/schemas/Content' } }) }
      }
    },
    '/api/contents/{id}': {
      put: {
        tags: ['内容'], operationId: 'updateContent', summary: '更新内容', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { blocks: { type: 'array', items: { $ref: '#/components/schemas/ContentBlock' } }, isEncrypted: { type: 'boolean' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Content' }) }
      },
      delete: {
        tags: ['内容'], operationId: 'deleteContent', summary: '删除内容', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'string' } } }) }
      }
    },
    '/api/contents/{id}/blocks': {
      post: {
        tags: ['内容'], operationId: 'addContentBlock', summary: '添加内容块', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ContentBlock' } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Content' }) }
      }
    },
    '/api/contents/{id}/blocks/{index}': {
      put: {
        tags: ['内容'], operationId: 'updateContentBlock', summary: '更新内容块', security: bearerSecurity,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'index', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ContentBlock' } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Content' }) }
      },
      delete: {
        tags: ['内容'], operationId: 'deleteContentBlock', summary: '删除内容块', security: bearerSecurity,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'index', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Content' }) }
      }
    },

    // ── Comments ──
    '/api/comments': {
      get: {
        tags: ['评论'], operationId: 'getComments', summary: '获取评论列表', security: bearerSecurity,
        parameters: [
          { name: 'threadId', in: 'query', schema: { type: 'string' } },
          { name: 'contentId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: { 200: SuccessResponse(PaginatedResponse('Comment')) }
      },
      post: {
        tags: ['评论'], operationId: 'createComment', summary: '创建评论', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['threadId', 'contentId', 'content'], properties: { threadId: { type: 'string' }, contentId: { type: 'string' }, content: { type: 'string', maxLength: 5000 }, parentId: { type: 'string', description: '回复的评论 ID' }, mentions: { type: 'array', items: { type: 'string' } } } } } } },
        responses: { 201: SuccessResponse({ $ref: '#/components/schemas/Comment' }) }
      }
    },
    '/api/comments/{parentId}/replies': {
      get: {
        tags: ['评论'], operationId: 'getCommentReplies', summary: '获取评论回复', security: bearerSecurity,
        parameters: [{ name: 'parentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ type: 'array', items: { $ref: '#/components/schemas/Comment' } }) }
      }
    },
    '/api/comments/{id}': {
      put: {
        tags: ['评论'], operationId: 'updateComment', summary: '更新评论', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string', maxLength: 5000 } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/Comment' }) }
      },
      delete: {
        tags: ['评论'], operationId: 'deleteComment', summary: '删除评论（软删除）', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'string' } } }) }
      }
    },

    // ── Sync ──
    '/api/sync': {
      post: {
        tags: ['同步'], operationId: 'sync', summary: '统一同步端点', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SyncRequest' } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/sync/get': {
      post: {
        tags: ['同步'], operationId: 'syncGet', summary: '同步获取数据', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SyncRequest' } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/sync/set': {
      post: {
        tags: ['同步'], operationId: 'syncSet', summary: '同步设置数据', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SyncRequest' } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },

    // ── Settings ──
    '/api/settings': {
      get: {
        tags: ['设置'], operationId: 'getSettings', summary: '获取用户设置', security: bearerSecurity,
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/UserSettings' }) }
      },
      put: {
        tags: ['设置'], operationId: 'updateSettings', summary: '更新用户设置', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { username: { type: 'string' }, avatar: { type: 'string' }, settings: { type: 'object' } } } } } },
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/UserSettings' }) }
      }
    },
    '/api/settings/notifications': {
      put: {
        tags: ['设置'], operationId: 'updateNotificationSettings', summary: '更新通知设置', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'boolean' }, push: { type: 'boolean' }, sms: { type: 'boolean' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/settings/language': {
      put: {
        tags: ['设置'], operationId: 'updateLanguage', summary: '更新语言设置', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['language'], properties: { language: { type: 'string', enum: ['zh-CN', 'en-US'] } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/settings/theme': {
      put: {
        tags: ['设置'], operationId: 'updateTheme', summary: '更新主题设置', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['theme'], properties: { theme: { type: 'string', enum: ['light', 'dark', 'auto'] } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/settings/timezone': {
      put: {
        tags: ['设置'], operationId: 'updateTimezone', summary: '更新时区设置', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['timezone'], properties: { timezone: { type: 'string', example: 'Asia/Shanghai' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/settings/ai': {
      put: {
        tags: ['设置'], operationId: 'updateAiSettings', summary: '更新 AI 设置', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { aiEnabled: { type: 'boolean' }, aiTagCount: { type: 'integer' }, aiTagStyle: { type: 'string' }, aiFavoriteTags: { type: 'array', items: { type: 'string' } }, aiAutoTagMode: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },

    // ── Files ──
    '/api/files/upload': {
      post: {
        tags: ['文件'], operationId: 'uploadFiles', summary: '上传文件', security: bearerSecurity,
        requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 10, description: '最多 10 个文件，每个不超过 50MB' } } } } } },
        responses: { 200: SuccessResponse({ type: 'array', items: { $ref: '#/components/schemas/FileInfo' } }) }
      }
    },
    '/api/files': {
      get: {
        tags: ['文件'], operationId: 'getFiles', summary: '获取文件列表', security: bearerSecurity,
        responses: { 200: SuccessResponse({ type: 'array', items: { $ref: '#/components/schemas/FileInfo' } }) }
      }
    },
    '/api/files/{id}': {
      get: {
        tags: ['文件'], operationId: 'getFile', summary: '获取文件详情', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ $ref: '#/components/schemas/FileInfo' }) }
      },
      delete: {
        tags: ['文件'], operationId: 'deleteFile', summary: '删除文件', security: bearerSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'string' } } }) }
      }
    },
    '/api/files/{id}/download': {
      get: {
        tags: ['文件'], operationId: 'downloadFile', summary: '下载文件',
        description: '支持通过 Authorization header、x-liu-token header 或 query 参数 token 认证',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'token', in: 'query', schema: { type: 'string', description: '认证令牌（可选，用于无法设置 header 的场景）' } }
        ],
        responses: { 200: { description: '文件二进制流', content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } } } }
      }
    },

    // ── AI ──
    '/api/ai/prompt': {
      post: {
        tags: ['AI'], operationId: 'aiPrompt', summary: 'AI 自定义提示', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['prompt'], properties: { prompt: { type: 'string' }, context: { type: 'string' }, model: { type: 'string' }, temperature: { type: 'number' }, maxTokens: { type: 'integer' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { result: { type: 'string' } } }) }
      }
    },
    '/api/ai/summarize': {
      post: {
        tags: ['AI'], operationId: 'aiSummarize', summary: 'AI 内容总结', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' }, maxLength: { type: 'integer' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { summary: { type: 'string' } } }) }
      }
    },
    '/api/ai/analyze': {
      post: {
        tags: ['AI'], operationId: 'aiAnalyze', summary: 'AI 内容分析', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' }, analysisType: { type: 'string', enum: ['sentiment', 'keywords', 'topics', 'summary'] } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { analysis: { type: 'object' } } }) }
      }
    },
    '/api/ai/translate': {
      post: {
        tags: ['AI'], operationId: 'aiTranslate', summary: 'AI 翻译', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' }, targetLanguage: { type: 'string', default: 'en' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { translation: { type: 'string' } } }) }
      }
    },
    '/api/ai/code': {
      post: {
        tags: ['AI'], operationId: 'aiCode', summary: 'AI 代码生成', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['prompt'], properties: { prompt: { type: 'string' }, language: { type: 'string' }, context: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { code: { type: 'string' }, language: { type: 'string' } } }) }
      }
    },
    '/api/ai/chat': {
      post: {
        tags: ['AI'], operationId: 'aiChat', summary: 'AI 对话', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['messages'], properties: { messages: { type: 'array', items: { type: 'object', required: ['role', 'content'], properties: { role: { type: 'string', enum: ['user', 'assistant'] }, content: { type: 'string' } } } }, model: { type: 'string' }, temperature: { type: 'number' }, maxTokens: { type: 'integer' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } } } } }) }
      }
    },
    '/api/ai/auto-tag': {
      post: {
        tags: ['AI'], operationId: 'aiAutoTag', summary: 'AI 自动打标签', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['threadId'], properties: { threadId: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } } }) }
      }
    },
    '/api/ai/similar': {
      post: {
        tags: ['AI'], operationId: 'aiSimilar', summary: 'AI 相似笔记推荐', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['threadId'], properties: { threadId: { type: 'string' }, limit: { type: 'integer', default: 5 } } } } } },
        responses: { 200: SuccessResponse({ type: 'array', items: { $ref: '#/components/schemas/Thread' } }) }
      }
    },
    '/api/ai/batch-retag': {
      post: {
        tags: ['AI'], operationId: 'aiBatchRetag', summary: '批量 AI 打标签', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { retagAll: { type: 'boolean', default: false, description: 'true=所有笔记重新打标签, false=仅未标记的笔记' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { processed: { type: 'integer' }, tagged: { type: 'integer' } } }) }
      }
    },

    // ── Tasks ──
    '/api/tasks': {
      get: {
        tags: ['任务'], operationId: 'getTasks', summary: '获取任务列表', security: bearerSecurity,
        responses: { 200: SuccessResponse({ type: 'array', items: { $ref: '#/components/schemas/Task' } }) }
      },
      post: {
        tags: ['任务'], operationId: 'createTask', summary: '创建任务', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title'], properties: { title: { type: 'string', maxLength: 200 }, description: { type: 'string', maxLength: 2000 }, category: { type: 'string' }, deadline: { type: 'string', format: 'date-time' }, allowAnonymous: { type: 'boolean', default: false }, requireLogin: { type: 'boolean', default: true } } } } } },
        responses: { 201: SuccessResponse({ $ref: '#/components/schemas/Task' }) }
      }
    },

    // ── Policies ──
    '/api/policies/terms': {
      get: { tags: ['政策'], operationId: 'getTerms', summary: '获取服务条款', responses: { 200: SuccessResponse({ type: 'object', properties: { content: { type: 'string' }, updatedAt: { type: 'string' } } }) } }
    },
    '/api/policies/privacy': {
      get: { tags: ['政策'], operationId: 'getPrivacy', summary: '获取隐私政策', responses: { 200: SuccessResponse({ type: 'object', properties: { content: { type: 'string' }, updatedAt: { type: 'string' } } }) } }
    },

    // ── Version ──
    '/api/version/check': {
      get: {
        tags: ['版本'], operationId: 'checkVersion', summary: '检查版本更新',
        parameters: [
          { name: 'currentVersion', in: 'query', schema: { type: 'string' } },
          { name: 'platform', in: 'query', schema: { type: 'string' } }
        ],
        responses: { 200: SuccessResponse({ type: 'object', properties: { hasUpdate: { type: 'boolean' }, latestVersion: { type: 'string' }, downloadUrl: { type: 'string' }, releaseNotes: { type: 'string' } } }) }
      }
    },
    '/api/version/current': {
      get: { tags: ['版本'], operationId: 'getCurrentVersion', summary: '获取当前版本信息', responses: { 200: SuccessResponse({ type: 'object', properties: { version: { type: 'string' }, buildTime: { type: 'string' } } }) } }
    },

    // ── WeChat Webhook ──
    '/api/wechat/webhook': {
      post: {
        tags: ['微信'], operationId: 'wechatWebhook', summary: '接收微信消息',
        parameters: [
          { name: 'x-wechat-signature', in: 'header', schema: { type: 'string' } },
          { name: 'x-wechat-timestamp', in: 'header', schema: { type: 'string' } },
          { name: 'x-wechat-nonce', in: 'header', schema: { type: 'string' } }
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string' }, messageType: { type: 'string', enum: ['text', 'image', 'voice'] }, content: { type: 'string' }, mediaId: { type: 'string' }, mediaUrl: { type: 'string' }, timestamp: { type: 'integer' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/wechat/webhook/test': {
      get: { tags: ['微信'], operationId: 'testWechatWebhook', summary: '测试微信 Webhook', responses: { 200: SuccessResponse({ type: 'object' }) } }
    },

    // ── Open Connect ──
    '/api/open-connect': {
      post: {
        tags: ['开放连接'], operationId: 'openConnect', summary: '第三方账号绑定操作', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['operateType'], properties: { operateType: { type: 'string', enum: ['get-wechat', 'bind-wechat', 'unbind-wechat', 'get-wechat-qrcode'] } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/open-connect/callback': {
      get: {
        tags: ['开放连接'], operationId: 'openConnectCallback', summary: '微信 OAuth 回调', security: bearerSecurity,
        parameters: [{ name: 'code', in: 'query', required: true, schema: { type: 'string' } }, { name: 'state', in: 'query', schema: { type: 'string' } }],
        responses: { 302: { description: '重定向到前端' } }
      }
    },

    // ── Admin ──
    '/api/admin/config': {
      get: { tags: ['管理后台'], operationId: 'getConfig', summary: '获取系统配置（安全版）', security: adminSecurity, responses: { 200: SuccessResponse({ $ref: '#/components/schemas/SystemConfig' }), 403: ErrorResponse('权限不足') } }
    },
    '/api/admin/config/full': {
      get: { tags: ['管理后台'], operationId: 'getFullConfig', summary: '获取完整系统配置（含敏感信息）', security: adminSecurity, responses: { 200: SuccessResponse({ $ref: '#/components/schemas/SystemConfig' }) } }
    },
    '/api/admin/config/base': {
      post: {
        tags: ['管理后台'], operationId: 'updateBaseConfig', summary: '更新基础配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { baseUrl: { type: 'string' }, frontendUrl: { type: 'string' }, proxy: { type: 'object', properties: { enabled: { type: 'boolean' }, host: { type: 'string' }, port: { type: 'integer' } } } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/admin/config/storage': {
      post: {
        tags: ['管理后台'], operationId: 'updateStorageConfig', summary: '更新存储配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { type: { type: 'string', enum: ['LOCAL', 'S3'] }, localPath: { type: 'string' }, s3: { type: 'object' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/admin/config/sms': {
      post: { tags: ['管理后台'], operationId: 'updateSmsConfig', summary: '更新短信配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) } }
    },
    '/api/admin/config/email': {
      post: { tags: ['管理后台'], operationId: 'updateEmailConfig', summary: '更新邮件配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { host: { type: 'string' }, port: { type: 'integer' }, secure: { type: 'boolean' }, user: { type: 'string' }, pass: { type: 'string' }, from: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) } }
    },
    '/api/admin/config/test/email': {
      post: { tags: ['管理后台'], operationId: 'testEmailConfig', summary: '测试邮件配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['to'], properties: { to: { type: 'string', format: 'email' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } }) } }
    },
    '/api/admin/config/wechat': {
      post: { tags: ['管理后台'], operationId: 'updateWechatConfig', summary: '更新微信配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) } }
    },
    '/api/admin/config/test/storage': {
      post: { tags: ['管理后台'], operationId: 'testStorageConfig', summary: '测试存储配置', security: adminSecurity, responses: { 200: SuccessResponse({ type: 'object', properties: { success: { type: 'boolean' } } }) } }
    },
    '/api/admin/config/test/sms': {
      post: { tags: ['管理后台'], operationId: 'testSmsConfig', summary: '测试短信配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['phone'], properties: { phone: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object', properties: { success: { type: 'boolean' } } }) } }
    },
    '/api/admin/config/test/wechat': {
      post: { tags: ['管理后台'], operationId: 'testWechatConfig', summary: '测试微信配置', security: adminSecurity, responses: { 200: SuccessResponse({ type: 'object', properties: { success: { type: 'boolean' } } }) } }
    },
    '/api/admin/policies/terms': {
      get: { tags: ['管理后台'], operationId: 'adminGetTerms', summary: '获取服务条款（管理）', security: adminSecurity, responses: { 200: SuccessResponse({ type: 'object', properties: { content: { type: 'string' } } }) } },
      put: { tags: ['管理后台'], operationId: 'adminUpdateTerms', summary: '更新服务条款', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) } }
    },
    '/api/admin/policies/privacy': {
      get: { tags: ['管理后台'], operationId: 'adminGetPrivacy', summary: '获取隐私政策（管理）', security: adminSecurity, responses: { 200: SuccessResponse({ type: 'object', properties: { content: { type: 'string' } } }) } },
      put: { tags: ['管理后台'], operationId: 'adminUpdatePrivacy', summary: '更新隐私政策', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) } }
    },
    '/api/admin/config/ai': {
      get: { tags: ['管理后台'], operationId: 'getAiConfig', summary: '获取 AI 配置', security: adminSecurity, responses: { 200: SuccessResponse({ $ref: '#/components/schemas/AIConfig' }) } },
      post: {
        tags: ['管理后台'], operationId: 'updateAiConfig', summary: '更新 AI 配置', security: adminSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AIConfig' } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/admin/overview': {
      get: { tags: ['管理后台'], operationId: 'getOverview', summary: '系统概览', security: adminSecurity, responses: { 200: SuccessResponse({ type: 'object', properties: { userCount: { type: 'integer' }, threadCount: { type: 'integer' }, activeUsers: { type: 'integer' }, storageUsed: { type: 'number' } } }) } }
    },
    '/api/admin/users': {
      get: {
        tags: ['管理后台'], operationId: 'getUsers', summary: '获取用户列表', security: adminSecurity,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive', 'banned', 'deleted'] } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'user'] } }
        ],
        responses: { 200: SuccessResponse(PaginatedResponse('User')) }
      }
    },
    '/api/admin/users/{id}/role': {
      put: {
        tags: ['管理后台'], operationId: 'updateUserRole', summary: '修改用户角色', security: adminSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['admin', 'user'] } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/admin/users/{id}/status': {
      put: {
        tags: ['管理后台'], operationId: 'updateUserStatus', summary: '修改用户状态', security: adminSecurity,
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['active', 'inactive', 'banned', 'deleted'] } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },

    // ── Subscribe Plan ──
    '/subscribe-plan': {
      post: {
        tags: ['订阅'], operationId: 'subscribePlan', summary: '订阅计划操作', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['operateType'], properties: { operateType: { type: 'string', enum: ['info', 'credit_packages', 'status', 'subscribe', 'buy_credits', 'buy_membership_with_credits', 'cancel_and_refund'] }, planId: { type: 'string' }, amount: { type: 'number' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },

    // ── Payment Order ──
    '/payment-order': {
      post: {
        tags: ['支付'], operationId: 'paymentOrder', summary: '支付订单操作', security: bearerSecurity,
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['operateType'], properties: { operateType: { type: 'string', enum: ['wxpay_jsapi', 'alipay_wap'] }, orderId: { type: 'string' }, amount: { type: 'number' } } } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },

    // ── Test ──
    '/api/test/ping': { get: { tags: ['测试'], operationId: 'ping', summary: 'Ping 测试', responses: { 200: SuccessResponse({ type: 'object', properties: { message: { type: 'string', example: 'pong' } } }) } } },
    '/api/test/echo': {
      post: {
        tags: ['测试'], operationId: 'echo', summary: 'Echo 测试',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: SuccessResponse({ type: 'object' }) }
      }
    },
    '/api/test/error': { get: { tags: ['测试'], operationId: 'testError', summary: '错误测试', responses: { 500: ErrorResponse('服务器内部错误') } } },
    '/api/test/auth': { get: { tags: ['测试'], operationId: 'testAuth', summary: '认证测试', security: bearerSecurity, responses: { 200: SuccessResponse({ type: 'object' }), 401: ErrorResponse('未授权') } } },
    '/api/test/db-status': { get: { tags: ['测试'], operationId: 'dbStatus', summary: '数据库状态测试', responses: { 200: SuccessResponse({ type: 'object', properties: { connected: { type: 'boolean' } } }) } } },

    // ── Hello World ──
    '/hello-world': {
      post: { tags: ['健康检查'], operationId: 'helloWorld', summary: '获取服务器时间戳（客户端时间校准）', responses: { 200: SuccessResponse({ type: 'object', properties: { timestamp: { type: 'integer' }, serverTime: { type: 'string' } } }) } }
    }
  },

  // ─── Components ─────────────────────────────────────────────────────────
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT 令牌认证。也支持通过 x-liu-token header 或 ?token= query 参数传递' }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'C0001' },
          errMsg: { type: 'string' },
          showMsg: { type: 'string' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          email: { type: 'string' },
          token: { type: 'string' },
          refreshToken: { type: 'string' },
          serial_id: { type: 'string' },
          theme: { type: 'string' },
          language: { type: 'string' },
          spaceMemberList: { type: 'array', items: { type: 'object' } },
          open_id: { type: 'string' },
          github_id: { type: 'string' }
        }
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          username: { type: 'string', minLength: 2, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          avatar: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'banned', 'deleted'] },
          role: { type: 'string', enum: ['admin', 'user'], default: 'user' },
          subscription: { type: 'object', properties: { plan: { type: 'string' }, isOn: { type: 'boolean' }, expireStamp: { type: 'integer' }, chargeTimes: { type: 'integer' }, autoRecharge: { type: 'boolean' }, isLifelong: { type: 'boolean' } } },
          credits: { type: 'number', default: 0 },
          settings: { $ref: '#/components/schemas/UserSettings' },
          lastLoginAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      UserSettings: {
        type: 'object',
        properties: {
          language: { type: 'string', enum: ['zh-CN', 'en-US'] },
          theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
          timezone: { type: 'string' },
          notifications: { type: 'object', properties: { email: { type: 'boolean' }, push: { type: 'boolean' }, sms: { type: 'boolean' } } },
          aiEnabled: { type: 'boolean' },
          aiTagCount: { type: 'integer' },
          aiTagStyle: { type: 'string' },
          aiFavoriteTags: { type: 'array', items: { type: 'string' } },
          aiAutoTagMode: { type: 'string' }
        }
      },
      Thread: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          spaceId: { type: 'string' },
          first_id: { type: 'string' },
          type: { type: 'string', enum: ['note', 'task', 'calendar', 'kanban', 'drawing'] },
          title: { type: 'string', maxLength: 500 },
          description: { type: 'string', maxLength: 10000 },
          thusDesc: { type: 'object', description: '富文本内容 (TipTap JSON)' },
          images: { type: 'array', items: { type: 'object' } },
          files: { type: 'array', items: { type: 'object' } },
          editedStamp: { type: 'integer' },
          createdStamp: { type: 'integer' },
          removedStamp: { type: 'integer' },
          calendarStamp: { type: 'integer' },
          remindStamp: { type: 'integer' },
          pinStamp: { type: 'integer' },
          oState: { type: 'string', enum: ['OK', 'DELETED', 'ONLY_LOCAL'] },
          tags: { type: 'array', items: { type: 'string' } },
          tagSearched: { type: 'array', items: { type: 'string' } },
          aiReadable: { type: 'string', enum: ['Y', 'N'] },
          status: { type: 'string', enum: ['active', 'archived', 'deleted'] },
          isPublic: { type: 'boolean' },
          settings: { type: 'object', properties: { color: { type: 'string' }, icon: { type: 'string' }, sort: { type: 'string' }, showCountdown: { type: 'boolean' } } },
          lastModifiedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Content: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          threadId: { type: 'string' },
          userId: { type: 'string' },
          version: { type: 'integer' },
          blocks: { type: 'array', items: { $ref: '#/components/schemas/ContentBlock' } },
          isEncrypted: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ContentBlock: {
        type: 'object',
        required: ['type', 'order'],
        properties: {
          type: { type: 'string', enum: ['text', 'heading', 'list', 'checklist', 'code', 'quote', 'divider', 'image', 'file', 'table'] },
          content: { type: 'string' },
          properties: { type: 'object' },
          order: { type: 'integer' }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          threadId: { type: 'string' },
          contentId: { type: 'string' },
          userId: { type: 'string' },
          parentId: { type: 'string' },
          content: { type: 'string', maxLength: 5000 },
          status: { type: 'string', enum: ['active', 'deleted', 'hidden'] },
          mentions: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          threadId: { type: 'string' },
          title: { type: 'string', maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'cancelled'] },
          category: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' },
          tags: { type: 'array', items: { type: 'string' } },
          subtasks: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, completed: { type: 'boolean' }, completedAt: { type: 'string', format: 'date-time' } } } },
          allowAnonymous: { type: 'boolean' },
          requireLogin: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      FileInfo: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          filename: { type: 'string' },
          originalName: { type: 'string' },
          mimeType: { type: 'string' },
          size: { type: 'integer' },
          url: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      SyncRequest: {
        type: 'object',
        properties: {
          atoms: { type: 'array', items: { type: 'object', required: ['taskType', 'taskId'], properties: { taskType: { type: 'string', enum: ['thread_list', 'thread-post', 'thread-edit', 'thread-delete', 'comment-post', 'workspace-tag', 'collection-favorite'], description: '同步任务类型' }, taskId: { type: 'string' }, viewType: { type: 'string' }, spaceId: { type: 'string' }, limit: { type: 'integer' }, skip: { type: 'integer' }, thread: { type: 'object' }, comment: { type: 'object' }, tagList: { type: 'array', items: { type: 'object' } }, collection: { type: 'object' } } } }
        }
      },
      SystemConfig: {
        type: 'object',
        properties: {
          baseUrl: { type: 'string' },
          frontendUrl: { type: 'string' },
          proxy: { type: 'object', properties: { enabled: { type: 'boolean' }, host: { type: 'string' }, port: { type: 'integer' } } },
          storage: { type: 'object', properties: { type: { type: 'string', enum: ['LOCAL', 'S3'] } } },
          sms: { type: 'object' },
          email: { type: 'object' },
          wechat: { type: 'object' },
          policies: { type: 'object' },
          ai: { $ref: '#/components/schemas/AIConfig' }
        }
      },
      AIConfig: {
        type: 'object',
        properties: {
          providers: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, baseUrl: { type: 'string' }, apiKey: { type: 'string' }, defaultModel: { type: 'string' }, models: { type: 'array', items: { type: 'string' } } } } },
          defaultProvider: { type: 'string' },
          enabled: { type: 'boolean' }
        }
      }
    }
  }
};

// ─── Output ─────────────────────────────────────────────────────────────────
const outputPath = path.join(__dirname, '..', 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');

// Count endpoints
let endpointCount = 0;
for (const pathObj of Object.values(spec.paths)) {
  endpointCount += Object.keys(pathObj).length;
}
const schemaCount = Object.keys(spec.components.schemas).length;

console.log(`✅ OpenAPI spec generated: ${outputPath}`);
console.log(`   Endpoints: ${endpointCount}`);
console.log(`   Schemas: ${schemaCount}`);
console.log(`   Tags: ${spec.tags.length}`);
