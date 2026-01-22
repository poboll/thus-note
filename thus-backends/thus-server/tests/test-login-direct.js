#!/usr/bin/env node

/**
 * 直接使用后端模型测试登录
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 连接数据库
const MONGODB_URI = 'mongodb://localhost:27017/thus-note';

// 定义 User Schema（与后端保持一致）
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  status: String,
  settings: Object,
  createdAt: Date,
  lastLoginAt: Date
});

async function testLogin() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    // 获取 User 模型
    const User = mongoose.model('User', UserSchema);

    // 查找测试用户
    const user = await User.findOne({ email: 'test@example.com' });

    if (!user) {
      console.log('❌ 用户不存在');
      process.exit(1);
    }

    console.log('👤 用户信息:');
    console.log(`  _id: ${user._id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  username: ${user.username}`);
    console.log(`  password: ${user.password ? user.password.substring(0, 30) + '...' : '不存在'}`);
    console.log(`  status: ${user.status}`);
    console.log(`  status 类型: ${typeof user.status}`);
    console.log('');

    // 测试密码
    const testPassword = 'Test123456!';
    console.log('🔐 测试密码:', testPassword);
    console.log('');

    // 测试 1: 使用 bcrypt.compare
    console.log('测试 1: 使用 bcrypt.compare');
    const result1 = await bcrypt.compare(testPassword, user.password);
    console.log(`  结果: ${result1 ? '✅ 成功' : '❌ 失败'}`);
    console.log('');

    // 测试 2: 检查状态
    console.log('测试 2: 检查用户状态');
    console.log(`  user.status: "${user.status}"`);
    console.log(`  user.status === 'active': ${user.status === 'active'}`);
    console.log(`  user.status === 'ACTIVE': ${user.status === 'ACTIVE'}`);
    console.log('');

    // 测试 3: 模拟后端登录逻辑
    console.log('测试 3: 模拟后端登录逻辑');
    console.log('  步骤 1: 查找用户');
    const foundUser = await User.findOne({ email: 'test@example.com' }).select('+password');
    console.log(`    找到用户: ${foundUser ? '✅' : '❌'}`);

    console.log('  步骤 2: 检查密码是否存在');
    if (!foundUser.password) {
      console.log(`    ❌ 用户没有密码`);
    } else {
      console.log(`    ✅ 用户有密码`);
    }

    console.log('  步骤 3: 验证密码');
    const isValidPassword = await bcrypt.compare(testPassword, foundUser.password);
    console.log(`    密码验证: ${isValidPassword ? '✅ 成功' : '❌ 失败'}`);

    console.log('  步骤 4: 检查用户状态');
    const isActive = foundUser.status === 'active';
    console.log(`    用户状态检查: ${isActive ? '✅ active' : '❌ 不是 active'}`);

    console.log('  步骤 5: 综合判断');
    if (!foundUser) {
      console.log(`    ❌ 用户不存在`);
    } else if (!foundUser.password) {
      console.log(`    ❌ 用户没有密码`);
    } else if (!isValidPassword) {
      console.log(`    ❌ 密码错误`);
    } else if (!isActive) {
      console.log(`    ❌ 用户状态不是 active`);
    } else {
      console.log(`    ✅ 登录应该成功`);
    }
    console.log('');

    // 测试 4: 测试不同的密码
    console.log('测试 4: 测试不同的密码');
    const passwords = [
      'Test123456!',
      'test123456!',
      'TEST123456!',
      'Test123456',
      'Test!',
    ];

    for (const pwd of passwords) {
      const isValid = await bcrypt.compare(pwd, user.password);
      console.log(`  ${pwd.padEnd(20)} ${isValid ? '✅' : '❌'}`);
    }
    console.log('');

    console.log('✅ 测试完成');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开MongoDB连接');
  }
}

testLogin();
