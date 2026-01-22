const fetch = require('node-fetch');
const mongoose = require('mongoose');

async function testSyncGet() {
  try {
    // 连接到 MongoDB
    await mongoose.connect('mongodb://localhost:27017/thus-note');
    console.log('✅ 已连接到MongoDB\n');

    // 获取用户
    const user = await mongoose.connection.db.collection('users').findOne({ email: 'test@example.com' });
    if (!user) {
      console.error('❌ 用户不存在');
      process.exit(1);
    }

    console.log('👤 用户信息:');
    console.log('  email:', user.email);
    console.log('  userId:', user._id);
    console.log('');

    // 登录获取 token
    const loginUrl = 'http://localhost:3000/api/auth/email';
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test123456!'
      })
    });

    const loginData = await loginResponse.json();
    if (loginData.code !== '0000') {
      console.error('❌ 登录失败:', loginData.errMsg);
      process.exit(1);
    }

    const token = loginData.data.token;
    const serial = loginData.data.serial_id;
    console.log('🔑 登录成功');
    console.log('  token:', token.substring(0, 20) + '...');
    console.log('  serial:', serial);
    console.log('');

    // 调用 sync-get API
    const url = 'http://localhost:3000/sync-get';
    const requestBody = {
      operateType: 'general_sync',
      plz_enc_atoms: [
        {
          taskType: 'thread_list',
          taskId: 'test-task-1',
          viewType: 'INDEX',
          limit: 20,
          skip: 0
        }
      ]
    };

    console.log('📤 发送请求:');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': token,
        'x-liu-serial': serial
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 HTTP 状态码: ${response.status}`);
    console.log(`📥 HTTP 状态文本: ${response.statusText}`);
    console.log('');

    const responseText = await response.text();
    console.log('📄 响应原始文本:');
    console.log(responseText);
    console.log('');

    const data = JSON.parse(responseText);
    console.log('✅ 解析 JSON 成功');
    console.log('code:', data.code);
    console.log('results:', data.data?.results ? '存在' : '不存在');
    console.log('');

    if (data.data?.results && data.data.results.length > 0) {
      console.log('📝 线程列表:');
      data.data.results.forEach((result, index) => {
        console.log(`\n  [${index + 1}] taskId: ${result.taskId}`);
        console.log(`      code: ${result.code}`);
        if (result.list && result.list.length > 0) {
          console.log(`      线程数: ${result.list.length}`);
          result.list.forEach((thread, tIndex) => {
            console.log(`        [${tIndex + 1}] id: ${thread.id}`);
            console.log(`            status: ${thread.status}`);
            console.log(`            parcelType: ${thread.parcelType}`);
            if (thread.content) {
              console.log(`            content.title: ${thread.content.title}`);
              console.log(`            content.infoType: ${thread.content.infoType}`);
            }
          });
        }
      });
    }

    await mongoose.connection.close();
    console.log('\n🔌 已断开MongoDB连接');
  } catch (err) {
    console.error('❌ 错误:', err.message);
    process.exit(1);
  }
}

testSyncGet();
