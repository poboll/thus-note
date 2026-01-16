#!/usr/bin/env node

/**
 * 如是(Thus-Note) 登录流程完整测试
 * 
 * 测试重点：
 * 1. 登录后的完整数据返回
 * 2. spaceMemberList 的验证
 * 3. 登录后的基本功能流程
 * 4. Token 的使用和刷新
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

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

// HTTP 请求函数
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
          const json = body ? JSON.parse(body) : {};
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

// 测试结果
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: [],
};

function recordResult(name, status, message = '', details = {}) {
  results.total++;
  if (status === 'pass') {
    results.passed++;
    log(`✅ ${name}`, colors.green);
  } else if (status === 'fail') {
    results.failed++;
    log(`❌ ${name}`, colors.red);
    log(`   错误: ${message}`, colors.red);
  } else {
    results.skipped++;
    log(`⏭️  ${name}`, colors.yellow);
    log(`   原因: ${message}`, colors.yellow);
  }
  results.details.push({ name, status, message, details });
}

// 主测试函数
async function runTests() {
  logSection('如是(Thus-Note) 登录流程完整测试');
  log(`测试服务器: ${BASE_URL}`);
  log(`开始时间: ${new Date().toLocaleString('zh-CN')}`);

  let testUser = null;
  let token = null;
  let userId = null;
  let spaceMemberList = null;

  // ========================================
  // 1. 健康检查
  // ========================================
  logSection('1. 健康检查');

  try {
    const res = await request('GET', '/health');
    if (res.statusCode === 200 && res.data.status === 'ok') {
      recordResult('基本健康检查', 'pass', '', res.data);
    } else {
      recordResult('基本健康检查', 'fail', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    recordResult('基本健康检查', 'fail', error.message);
  }

  try {
    const res = await request('GET', '/health/db');
    if (res.statusCode === 200 && res.data.mongodb && res.data.redis) {
      recordResult('数据库健康检查', 'pass', 'MongoDB 和 Redis 连接正常');
    } else {
      recordResult('数据库健康检查', 'fail', '数据库连接异常');
    }
  } catch (error) {
    recordResult('数据库健康检查', 'fail', error.message);
  }

  // ========================================
  // 2. 创建测试用户
  // ========================================
  logSection('2. 创建测试用户');

  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    const res = await request('POST', '/api/auth/create-test-user', {
      email: testEmail,
      password: testPassword,
    });

    if (res.statusCode === 201 && res.data.data) {
      testUser = res.data.data.user;
      recordResult('创建测试用户', 'pass', '', testUser);
    } else {
      recordResult('创建测试用户', 'fail', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    recordResult('创建测试用户', 'fail', error.message);
  }

  // ========================================
  // 3. 登录测试
  // ========================================
  logSection('3. 登录测试');

  // 3.1 邮箱密码登录
  try {
    const res = await request('POST', '/api/auth/email', {
      email: testEmail,
      password: testPassword,
    });

    if (res.statusCode === 200 && res.data.code === '0000' && res.data.data) {
      const loginData = res.data.data;
      token = loginData.token;
      userId = loginData.userId;
      spaceMemberList = loginData.spaceMemberList;

      // 验证登录返回的数据结构
      const requiredFields = ['userId', 'email', 'token', 'serial_id', 'theme', 'language', 'spaceMemberList'];
      const missingFields = requiredFields.filter(field => !loginData[field]);

      if (missingFields.length === 0) {
        recordResult('邮箱密码登录', 'pass', '登录成功，返回完整数据', loginData);
      } else {
        recordResult('邮箱密码登录', 'fail', `缺少字段: ${missingFields.join(', ')}`);
      }

      // 验证 spaceMemberList
      if (Array.isArray(spaceMemberList)) {
        log(`   spaceMemberList 包含 ${spaceMemberList.length} 个空间`, colors.blue);
        if (spaceMemberList.length > 0) {
          const firstSpace = spaceMemberList[0];
          log(`   第一个空间: ${firstSpace.space_name}`, colors.blue);
          recordResult('spaceMemberList 验证', 'pass', `包含 ${spaceMemberList.length} 个空间`, firstSpace);
        } else {
          recordResult('spaceMemberList 验证', 'pass', '用户暂无空间');
        }
      } else {
        recordResult('spaceMemberList 验证', 'fail', 'spaceMemberList 不是数组');
      }
    } else {
      recordResult('邮箱密码登录', 'fail', `状态码: ${res.statusCode}, 响应: ${JSON.stringify(res.data)}`);
    }
  } catch (error) {
    recordResult('邮箱密码登录', 'fail', error.message);
  }

  // 3.2 获取当前用户信息（使用 token）
  if (token) {
    try {
      const res = await request('GET', '/api/auth/me', null, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200 && res.data.data) {
        recordResult('获取当前用户信息', 'pass', '', res.data.data);
      } else {
        recordResult('获取当前用户信息', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('获取当前用户信息', 'fail', error.message);
    }
  }

  // ========================================
  // 4. 登录后的基本功能测试
  // ========================================
  logSection('4. 登录后的基本功能测试');

  // 4.1 获取线程列表
  if (token) {
    try {
      const res = await request('GET', '/api/threads', null, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200) {
        const threads = res.data.data || [];
        recordResult('获取线程列表', 'pass', `共 ${threads.length} 个线程`);
      } else {
        recordResult('获取线程列表', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('获取线程列表', 'fail', error.message);
    }
  }

  // 4.2 创建线程
  let threadId = null;
  if (token) {
    try {
      const res = await request('POST', '/api/threads', {
        title: '测试线程',
        content: '这是一个测试线程',
      }, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 201 && res.data.data) {
        threadId = res.data.data._id;
        recordResult('创建线程', 'pass', '', res.data.data);
      } else {
        recordResult('创建线程', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('创建线程', 'fail', error.message);
    }
  }

  // 4.3 获取线程详情
  if (token && threadId) {
    try {
      const res = await request('GET', `/api/threads/${threadId}`, null, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200 && res.data.data) {
        recordResult('获取线程详情', 'pass', '', res.data.data);
      } else {
        recordResult('获取线程详情', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('获取线程详情', 'fail', error.message);
    }
  }

  // 4.4 更新线程
  if (token && threadId) {
    try {
      const res = await request('PUT', `/api/threads/${threadId}`, {
        title: '更新后的测试线程',
      }, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200) {
        recordResult('更新线程', 'pass', '');
      } else {
        recordResult('更新线程', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('更新线程', 'fail', error.message);
    }
  }

  // 4.5 获取用户设置
  if (token) {
    try {
      const res = await request('GET', '/api/settings', null, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200 && res.data.data) {
        recordResult('获取用户设置', 'pass', '', res.data.data);
      } else {
        recordResult('获取用户设置', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('获取用户设置', 'fail', error.message);
    }
  }

  // 4.6 更新用户设置
  if (token) {
    try {
      const res = await request('PUT', '/api/settings', {
        language: 'en',
      }, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200) {
        recordResult('更新用户设置', 'pass', '');
      } else {
        recordResult('更新用户设置', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('更新用户设置', 'fail', error.message);
    }
  }

  // 4.7 同步获取
  if (token) {
    try {
      const res = await request('POST', '/api/sync/get', {
        atoms: [
          {
            taskType: 'thread_list',
            taskId: 'test-1',
            limit: 10,
          },
        ],
      }, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200) {
        recordResult('同步获取', 'pass', '');
      } else {
        recordResult('同步获取', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('同步获取', 'fail', error.message);
    }
  }

  // 4.8 同步设置
  if (token) {
    try {
      const res = await request('POST', '/api/sync/set', {
        atoms: [
          {
            taskType: 'thread-post',
            taskId: 'test-2',
            thread: {
              title: '测试线程',
              type: 'note',
            },
          },
        ],
      }, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200) {
        recordResult('同步设置', 'pass', '');
      } else {
        recordResult('同步设置', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('同步设置', 'fail', error.message);
    }
  }

  // ========================================
  // 5. OAuth URL 生成测试
  // ========================================
  logSection('5. OAuth URL 生成测试');

  try {
    const res = await request('GET', '/api/auth/github/url');
    if (res.statusCode === 200 && res.data.data && res.data.data.url) {
      recordResult('GitHub OAuth URL 生成', 'pass', '', { url: res.data.data.url });
    } else {
      recordResult('GitHub OAuth URL 生成', 'fail', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    recordResult('GitHub OAuth URL 生成', 'fail', error.message);
  }

  try {
    const res = await request('GET', '/api/auth/google/url');
    if (res.statusCode === 200 && res.data.data && res.data.data.url) {
      recordResult('Google OAuth URL 生成', 'pass', '', { url: res.data.data.url });
    } else {
      recordResult('Google OAuth URL 生成', 'fail', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    recordResult('Google OAuth URL 生成', 'fail', error.message);
  }

  try {
    const res = await request('GET', '/api/auth/wechat/url');
    if (res.statusCode === 200 && res.data.data && res.data.data.url) {
      recordResult('微信公众号 OAuth URL 生成', 'pass', '', { url: res.data.data.url });
    } else {
      recordResult('微信公众号 OAuth URL 生成', 'fail', `状态码: ${res.statusCode}`);
    }
  } catch (error) {
    recordResult('微信公众号 OAuth URL 生成', 'fail', error.message);
  }

  // ========================================
  // 6. AI 功能测试
  // ========================================
  logSection('6. AI 功能测试');

  if (token) {
    try {
      const res = await request('POST', '/api/ai/chat', {
        messages: [
          {
            role: 'user',
            content: '你好',
          },
        ],
        model: 'gpt-3.5-turbo',
      }, {
        'Authorization': `Bearer ${token}`,
      });

      if (res.statusCode === 200) {
        recordResult('AI 聊天', 'pass', '功能正常（未配置 API Key）');
      } else {
        recordResult('AI 聊天', 'fail', `状态码: ${res.statusCode}`);
      }
    } catch (error) {
      recordResult('AI 聊天', 'fail', error.message);
    }
  }

  // ========================================
  // 测试结果汇总
  // ========================================
  logSection('测试结果汇总');
  log(`总测试数: ${results.total}`, colors.blue);
  log(`通过: ${results.passed}`, colors.green);
  log(`失败: ${results.failed}`, colors.red);
  log(`跳过: ${results.skipped}`, colors.yellow);
  log(`通过率: ${((results.passed / results.total) * 100).toFixed(2)}%`, colors.cyan);

  if (results.failed > 0) {
    log('\n失败的测试:', colors.red);
    results.details
      .filter(d => d.status === 'fail')
      .forEach(d => log(`  ❌ ${d.name} - ${d.message}`, colors.red));
  }

  if (results.skipped > 0) {
    log('\n跳过的测试:', colors.yellow);
    results.details
      .filter(d => d.status === 'skip')
      .forEach(d => log(`  ⏭️  ${d.name} - ${d.message}`, colors.yellow));
  }

  log(`\n结束时间: ${new Date().toLocaleString('zh-CN')}`, colors.blue);
  log('='.repeat(60), colors.cyan);

  // 退出码
  process.exit(results.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
  log(`\n测试运行失败: ${error.message}`, colors.red);
  process.exit(1);
});
