/**
 * 创建测试用户脚本（简化版）
 * 用法: node scripts/create-test-user-simple.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BANNED', 'DELETED'], default: 'ACTIVE' },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function createTestUsers() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 已连接到数据库');

    // 测试用户列表
    const testUsers = [
      {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123456!',
      },
      {
        username: 'testuser12345',
        email: 'testuser12345@example.com',
        password: 'Test123456!',
      },
    ];

    for (const userData of testUsers) {
      // 检查用户是否已存在
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  用户 ${userData.email} 已存在，跳过创建`);
        continue;
      }

      // 哈希密码
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // 创建用户
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        status: 'ACTIVE',
      });

      await user.save();
      console.log(`✅  用户 ${userData.email} 创建成功`);
      console.log(`   用户名: ${userData.username}`);
      console.log(`   密码: ${userData.password}`);
    }

    console.log('\n🎉 所有测试用户创建完成！');
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ 已断开数据库连接');
  }
}

createTestUsers();
