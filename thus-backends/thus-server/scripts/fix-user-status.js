const mongoose = require('mongoose');

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

async function fixUserStatus() {
  try {
    // 修复 testuser12345@example.com 的状态
    const result = await User.updateOne(
      { email: 'testuser12345@example.com' },
      { status: 'active', updatedAt: new Date() }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ 用户 testuser12345@example.com 状态已修复');
    } else {
      console.log('ℹ️  用户 testuser12345@example.com 状态未修改');
    }

    // 检查所有用户的状态
    const users = await User.find({});
    console.log('\n📋 所有用户列表:');
    users.forEach(user => {
      console.log(`   ${user.email} - ${user.username} - 状态: ${user.status}`);
    });

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ 已断开数据库连接');
  }
}

fixUserStatus();
