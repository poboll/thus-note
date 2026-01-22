#!/usr/bin/env node

/**
 * 测试密码哈希和验证
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 连接数据库
const MONGODB_URI = 'mongodb://localhost:27017/thus-note';

async function testPassword() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    // 获取 User 模型
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      username: String,
      password: String,
      status: String,
      settings: Object,
      createdAt: Date,
      lastLoginAt: Date
    }));

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
    console.log(`  status: ${user.status}\n`);

    // 测试密码哈希
    const testPassword = 'Test123456!';
    console.log('🔐 测试密码:', testPassword);
    console.log('');

    // 测试 1: 直接使用 bcrypt.compare
    console.log('测试 1: 使用 bcrypt.compare');
    const result1 = await bcrypt.compare(testPassword, user.password);
    console.log(`  结果: ${result1 ? '✅ 成功' : '❌ 失败'}`);
    console.log('');

    // 测试 2: 重新哈希并比较
    console.log('测试 2: 重新哈希测试密码');
    const newHash = await bcrypt.hash(testPassword, 10);
    const result2 = await bcrypt.compare(testPassword, newHash);
    console.log(`  新哈希: ${newHash.substring(0, 30)}...`);
    console.log(`  比较: ${result2 ? '✅ 成功' : '❌ 失败'}`);
    console.log('');

    // 测试 3: 测试错误密码
    console.log('测试 3: 测试错误密码');
    const wrongPassword = 'wrongpassword';
    const result3 = await bcrypt.compare(wrongPassword, user.password);
    console.log(`  错误密码: ${wrongPassword}`);
    console.log(`  结果: ${result3 ? '❌ 错误地成功了' : '✅ 正确地失败了'}`);
    console.log('');

    // 测试 4: 测试密码强度
    console.log('测试 4: 测试不同密码');
    const passwords = [
      'Test123456!',
      'test123456!',
      'TEST123456!',
      'Test123456',
      'Test!',
      'Test12345678901234567890'
    ];

    for (const pwd of passwords) {
      const isValid = await bcrypt.compare(pwd, user.password);
      console.log(`  ${pwd.padEnd(30)} ${isValid ? '✅' : '❌'}`);
    }
    console.log('');

    // 测试 5: 检查哈希格式
    console.log('测试 5: 检查哈希格式');
    console.log(`  哈希长度: ${user.password.length}`);
    console.log(`  以 $2b$ 开头: ${user.password.startsWith('$2b$') ? '✅' : '❌'}`);
    console.log(`  包含 3 个 $ 符号: ${(user.password.match(/\$/g) || []).length === 3 ? '✅' : '❌'}`);
    console.log('');

    console.log('✅ 测试完成');
    console.log('');
    console.log('💡 如果测试 1 成功，说明密码哈希是正确的');
    console.log('💡 如果测试 1 失败，说明数据库中的密码哈希不正确');
    console.log('💡 如果测试 2 成功，说明 bcrypt 本身工作正常');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开MongoDB连接');
  }
}

testPassword();
