# Thus-Note 前端应用

<div align="center">

  [![Vue Version](https://img.shields.io/badge/Vue-3.4-brightgreen)](https://vuejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646cff)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../LICENSE)

</div>

## 📋 概述

Thus-Note 前端应用包含多个独立的前端项目，为 Thus-Note 用户提供跨平台的使用体验。

### 项目列表

| 项目 | 描述 | 状态 | 技术栈 |
|------|------|------|--------|
| [thus-web](./thus-web/) | Web 应用（SPA + PWA） | ✅ 活跃 | Vue 3 + TypeScript + Vite |
| [thus-vscode-extension](./thus-vscode-extension/) | VS Code 插件 | ✅ 活跃 | TypeScript + VS Code API |
| [thus-weixin/](./thus-weixin/) | 微信小程序 | ✅ 活跃 | TypeScript + Skyline |

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- VS Code（用于开发 thus-vscode-extension）
- 微信开发者工具（用于开发 thus-weixin）

### 安装依赖

```bash
# 安装所有前端项目依赖
cd thus-frontends

# 安装 thus-web
cd thus-web
pnpm install

# 安装 thus-vscode-extension
cd ../thus-vscode-extension
pnpm install

# 安装 thus-weixin
cd ../thus-weixin
pnpm install
```

### 配置环境变量

每个项目都有独立的环境变量配置文件：

```bash
# thus-web
cd thus-web
cp .env.template .env
# 编辑 .env 文件

# thus-vscode-extension
cd ../thus-vscode-extension
cp .env.template .env
# 编辑 .env 文件

# thus-weixin
cd ../thus-weixin
cp .env.template .env
# 编辑 .env 文件
```

### 启动开发环境

#### thus-web

```bash
cd thus-frontends/thus-web

# 启动开发服务器
pnpm dev

# 应用将在 http://localhost:5173 启动
```

#### thus-vscode-extension

```bash
cd thus-frontends/thus-vscode-extension

# 启动开发服务器
pnpm dev

# 在 VS Code 中按 F5 启动调试
```

#### thus-weixin

```bash
cd thus-frontends/thus-weixin

# 启动开发服务器
pnpm dev

# 在微信开发者工具中打开项目
```

### 构建生产版本

```bash
# 构建 thus-web
cd thus-frontends/thus-web
pnpm build

# 构建 thus-vscode-extension
cd thus-frontends/thus-vscode-extension
pnpm build

# 构建 thus-weixin
cd thus-frontends/thus-weixin
pnpm build
```

## 📂 项目结构

```
thus-frontends/
├── thus-web/                    # Web 应用
│   ├── src/
│   │   ├── components/          # 组件
│   │   ├── views/               # 页面
│   │   ├── stores/              # 状态管理
│   │   ├── utils/               # 工具函数
│   │   ├── api/                 # API 接口
│   │   ├── composables/         # 组合式函数
│   │   ├── types/               # TypeScript 类型
│   │   └── main.ts              # 入口文件
│   ├── public/                  # 静态资源
│   ├── .notes/                  # 开发笔记
│   ├── .vscode/                 # VS Code 配置
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── biome.json
│   ├── netlify.toml
│   ├── vercel.json
│   └── README.md
├── thus-vscode-extension/        # VS Code 插件
│   ├── src/
│   │   ├── extension.ts         # 插件入口
│   │   ├── commands/            # 命令
│   │   ├── views/               # 视图
│   │   ├── services/            # 服务
│   │   └── utils/               # 工具函数
│   ├── images/                  # 图标资源
│   ├── .notes/                  # 开发笔记
│   ├── .vscode/                 # VS Code 配置
│   ├── .vscode-test.mjs         # 测试配置
│   ├── package.json
│   ├── tsconfig.json
│   ├── esbuild.js
│   ├── eslint.config.mjs
│   ├── CHANGELOG.md
│   └── README.md
└── thus-weixin/                  # 微信小程序
    ├── miniprogram/             # 小程序源码
    │   ├── pages/               # 页面
    │   ├── components/          # 组件
    │   ├── utils/               # 工具函数
    │   ├── services/            # 服务
    │   └── app.ts               # 应用入口
    ├── images/                  # 图片资源
    ├── .notes/                  # 开发笔记
    ├── .vscode/                 # VS Code 配置
    ├── package.json
    ├── tsconfig.json
    ├── project.config.json      # 微信小程序配置
    ├── project.private.config.json  # 私有配置
    └── README.md
```

## 🔧 技术栈

### thus-web

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4 | 渐进式 JavaScript 框架 |
| TypeScript | 5.0 | 类型安全 |
| Vite | 5.0 | 构建工具 |
| VueUse | 10.x | Vue 组合式工具集 |
| Dexie.js | 3.x | IndexedDB 封装 |
| TipTap | 2.x | 富文本编辑器 |
| Biome | - | 代码格式化和检查 |
| PWA | - | 渐进式 Web 应用 |

### thus-vscode-extension

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.0 | 开发语言 |
| VS Code API | - | VS Code 扩展 API |
| esbuild | - | 快速打包工具 |
| Web Extension | - | Web Extension API |

### thus-weixin

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.0 | 开发语言 |
| Skyline | - | 小程序渲染引擎 |
| Chat Tool API | - | 聊天工具 API |

## 🎨 核心功能

### thus-web

#### 用户界面
- 响应式设计（300px ~ 1920px）
- 浅色/深色主题切换
- 中英文国际化
- 流畅的动画和过渡效果

#### 功能模块
- **笔记管理**: 创建、编辑、删除笔记
- **任务管理**: 待办事项、任务列表
- **日程管理**: 日历视图、事件提醒
- **看板管理**: 看板视图、拖拽排序
- **文件管理**: 文件上传、下载、预览
- **AI 助手**: 智能对话、内容生成
- **同步功能**: 多设备数据同步
- **离线模式**: PWA 离线支持

#### 数据存储
- IndexedDB 本地存储
- 云端数据同步
- 离线数据缓存

### thus-vscode-extension

#### 编辑器集成
- 在编辑器中直接记录笔记
- 代码片段快速记录
- 侧边栏视图
- 命令面板集成

#### 功能特性
- 与 thus-web 数据同步
- 快捷键支持
- 主题适配
- 多语言支持

### thus-weixin

#### 小程序特性
- 原生小程序体验
- 微信登录
- 消息推送
- 分享功能

#### 核心功能
- 快速记录
- 待办事项
- 日程提醒
- 数据同步

## 🧪 测试

### thus-web

```bash
cd thus-frontends/thus-web

# 运行单元测试
pnpm test

# 运行端到端测试
pnpm test:e2e
```

### thus-vscode-extension

```bash
cd thus-frontends/thus-vscode-extension

# 运行测试
pnpm test
```

### thus-weixin

```bash
cd thus-frontends/thus-weixin

# 运行测试
pnpm test
```

## 🚢 部署

### thus-web

#### Vercel 部署

```bash
cd thus-frontends/thus-web

# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

#### Netlify 部署

```bash
cd thus-frontends/thus-web

# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

#### 手动部署

```bash
cd thus-frontends/thus-web

# 构建项目
pnpm build

# 部署 dist 目录到静态服务器
```

### thus-vscode-extension

#### 发布到 VS Code Marketplace

```bash
cd thus-frontends/thus-vscode-extension

# 安装 vsce
npm i -g @vscode/vsce

# 打包
vsce package

# 发布
vsce publish
```

### thus-weixin

#### 发布到微信小程序平台

```bash
cd thus-frontends/thus-weixin

# 构建项目
pnpm build

# 使用微信开发者工具上传代码
```

## 🔐 安全

### 环境变量

所有敏感信息都通过环境变量配置，不要将 `.env` 文件提交到版本控制。

### 数据保护

- HTTPS 传输加密
- JWT 令牌认证
- XSS 防护
- CSRF 防护

## 🐛 故障排除

### thus-web

#### 依赖安装失败

```bash
# 清除缓存并重新安装
rm -rf node_modules .vite dist
pnpm install
```

#### 构建失败

```bash
# 清除缓存并重新构建
rm -rf .vite dist
pnpm build
```

#### 开发服务器启动失败

```bash
# 检查端口是否被占用
lsof -i :5173

# 修改 vite.config.ts 中的端口
```

### thus-vscode-extension

#### 插件无法加载

- 检查 VS Code 版本是否兼容
- 检查依赖是否正确安装
- 查看 VS Code 输出面板的错误信息

### thus-weixin

#### 小程序无法预览

- 检查微信开发者工具版本
- 检查 project.config.json 配置
- 查看控制台错误信息

## 📚 相关文档

- [thus-web 详细文档](./thus-web/README.md)
- [thus-vscode-extension 详细文档](./thus-vscode-extension/README.md)
- [thus-weixin 详细文档](./thus-weixin/README.md)

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

### 代码风格

- 使用 Biome 进行代码格式化
- 遵循 TypeScript 最佳实践
- 使用 ESLint 进行代码检查

### 组件开发

- 使用 Vue 3 Composition API
- 组件命名使用 PascalCase
- Props 定义使用 TypeScript 类型
- 事件命名使用 kebab-case

## 🎯 性能优化

### thus-web

- 代码分割和懒加载
- 图片压缩和优化
- 使用 Web Workers 处理复杂计算
- 优化 IndexedDB 查询
- 使用虚拟滚动处理长列表

### thus-vscode-extension

- 按需加载扩展功能
- 优化 API 调用
- 使用缓存减少重复请求

### thus-weixin

- 优化小程序包大小
- 使用分包加载
- 优化图片资源

## 🔄 版本管理

### thus-web

- 遵循语义化版本规范
- 使用 CHANGELOG.md 记录变更
- 定期发布稳定版本

### thus-vscode-extension

- 使用 package.json 中的 version 字段
- 发布时自动生成 CHANGELOG
- 遵循 VS Code 扩展版本规范

### thus-weixin

- 使用 package.json 中的 version 字段
- 发布时更新版本号
- 遵循微信小程序版本规范

## 📞 联系方式

- **GitHub Issues**: https://github.com/poboll/thus-note/issues
- **GitHub Discussions**: https://github.com/poboll/thus-note/discussions
- **Email**: support@thus-note.example.com

## 📄 许可证

本项目基于 [AGPL-3.0](../LICENSE) 开源协议。

---

<div align="center">
  <p>Made with ❤️ by Thus-Note Team</p>
  <p>© 2024 Thus-Note. All rights reserved.</p>
</div>
