/**
 * 测试 sync-get API 的完整流程
 * 包括：请求、响应、数据格式验证
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';

async function testSyncGet() {
  console.log('========================================');
  console.log('开始测试 sync-get API');
  console.log('========================================\n');

  // 1. 首先登录获取 token
  console.log('1. 登录获取 token...');
  const loginRes = await fetch(`${API_URL}/api/auth/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123456!',
    }),
  });

  const loginData = await loginRes.json();
  console.log('登录响应:', JSON.stringify(loginData, null, 2));

  if (loginData.code !== '0000' || !loginData.data) {
    console.error('登录失败！');
    return;
  }

  const { userId, token, serial_id } = loginData.data;
  console.log(`userId: ${userId}`);
  console.log(`token: ${token}`);
  console.log(`serial_id: ${serial_id}\n`);

  // 2. 测试 sync-get API
  console.log('2. 测试 sync-get API...');
  const syncGetRes = await fetch(`${API_URL}/sync-get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-liu-token': token,
      'x-liu-serial': serial_id,
    },
    body: JSON.stringify({
      operateType: 'general_sync',
      plz_enc_atoms: [
        {
          taskType: 'thread_list',
          taskId: '1',
          limit: 20,
          skip: 0,
        },
      ],
    }),
  });

  const syncGetData = await syncGetRes.json();
  console.log('sync-get 响应状态:', syncGetRes.status);
  console.log('sync-get 响应数据:', JSON.stringify(syncGetData, null, 2));

  if (syncGetData.code !== '0000') {
    console.error('sync-get 失败！');
    console.error('错误代码:', syncGetData.code);
    return;
  }

  if (!syncGetData.data || !syncGetData.data.results) {
    console.error('sync-get 返回数据为空！');
    return;
  }

  console.log('results 数量:', syncGetData.data.results.length);
  console.log('');

  // 3. 检查每个 result
  syncGetData.data.results.forEach((result, index) => {
    console.log(`Result ${index + 1}:`);
    console.log('  taskId:', result.taskId);
    console.log('  code:', result.code);
    console.log('  list 长度:', result.list ? result.list.length : 0);

    if (result.code === '0000' && result.list && result.list.length > 0) {
      const firstItem = result.list[0];
      console.log('  第一项数据:');
      console.log('    id:', firstItem.id);
      console.log('    status:', firstItem.status);
      console.log('    parcelType:', firstItem.parcelType);
      console.log('    content:', firstItem.content ? 'exists' : 'null');

      if (firstItem.content) {
        const content = firstItem.content;
        console.log('    content._id:', content._id);
        console.log('    content.title:', content.title);
        console.log('    content.spaceId:', content.spaceId);
        console.log('    content.spaceType:', content.spaceType);
        console.log('    content.createdStamp:', content.createdStamp);
        console.log('    content.editedStamp:', content.editedStamp);
      }
    }
    console.log('');
  });

  console.log('========================================');
  console.log('测试完成');
  console.log('========================================');
}

// 运行测试
testSyncGet().catch(err => {
  console.error('测试出错:', err);
});
