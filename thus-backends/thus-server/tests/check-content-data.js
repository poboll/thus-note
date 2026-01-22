const mongoose = require('mongoose');

async function checkContentData() {
  try {
    // 连接到 MongoDB
    await mongoose.connect('mongodb://localhost:27017/thus-note');
    console.log('✅ Connected to MongoDB\n');

    // 检查 Thread 数据
    const threads = await mongoose.connection.db.collection('threads').find({}).limit(3).toArray();
    console.log('📝 Threads count:', await mongoose.connection.db.collection('threads').countDocuments());
    if (threads.length > 0) {
      console.log('First thread:');
      console.log(JSON.stringify(threads[0], null, 2));
    }

    // 检查 Content 数据
    const contents = await mongoose.connection.db.collection('contents').find({}).limit(3).toArray();
    console.log('\n📄 Contents count:', await mongoose.connection.db.collection('contents').countDocuments());
    if (contents.length > 0) {
      console.log('First content:');
      console.log(JSON.stringify(contents[0], null, 2));
    }

    // 检查是否有 infoType 字段
    const contentsWithInfoType = await mongoose.connection.db.collection('contents').find({ infoType: 'THREAD' }).limit(3).toArray();
    console.log('\n📄 Contents with infoType=THREAD count:', contentsWithInfoType.length);
    if (contentsWithInfoType.length > 0) {
      console.log('First content with infoType=THREAD:');
      console.log(JSON.stringify(contentsWithInfoType[0], null, 2));
    }

    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkContentData();
