#!/usr/bin/env node

/**
 * 如是(Thus-Note) 后端快速测试脚本
 * 
 * 使用方法:
 * node tests/quick-test.js
 * 
 * 环境要求:
 * - 后端服务运行在 http://localhost:3000
 * - MongoDB 运行在 localhost:27017
 * - Redis 运行在 localhost:6379
 */

const http = require('http');

// 配置
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456',
  username: 'testuser'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 测试结果
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// 工具函数
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(name, status, details = '') {
  results.total++;

  let icon, color;
  if (status === 'PASS') {
    icon = '✓';
    color = 'green';
    results.passed++;
  } else if (status === 'FAIL') {
    icon = '✗';
    color = 'red';
    results.failed++;
  } else {
    icon = '○';
    color = 'yellow';
    results.skipped++;
  }

  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
}

// HTTP 请求函数
function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
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

// 测试函数
async function testHealthCheck() {
  logSection('1. 健康检查测试');

  try {
    const res = await request('GET', '/health');
    if (res.statusCode === 200 && res.data.status === 'ok') {
      logTest('基本健康检查', 'PASS', `状态: ${res.data.status}`);
    } else {
      logTest('基本健康检查', 'FAIL', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    logTest('基本健康检查', 'FAIL', error.message);
  }

  try {
    const res = await request('GET', '/health/db');
    if (res.statusCode === 200 && res.data.database) {
      logTest('数据库健康检查', 'PASS',
        `MongoDB: ${res.data.database.mongodb}, Redis: ${res.data.database.redis}`);
    } else {
      logTest('数据库健康检查', 'FAIL', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    logTest('数据库健康检查', 'FAIL', error.message);
  }
}

async function testPasswordLogin() {
  logSection('2. 密码登录测试');

  // 测试邮箱密码登录
  try {
    const res = await request('POST', '/api/auth/email', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (res.statusCode === 200 && res.data.code === '0000') {
      logTest('邮箱密码登录', 'PASS', `用户ID: ${res.data.data.userId}`);
      return res.data.data.token;
    } else if (res.statusCode === 404) {
      logTest('邮箱密码登录', 'FAIL', '用户不存在，请先注册');
      return null;
    } else {
      logTest('邮箱密码登录', 'FAIL', `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.data)}`);
      return null;
    }
  } catch (error) {
    logTest('邮箱密码登录', 'FAIL', error.message);
    return null;
  }
}

async function testOAuthUrls() {
  logSection('3. OAuth 授权 URL 测试');

  // GitHub OAuth URL
  try {
    const res = await request('GET', '/api/auth/github/url');
    if (res.statusCode === 200 && res.data.code === '0000' && res.data.data.url) {
      logTest('GitHub OAuth URL 生成', 'PASS', 'URL 生成成功');
    } else {
      logTest('GitHub OAuth URL 生成', 'FAIL', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    logTest('GitHub OAuth URL 生成', 'FAIL', error.message);
  }

  // Google OAuth URL
  try {
    const res = await request('GET', '/api/auth/google/url');
    if (res.statusCode === 200 && res.data.code === '0000' && res.data.data.url) {
      logTest('Google OAuth URL 生成', 'PASS', 'URL 生成成功');
    } else {
      logTest('Google OAuth URL 生成', 'FAIL', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    logTest('Google OAuth URL 生成', 'FAIL', error.message);
  }

  // 微信公众号 OAuth URL
  try {
    const res = await request('GET', '/api/auth/wechat/url');
    if (res.statusCode === 200 && res.data.code === '0000' && res.data.data.url) {
      logTest('微信公众号 OAuth URL 生成', 'PASS', 'URL 生成成功');
    } else {
      logTest('微信公众号 OAuth URL 生成', 'FAIL', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    logTest('微信公众号 OAuth URL 生成', 'FAIL', error.message);
  }
}

async function testAI(token) {
  logSection('4. AI 功能测试');

  if (!token) {
    logTest('AI 聊天', 'SKIP', '未提供有效的 token');
    logTest('AI 内容总结', 'SKIP', '未提供有效的 token');
    return;
  }

  // AI 聊天
  try {
    const res = await request('POST', '/api/ai/chat', {
      messages: [
        {
          role: 'user',
          content: '你好，请简单介绍一下你自己'
        }
      ],
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 100
    }, {
      'Authorization': `Bearer ${token}`
    });

    if (res.statusCode === 200 && res.data.code === '0000') {
      logTest('AI 聊天', 'PASS',
        `模型: ${res.data.data.model}, Tokens: ${res.data.data.tokensUsed}`);
    } else {
      logTest('AI 聊天', 'FAIL',
        `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    logTest('AI 聊天', 'FAIL', error.message);
  }

  // AI 内容总结
  try {
    const res = await request('POST', '/api/ai/summarize', {
      content: '这是一段很长的文本内容，需要AI进行总结。这段文本包含了多个要点和详细信息，AI需要提取关键信息并进行简洁的总结。',
      maxLength: 50
    }, {
      'Authorization': `Bearer ${token}`
    });

    if (res.statusCode === 200 && res.data.code === '0000') {
      logTest('AI 内容总结', 'PASS',
        `原文长度: ${res.data.data.originalLength}, 总结长度: ${res.data.data.summaryLength}`);
    } else {
      logTest('AI 内容总结', 'FAIL',
        `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    logTest('AI 内容总结', 'FAIL', error.message);
  }
}

async function testVerificationCode() {
  logSection('5. 验证码功能测试');

  // 发送邮箱验证码
  try {
    const res = await request('POST', '/api/auth/send-code', {
      type: 'EMAIL',
      identifier: TEST_USER.email
    });

    if (res.statusCode === 200 && res.data.code === '0000') {
      logTest('发送邮箱验证码', 'PASS', '验证码已发送');
    } else if (res.statusCode === 429) {
      logTest('发送邮箱验证码', 'PASS', '速率限制正常工作');
    } else {
      logTest('发送邮箱验证码', 'FAIL',
        `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    logTest('发送邮箱验证码', 'FAIL', error.message);
  }

  // 发送手机验证码
  try {
    const res = await request('POST', '/api/auth/send-code', {
      type: 'PHONE',
      identifier: '+8613800138000'
    });

    if (res.statusCode === 200 && res.data.code === '0000') {
      logTest('发送手机验证码', 'PASS', '验证码已发送');
    } else if (res.statusCode === 429) {
      logTest('发送手机验证码', 'PASS', '速率限制正常工作');
    } else {
      logTest('发送手机验证码', 'FAIL',
        `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    logTest('发送手机验证码', 'FAIL', error.message);
  }
}

async function testRateLimit() {
  logSection('6. 速率限制测试');

  let rateLimited = false;

  // 快速发送多个请求
  for (let i = 0; i < 10; i++) {
    try {
      const res = await request('POST', '/api/auth/send-code', {
        type: 'EMAIL',
        identifier: `test${i}@example.com`
      });

      if (res.statusCode === 429) {
        rateLimited = true;
        break;
      }
    } catch (error) {
      // 忽略错误
    }
  }

  if (rateLimited) {
    logTest('速率限制', 'PASS', '速率限制正常工作');
  } else {
    logTest('速率限制', 'FAIL', '速率限制未触发');
  }
}

async function testTokenRefresh(token) {
  logSection('7. Token 刷新测试');

  if (!token) {
    logTest('Token 刷新', 'SKIP', '未提供有效的 token');
    return;
  }

  // 注意：这里需要 refresh token，但我们只有 access token
  // 所以这个测试会失败，这是正常的
  try {
    const res = await request('POST', '/api/auth/refresh', {
      refreshToken: token
    });

    if (res.statusCode === 200 && res.data.code === '0000') {
      logTest('Token 刷新', 'PASS', 'Token 刷新成功');
    } else {
      logTest('Token 刷新', 'FAIL',
        `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    logTest('Token 刷新', 'FAIL', error.message);
  }
}

async function testProtectedRoutes(token) {
  logSection('8. 受保护路由测试');

  if (!token) {
    logTest('受保护路由访问', 'SKIP', '未提供有效的 token');
    return;
  }

  // 测试无 token 访问
  try {
    const res = await request('GET', '/api/users');
    if (res.statusCode === 401) {
      logTest('无 token 访问受保护路由', 'PASS', '正确返回 401');
    } else {
      logTest('无 token 访问受保护路由', 'FAIL',
        `状态码: ${res.statusCode}, 应该是 401`);
    }
  } catch (error) {
    logTest('无 token 访问受保护路由', 'FAIL', error.message);
  }

  // 测试有效 token 访问
  try {
    const res = await request('GET', '/api/users', null, {
      'Authorization': `Bearer ${token}`
    });
    if (res.statusCode === 200) {
      logTest('有效 token 访问受保护路由', 'PASS', '访问成功');
    } else {
      logTest('有效 token 访问受保护路由', 'FAIL',
        `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    logTest('有效 token 访问受保护路由', 'FAIL', error.message);
  }

  // 测试无效 token 访问
  try {
    const res = await request('GET', '/api/users', null, {
      'Authorization': 'Bearer invalid-token'
    });
    if (res.statusCode === 401) {
      logTest('无效 token 访问受保护路由', 'PASS', '正确返回 401');
    } else {
      logTest('无效 token 访问受保护路由', 'FAIL',
        `状态码: ${res.statusCode}, 应该是 401`);
    }
  } catch (error) {
    logTest('无效 token 访问受保护路由', 'FAIL', error.message);
  }
}

async function printSummary() {
  logSection('测试总结');

  console.log(`总测试数: ${results.total}`);
  log(`通过: ${results.passed}`, 'green');
  log(`失败: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`跳过: ${results.skipped}`, 'yellow');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`\n通过率: ${passRate}%`);

  if (results.failed === 0) {
    log('\n🎉 所有测试通过！', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查错误信息', 'red');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// 主测试流程
async function main() {
  console.log('\n' + '='.repeat(60));
  log('如是(Thus-Note) 后端快速测试', 'cyan');
  console.log('='.repeat(60) + '\n');

  log(`测试服务器: ${BASE_URL}`, 'blue');
  log(`测试用户: ${TEST_USER.email}`, 'blue');
  console.log('');

  try {
    // 1. 健康检查
    await testHealthCheck();

    // 2. 密码登录
    const token = await testPasswordLogin();

    // 3. OAuth URLs
    await testOAuthUrls();

    // 4. AI 功能
    await testAI(token);

    // 5. 验证码功能
    await testVerificationCode();

    // 6. 速率限制
    await testRateLimit();

    // 7. Token 刷新
    await testTokenRefresh(token);

    // 8. 受保护路由
    await testProtectedRoutes(token);

    // 打印总结
    await printSummary();

  } catch (error) {
    log(`\n❌ 测试过程中发生错误: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
main();
