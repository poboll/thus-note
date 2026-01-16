#!/usr/bin/env node

/**
 * 如是(Thus-Note) 后端全面测试脚本
 * 测试所有主要功能模块
 */

const http = require('http');

// 配置
const BASE_URL = 'http://localhost:3000';
let authToken = null;
let testUserId = null;
let testThreadId = null;
let testContentId = null;
let testCommentId = null;
let testFileId = null;
let testUserEmail = null;
let testUserPassword = 'Test123456';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, colors.reset);
  }
}

// HTTP 请求工具
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: [],
};

function recordTest(name, status, details = '') {
  testResults.total++;
  if (status === 'pass') testResults.passed++;
  else if (status === 'fail') testResults.failed++;
  else testResults.skipped++;

  testResults.details.push({ name, status, details });
  logTest(name, status, details);
}

// ==================== 测试函数 ====================

async function testHealthCheck() {
  logSection('1. 健康检查测试');

  try {
    const res = await request('GET', '/health');
    if (res.status === 200 && res.data.status === 'ok') {
      recordTest('基本健康检查', 'pass', `运行时间: ${res.data.uptime.toFixed(2)}s`);
    } else {
      recordTest('基本健康检查', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('基本健康检查', 'fail', error.message);
  }

  try {
    const res = await request('GET', '/health/db');
    if (res.status === 200 && res.data.mongodb === 'connected' && res.data.redis === 'connected') {
      recordTest('数据库健康检查', 'pass', 'MongoDB 和 Redis 连接正常');
    } else {
      recordTest('数据库健康检查', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('数据库健康检查', 'fail', error.message);
  }
}

async function testAuth() {
  logSection('2. 认证功能测试');

  // 创建测试用户
  try {
    const timestamp = Date.now();
    testUserEmail = `testuser${timestamp}@example.com`;
    const res = await request('POST', '/api/auth/create-test-user', {
      email: testUserEmail,
      password: testUserPassword,
    });
    if ((res.status === 200 || res.status === 201) && res.data.code === "0000") {
      testUserId = res.data.data.user.id;
      recordTest('创建测试用户', 'pass', `用户ID: ${testUserId}, 邮箱: ${testUserEmail}`);
    } else {
      recordTest('创建测试用户', 'fail', `状态码: ${res.status}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    recordTest('创建测试用户', 'fail', error.message);
  }

  // 密码登录
  try {
    const res = await request('POST', '/api/auth/email', {
      email: testUserEmail,
      password: testUserPassword,
    });
    if (res.status === 200 && res.data.code === "0000") {
      authToken = res.data.data.token;
      recordTest('邮箱密码登录', 'pass', '获取到 token');
    } else {
      recordTest('邮箱密码登录', 'fail', `状态码: ${res.status}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    recordTest('邮箱密码登录', 'fail', error.message);
  }

  // OAuth URL 生成
  try {
    const res = await request('GET', '/api/auth/github/url');
    if (res.status === 200 && res.data.code === '0000' && res.data.data.url) {
      recordTest('GitHub OAuth URL 生成', 'pass', 'URL 生成成功');
    } else {
      recordTest('GitHub OAuth URL 生成', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('GitHub OAuth URL 生成', 'fail', error.message);
  }

  try {
    const res = await request('GET', '/api/auth/google/url');
    if (res.status === 200 && res.data.code === '0000' && res.data.data.url) {
      recordTest('Google OAuth URL 生成', 'pass', 'URL 生成成功');
    } else {
      recordTest('Google OAuth URL 生成', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('Google OAuth URL 生成', 'fail', error.message);
  }

  try {
    const res = await request('GET', '/api/auth/wechat/url');
    if (res.status === 200 && res.data.code === '0000' && res.data.data.url) {
      recordTest('微信公众号 OAuth URL 生成', 'pass', 'URL 生成成功');
    } else {
      recordTest('微信公众号 OAuth URL 生成', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('微信公众号 OAuth URL 生成', 'fail', error.message);
  }

  // 发送验证码（需要配置 SMTP）
  try {
    const res = await request('POST', '/api/auth/send-code', {
      type: 'EMAIL',
      identifier: 'test@example.com',
    });
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('发送邮箱验证码', 'pass', '验证码已发送');
    } else {
      recordTest('发送邮箱验证码', 'fail', `错误: ${res.data.errMsg || '未知错误'}`);
    }
  } catch (error) {
    recordTest('发送邮箱验证码', 'fail', error.message);
  }

  // Token 刷新（需要 refresh token）
  if (!authToken) {
    recordTest('Token 刷新', 'skip', '未获取到 access token');
  } else {
    recordTest('Token 刷新', 'skip', '需要 refresh token');
  }
}

async function testThreads() {
  logSection('3. 线程管理测试');

  if (!authToken) {
    log('缺少认证 token，跳过线程测试', colors.yellow);
    recordTest('获取线程列表', 'skip', '缺少认证 token');
    recordTest('创建线程', 'skip', '缺少认证 token');
    recordTest('获取线程详情', 'skip', '缺少认证 token');
    recordTest('更新线程', 'skip', '缺少认证 token');
    recordTest('删除线程', 'skip', '缺少认证 token');
    recordTest('归档线程', 'skip', '缺少认证 token');
    recordTest('搜索线程', 'skip', '缺少认证 token');
    return;
  }

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // 获取线程列表
  try {
    const res = await request('GET', '/api/threads?page=1&limit=20', null, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('获取线程列表', 'pass', `共 ${res.data.data.threads.length} 个线程`);
    } else {
      recordTest('获取线程列表', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('获取线程列表', 'fail', error.message);
  }

  // 创建线程
  try {
    const res = await request('POST', '/api/threads', {
      type: 'note',
      title: '测试线程',
      description: '这是一个测试线程',
      tags: ['测试', '自动化'],
    }, headers);
    if (res.status === 201 && res.data.code === '0000') {
      testThreadId = res.data.data._id || res.data.data.id;
      recordTest('创建线程', 'pass', `线程ID: ${testThreadId}`);
    } else {
      recordTest('创建线程', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('创建线程', 'fail', error.message);
  }

  // 获取线程详情
  if (!testThreadId) {
    recordTest('获取线程详情', 'skip', '未创建线程');
  } else {
    try {
      const res = await request('GET', `/api/threads/${testThreadId}`, null, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('获取线程详情', 'pass', '获取成功');
      } else {
        recordTest('获取线程详情', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('获取线程详情', 'fail', error.message);
    }
  }

  // 更新线程
  if (!testThreadId) {
    recordTest('更新线程', 'skip', '未创建线程');
  } else {
    try {
      const res = await request('PUT', `/api/threads/${testThreadId}`, {
        title: '测试线程（已更新）',
        description: '这是一个更新后的测试线程',
      }, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('更新线程', 'pass', '更新成功');
      } else {
        recordTest('更新线程', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('更新线程', 'fail', error.message);
    }
  }

  // 归档线程
  if (!testThreadId) {
    recordTest('归档线程', 'skip', '未创建线程');
  } else {
    try {
      const res = await request('POST', `/api/threads/${testThreadId}/archive`, null, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('归档线程', 'pass', '归档成功');
      } else {
        recordTest('归档线程', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('归档线程', 'fail', error.message);
    }
  }

  // 搜索线程
  try {
    const res = await request('GET', '/api/threads/search?q=测试&page=1&limit=20', null, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('搜索线程', 'pass', `找到 ${res.data.data.threads.length} 个结果`);
    } else {
      recordTest('搜索线程', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('搜索线程', 'fail', error.message);
  }

  // 删除线程（软删除）
  if (!testThreadId) {
    recordTest('删除线程', 'skip', '未创建线程');
  } else {
    try {
      const res = await request('DELETE', `/api/threads/${testThreadId}`, null, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('删除线程', 'pass', '删除成功');
      } else {
        recordTest('删除线程', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('删除线程', 'fail', error.message);
    }
  }
}

async function testContents() {
  logSection('4. 内容管理测试');

  if (!authToken) {
    log('缺少认证 token，跳过内容测试', colors.yellow);
    recordTest('获取内容列表', 'skip', '缺少认证 token');
    recordTest('创建内容', 'skip', '缺少认证 token');
    recordTest('获取最新内容', 'skip', '缺少认证 token');
    recordTest('更新内容', 'skip', '缺少认证 token');
    recordTest('添加内容块', 'skip', '缺少认证 token');
    recordTest('更新内容块', 'skip', '缺少认证 token');
    recordTest('删除内容块', 'skip', '缺少认证 token');
    recordTest('删除内容', 'skip', '缺少认证 token');
    return;
  }

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // 先创建一个线程用于测试内容
  let threadId = null;
  try {
    const res = await request('POST', '/api/threads', {
      type: 'note',
      title: '内容测试线程',
      description: '用于测试内容功能',
    }, headers);
    if (res.status === 201 && res.data.code === '0000') {
      threadId = res.data.data._id || res.data.data.id;
    }
  } catch (error) {
    log('创建测试线程失败', colors.red);
  }

  if (!threadId) {
    log('无法创建测试线程，跳过内容测试', colors.yellow);
    recordTest('获取内容列表', 'skip', '无法创建测试线程');
    recordTest('创建内容', 'skip', '无法创建测试线程');
    recordTest('获取最新内容', 'skip', '无法创建测试线程');
    recordTest('更新内容', 'skip', '无法创建测试线程');
    recordTest('添加内容块', 'skip', '无法创建测试线程');
    recordTest('更新内容块', 'skip', '无法创建测试线程');
    recordTest('删除内容块', 'skip', '无法创建测试线程');
    recordTest('删除内容', 'skip', '无法创建测试线程');
    return;
  }

  // 获取内容列表
  try {
    const res = await request('GET', `/api/contents?threadId=${threadId}&page=1&limit=20`, null, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('获取内容列表', 'pass', `共 ${res.data.data.contents.length} 个内容`);
    } else {
      recordTest('获取内容列表', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('获取内容列表', 'fail', error.message);
  }

  // 创建内容
  try {
    const res = await request('POST', '/api/contents', {
      threadId: threadId,
      blocks: [
        { type: 'text', content: '这是第一个内容块' },
        { type: 'text', content: '这是第二个内容块' },
      ],
    }, headers);
    if (res.status === 201 && res.data.code === '0000') {
      testContentId = res.data.data._id || res.data.data.id;
      recordTest('创建内容', 'pass', `内容ID: ${testContentId}`);
    } else {
      recordTest('创建内容', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('创建内容', 'fail', error.message);
  }

  // 获取最新内容
  try {
    const res = await request('GET', `/api/contents/latest/${threadId}`, null, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('获取最新内容', 'pass', '获取成功');
    } else {
      recordTest('获取最新内容', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('获取最新内容', 'fail', error.message);
  }

  // 更新内容
  if (!testContentId) {
    recordTest('更新内容', 'skip', '未创建内容');
  } else {
    try {
      const res = await request('PUT', `/api/contents/${testContentId}`, {
        blocks: [
          { type: 'text', content: '这是更新后的第一个内容块' },
          { type: 'text', content: '这是更新后的第二个内容块' },
          { type: 'text', content: '这是新添加的第三个内容块' },
        ],
      }, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('更新内容', 'pass', '更新成功');
      } else {
        recordTest('更新内容', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('更新内容', 'fail', error.message);
    }
  }

  // 添加内容块
  if (!testContentId) {
    recordTest('添加内容块', 'skip', '未创建内容');
  } else {
    try {
      const res = await request('POST', `/api/contents/${testContentId}/blocks`, {
        block: { type: 'text', content: '这是新添加的内容块' },
      }, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('添加内容块', 'pass', '添加成功');
      } else {
        recordTest('添加内容块', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('添加内容块', 'fail', error.message);
    }
  }

  // 更新内容块
  if (!testContentId) {
    recordTest('更新内容块', 'skip', '未创建内容');
  } else {
    try {
      const res = await request('PUT', `/api/contents/${testContentId}/blocks/0`, {
        block: { type: 'text', content: '这是更新后的内容块' },
      }, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('更新内容块', 'pass', '更新成功');
      } else {
        recordTest('更新内容块', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('更新内容块', 'fail', error.message);
    }
  }

  // 删除内容块
  if (!testContentId) {
    recordTest('删除内容块', 'skip', '未创建内容');
  } else {
    try {
      const res = await request('DELETE', `/api/contents/${testContentId}/blocks/0`, null, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('删除内容块', 'pass', '删除成功');
      } else {
        recordTest('删除内容块', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('删除内容块', 'fail', error.message);
    }
  }

  // 删除内容
  if (!testContentId) {
    recordTest('删除内容', 'skip', '未创建内容');
  } else {
    try {
      const res = await request('DELETE', `/api/contents/${testContentId}`, null, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('删除内容', 'pass', '删除成功');
      } else {
        recordTest('删除内容', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('删除内容', 'fail', error.message);
    }
  }
}

async function testComments() {
  logSection('5. 评论管理测试');

  if (!authToken) {
    log('缺少认证 token，跳过评论测试', colors.yellow);
    recordTest('获取评论列表', 'skip', '缺少认证 token');
    recordTest('创建评论', 'skip', '缺少认证 token');
    recordTest('获取回复列表', 'skip', '缺少认证 token');
    recordTest('更新评论', 'skip', '缺少认证 token');
    recordTest('删除评论', 'skip', '缺少认证 token');
    return;
  }

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // 先创建一个线程和内容用于测试评论
  let threadId = null;
  let contentId = null;
  try {
    const threadRes = await request('POST', '/api/threads', {
      type: 'note',
      title: '评论测试线程',
      description: '用于测试评论功能',
    }, headers);
    if (threadRes.status === 201 && threadRes.data.code === '0000') {
      threadId = threadRes.data.data._id || threadRes.data.data.id;
    }

    if (threadId) {
      const contentRes = await request('POST', '/api/contents', {
        threadId: threadId,
        blocks: [{ type: 'text', content: '测试内容' }],
      }, headers);
      if (contentRes.status === 201 && contentRes.data.code === '0000') {
        contentId = contentRes.data.data._id || contentRes.data.data.id;
      }
    }
  } catch (error) {
    log('创建测试数据失败', colors.red);
  }

  if (!threadId || !contentId) {
    log('无法创建测试数据，跳过评论测试', colors.yellow);
    recordTest('获取评论列表', 'skip', '无法创建测试数据');
    recordTest('创建评论', 'skip', '无法创建测试数据');
    recordTest('获取回复列表', 'skip', '无法创建测试数据');
    recordTest('更新评论', 'skip', '无法创建测试数据');
    recordTest('删除评论', 'skip', '无法创建测试数据');
    return;
  }

  // 获取评论列表
  try {
    const res = await request('GET', `/api/comments?threadId=${threadId}&page=1&limit=20`, null, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('获取评论列表', 'pass', `共 ${res.data.data.comments.length} 个评论`);
    } else {
      recordTest('获取评论列表', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('获取评论列表', 'fail', error.message);
  }

  // 创建评论
  try {
    const res = await request('POST', '/api/comments', {
      threadId: threadId,
      contentId: contentId,
      content: '这是一个测试评论',
    }, headers);
    if (res.status === 201 && res.data.code === '0000') {
      testCommentId = res.data.data._id || res.data.data.id;
      recordTest('创建评论', 'pass', `评论ID: ${testCommentId}`);
    } else {
      recordTest('创建评论', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('创建评论', 'fail', error.message);
  }

  // 获取回复列表
  if (!testCommentId) {
    recordTest('获取回复列表', 'skip', '未创建评论');
  } else {
    try {
      const res = await request('GET', `/api/comments/${testCommentId}/replies`, null, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('获取回复列表', 'pass', `共 ${res.data.data.replies.length} 个回复`);
      } else {
        recordTest('获取回复列表', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('获取回复列表', 'fail', error.message);
    }
  }

  // 更新评论
  if (!testCommentId) {
    recordTest('更新评论', 'skip', '未创建评论');
  } else {
    try {
      const res = await request('PUT', `/api/comments/${testCommentId}`, {
        content: '这是更新后的评论',
      }, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('更新评论', 'pass', '更新成功');
      } else {
        recordTest('更新评论', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('更新评论', 'fail', error.message);
    }
  }

  // 删除评论
  if (!testCommentId) {
    recordTest('删除评论', 'skip', '未创建评论');
  } else {
    try {
      const res = await request('DELETE', `/api/comments/${testCommentId}`, null, headers);
      if (res.status === 200 && res.data.code === '0000') {
        recordTest('删除评论', 'pass', '删除成功');
      } else {
        recordTest('删除评论', 'fail', `状态码: ${res.status}`);
      }
    } catch (error) {
      recordTest('删除评论', 'fail', error.message);
    }
  }
}

async function testSettings() {
  logSection('6. 用户设置测试');

  if (!authToken) {
    log('缺少认证 token，跳过设置测试', colors.yellow);
    recordTest('获取用户设置', 'skip', '缺少认证 token');
    recordTest('更新用户设置', 'skip', '缺少认证 token');
    recordTest('更新通知设置', 'skip', '缺少认证 token');
    recordTest('更新语言设置', 'skip', '缺少认证 token');
    recordTest('更新主题设置', 'skip', '缺少认证 token');
    recordTest('更新时区设置', 'skip', '缺少认证 token');
    return;
  }

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // 获取用户设置
  try {
    const res = await request('GET', '/api/settings', null, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('获取用户设置', 'pass', '获取成功');
    } else {
      recordTest('获取用户设置', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('获取用户设置', 'fail', error.message);
  }

  // 更新用户设置
  try {
    const res = await request('PUT', '/api/settings', {
      username: 'testuser_updated',
      avatar: 'https://example.com/avatar.png',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('更新用户设置', 'pass', '更新成功');
    } else {
      recordTest('更新用户设置', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('更新用户设置', 'fail', error.message);
  }

  // 更新通知设置
  try {
    const res = await request('PUT', '/api/settings/notifications', {
      notifications: {
        email: true,
        push: false,
        sms: true,
      },
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('更新通知设置', 'pass', '更新成功');
    } else {
      recordTest('更新通知设置', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('更新通知设置', 'fail', error.message);
  }

  // 更新语言设置
  try {
    const res = await request('PUT', '/api/settings/language', {
      language: 'en-US',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('更新语言设置', 'pass', '更新成功');
    } else {
      recordTest('更新语言设置', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('更新语言设置', 'fail', error.message);
  }

  // 更新主题设置
  try {
    const res = await request('PUT', '/api/settings/theme', {
      theme: 'dark',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('更新主题设置', 'pass', '更新成功');
    } else {
      recordTest('更新主题设置', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('更新主题设置', 'fail', error.message);
  }

  // 更新时区设置
  try {
    const res = await request('PUT', '/api/settings/timezone', {
      timezone: 'Asia/Shanghai',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('更新时区设置', 'pass', '更新成功');
    } else {
      recordTest('更新时区设置', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('更新时区设置', 'fail', error.message);
  }
}

async function testSync() {
  logSection('7. 同步功能测试');

  if (!authToken) {
    log('缺少认证 token，跳过同步测试', colors.yellow);
    recordTest('同步获取', 'skip', '缺少认证 token');
    recordTest('同步设置', 'skip', '缺少认证 token');
    return;
  }

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // 同步获取
  try {
    const res = await request('POST', '/api/sync/get', {
      atoms: [
        { taskType: 'thread_list', taskId: '1', type: 'note', limit: 10 },
      ],
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('同步获取', 'pass', '同步成功');
    } else {
      recordTest('同步获取', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('同步获取', 'fail', error.message);
  }

  // 同步设置
  try {
    const res = await request('POST', '/api/sync/set', {
      atoms: [
        {
          taskType: 'thread-post',
          taskId: '1',
          thread: {
            title: '同步测试线程',
            type: 'note',
            description: '通过同步创建',
          },
        },
      ],
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('同步设置', 'pass', '同步成功');
    } else {
      recordTest('同步设置', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('同步设置', 'fail', error.message);
  }
}

async function testAI() {
  logSection('8. AI 功能测试');

  if (!authToken) {
    log('缺少认证 token，跳过 AI 测试', colors.yellow);
    recordTest('AI 聊天', 'skip', '缺少认证 token');
    recordTest('AI 内容总结', 'skip', '缺少认证 token');
    recordTest('AI 内容分析', 'skip', '缺少认证 token');
    recordTest('AI 翻译', 'skip', '缺少认证 token');
    recordTest('AI 代码生成', 'skip', '缺少认证 token');
    return;
  }

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // AI 聊天
  try {
    const res = await request('POST', '/api/ai/chat', {
      messages: [
        { role: 'user', content: '你好' },
      ],
      model: 'gpt-3.5-turbo',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      if (res.data.data.content.includes('未配置')) {
        recordTest('AI 聊天', 'pass', '功能正常（未配置 API Key）');
      } else {
        recordTest('AI 聊天', 'pass', 'AI 响应成功');
      }
    } else {
      recordTest('AI 聊天', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('AI 聊天', 'fail', error.message);
  }

  // AI 内容总结
  try {
    const res = await request('POST', '/api/ai/summary', {
      content: '这是一段需要总结的内容。AI 应该能够提取关键信息并生成简短的摘要。',
      model: 'gpt-3.5-turbo',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      if (res.data.data.content.includes('未配置')) {
        recordTest('AI 内容总结', 'pass', '功能正常（未配置 API Key）');
      } else {
        recordTest('AI 内容总结', 'pass', '总结成功');
      }
    } else {
      recordTest('AI 内容总结', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('AI 内容总结', 'fail', error.message);
  }

  // AI 内容分析
  try {
    const res = await request('POST', '/api/ai/analyze', {
      content: '这是一段需要分析的内容。AI 应该能够分析内容的情感、主题等。',
      model: 'gpt-3.5-turbo',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      if (res.data.data.content.includes('未配置')) {
        recordTest('AI 内容分析', 'pass', '功能正常（未配置 API Key）');
      } else {
        recordTest('AI 内容分析', 'pass', '分析成功');
      }
    } else {
      recordTest('AI 内容分析', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('AI 内容分析', 'fail', error.message);
  }

  // AI 翻译
  try {
    const res = await request('POST', '/api/ai/translate', {
      content: 'Hello, world!',
      targetLanguage: 'zh-CN',
      model: 'gpt-3.5-turbo',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      if (res.data.data.content.includes('未配置')) {
        recordTest('AI 翻译', 'pass', '功能正常（未配置 API Key）');
      } else {
        recordTest('AI 翻译', 'pass', '翻译成功');
      }
    } else {
      recordTest('AI 翻译', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('AI 翻译', 'fail', error.message);
  }

  // AI 代码生成
  try {
    const res = await request('POST', '/api/ai/code', {
      prompt: '写一个冒泡排序算法',
      language: 'javascript',
      model: 'gpt-3.5-turbo',
    }, headers);
    if (res.status === 200 && res.data.code === '0000') {
      if (res.data.data.content.includes('未配置')) {
        recordTest('AI 代码生成', 'pass', '功能正常（未配置 API Key）');
      } else {
        recordTest('AI 代码生成', 'pass', '代码生成成功');
      }
    } else {
      recordTest('AI 代码生成', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('AI 代码生成', 'fail', error.message);
  }
}

async function testFiles() {
  logSection('9. 文件管理测试');

  if (!authToken) {
    log('缺少认证 token，跳过文件测试', colors.yellow);
    recordTest('获取文件列表', 'skip', '缺少认证 token');
    recordTest('上传文件', 'skip', '缺少认证 token');
    recordTest('获取文件详情', 'skip', '缺少认证 token');
    recordTest('下载文件', 'skip', '缺少认证 token');
    recordTest('删除文件', 'skip', '缺少认证 token');
    return;
  }

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // 获取文件列表
  try {
    const res = await request('GET', '/api/files', null, headers);
    if (res.status === 200 && res.data.code === '0000') {
      recordTest('获取文件列表', 'pass', `共 ${res.data.data.files.length} 个文件`);
    } else {
      recordTest('获取文件列表', 'fail', `状态码: ${res.status}`);
    }
  } catch (error) {
    recordTest('获取文件列表', 'fail', error.message);
  }

  // 上传文件（需要 multipart/form-data，这里跳过）
  recordTest('上传文件', 'skip', '需要 multipart/form-data 支持');

  // 获取文件详情
  recordTest('获取文件详情', 'skip', '未上传文件');

  // 下载文件
  recordTest('下载文件', 'skip', '未上传文件');

  // 删除文件
  recordTest('删除文件', 'skip', '未上传文件');
}

async function printSummary() {
  logSection('测试结果汇总');

  log(`总测试数: ${testResults.total}`, colors.blue);
  log(`通过: ${testResults.passed}`, colors.green);
  log(`失败: ${testResults.failed}`, colors.red);
  log(`跳过: ${testResults.skipped}`, colors.yellow);

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  log(`通过率: ${passRate}%`, colors.cyan);

  if (testResults.failed > 0) {
    log('\n失败的测试:', colors.red);
    testResults.details
      .filter(t => t.status === 'fail')
      .forEach(t => log(`  ❌ ${t.name}`, colors.red));
  }

  if (testResults.skipped > 0) {
    log('\n跳过的测试:', colors.yellow);
    testResults.details
      .filter(t => t.status === 'skip')
      .forEach(t => log(`  ⏭️  ${t.name} - ${t.details}`, colors.yellow));
  }
}

// ==================== 主函数 ====================

async function main() {
  log('='.repeat(60), colors.cyan);
  log('如是(Thus-Note) 后端全面测试', colors.cyan);
  log('='.repeat(60), colors.cyan);
  log(`测试服务器: ${BASE_URL}`, colors.blue);
  log(`开始时间: ${new Date().toLocaleString('zh-CN')}`, colors.blue);

  try {
    await testHealthCheck();
    await testAuth();
    await testThreads();
    await testContents();
    await testComments();
    await testSettings();
    await testSync();
    await testAI();
    await testFiles();
  } catch (error) {
    log(`\n测试过程中发生错误: ${error.message}`, colors.red);
  }

  await printSummary();

  log(`\n结束时间: ${new Date().toLocaleString('zh-CN')}`, colors.blue);
  log('='.repeat(60), colors.cyan);
}

// 运行测试
main().catch(error => {
  log(`\n测试脚本执行失败: ${error.message}`, colors.red);
  process.exit(1);
});
