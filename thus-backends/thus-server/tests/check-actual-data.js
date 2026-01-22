const mongoose = require('mongoose');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thus-note';

async function checkActualData() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    const db = mongoose.connection.db;

    // 查询用户
    const users = await db.collection('users').find({ email: 'test@example.com' }).toArray();

    if (users.length === 0) {
      console.log('❌ 用户 test@example.com 不存在');
      return;
    }

    const user = users[0];
    console.log(`👤 用户 ID: ${user._id}`);
    console.log(`👤 用户邮箱: ${user.email}`);

    // 查询线程
    const threadsCollection = db.collection('threads');
    const allThreads = await threadsCollection.find({ userId: user._id }).toArray();

    console.log(`\n📊 数据库中的所有线程 (${allThreads.length} 个):`);
    allThreads.forEach((thread, index) => {
      console.log(`\n线程 ${index + 1}:`);
      console.log(`  _id: ${thread._id}`);
      console.log(`  userId: ${thread.userId}`);
      console.log(`  type: "${thread.type}"`);
      console.log(`  title: "${thread.title}"`);
      console.log(`  status: "${thread.status}"`);
      console.log(`  createdAt: ${thread.createdAt}`);
      console.log(`  lastModifiedAt: ${thread.lastModifiedAt}`);
    });

    // 测试查询
    console.log('\n🔍 测试查询条件:');

    const query1 = { userId: user._id };
    const result1 = await threadsCollection.find(query1).toArray();
    console.log(`\n查询1: { userId: ${user._id} }`);
    console.log(`结果: ${result1.length} 个线程`);

    const query2 = { userId: user._id, type: 'note' };
    const result2 = await threadsCollection.find(query2).toArray();
    console.log(`\n查询2: { userId: ${user._id}, type: 'note' }`);
    console.log(`结果: ${result2.length} 个线程`);

    const query3 = { userId: user._id, type: 'NOTE' };
    const result3 = await threadsCollection.find(query3).toArray();
    console.log(`\n查询3: { userId: ${user._id}, type: 'NOTE' }`);
    console.log(`结果: ${result3.length} 个线程`);

    const query4 = { userId: user._id, status: 'active' };
    const result4 = await threadsCollection.find(query4).toArray();
    console.log(`\n查询4: { userId: ${user._id}, status: 'active' }`);
    console.log(`结果: ${result4.length} 个线程`);

    const query5 = { userId: user._id, type: 'note', status: 'active' };
    const result5 = await threadsCollection.find(query5).toArray();
    console.log(`\n查询5: { userId: ${user._id}, type: 'note', status: 'active' }`);
    console.log(`结果: ${result5.length} 个线程`);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 已断开MongoDB连接');
  }
}

checkActualData();
