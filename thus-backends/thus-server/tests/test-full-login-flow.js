const mongoose = require('mongoose');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thus-note';

async function testFullLoginFlow() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    const API_DOMAIN = process.env.API_DOMAIN || 'http://localhost:3000';

    // 1. 登录
    console.log('1️⃣ 第一步：登录');
    console.log(`   API: ${API_DOMAIN}/api/auth/email`);

    const loginResponse = await fetch(`${API_DOMAIN}/api/auth/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123456!',
      }),
    });

    console.log(`   HTTP 状态码: ${loginResponse.status}`);

    if (loginResponse.status !== 200) {
      console.log('❌ 登录失败');
      const loginText = await loginResponse.text();
      console.log(loginText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log(`   code: ${loginData.code}`);
    console.log(`   userId: ${loginData.data?.userId}`);
    console.log(`   token: ${loginData.data?.token ? '存在' : '不存在'}`);
    console.log(`   serial_id: ${loginData.data?.serial_id ? '存在' : '不存在'}`);
    console.log(`   spaceMemberList: ${loginData.data?.spaceMemberList?.length || 0} 个成员\n`);

    if (loginData.code !== '0000' || !loginData.data) {
      console.log('❌ 登录响应格式错误');
      return;
    }

    const { userId, token, serial_id, spaceMemberList } = loginData.data;

    if (!token || !serial_id) {
      console.log('❌ 登录成功但没有返回 token 或 serial_id');
      return;
    }

    if (!spaceMemberList || spaceMemberList.length === 0) {
      console.log('❌ 登录成功但没有返回 spaceMemberList');
      return;
    }

    console.log('✅ 登录成功，获得 token 和 serial_id\n');

    // 2. 使用 token 调用 sync-get API
    console.log('2️⃣ 第二步：使用 token 调用 sync-get API');
    console.log(`   API: ${API_DOMAIN}/sync-get`);
    console.log(`   token: ${token.substring(0, 20)}...`);
    console.log(`   serial: ${serial_id.substring(0, 20)}...\n`);

    const syncGetPayload = {
      atoms: [
        {
          taskType: 'thread_list',
          taskId: 'test-task-1',
          type: 'INDEX',
          limit: 20,
          skip: 0
        }
      ]
    };

    const syncGetResponse = await fetch(`${API_DOMAIN}/sync-get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': token,
        'x-liu-serial': serial_id,
      },
      body: JSON.stringify(syncGetPayload),
    });

    console.log(`   HTTP 状态码: ${syncGetResponse.status}`);

    if (syncGetResponse.status !== 200) {
      console.log('❌ sync-get 请求失败');
      const syncGetText = await syncGetResponse.text();
      console.log(syncGetText);
      return;
    }

    const syncGetData = await syncGetResponse.json();
    console.log(`   code: ${syncGetData.code}`);
    console.log(`   results: ${syncGetData.data?.results ? '存在' : '不存在'}`);

    if (syncGetData.data && syncGetData.data.results) {
      console.log('\n   📋 结果详情:');
      syncGetData.data.results.forEach((result, index) => {
        console.log(`\n   结果 ${index + 1}:`);
        console.log(`     taskId: ${result.taskId}`);
        console.log(`     code: ${result.code}`);
        console.log(`     list: ${result.list ? result.list.length + ' 个项目' : '不存在'}`);
        if (result.list && result.list.length > 0) {
          console.log(`     第一个项目:`, JSON.stringify(result.list[0], null, 2));
        }
      });
    }

    console.log('\n✅ 完整登录流程测试完成！');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 已断开MongoDB连接');
  }
}

testFullLoginFlow();
