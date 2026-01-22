const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/thus-note')
  .then(() => console.log('✅ 已连接到数据库'))
  .catch(err => console.error('❌ 数据库连接失败:', err));

// 定义 User 模型
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive', 'disabled', 'deleted'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function checkUserStatus() {
  try {
    // 检查 test@example.com 用户
    const testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      console.log('✅ 用户 test@example.com 存在');
      console.log('   状态:', testUser.status);
      console.log('   用户名:', testUser.username);
      console.log('   创建时间:', testUser.createdAt);
    } else {
      console.log('❌ 用户 test@example.com 不存在');
    }

    // 检查 testuser12345@example.com 用户
    const testUser2 = await User.findOne({ email: 'testuser12345@example.com' });
    if (testUser2) {
      console.log('✅ 用户 testuser12345@example.com 存在');
      console.log('   状态:', testUser2.status);
      console.log('   用户名:', testUser2.username);
      console.log('   创建时间:', testUser2.createdAt);
    } else {
      console.log('❌ 用户 testuser12345@example.com 不存在');
    }

    // 创建一个新的测试用户
    const newPassword = 'Test123456!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const newUser = new User({
      email: 'testuser67890@example.com',
      password: hashedPassword,
      username: 'TestUser67890',
      avatar: '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();
    console.log('✅ 新用户 testuser67890@example.com 创建成功');
    console.log('   密码:', newPassword);
    console.log('   状态:', newUser.status);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ 已断开数据库连接');
  }
}

checkUserStatus();
