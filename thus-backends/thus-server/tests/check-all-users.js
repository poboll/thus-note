#!/usr/bin/env node

/**
 * 检查数据库中所有的 test@example.com 用户
 */

const mongoose = require('mongoose');

// 连接数据库
const MONGODB_URI = 'mongodb://localhost:27017/thus-note';

async function checkAllUsers() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    // 定义 User Schema
    const UserSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      status: String,
      settings: Object,
      createdAt: Date,
      lastLoginAt: Date
    });

    const User = mongoose.model('User', UserSchema);

    // 查找所有 test@example.com 用户
    console.log('🔍 查找所有 test@example.com 用户...');
    const users = await User.find({ email: 'test@example.com' });

    console.log(`找到 ${users.length} 个用户\n`);

    if (users.length === 0) {
      console.log('❌ 没有找到 test@example.com 用户');
      process.exit(1);
    }

    users.forEach((user, index) => {
      console.log(`用户 ${index + 1}:`);
      console.log(`  _id: ${user._id}`);
      console.log(`  email: ${user.email}`);
      console.log(`  username: ${user.username}`);
      console.log(`  password: ${user.password ? '存在' : '不存在'}`);
      if (user.password) {
        console.log(`  password hash: ${user.password.substring(0, 30)}...`);
      }
      console.log(`  status: ${user.status}`);
      console.log(`  createdAt: ${user.createdAt}`);
      console.log('');
    });

    // 删除没有密码的用户
    console.log('🗑️  清理没有密码的用户...');
    let deletedCount = 0;
    for (const user of users) {
      if (!user.password) {
        console.log(`  删除用户: ${user._id} (没有密码)`);
        await User.deleteOne({ _id: user._id });
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`  ✅ 已删除 ${deletedCount} 个没有密码的用户\n`);
    } else {
      console.log('  没有需要删除的用户\n');
    }

    // 再次检查
    console.log('🔍 再次检查 test@example.com 用户...');
    const remainingUsers = await User.find({ email: 'test@example.com' });
    console.log(`剩余 ${remainingUsers.length} 个用户\n`);

    if (remainingUsers.length === 0) {
      console.log('❌ 没有剩余用户，需要重新创建');
    } else {
      const user = remainingUsers[0];
      console.log('用户信息:');
      console.log(`  _id: ${user._id}`);
      console.log(`  email: ${user.email}`);
      console.log(`  username: ${user.username}`);
      console.log(`  password: ${user.password ? '存在' : '不存在'}`);
      if (user.password) {
        console.log(`  password hash: ${user.password.substring(0, 30)}...`);
      }
      console.log(`  status: ${user.status}`);
    }

    console.log('\n✅ 检查完成');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开MongoDB连接');
  }
}

checkAllUsers();
