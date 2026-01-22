/**
 * 创建测试用户
 * 使用 Mongoose 模型，这样 pre-save 中间件会自动哈希密码
 */

const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/thus-note')
  .then(() => console.log('✅ 已连接到MongoDB\n'))
  .catch(err => {
    console.error('❌ 连接MongoDB失败:', err.message);
    process.exit(1);
  });

// 导入编译后的模型（使用 .default）
const User = require('../dist/models/User').default;

async function createTestUser() {
  try {
    // 删除旧用户
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ 已删除旧用户\n');

    // 创建新用户（明文密码，pre-save中间件会自动哈希）
    // 密码必须符合强度要求：至少8位，包含大小写字母、数字和特殊字符
    const user = new User({
      email: 'test@example.com',
      username: 'test',
      password: 'Test123456!', // 符合强度要求的密码
      status: 'active', // 注意：使用小写 'active'，不是 'ACTIVE'
      settings: {
        theme: 'light',
        language: 'zh-Hans'
      }
    });

    await user.save();

    console.log('✅ 测试用户创建成功');
    console.log('  _id:', user._id);
    console.log('  email: test@example.com');
    console.log('  password: Test123456!');
    console.log('  password (hashed):', user.password ? '存在' : '不存在');
    console.log('  status:', user.status);
    console.log('\n现在可以使用这个账户登录了！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n已断开MongoDB连接');
    process.exit(0);
  }
}

createTestUser();
