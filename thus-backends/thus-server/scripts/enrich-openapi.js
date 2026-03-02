#!/usr/bin/env node
/**
 * Enrich OpenAPI spec with examples, defaults, and descriptions
 */
const fs = require('fs');
const path = require('path');

const specPath = path.join(__dirname, '..', 'openapi.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

// ─── Example data ────────────────────────────────────────────────────────────
const EXAMPLES = {
  userId: '507f1f77bcf86cd799439011',
  threadId: '507f1f77bcf86cd799439012',
  contentId: '507f1f77bcf86cd799439013',
  commentId: '507f1f77bcf86cd799439014',
  fileId: '507f1f77bcf86cd799439015',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzA5MzYwMDAwfQ.example',
  email: 'user@example.com',
  username: '张三',
  phone: '13800138000',
};

// ─── Path-level enrichments ───────────────────────────────────────────────────
const pathEnrichments = {
  '/api/auth/email': {
    post: {
      requestBody: {
        content: { 'application/json': { example: { email: EXAMPLES.email, password: 'Password123!', client_key: 'web' } } }
      },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { userId: EXAMPLES.userId, email: EXAMPLES.email, token: EXAMPLES.token, serial_id: 'space_001', theme: 'light', language: 'zh-CN' } } } } } }
    }
  },
  '/api/auth/register': {
    post: {
      requestBody: {
        content: { 'application/json': { example: { username: EXAMPLES.username, email: EXAMPLES.email, password: 'Password123!' } } }
      },
      responses: { 201: { content: { 'application/json': { example: { code: '0000', data: { user: { id: EXAMPLES.userId, username: EXAMPLES.username, email: EXAMPLES.email }, token: EXAMPLES.token, serial_id: 'space_001' } } } } } }
    }
  },
  '/api/auth/send-code': {
    post: {
      requestBody: { content: { 'application/json': { example: { type: 'EMAIL', identifier: EXAMPLES.email } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '验证码已发送', expiresIn: 300 } } } } } }
    }
  },
  '/api/auth/refresh': {
    post: {
      requestBody: { content: { 'application/json': { example: { refreshToken: EXAMPLES.token } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { token: EXAMPLES.token, refreshToken: EXAMPLES.token } } } } } }
    }
  },
  '/api/auth/me': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.userId, username: EXAMPLES.username, email: EXAMPLES.email, role: 'user', status: 'active', credits: 100 } } } } } }
    }
  },
  '/api/threads': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { items: [{ _id: EXAMPLES.threadId, type: 'note', title: '我的第一篇笔记', tags: ['工作', '重要'], status: 'active', createdAt: '2026-01-01T00:00:00.000Z' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } } } } } }
    },
    post: {
      requestBody: { content: { 'application/json': { example: { type: 'note', title: '新笔记标题', description: '笔记描述', tags: ['工作', '学习'], isPublic: false } } } },
      responses: { 201: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.threadId, type: 'note', title: '新笔记标题', tags: ['工作', '学习'], status: 'active', userId: EXAMPLES.userId } } } } } }
    }
  },
  '/api/threads/{id}': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.threadId, type: 'note', title: '笔记标题', tags: ['工作'], status: 'active', isPublic: false } } } } } }
    },
    put: {
      requestBody: { content: { 'application/json': { example: { title: '更新后的标题', tags: ['工作', '更新'], status: 'active' } } } }
    }
  },
  '/api/contents': {
    post: {
      requestBody: { content: { 'application/json': { example: { threadId: EXAMPLES.threadId, blocks: [{ type: 'text', content: '这是一段文字内容', order: 0, properties: {} }, { type: 'heading', content: '标题', order: 1, properties: { level: 2 } }], isEncrypted: false } } } },
      responses: { 201: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.contentId, threadId: EXAMPLES.threadId, version: 1, blocks: [{ type: 'text', content: '这是一段文字内容', order: 0 }] } } } } } }
    }
  },
  '/api/comments': {
    post: {
      requestBody: { content: { 'application/json': { example: { threadId: EXAMPLES.threadId, contentId: EXAMPLES.contentId, content: '这是一条评论', parentId: null, mentions: [] } } } },
      responses: { 201: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.commentId, content: '这是一条评论', status: 'active', userId: EXAMPLES.userId } } } } } }
    }
  },
  '/api/sync': {
    post: {
      requestBody: { content: { 'application/json': { example: { atoms: [{ taskType: 'thread_list', taskId: 'task_001', viewType: 'default', spaceId: 'space_001', limit: 20, skip: 0 }] } } } }
    }
  },
  '/api/sync/get': {
    post: {
      requestBody: { content: { 'application/json': { example: { atoms: [{ taskType: 'thread_list', taskId: 'task_001', limit: 20, skip: 0 }] } } } }
    }
  },
  '/api/sync/set': {
    post: {
      requestBody: { content: { 'application/json': { example: { atoms: [{ taskType: 'thread-post', taskId: 'task_002', thread: { first_id: 'local_001', type: 'note', title: '新笔记', tags: [] } }] } } } }
    }
  },
  '/api/settings': {
    put: {
      requestBody: { content: { 'application/json': { example: { username: EXAMPLES.username, avatar: 'https://example.com/avatar.jpg', settings: { language: 'zh-CN', theme: 'light', timezone: 'Asia/Shanghai' } } } } }
    }
  },
  '/api/settings/language': {
    put: { requestBody: { content: { 'application/json': { example: { language: 'zh-CN' } } } } }
  },
  '/api/settings/theme': {
    put: { requestBody: { content: { 'application/json': { example: { theme: 'light' } } } } }
  },
  '/api/settings/timezone': {
    put: { requestBody: { content: { 'application/json': { example: { timezone: 'Asia/Shanghai' } } } } }
  },
  '/api/settings/ai': {
    put: { requestBody: { content: { 'application/json': { example: { aiEnabled: true, aiTagCount: 5, aiTagStyle: 'short', aiFavoriteTags: ['工作', '学习', '生活'], aiAutoTagMode: 'auto' } } } } }
  },
  '/api/ai/prompt': {
    post: {
      requestBody: { content: { 'application/json': { example: { prompt: '帮我总结一下这段文字的要点', context: '这是一段关于人工智能的文章...', model: 'gpt-3.5-turbo', temperature: 0.7, maxTokens: 1000 } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { result: 'AI 生成的回复内容...' } } } } } }
    }
  },
  '/api/ai/summarize': {
    post: {
      requestBody: { content: { 'application/json': { example: { content: '这是一篇很长的文章，需要总结...', maxLength: 200 } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { summary: '文章主要讲述了...' } } } } } }
    }
  },
  '/api/ai/analyze': {
    post: {
      requestBody: { content: { 'application/json': { example: { content: '今天工作很顺利，完成了所有任务', analysisType: 'sentiment' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { analysis: { sentiment: 'positive', score: 0.9, keywords: ['工作', '任务'] } } } } } } }
    }
  },
  '/api/ai/translate': {
    post: {
      requestBody: { content: { 'application/json': { example: { content: '你好，世界！', targetLanguage: 'en' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { translation: 'Hello, World!' } } } } } }
    }
  },
  '/api/ai/chat': {
    post: {
      requestBody: { content: { 'application/json': { example: { messages: [{ role: 'user', content: '你好，请帮我分析一下这篇笔记的主题' }, { role: 'assistant', content: '好的，请把笔记内容发给我' }, { role: 'user', content: '笔记内容是：今天学习了 Vue 3 的组合式 API...' }], model: 'deepseek-ai/DeepSeek-V3', temperature: 0.7, maxTokens: 2000 } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: { role: 'assistant', content: '根据您的笔记，主题是 Vue 3 组合式 API 的学习...' } } } } } } }
    }
  },
  '/api/ai/auto-tag': {
    post: {
      requestBody: { content: { 'application/json': { example: { threadId: EXAMPLES.threadId } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { tags: ['Vue3', '前端', '学习', '编程'] } } } } } }
    }
  },
  '/api/ai/similar': {
    post: {
      requestBody: { content: { 'application/json': { example: { threadId: EXAMPLES.threadId, limit: 5 } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: [{ _id: '507f1f77bcf86cd799439099', title: '相似笔记标题', tags: ['Vue3', '前端'] }] } } } } }
    }
  },
  '/api/ai/batch-retag': {
    post: {
      requestBody: { content: { 'application/json': { example: { retagAll: false } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { processed: 42, tagged: 38 } } } } } }
    }
  },
  '/api/tasks': {
    post: {
      requestBody: { content: { 'application/json': { example: { title: '完成项目报告', description: '需要在本周五前完成', category: 'work', deadline: '2026-03-07T18:00:00.000Z', allowAnonymous: false, requireLogin: true } } } }
    }
  },
  '/api/admin/config/ai': {
    post: {
      requestBody: { content: { 'application/json': { example: { providers: [{ name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', apiKey: 'sk-xxx', defaultModel: 'deepseek-ai/DeepSeek-V3', models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'] }], defaultProvider: 'SiliconFlow', enabled: true } } } }
    }
  },
  '/api/admin/config/email': {
    post: {
      requestBody: { content: { 'application/json': { example: { host: 'smtp.example.com', port: 587, secure: false, user: 'noreply@example.com', pass: 'smtp_password', from: '"如是笔记" <noreply@example.com>' } } } }
    }
  },
  '/api/admin/config/test/email': {
    post: {
      requestBody: { content: { 'application/json': { example: { to: EXAMPLES.email } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { success: true, message: '测试邮件发送成功' } } } } } }
    }
  },
  '/api/admin/users': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { items: [{ _id: EXAMPLES.userId, username: EXAMPLES.username, email: EXAMPLES.email, role: 'user', status: 'active', credits: 100, createdAt: '2026-01-01T00:00:00.000Z' }], pagination: { page: 1, limit: 20, total: 100, totalPages: 5 } } } } } } }
    }
  },
  '/api/admin/users/{id}/role': {
    put: { requestBody: { content: { 'application/json': { example: { role: 'user' } } } } }
  },
  '/api/admin/users/{id}/status': {
    put: { requestBody: { content: { 'application/json': { example: { status: 'active' } } } } }
  },
  '/api/admin/overview': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { userCount: 1024, threadCount: 50000, activeUsers: 256, storageUsed: 10.5 } } } } } }
    }
  },
  '/api/version/check': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { hasUpdate: true, latestVersion: '1.2.0', downloadUrl: 'https://github.com/poboll/thus-note/releases', releaseNotes: '修复了若干问题，提升了性能' } } } } } }
    }
  },
  '/api/test/ping': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: 'pong' } } } } } }
    }
  },
  '/api/test/echo': {
    post: {
      requestBody: { content: { 'application/json': { example: { message: 'Hello, Thus-Note!', timestamp: 1709360000 } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: 'Hello, Thus-Note!', timestamp: 1709360000 } } } } } }
    }
  },
  '/health': {
    get: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { status: 'ok', message: 'Thus-Note Server is running', timestamp: '2026-03-02T10:00:00.000Z', connections: { mongodb: true, redis: true }, uptime: 3600 } } } } } }
    }
  },
  '/hello-world': {
    post: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { timestamp: 1709380800000, serverTime: '2026-03-02T10:00:00.000Z' } } } } } }
    }
  },
  '/subscribe-plan': {
    post: {
      requestBody: { content: { 'application/json': { example: { operateType: 'status' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { plan: 'free', isOn: false, expireStamp: 0, credits: 100 } } } } } }
    }
  },
  '/payment-order': {
    post: {
      requestBody: { content: { 'application/json': { example: { operateType: 'wxpay_jsapi', orderId: 'order_20260302_001', amount: 9.9 } } } }
    }
  },
  '/user-login': {
    post: {
      requestBody: { content: { 'application/json': { example: { operateType: 'email_code', email: EXAMPLES.email, code: '123456' } } } }
    }
  },
  '/user-settings': {
    post: {
      requestBody: { content: { 'application/json': { example: { operateType: 'enter' } } } }
    }
  },
  '/api/open-connect': {
    post: {
      requestBody: { content: { 'application/json': { example: { operateType: 'get-wechat' } } } }
    }
  },
  '/api/wechat/webhook': {
    post: {
      requestBody: { content: { 'application/json': { example: { userId: EXAMPLES.userId, messageType: 'text', content: '帮我记录一条笔记：今天天气很好', timestamp: 1709380800 } } } }
    }
  },
  '/api/files/upload': {
    post: {
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: [{ _id: EXAMPLES.fileId, filename: 'image_001.jpg', originalName: '照片.jpg', mimeType: 'image/jpeg', size: 204800, url: 'https://thus.caiths.com/uploads/image_001.jpg' }] } } } } }
    }
  },
  '/api/admin/policies/terms': {
    put: { requestBody: { content: { 'application/json': { example: { content: '# 服务条款\n\n## 1. 接受条款\n\n使用本服务即表示您同意以下条款...' } } } } }
  },
  '/api/admin/policies/privacy': {
    put: { requestBody: { content: { 'application/json': { example: { content: '# 隐私政策\n\n## 1. 信息收集\n\n我们收集以下信息...' } } } } }
  },
  '/health/db': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { mongodb: { connected: true, state: 1 }, redis: { connected: true } } } } } } } }
  },
  '/api/auth/github/url': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { url: 'https://github.com/login/oauth/authorize?client_id=xxx&scope=user:email', state: 'abc123' } } } } } } }
  },
  '/api/auth/github': {
    post: {
      requestBody: { content: { 'application/json': { example: { code: 'github_oauth_code_xxx' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { userId: EXAMPLES.userId, email: EXAMPLES.email, token: EXAMPLES.token, serial_id: EXAMPLES.token, theme: 'light', language: 'zh-Hans', open_id: '12345678', github_id: 12345678, spaceMemberList: [] } } } } } }
    }
  },
  '/api/auth/google/url': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&scope=openid%20email%20profile', state: 'xyz789' } } } } } } }
  },
  '/api/auth/google': {
    post: {
      requestBody: { content: { 'application/json': { example: { idToken: 'google_id_token_xxx' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { userId: EXAMPLES.userId, email: EXAMPLES.email, token: EXAMPLES.token, serial_id: EXAMPLES.token, theme: 'light', language: 'zh-Hans', open_id: 'google_sub_xxx', spaceMemberList: [] } } } } } }
    }
  },
  '/api/auth/wechat/url': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { url: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=xxx&scope=snsapi_userinfo', state: 'wx123' } } } } } } }
  },
  '/api/auth/wechat/gzh': {
    post: {
      requestBody: { content: { 'application/json': { example: { code: 'wechat_oauth_code_xxx' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { userId: EXAMPLES.userId, token: EXAMPLES.token, serial_id: EXAMPLES.token, theme: 'light', language: 'zh-Hans', open_id: 'wx_openid_xxx', spaceMemberList: [] } } } } } }
    }
  },
  '/api/auth/wechat/mini': {
    post: {
      requestBody: { content: { 'application/json': { example: { code: 'mini_program_code_xxx' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '微信小程序登录功能待实现' } } } } } }
    }
  },
  '/api/auth/phone': {
    post: {
      requestBody: { content: { 'application/json': { example: { phone: EXAMPLES.phone, code: '123456' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { user: { id: EXAMPLES.userId, username: 'user_8000', phone: EXAMPLES.phone }, accessToken: EXAMPLES.token, refreshToken: EXAMPLES.token } } } } } }
    }
  },
  '/api/auth/verify-code': {
    post: {
      requestBody: { content: { 'application/json': { example: { type: 'EMAIL', identifier: EXAMPLES.email, code: '654321' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { userId: EXAMPLES.userId, email: EXAMPLES.email, token: EXAMPLES.token, serial_id: EXAMPLES.token, theme: 'light', language: 'zh-Hans', spaceMemberList: [] } } } } } }
    }
  },
  '/api/auth/logout': {
    post: {
      requestBody: { content: { 'application/json': { example: { refreshToken: EXAMPLES.token } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '登出成功' } } } } } }
    }
  },
  '/api/auth/create-test-user': {
    post: {
      requestBody: { content: { 'application/json': { example: { email: 'test@example.com', password: 'Test123456!' } } } },
      responses: { 201: { content: { 'application/json': { example: { code: '0000', data: { message: '测试用户创建成功', user: { id: EXAMPLES.userId, username: 'test', email: 'test@example.com' } } } } } } }
    }
  },
  '/api/threads/{id}': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.threadId, type: 'note', title: '笔记标题', tags: ['工作'], status: 'active', isPublic: false } } } } } } },
    put: { requestBody: { content: { 'application/json': { example: { title: '更新后的标题', tags: ['工作', '更新'] } } } } },
    delete: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '线程已删除' } } } } } } }
  },
  '/api/threads/{id}/archive': {
    post: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.threadId, status: 'archived', title: '已归档的笔记' } } } } } } }
  },
  '/api/threads/search': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { items: [{ _id: EXAMPLES.threadId, title: '搜索结果笔记', tags: ['工作'], status: 'active' }], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } } } } } } }
  },
  '/api/contents': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { contents: [{ _id: EXAMPLES.contentId, threadId: EXAMPLES.threadId, version: 3, blocks: [{ type: 'text', content: '内容文字', order: 0 }] }], pagination: { page: 1, limit: 20, total: 1 } } } } } } } }
  },
  '/api/contents/latest/{threadId}': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.contentId, threadId: EXAMPLES.threadId, version: 5, blocks: [{ type: 'text', content: '最新内容', order: 0 }, { type: 'heading', content: '标题', order: 1, properties: { level: 2 } }] } } } } } } }
  },
  '/api/contents/history/{threadId}': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { contents: [{ _id: EXAMPLES.contentId, version: 5, createdAt: '2026-03-02T10:00:00.000Z' }, { _id: '507f1f77bcf86cd799439099', version: 4, createdAt: '2026-03-01T10:00:00.000Z' }] } } } } } } }
  },
  '/api/contents/{id}': {
    put: {
      requestBody: { content: { 'application/json': { example: { blocks: [{ type: 'text', content: '更新后的内容', order: 0 }], isEncrypted: false } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.contentId, version: 6, blocks: [{ type: 'text', content: '更新后的内容', order: 0 }] } } } } } }
    },
    delete: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '内容已删除' } } } } } } }
  },
  '/api/contents/{id}/blocks': {
    post: {
      requestBody: { content: { 'application/json': { example: { block: { type: 'image', content: '', order: 2, properties: { url: 'https://thus.caiths.com/uploads/img.jpg', alt: '图片描述' } } } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.contentId, version: 7, blocks: [{ type: 'text', content: '文字', order: 0 }, { type: 'image', order: 2 }] } } } } } }
    }
  },
  '/api/contents/{id}/blocks/{index}': {
    put: {
      requestBody: { content: { 'application/json': { example: { block: { type: 'text', content: '修改后的文字内容', order: 0, properties: {} } } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.contentId, version: 8 } } } } } }
    },
    delete: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.contentId, version: 9, blocks: [] } } } } } } }
  },
  '/api/comments': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { comments: [{ _id: EXAMPLES.commentId, content: '这是一条评论', userId: EXAMPLES.userId, threadId: EXAMPLES.threadId, createdAt: '2026-03-02T10:00:00.000Z' }], pagination: { page: 1, limit: 20, total: 1 } } } } } } } }
  },
  '/api/comments/{parentId}/replies': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { replies: [{ _id: '507f1f77bcf86cd799439020', content: '这是一条回复', userId: EXAMPLES.userId, parentId: EXAMPLES.commentId }] } } } } } } }
  },
  '/api/comments/{id}': {
    put: {
      requestBody: { content: { 'application/json': { example: { content: '修改后的评论内容' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.commentId, content: '修改后的评论内容' } } } } } }
    },
    delete: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '评论已删除' } } } } } } }
  },
  '/api/settings': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { username: EXAMPLES.username, avatar: 'https://example.com/avatar.jpg', settings: { language: 'zh-Hans', theme: 'light', timezone: 'Asia/Shanghai', aiEnabled: true, aiTagCount: 5 } } } } } } } }
  },
  '/api/settings/notifications': {
    put: {
      requestBody: { content: { 'application/json': { example: { notifications: { email: true, push: true, digest: 'weekly' } } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '通知设置已更新', notifications: { email: true, push: true, digest: 'weekly' } } } } } } }
    }
  },
  '/api/files': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { files: [{ _id: EXAMPLES.fileId, filename: 'image_001.jpg', originalName: '照片.jpg', mimeType: 'image/jpeg', size: 204800, url: 'https://thus.caiths.com/uploads/image_001.jpg', createdAt: '2026-03-02T10:00:00.000Z' }], pagination: { page: 1, limit: 20, total: 1 } } } } } } } }
  },
  '/api/files/{id}': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { _id: EXAMPLES.fileId, filename: 'image_001.jpg', originalName: '照片.jpg', mimeType: 'image/jpeg', size: 204800, url: 'https://thus.caiths.com/uploads/image_001.jpg' } } } } } } },
    delete: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '文件已删除', fileId: EXAMPLES.fileId } } } } } } }
  },
  '/api/files/{id}/download': {
    get: { responses: { 200: { content: { 'application/octet-stream': { example: '<binary file content>' } } } } }
  },
  '/api/ai/code': {
    post: {
      requestBody: { content: { 'application/json': { example: { description: '实现一个防抖函数，延迟300ms', language: 'JavaScript', framework: 'vanilla' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { result: 'function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}' } } } } } }
    }
  },
  '/api/tasks': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { tasks: [{ _id: '507f1f77bcf86cd799439030', title: '完成项目报告', category: 'work', deadline: '2026-03-07T18:00:00.000Z', status: 'pending' }], pagination: { page: 1, limit: 20, total: 1 } } } } } } } }
  },
  '/api/policies/terms': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { content: '# 服务条款\n\n...', version: '1.0.0', lastUpdated: '2026-01-01T00:00:00.000Z' } } } } } } }
  },
  '/api/policies/privacy': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { content: '# 隐私政策\n\n...', version: '1.0.0', lastUpdated: '2026-01-01T00:00:00.000Z' } } } } } } }
  },
  '/api/version/current': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { version: '1.0.0', buildTime: '2026-01-01T00:00:00.000Z', nodeVersion: 'v20.11.0' } } } } } } }
  },
  '/api/wechat/webhook/test': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { status: 'ok', message: '微信 Webhook 测试端点正常', timestamp: '2026-03-02T10:00:00.000Z' } } } } } } }
  },
  '/api/open-connect/callback': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: 'OAuth 回调处理成功', provider: 'github' } } } } } } }
  },
  '/api/admin/config': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { baseUrl: 'https://api.thus.caiths.com', frontendUrl: 'https://thus.caiths.com', storage: { type: 'local' }, email: { enabled: true, host: 'smtp.example.com', configured: true }, wechat: { enabled: false }, updatedAt: '2026-03-02T10:00:00.000Z' } } } } } } }
  },
  '/api/admin/config/full': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { baseUrl: 'https://api.thus.caiths.com', frontendUrl: 'https://thus.caiths.com', storage: { type: 'local', local: { uploadDir: './uploads' } }, ai: { enabled: true, providers: [] } } } } } } } }
  },
  '/api/admin/config/base': {
    post: {
      requestBody: { content: { 'application/json': { example: { baseUrl: 'https://api.thus.caiths.com', frontendUrl: 'https://thus.caiths.com', proxy: '' } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '基础配置已更新', baseUrl: 'https://api.thus.caiths.com', frontendUrl: 'https://thus.caiths.com' } } } } } }
    }
  },
  '/api/admin/config/storage': {
    post: {
      requestBody: { content: { 'application/json': { example: { storage: { type: 's3', s3: { provider: 'aws', endpoint: 'https://s3.amazonaws.com', bucket: 'thus-note-files', region: 'us-east-1', accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', publicUrl: 'https://thus-note-files.s3.amazonaws.com' } } } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '存储配置已更新', storage: { type: 's3' } } } } } } }
    }
  },
  '/api/admin/config/sms': {
    post: {
      requestBody: { content: { 'application/json': { example: { sms: { enabled: true, provider: 'tencent', tencent: { secretId: 'AKIDxxx', secretKey: 'xxx', region: 'ap-guangzhou', appId: '1400xxx', signName: '如是笔记', templateId: '123456' } } } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '短信配置已更新', sms: { enabled: true, provider: 'tencent' } } } } } } }
    }
  },
  '/api/admin/config/wechat': {
    post: {
      requestBody: { content: { 'application/json': { example: { wechat: { enabled: true, gzhAppId: 'wx_appid_xxx', gzhAppSecret: 'wx_secret_xxx', miniAppId: 'wx_mini_xxx', miniAppSecret: 'wx_mini_secret_xxx' } } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { message: '微信配置已更新', wechat: { enabled: true, gzhAppId: 'wx_appid_xxx' } } } } } } }
    }
  },
  '/api/admin/config/test/storage': {
    post: {
      requestBody: { content: { 'application/json': { example: { storage: { type: 'local' } } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { success: true, message: '存储连接测试成功', latency: 12 } } } } } }
    }
  },
  '/api/admin/config/test/sms': {
    post: {
      requestBody: { content: { 'application/json': { example: { testPhone: EXAMPLES.phone } } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { success: true, message: '短信发送成功' } } } } } }
    }
  },
  '/api/admin/config/test/wechat': {
    post: {
      requestBody: { content: { 'application/json': { example: {} } } },
      responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { success: true, accessToken: 'wx_access_token_xxx', expiresIn: 7200 } } } } } }
    }
  },
  '/api/admin/policies/terms': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { content: '# 服务条款\n\n...', version: '1.0.0', lastUpdated: '2026-01-01T00:00:00.000Z' } } } } } } }
  },
  '/api/admin/policies/privacy': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { content: '# 隐私政策\n\n...', version: '1.0.0', lastUpdated: '2026-01-01T00:00:00.000Z' } } } } } } }
  },
  '/api/admin/config/ai': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { enabled: true, autoTag: true, autoSummary: false, similarRecommend: true, providers: [{ enabled: true, name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', apiKey: 'sk-xxx***', defaultModel: 'deepseek-ai/DeepSeek-V3', models: ['deepseek-ai/DeepSeek-V3'] }] } } } } } } }
  },
  '/api/test/error': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: 'E0001', errMsg: 'This is a test error', showMsg: '服务器内部错误' } } } } } }
  },
  '/api/test/auth': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { authenticated: true, userId: EXAMPLES.userId, message: '认证成功' } } } } } } }
  },
  '/api/test/db-status': {
    get: { responses: { 200: { content: { 'application/json': { example: { code: '0000', data: { mongodb: { connected: true, readyState: 1 }, redis: { connected: true, latency: 1 } } } } } } } }
  },
};

// ─── Schema descriptions ──────────────────────────────────────────────────────
const schemaDescriptions = {
  User: '用户账号信息，包含基本资料、订阅状态、AI 设置等',
  Thread: '笔记/任务/日历/看板条目，是系统的核心数据单元',
  Content: '笔记内容，由多个内容块（blocks）组成，支持版本历史',
  ContentBlock: '内容块，支持文本、标题、列表、代码、图片等多种类型',
  Comment: '笔记评论，支持嵌套回复和 @提及',
  Task: '独立任务条目，包含优先级、状态、截止日期、子任务',
  FileInfo: '上传文件的元数据信息',
  SyncRequest: '多端同步请求，包含一组原子操作（atoms）',
  SystemConfig: '系统全局配置，包含存储、短信、邮件、微信、AI 等配置',
  AIConfig: 'AI 服务配置，支持多个 AI 提供商（SiliconFlow、OpenAI、Anthropic 等）',
  UserSettings: '用户个人偏好设置，包含语言、主题、时区、AI 功能配置',
  LoginResponse: '登录成功响应，包含 JWT 令牌和用户基本信息',
  ErrorResponse: '统一错误响应格式，code 为错误码，errMsg 为错误详情',
  Pagination: '分页信息，包含当前页、每页数量、总数、总页数',
};

// ─── Apply enrichments ────────────────────────────────────────────────────────
let enrichedCount = 0;

// Apply path-level examples
for (const [pathKey, methods] of Object.entries(pathEnrichments)) {
  if (!spec.paths[pathKey]) continue;
  for (const [method, enrichment] of Object.entries(methods)) {
    if (!spec.paths[pathKey][method]) continue;
    const op = spec.paths[pathKey][method];

    // Merge requestBody examples
    if (enrichment.requestBody?.content) {
      for (const [ct, ctData] of Object.entries(enrichment.requestBody.content)) {
        if (op.requestBody?.content?.[ct] && ctData.example) {
          op.requestBody.content[ct].example = ctData.example;
          enrichedCount++;
        }
      }
    }

    // Merge response examples
    if (enrichment.responses) {
      for (const [status, resData] of Object.entries(enrichment.responses)) {
        if (op.responses?.[status]?.content?.['application/json'] && resData.content?.['application/json']?.example) {
          op.responses[status].content['application/json'].example = resData.content['application/json'].example;
          enrichedCount++;
        }
      }
    }
  }
}

// Apply schema descriptions
for (const [schemaName, desc] of Object.entries(schemaDescriptions)) {
  if (spec.components?.schemas?.[schemaName]) {
    spec.components.schemas[schemaName].description = desc;
  }
}

// Add x-liu-token header description to securitySchemes
spec.components.securitySchemes.bearerAuth.description =
  'JWT 令牌认证。支持三种方式传递：\n1. `Authorization: Bearer <token>` header（推荐）\n2. `x-liu-token: <token>` header\n3. `?token=<token>` query 参数（仅文件下载）';

// Add global description enrichment to info
spec.info.description = `# 如是 (Thus-Note) API 文档

如是笔记后端 RESTful API，基于 Express.js + TypeScript + MongoDB 构建。

## 认证方式

所有需要认证的接口支持以下三种方式传递 JWT 令牌：

\`\`\`
Authorization: Bearer <token>   # 推荐方式
x-liu-token: <token>            # 兼容方式
?token=<token>                  # 仅用于文件下载
\`\`\`

## 响应格式

所有接口统一返回以下格式：

**成功：**
\`\`\`json
{ "code": "0000", "data": { ... } }
\`\`\`

**失败：**
\`\`\`json
{ "code": "C0001", "errMsg": "错误描述", "showMsg": "用户可见的提示" }
\`\`\`

## 错误码说明

| 错误码 | 含义 |
|--------|------|
| 0000 | 成功 |
| C0001 | 客户端错误 |
| C0002 | 未授权（需要登录） |
| C0003 | 禁止访问（权限不足） |
| C0004 | 资源不存在 |
| C0006 | 参数验证失败 |
| E0001 | 服务器内部错误 |

## 频率限制

- 通用接口：100 次/15分钟
- API 接口：30 次/分钟
- 登录接口：5 次/15分钟`;

// ─── Apply x-apifox-post-processors (test assertions) ──────────────────────
const TEST_SCRIPTS = {
  default: `pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Response code 0000", () => {
  const j = pm.response.json();
  pm.expect(j.code).to.eql("0000");
});
pm.test("Has data field", () => {
  pm.expect(pm.response.json()).to.have.property("data");
});`,
  auth: `pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Returns token", () => {
  const j = pm.response.json();
  pm.expect(j.code).to.eql("0000");
  pm.expect(j.data).to.have.property("token");
  pm.collectionVariables.set("token", j.data.token);
  pm.collectionVariables.set("refreshToken", j.data.serial_id);
});`,
  create: `pm.test("Status 201", () => pm.response.to.have.status(201));
pm.test("Response code 0000", () => pm.expect(pm.response.json().code).to.eql("0000"));
pm.test("Has _id", () => pm.expect(pm.response.json().data).to.have.property("_id"));`,
  delete: `pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Delete success", () => pm.expect(pm.response.json().code).to.eql("0000"));`,
  admin: `pm.test("Status 200", () => pm.response.to.have.status(200));
pm.test("Admin response ok", () => pm.expect(pm.response.json().code).to.eql("0000"));
pm.test("Has data", () => pm.expect(pm.response.json()).to.have.property("data"));`,
};

const AUTH_PATHS = ['/api/auth/email', '/api/auth/register', '/api/auth/github', '/api/auth/google', '/api/auth/wechat/gzh', '/api/auth/phone', '/api/auth/verify-code'];
const CREATE_METHODS = ['post'];
const DELETE_METHODS = ['delete'];
const ADMIN_PATHS_PREFIX = '/api/admin';

for (const [pathKey, methods] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    if (!['get','post','put','delete','patch'].includes(method)) continue;
    let script = TEST_SCRIPTS.default;
    if (AUTH_PATHS.includes(pathKey) && method === 'post') script = TEST_SCRIPTS.auth;
    else if (method === 'delete') script = TEST_SCRIPTS.delete;
    else if (method === 'post' && op.responses?.['201']) script = TEST_SCRIPTS.create;
    else if (pathKey.startsWith(ADMIN_PATHS_PREFIX)) script = TEST_SCRIPTS.admin;
    op['x-apifox-post-processors'] = [{ type: 'script', attributes: { code: script } }];
  }
}

// Write enriched spec
fs.writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf-8');

let endpointCount = 0;
for (const p of Object.values(spec.paths)) endpointCount += Object.keys(p).filter(k => ['get','post','put','delete','patch'].includes(k)).length;

console.log(`✅ Enriched OpenAPI spec`);
console.log(`   Examples added: ${enrichedCount}`);
console.log(`   Endpoints: ${endpointCount}`);
console.log(`   Schemas with descriptions: ${Object.keys(schemaDescriptions).length}`);
console.log(`   File size: ${(fs.statSync(specPath).size / 1024).toFixed(1)} KB`);
