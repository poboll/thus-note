# 微信登录问题修复指南

## 问题描述
微信登录后每次都要求设置用户名，删除缓存重新登录后之前的笔记消失。

## 问题原因
`getOrCreateSpaceMemberList` 函数创建 Member 时没有设置 `name` 字段，导致前端认为用户未设置名字。

## 修复步骤

### 方式一：使用自动化脚本（推荐）

1. 上传脚本到服务器：
```bash
scp deploy/fix-wechat-login.sh root@164.152.42.24:/tmp/
```

2. SSH 登录服务器并执行：
```bash
ssh root@164.152.42.24
cd /tmp
chmod +x fix-wechat-login.sh
./fix-wechat-login.sh
```

### 方式二：手动修改

1. SSH 登录服务器：
```bash
ssh root@164.152.42.24
```

2. 编辑文件：
```bash
cd /www/wwwroot/thus.caiths.com/thus-backends/thus-server
nano src/routes/user-login.ts
```

3. 找到第 34-52 行的代码：
```typescript
  if (members.length === 0) {
    const space = new Space({
      ownerId: userId,
      spaceType: SpaceType.ME,
      status: SpaceStatus.OK,
    });
    await space.save();

    const member = new Member({
      spaceId: space._id,
      userId,
      status: MemberStatus.OK,
    });
    await member.save();

    members = [member];
  }
```

4. 修改为：
```typescript
  if (members.length === 0) {
    const user = await User.findById(userId);
    
    const space = new Space({
      ownerId: userId,
      spaceType: SpaceType.ME,
      status: SpaceStatus.OK,
    });
    await space.save();

    const member = new Member({
      spaceId: space._id,
      userId,
      name: user?.username,
      status: MemberStatus.OK,
    });
    await member.save();

    members = [member];
  }
```

5. 保存文件（Ctrl+O, Enter, Ctrl+X）

6. 清理缓存并重新构建：
```bash
rm -rf node_modules/.cache dist
pnpm run build
```

7. 重启服务：
```bash
pm2 restart thus-server
pm2 logs thus-server --lines 50
```

## 验证修复

1. 检查服务状态：
```bash
curl http://localhost:3000/health
```

2. 测试微信登录：
- 清除浏览器缓存
- 访问 https://thus.caiths.com
- 使用微信扫码登录
- 检查是否还会要求设置用户名

## 数据库修复（可选）

对于已存在的用户，可以运行以下 MongoDB 命令更新 Member 表：

```javascript
// 连接 MongoDB
mongosh "mongodb://用户:密码@127.0.0.1:27017/thus-note?authSource=admin"

// 更新所有缺少 name 的 Member
db.members.find({ name: { $exists: false } }).forEach(function(member) {
  var user = db.users.findOne({ _id: member.userId });
  if (user && user.username) {
    db.members.updateOne(
      { _id: member._id },
      { $set: { name: user.username } }
    );
    print("Updated member " + member._id + " with name: " + user.username);
  }
});
```

## 回滚（如果出现问题）

```bash
cd /www/wwwroot/thus.caiths.com/thus-backends/thus-server
cp src/routes/user-login.ts.backup.* src/routes/user-login.ts
pnpm run build
pm2 restart thus-server
```
