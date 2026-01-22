#!/usr/bin/env node

/**
 * 检查后端使用的 User 模型
 */

const mongoose = require('mongoose');

// 连接数据库
const MONGODB_URI = 'mongodb://localhost:27017/thus-note';

async function checkBackendUserModel() {
  try {
    console.log('🔗 连接到MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 已连接到MongoDB\n');

    // 使用与后端相同的 User 模型定义
    const UserSchema = new mongoose.Schema({
      username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
      },
      email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
      },
      password: {
        type: String,
        select: false, // 默认不查询密码
      },
      avatar: String,
      status: {
        type: String,
        enum: ['active', 'inactive', 'banned', 'deleted'],
        default: 'active',
      },
      role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
        required: true,
      },
      oauthAccounts: [],
      files: [],
      settings: {
        language: {
          type: String,
          default: 'zh-CN',
        },
        theme: {
          type: String,
          default: 'light',
        },
        timezone: {
          type: String,
          default: 'Asia/Shanghai',
        },
        notifications: {
          email: {
            type: Boolean,
            default: true,
          },
          push: {
            type: Boolean,
            default: true,
          },
        },
      },
      lastLoginAt: Date,
      createdAt: Date,
      updatedAt: Date,
    });

    const User = mongoose.model('User', UserSchema);

    // 查找用户（不包含密码）
    console.log('1️⃣ 查找用户（不包含密码）');
    const user1 = await User.findOne({ email: 'test@example.com' });
    console.log(`  _id: ${user1?._id}`);
    console.log(`  email: ${user1?.email}`);
    console.log(`  password: ${user1?.password ? '存在' : '不存在'}`);
    console.log('');

    // 查找用户（包含密码）
    console.log('2️⃣ 查找用户（包含密码）');
    const user2 = await User.findOne({ email: 'test@example.com' }).select('+password');
    console.log(`  _id: ${user2?._id}`);
    console.log(`  email: ${user2?.email}`);
    console.log(`  password: ${user2?.password ? '存在' : '不存在'}`);
    if (user2?.password) {
      console.log(`  password hash: ${user2.password.substring(0, 30)}...`);
    }
    console.log('');

    // 检查所有用户
    console.log('3️⃣ 检查所有用户');
    const allUsers = await User.find({});
    console.log(`  总用户数: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`  用户 ${index + 1}: ${user.email || user.username} (${user._id})`);
    });
    console.log('');

    console.log('✅ 检查完成');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 已断开MongoDB连接');
  }
}

checkBackendUserModel();
