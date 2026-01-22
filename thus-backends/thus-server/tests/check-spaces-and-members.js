const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

// 连接数据库
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thus-note';

async function checkSpacesAndMembers() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    const db = mongoose.connection.db;

    // 检查 spaces 集合
    console.log('🔍 检查 spaces 集合...');
    const spaces = await db.collection('spaces').find({}).toArray();
    console.log(`找到 ${spaces.length} 个空间\n`);

    if (spaces.length > 0) {
      spaces.forEach((space, index) => {
        console.log(`空间 ${index + 1}:`);
        console.log(`  _id: ${space._id}`);
        console.log(`  ownerId: ${space.ownerId}`);
        console.log(`  spaceType: ${space.spaceType}`);
        console.log(`  status: ${space.status}`);
        console.log(`  name: ${space.name}`);
        console.log('');
      });
    }

    // 检查 members 集合
    console.log('🔍 检查 members 集合...');
    const members = await db.collection('members').find({}).toArray();
    console.log(`找到 ${members.length} 个成员\n`);

    if (members.length > 0) {
      members.forEach((member, index) => {
        console.log(`成员 ${index + 1}:`);
        console.log(`  _id: ${member._id}`);
        console.log(`  spaceId: ${member.spaceId}`);
        console.log(`  userId: ${member.userId}`);
        console.log(`  status: ${member.status}`);
        console.log(`  name: ${member.name}`);
        console.log('');
      });
    }

    // 检查 test@example.com 用户的空间和成员
    console.log('🔍 检查 test@example.com 用户的空间和成员...');
    const user = await db.collection('users').findOne({ email: 'test@example.com' });
    
    if (user) {
      console.log(`用户 ID: ${user._id}\n`);

      // 查找该用户的空间
      const userSpaces = await db.collection('spaces').find({ ownerId: user._id }).toArray();
      console.log(`找到 ${userSpaces.length} 个用户拥有的空间:`);
      userSpaces.forEach((space, index) => {
        console.log(`  空间 ${index + 1}: ${space._id} (${space.name})`);
      });
      console.log('');

      // 查找该用户的成员记录
      const userMembers = await db.collection('members').find({ userId: user._id }).toArray();
      console.log(`找到 ${userMembers.length} 个用户成员记录:`);
      userMembers.forEach((member, index) => {
        console.log(`  成员 ${index + 1}: ${member._id} (spaceId: ${member.spaceId}, status: ${member.status})`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开MongoDB连接');
  }
}

checkSpacesAndMembers();
