/**
 * 检查MongoDB中的用户数据
 */

const { MongoClient } = require('mongodb');

async function checkUser() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ 已连接到MongoDB\n');

    const db = client.db('thus-note');
    const users = db.collection('users');

    // 查找测试用户
    const user = await users.findOne({ email: 'test@example.com' });

    if (user) {
      console.log('找到用户:');
      console.log('  _id:', user._id);
      console.log('  email:', user.email);
      console.log('  username:', user.username);
      console.log('  password:', user.password ? '存在' : '不存在');
      console.log('  status:', user.status);
      console.log('  createdAt:', user.createdAt);
      console.log('  lastLoginAt:', user.lastLoginAt);
      console.log('  settings:', user.settings);
    } else {
      console.log('❌ 用户不存在');
      console.log('\n正在创建测试用户...');

      // 创建测试用户
      const bcrypt = require('bcrypt');
      const password = await bcrypt.hash('test123456', 10);

      const result = await users.insertOne({
        email: 'test@example.com',
        username: 'test',
        password: password,
        status: 'ACTIVE',
        settings: {
          theme: 'light',
          language: 'zh-Hans'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ 测试用户创建成功');
      console.log('  _id:', result.insertedId);
    }

    // 检查空间和成员
    console.log('\n检查空间和成员:');
    const spaces = db.collection('spaces');
    const members = db.collection('members');

    const spaceCount = await spaces.countDocuments();
    const memberCount = await members.countDocuments();

    console.log(`  空间数量: ${spaceCount}`);
    console.log(`  成员数量: ${memberCount}`);

    if (user) {
      const userMembers = await members.find({ userId: user._id }).toArray();
      console.log(`  用户 ${user.email} 的成员数量: ${userMembers.length}`);

      if (userMembers.length > 0) {
        console.log('\n  成员列表:');
        userMembers.forEach((member, index) => {
          console.log(`    ${index + 1}. memberId: ${member._id}, spaceId: ${member.spaceId}, name: ${member.name}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await client.close();
    console.log('\n已断开MongoDB连接');
  }
}

checkUser();
