# 如是 (Thus-Note) 项目规划

## 🎯 项目概述

**如是** 是基于 [Liubai](https://github.com/yenche123/thus-note) 进行二次开发的个人信息管理系统，致力于提供"如是记录，真实自我"的使用体验。

- **项目仓库**: https://github.com/poboll/thus-note
- **域名**: idrop.in
- **开源协议**: AGPL-3.0-or-later
- **开发状态**: 品牌化完成，功能优化进行中

## 📋 当前状态

### ✅ 已完成
- [x] 项目重新品牌化 (Liubai → Thus-Note → 如是)
- [x] 目录结构重命名 (`liubai-*` → `thus-*`)
- [x] 核心配置文件更新 (package.json, README.md)
- [x] 项目归属声明 (NOTICE 文件)
- [x] 前端页面信息更新 (index.html)
- [x] 品牌词汇统一替换 ("留白记事" → "如是")
- [x] 域名更新 (idrop.in)
- [x] Favicon 更新 (使用用户指定的 pic.svg)
- [x] PWA 配置更新 (manifest.json)
- [x] 多语言文件更新 (zh-Hans.json, en.json)
- [x] 数据库类名更新 (LiuDexie → ThusNoteDexie)
- [x] 前端开发环境验证 (http://localhost:5175/)

### 🔄 进行中
- [ ] 后端品牌化调整
- [ ] 文档站点品牌化更新
- [ ] VS Code 插件品牌化
- [ ] 微信小程序品牌化

### 📅 计划中
- [ ] 新后端架构实现
- [ ] UI/UX 优化升级
- [ ] 功能扩展和增强

## 🚀 近期行动计划

### 第一阶段：基础设施 (本周)
1. **Git 仓库初始化**
   ```bash
   git init
   git remote add origin git@github.com:poboll/thus-note.git
   git add .
   git commit -m "feat: initialize Thus-Note project with rebranding"
   git push -u origin main
   ```

2. **前端核心文件完善**
   - 更新 manifest.json 和 PWA 配置
   - 替换应用图标和 favicon
   - 搜索替换代码中的品牌词汇

3. **基本功能测试**
   - 前端构建测试
   - 文档站点构建测试
   - 开发环境验证

### 第二阶段：功能迁移 (2-3周)
1. **后端架构设计**
   - 技术栈选择：Node.js + Express + MongoDB
   - API 设计和兼容性保持
   - 数据库迁移方案

2. **核心功能迁移**
   - 用户认证系统
   - 笔记 CRUD 操作
   - 文件上传下载
   - AI 功能集成

3. **部署和运维**
   - Docker 容器化
   - CI/CD 流水线
   - 监控和日志系统

### 第三阶段：优化升级 (1个月)
1. **UI/UX 优化**
   - 新的视觉设计
   - 用户体验改进
   - 响应式优化

2. **功能扩展**
   - 新的 AI 模型集成
   - 团队协作功能
   - 移动端优化

## 🏗️ 技术架构

### 当前架构
```
thus-note/
├── thus-frontends/          # 前端项目
│   ├── thus-web/           # Vue 3 + TypeScript Web 应用
│   ├── thus-vscode-extension/  # VS Code 插件
│   └── thus-weixin/        # 微信小程序
├── thus-backends/           # 后端项目
│   ├── thus-laf/          # LAF 云函数 (当前)
│   └── thus-ffmpeg/       # FFmpeg 服务
├── thus-docs/              # VitePress 文档
└── memory-bank/            # AI 工作区
```

### 目标架构
```
thus-note/
├── thus-frontends/          # 前端项目 (保持不变)
├── thus-backends/           # 后端项目
│   ├── thus-server/        # 新的 Node.js 后端 (主要)
│   ├── thus-laf/          # LAF 云函数 (备用)
│   └── thus-ffmpeg/       # FFmpeg 服务
├── thus-docs/              # 文档
├── deployment/             # 部署配置
└── scripts/                # 工具脚本
```

## 🔧 后端迁移计划

### 技术选型
- **框架**: Node.js + Express/Fastify
- **数据库**: MongoDB (保持不变)
- **缓存**: Redis
- **部署**: Docker + PM2
- **代理**: Nginx

### 迁移策略
1. **渐进式迁移**: 保持 LAF 和新后端并行运行
2. **API 兼容**: 确保前端无需大幅修改
3. **数据同步**: 平滑的数据迁移过程
4. **灰度发布**: 逐步切换用户流量

### 关键迁移点
- 云函数 → REST API 路由
- LAF 数据库操作 → MongoDB 原生操作
- 环境变量和配置管理
- 文件存储和处理

## 📊 风险评估

### 主要风险
1. **技术风险**: 功能遗漏、性能问题
2. **数据风险**: 迁移过程中的数据丢失
3. **时间风险**: 开发周期超预期
4. **维护风险**: 运维复杂度增加

### 应对措施
1. **完整备份**: 迁移前完整数据备份
2. **分阶段测试**: 每个阶段充分测试
3. **回滚机制**: 保持快速回滚能力
4. **文档完善**: 详细的部署和运维文档

## 🎯 成功指标

### 技术指标
- [ ] 前端构建成功率 100%
- [ ] API 响应时间 < 200ms
- [ ] 系统可用性 > 99.9%
- [ ] 数据迁移完整性 100%

### 用户体验指标
- [ ] 页面加载时间 < 3s
- [ ] 功能完整性保持
- [ ] 用户界面一致性
- [ ] 跨平台兼容性

### 项目指标
- [ ] 代码覆盖率 > 80%
- [ ] 文档完整性
- [ ] 部署自动化
- [ ] 监控告警完善

## 📝 开发规范

### Git 提交规范
```
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 分支策略
- `main`: 主分支，稳定版本
- `develop`: 开发分支
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支

### 代码审查
- 所有 PR 需要代码审查
- 自动化测试必须通过
- 文档同步更新

## 📞 联系方式

- **GitHub**: https://github.com/poboll/thus-note
- **Issues**: https://github.com/poboll/thus-note/issues
- **Discussions**: https://github.com/poboll/thus-note/discussions

---

**更新时间**: 2025年1月  
**项目状态**: 积极开发中  
**维护团队**: Thus-Note Team