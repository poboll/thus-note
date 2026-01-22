#!/usr/bin/env node

/**
 * 测试登录 API 的完整流程
 */

async function testLoginAPI() {
  const API_DOMAIN = 'http://localhost:3000';
  const email = 'test@example.com';
  const password = 'Test123456!';

  console.log('🔐 测试登录 API');
  console.log('API Domain:', API_DOMAIN);
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');

  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查');
    const healthRes = await fetch(`${API_DOMAIN}/health`);
    const healthData = await healthRes.json();
    console.log('  状态:', healthRes.status);
    console.log('  MongoDB:', healthData.connections.mongodb);
    console.log('  Redis:', healthData.connections.redis);
    console.log('');

    // 2. 测试登录 API
    console.log('2️⃣ 测试登录 API');
    const loginRes = await fetch(`${API_DOMAIN}/api/auth/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    console.log('  HTTP 状态码:', loginRes.status);
    console.log('  HTTP 状态文本:', loginRes.statusText);
    console.log('');

    // 3. 读取响应
    console.log('3️⃣ 读取响应');
    const responseText = await loginRes.text();
    console.log('  响应原始文本:', responseText);
    console.log('');

    // 4. 解析 JSON
    console.log('4️⃣ 解析 JSON');
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('  解析成功');
      console.log('  code:', responseData.code);
      console.log('  errMsg:', responseData.errMsg);
      console.log('  data:', responseData.data ? '存在' : '不存在');
      if (responseData.data) {
        console.log('  userId:', responseData.data.userId);
        console.log('  email:', responseData.data.email);
        console.log('  token:', responseData.data.token ? '存在' : '不存在');
        console.log('  serial_id:', responseData.data.serial_id ? '存在' : '不存在');
        console.log('  spaceMemberList:', responseData.data.spaceMemberList?.length || 0);
      }
    } catch (error) {
      console.log('  ❌ JSON 解析失败');
      console.log('  错误:', error.message);
    }
    console.log('');

    // 5. 分析结果
    console.log('5️⃣ 分析结果');
    if (loginRes.ok && responseData?.code === '0000' && responseData?.data) {
      console.log('  ✅ 登录成功');
      console.log('  前端应该能够正常处理这个响应');
    } else {
      console.log('  ❌ 登录失败');
      console.log('  HTTP 状态码:', loginRes.status);
      console.log('  响应 code:', responseData?.code);
      console.log('  响应 errMsg:', responseData?.errMsg);
      console.log('');
      console.log('  💡 前端期望的响应格式:');
      console.log('  {');
      console.log('    code: "0000",');
      console.log('    data: {');
      console.log('      userId: string,');
      console.log('      email: string,');
      console.log('      token: string,');
      console.log('      serial_id: string,');
      console.log('      theme: string,');
      console.log('      language: string,');
      console.log('      spaceMemberList: array');
      console.log('    }');
      console.log('  }');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testLoginAPI();
