const mongoose = require('mongoose');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thus-note';

async function testSyncGet() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    // 模拟 sync-get 请求
    const API_DOMAIN = process.env.API_DOMAIN || 'http://localhost:3000';
    const url = `${API_DOMAIN}/sync-get`;

    console.log(`📡 测试 sync-get API: ${url}\n`);

    const payload = {
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

    console.log('📤 发送请求:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`📥 HTTP 状态码: ${response.status}`);
    console.log(`📥 HTTP 状态文本: ${response.statusText}\n`);

    const text = await response.text();
    console.log('📄 响应原始文本:');
    console.log(text);
    console.log('');

    try {
      const json = JSON.parse(text);
      console.log('✅ 解析 JSON 成功');
      console.log(`code: ${json.code}`);
      console.log(`results: ${json.data?.results ? '存在' : '不存在'}`);

      if (json.data && json.data.results) {
        console.log('\n📋 结果详情:');
        json.data.results.forEach((result, index) => {
          console.log(`\n结果 ${index + 1}:`);
          console.log(`  taskId: ${result.taskId}`);
          console.log(`  code: ${result.code}`);
          console.log(`  list: ${result.list ? result.list.length + ' 个项目' : '不存在'}`);
          if (result.list && result.list.length > 0) {
            console.log(`  第一个项目:`, JSON.stringify(result.list[0], null, 2));
          }
        });
      }
    } catch (e) {
      console.log('❌ 解析 JSON 失败');
      console.log(e);
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 已断开MongoDB连接');
  }
}

testSyncGet();
