/**
 * 模板数据库种子脚本
 * 为复刻者提供开箱即用的演示数据
 *
 * 用法:
 *   node scripts/seed-database.js          # 创建演示数据
 *   node scripts/seed-database.js --clean  # 清除后重建
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Schema 定义（与 src/models 保持一致）──────────────────────────

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, select: false },
  avatar: String,
  status: { type: String, enum: ['active', 'inactive', 'banned', 'deleted'], default: 'active' },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  oauthAccounts: { type: Array, default: [] },
  files: { type: Array, default: [] },
  settings: {
    language: { type: String, default: 'zh-CN' },
    theme: { type: String, default: 'light' },
    timezone: { type: String, default: 'Asia/Shanghai' },
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true } },
  },
  lastLoginAt: Date,
}, { timestamps: true });

const threadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space' },
  first_id: String,
  type: { type: String, enum: ['note', 'task', 'calendar', 'kanban', 'drawing'], default: 'note' },
  title: { type: String, default: '' },
  description: { type: String },
  thusDesc: { type: mongoose.Schema.Types.Mixed, default: [] },
  images: { type: Array, default: [] },
  files: { type: Array, default: [] },
  editedStamp: Number,
  createdStamp: Number,
  removedStamp: Number,
  calendarStamp: Number,
  remindStamp: Number,
  whenStamp: Number,
  pinStamp: Number,
  stateStamp: Number,
  remindMe: mongoose.Schema.Types.Mixed,
  oState: { type: String, enum: ['OK', 'DELETED', 'ONLY_LOCAL'], default: 'OK' },
  tags: { type: [String], default: [] },
  tagIds: { type: [String], default: [] },
  tagSearched: { type: [String], default: [] },
  stateId: String,
  emojiData: { type: mongoose.Schema.Types.Mixed, default: { total: 0, system: [] } },
  config: mongoose.Schema.Types.Mixed,
  aiChatId: String,
  aiReadable: { type: String, enum: ['Y', 'N'], default: 'Y' },
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
  isPublic: { type: Boolean, default: false },
  settings: { color: String, icon: String, sort: { type: Number, default: 0 }, showCountdown: Boolean },
  lastModifiedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const contentBlockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'heading', 'list', 'checklist', 'code', 'quote', 'divider', 'image', 'file', 'table'] },
  content: String,
  properties: { type: mongoose.Schema.Types.Mixed, default: {} },
  order: { type: Number, required: true },
}, { _id: false });

const contentSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  version: { type: Number, default: 1 },
  blocks: { type: [contentBlockSchema], default: [] },
  isEncrypted: { type: Boolean, default: false },
  encryptedData: String,
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  content: { type: String, required: true },
  status: { type: String, enum: ['active', 'deleted', 'hidden'], default: 'active' },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// ── 模型注册 ──────────────────────────────────────────────

const User = mongoose.model('User', userSchema);
const Thread = mongoose.model('Thread', threadSchema);
const Content = mongoose.model('Content', contentSchema);
const Comment = mongoose.model('Comment', commentSchema);

// ── 演示数据 ──────────────────────────────────────────────

const now = Date.now();
const DAY = 86400000;

function stamp(daysAgo) { return now - daysAgo * DAY; }

const DEMO_USERS = [
  { username: 'demo', email: 'demo@thus-note.com', password: 'Demo123456!' },
  { username: 'testuser', email: 'test@thus-note.com', password: 'Test123456!' },
];

function buildThreads(userId) {
  return [
    {
      userId, type: 'note', title: '如是笔记系统简介',
      description: '如是（Thus-Note）是一个基于原子化理念的个人信息管理系统，每条笔记都是独立的信息单元，支持标签、收藏、完成状态等多维度管理。',
      tags: ['产品', '介绍'], pinStamp: stamp(0),
      createdStamp: stamp(14), editedStamp: stamp(0),
    },
    {
      userId, type: 'note', title: 'Vue 3 Composition API 学习笔记',
      description: 'Vue 3 的 Composition API 通过 setup() 函数和 ref/reactive 实现了更灵活的逻辑组织方式。相比 Options API，它更适合复杂组件的逻辑复用和代码拆分。',
      tags: ['学习', 'Vue', 'TypeScript'],
      createdStamp: stamp(12), editedStamp: stamp(5),
    },
    {
      userId, type: 'note', title: 'MongoDB 文档模型设计思路',
      description: '在设计 MongoDB 文档模型时，应考虑反范式化设计，将关联数据内嵌到文档中以减少查询次数。对于原子化笔记系统，每个文档即一个笔记原子。',
      tags: ['学习', 'MongoDB', '数据库'],
      createdStamp: stamp(11), editedStamp: stamp(6),
    },
    {
      userId, type: 'note', title: '今天的灵感：关于知识管理',
      description: '真正的知识管理不是囤积信息，而是建立信息之间的连接。原子化笔记的核心价值在于让每一个想法都能被独立检索和重组。',
      tags: ['灵感', '生活'],
      createdStamp: stamp(8), editedStamp: stamp(8),
    },
    {
      userId, type: 'note', title: '《认知觉醒》读书笔记',
      description: '周岭在书中提到，元认知能力是人类最重要的能力之一。我们需要学会觉察自己的思维过程，这就是"如是观照"的现代诠释。',
      tags: ['读书笔记', '学习'], pinStamp: stamp(2),
      createdStamp: stamp(10), editedStamp: stamp(3),
    },
    {
      userId, type: 'task', title: '完成毕业设计论文初稿',
      description: '1. 完成第四章系统实现部分\n2. 补充系统测试用例\n3. 整理参考文献\n4. 导师审阅反馈修改',
      tags: ['待办', '工作'], stateId: 'done', stateStamp: stamp(1),
      createdStamp: stamp(20), editedStamp: stamp(1),
    },
    {
      userId, type: 'task', title: '本周学习计划',
      description: '- 复习 TypeScript 高级类型\n- 学习 Service Worker 缓存策略\n- 阅读 PWA 最佳��践文档\n- 完成前端瀑布流布局优化',
      tags: ['待办', '学习'],
      createdStamp: stamp(3), editedStamp: stamp(2),
    },
    {
      userId, type: 'task', title: '系统部署清单',
      description: '- 配置 Nginx 反向代理\n- 设置 SSL 证书\n- 配置 PM2 进程管理\n- 设置数据库备份策略\n- 配置日志轮转',
      tags: ['待办', '工作', '部署'],
      createdStamp: stamp(5), editedStamp: stamp(4),
    },
    {
      userId, type: 'calendar', title: '毕业答辩准备',
      description: '准备毕业论文答辩PPT，练习演讲，预计20分钟展示+10分钟答辩。重点突出系统的原子化设计理念和PWA离线架构。',
      tags: ['工作', '重要'], calendarStamp: stamp(-7), remindStamp: stamp(-8),
      createdStamp: stamp(15), editedStamp: stamp(2),
    },
    {
      userId, type: 'calendar', title: '项目代码评审会议',
      description: '与导师进行代码评审，重点讨论后端API设计和数据库索引优化方案。',
      tags: ['工作'], calendarStamp: stamp(-3),
      createdStamp: stamp(7), editedStamp: stamp(4),
    },
    {
      userId, type: 'note', title: 'PWA Service Worker 缓存策略总结',
      description: '常见的缓存策略包括：Cache First（缓存优先）、Network First（网络优先）、Stale While Revalidate（过期重验证）。对于笔记应用，推荐使用 Cache First 策略处理静态资源，Network First 策略处理API请求。',
      tags: ['学习', 'PWA', 'TypeScript'],
      createdStamp: stamp(9), editedStamp: stamp(7),
    },
    {
      userId, type: 'note', title: 'RESTful API 设计规范',
      description: '良好的 REST API 设计应遵循：使用名词而非动词、版本控制、合理的HTTP状态码、统一的错误响应格式、分页与过滤支持。本项目采用 /api/v1/ 前缀风格。',
      tags: ['学习', '工作'],
      createdStamp: stamp(13), editedStamp: stamp(9),
    },
    {
      userId, type: 'note', title: '周末咖啡馆随想',
      description: '在南山的独立咖啡馆写代码，窗外是深圳的天际线。好的工具应该像这杯手冲一样，简单、纯粹、恰到好处。如是记录，真实自我。',
      tags: ['灵感', '生活'],
      createdStamp: stamp(4), editedStamp: stamp(4),
    },
  ];
}

function buildContents(threads, userId) {
  return threads.map((t, i) => ({
    threadId: t._id,
    userId,
    version: 1,
    blocks: [
      { type: 'text', content: t.description || t.title, properties: {}, order: 0 },
    ],
    isEncrypted: false,
  }));
}

function buildComments(threads, contents, userId) {
  return [
    {
      threadId: threads[0]._id,
      contentId: contents[0]._id,
      userId,
      content: '这个系统真的很好用，原子化的设计让碎片化记录变得轻松。',
      status: 'active',
    },
    {
      threadId: threads[4]._id,
      contentId: contents[4]._id,
      userId,
      content: '这本书确实值得反复阅读，元认知的概念对个人成长很有帮助。',
      status: 'active',
    },
  ];
}

// ── 主逻辑 ──────────────────────────────────────────────

async function seed() {
  const isClean = process.argv.includes('--clean');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thus-note');
    console.log('✅ 已连接 MongoDB');

    if (isClean) {
      console.log('🗑  清除现有数据...');
      await Promise.all([
        User.deleteMany({}),
        Thread.deleteMany({}),
        Content.deleteMany({}),
        Comment.deleteMany({}),
      ]);
      console.log('✅ 数据已清除');
    }

    // 创建用户
    const users = [];
    for (const u of DEMO_USERS) {
      const exists = await User.findOne({ $or: [{ email: u.email }, { username: u.username }] });
      if (exists) {
        console.log(`⚠️  用户 ${u.email} 已存在，跳过`);
        users.push(exists);
        continue;
      }
      const hash = await bcrypt.hash(u.password, 10);
      const user = await User.create({ ...u, password: hash, status: 'active', role: 'user' });
      console.log(`✅ 用户 ${u.email} (密码: ${u.password})`);
      users.push(user);
    }

    const demoUser = users[0];

    // 检查是否已有演示数据
    const existingCount = await Thread.countDocuments({ userId: demoUser._id });
    if (existingCount > 0 && !isClean) {
      console.log(`⚠️  demo 用户已有 ${existingCount} 条笔记，跳过种子数据创建 (使用 --clean 强制重建)`);
    } else {
      // 创建笔记
      const threadDocs = buildThreads(demoUser._id);
      const threads = await Thread.insertMany(threadDocs);
      console.log(`✅ 创建 ${threads.length} 条笔记`);

      // 创建内容
      const contentDocs = buildContents(threads, demoUser._id);
      const contents = await Content.insertMany(contentDocs);
      console.log(`✅ 创建 ${contents.length} 条内容`);

      // 创建评论
      const commentDocs = buildComments(threads, contents, demoUser._id);
      await Comment.insertMany(commentDocs);
      console.log(`✅ 创建 ${commentDocs.length} 条评论`);
    }

    console.log('\n🎉 种子数据创建完成！');
    console.log('────────────────────────────────────');
    console.log('演示账号:');
    console.log(`  📧 demo@thus-note.com / Demo123456!`);
    console.log(`  📧 test@thus-note.com / Test123456!`);
    console.log('────────────────────────────────────');
  } catch (err) {
    console.error('❌ 种子数据创建失败:', err);
  } finally {
    await mongoose.disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

seed();
