const mongoose = require('mongoose');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thus-note';

async function addTestData() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    // 获取用户和空间
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({ email: 'test@example.com' }).toArray();
    
    if (users.length === 0) {
      console.log('❌ 用户 test@example.com 不存在');
      return;
    }

    const user = users[0];
    console.log(`👤 找到用户: ${user._id}`);

    const spaces = await db.collection('spaces').find({ ownerId: user._id }).toArray();
    
    if (spaces.length === 0) {
      console.log('❌ 用户没有空间');
      return;
    }

    const space = spaces[0];
    console.log(`🏠 找到空间: ${space._id} (${space.name})`);

    // 创建一些测试线程
    const threads = [];
    const now = new Date();
    
    for (let i = 1; i <= 5; i++) {
      const thread = {
        userId: user._id,
        spaceId: space._id,
        type: 'note',
        title: `测试笔记 ${i}`,
        description: `这是第 ${i} 个测试笔记`,
        tags: ['测试'],
        status: 'active',
        isPublic: false,
        settings: {},
        createdAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000), // 过去几天
        lastModifiedAt: new Date(now.getTime() - (5 - i) * 24 * 60 * 60 * 1000),
      };
      threads.push(thread);
    }

    console.log(`\n📝 准备插入 ${threads.length} 个测试线程...`);

    // 插入线程
    const threadsCollection = db.collection('threads');
    const insertResult = await threadsCollection.insertMany(threads);
    console.log(`✅ 成功插入 ${insertResult.insertedCount} 个线程\n`);

    // 为每个线程创建一些内容
    const contentsCollection = db.collection('contents');
    for (const thread of threads) {
      const content = {
        threadId: thread._id,
        userId: user._id,
        version: 1,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              children: [
                {
                  text: `这是线程 "${thread.title}" 的内容。`
                }
              ]
            }
          ]
        },
        status: 'active',
        createdAt: now,
        lastModifiedAt: now,
      };
      
      await contentsCollection.insertOne(content);
      console.log(`  ✅ 为线程 "${thread.title}" 创建内容`);
    }

    console.log('\n✅ 测试数据创建完成！');
    console.log('\n📊 数据库统计:');
    console.log(`  用户数: ${users.length}`);
    console.log(`  空间数: ${spaces.length}`);
    console.log(`  线程数: ${await db.collection('threads').countDocuments({ userId: user._id })}`);
    console.log(`  内容数: ${await db.collection('contents').countDocuments({ userId: user._id })}`);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 已断开MongoDB连接');
  }
}

addTestData();
