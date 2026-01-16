# Thus-Note 文档中心

<div align="center">

  [![VitePress](https://img.shields.io/badge/VitePress-1.0-646cff)](https://vitepress.dev/)
  [![Vue](https://img.shields.io/badge/Vue-3.4-brightgreen)](https://vuejs.org/)
  [![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](../LICENSE)

</div>

## 📋 概述

Thus-Note 文档中心是基于 VitePress 构建的静态站点，为 Thus-Note 项目提供完整的使用文档、开发指南和 API 参考。

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
cd thus-docs

# 安装依赖
pnpm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.template .env

# 编辑 .env 文件
nano .env
```

### 启动开发服务器

```bash
# 启动开发服务器
pnpm docs:dev

# 文档站点将在 http://localhost:5174 启动
```

### 构建生产版本

```bash
# 构建静态站点
pnpm docs:build

# 预览构建结果
pnpm docs:preview
```

## 📂 项目结构

```
thus-docs/
├── docs/                       # 文档内容
│   ├── index.md               # 首页
│   ├── guide/                # 使用指南
│   │   ├── what-is-liubai.md      # 什么是如是
│   │   ├── three-assistants.md    # 三重助手
│   │   ├── intelligent-pocket.md  # 智能口袋
│   │   ├── markdown-support.md    # Markdown 支持
│   │   ├── offline.md            # 离线模式
│   │   ├── privacy.md            # 隐私保护
│   │   └── connect/              # 集成指南
│   │       ├── index.md          # 集成概览
│   │       ├── dingtalk.md       # 钉钉集成
│   │       ├── vika.md           # 维格表集成
│   │       └── wps.md            # WPS 集成
│   ├── article/              # 文章
│   │   ├── 2024/             # 2024 年文章
│   │   │   ├── how-to-use-multi-ai-on-wechat.md
│   │   │   └── supercharge-yourself.md
│   │   └── 2025/             # 2025 年文章
│   │       ├── devbox-voice-input.md
│   │       ├── labour-day.md
│   │       ├── system-two.md
│   │       └── weixin-task.md
│   └── public/               # 静态资源
│       ├── logo_512x512_v2.png
│       └── liu-assets/      # 资源文件
│           ├── devices_dark_theme.svg
│           ├── devices_light_theme.svg
│           ├── extension_dark_theme.svg
│           ├── extension_light_theme.svg
│           ├── hero-image.png
│           ├── open_source_dark_theme.svg
│           ├── open_source_light_theme.svg
│           ├── person_celebrate_dark_theme.svg
│           ├── person_celebrate_light_theme.svg
│           ├── polyline_dark_theme.svg
│           ├── polyline_light_theme.svg
│           ├── wifi_off_dark_theme.svg
│           └── wifi_off_light_theme.svg
├── .vitepress/              # VitePress 配置
│   ├── theme/                # 自定义主题
│   │   ├── components/       # 组件
│   │   ├── styles/           # 样式
│   │   └── index.ts          # 主题入口
│   ├── config.ts             # 站点配置
│   └── cache/                # 缓存
├── .env.template            # 环境变量模板
├── .gitignore               # Git 忽略文件
├── package.json             # 包配置
└── README.md                # 文档说明
```

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| VitePress | 1.x | 静态站点生成器 |
| Vue | 3.4 | 前端框架 |
| TypeScript | 5.0 | 类型安全 |
| pnpm | 8.x | 包管理器 |

## 📝 文档结构

### 使用指南 (guide/)

用户使用指南，帮助用户快速上手和深入了解 Thus-Note 的各项功能。

- **什么是如是**: 介绍 Thus-Note 的核心理念和设计思想
- **三重助手**: 介绍写作助手、分析助手、绘图助手的功能
- **智能口袋**: 介绍智能口袋功能的使用方法
- **Markdown 支持**: 详细说明 Markdown 语法的支持情况
- **离线模式**: 介绍 PWA 离线功能的使用
- **隐私保护**: 说明数据隐私保护机制
- **集成指南**: 介绍如何与第三方平台集成

### 文章 (article/)

技术文章和博客，分享 Thus-Note 的开发经验、使用技巧和最新动态。

- **2024 年文章**: 2024 年发布的技术文章
- **2025 年文章**: 2025 年发布的技术文章

### 静态资源 (public/)

文档站点使用的图片、图标等静态资源。

## 🎨 自定义主题

### 主题配置

VitePress 主题配置在 `.vitepress/config.ts` 中：

```typescript
export default defineConfig({
  title: 'Thus-Note 文档',
  description: '如是记录，真实自我',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '使用指南', link: '/guide/what-is-liubai' },
      { text: '文章', link: '/article/2024/how-to-use-multi-ai-on-wechat' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '使用指南',
          items: [
            { text: '什么是如是', link: '/guide/what-is-liubai' },
            { text: '三重助手', link: '/guide/three-assistants' },
            { text: '智能口袋', link: '/guide/intelligent-pocket' }
          ]
        }
      ]
    }
  }
})
```

### 自定义组件

自定义组件位于 `.vitepress/theme/components/` 目录。

### 自定义样式

自定义样式位于 `.vitepress/theme/styles/` 目录。

## 📝 编写文档

### Markdown 语法

VitePress 支持 Markdown 扩展语法：

```markdown
# 标题

## 二级标题

### 三级标题

**粗体**
*斜体*
`代码`

[链接](https://example.com)

![图片](./image.png)

> 引用

- 列表项 1
- 列表项 2

1. 有序列表项 1
2. 有序列表项 2

```javascript
// 代码块
console.log('Hello, World!');
```

| 表头 1 | 表头 2 |
|--------|--------|
| 单元格 1 | 单元格 2 |

::: tip 提示
这是一个提示
:::

::: warning 警告
这是一个警告
:::

::: danger 危险
这是一个危险提示
:::
```

### 添加新文档

1. 在 `docs/` 目录下创建新的 `.md` 文件
2. 使用 Markdown 语法编写内容
3. 在 `.vitepress/config.ts` 中添加导航和侧边栏配置

### 添加图片

1. 将图片文件放入 `docs/public/` 或相应的子目录
2. 在文档中使用 Markdown 语法引用图片：

```markdown
![图片描述](./public/image.png)
```

## 🚢 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Netlify 部署

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

### GitHub Pages 部署

```bash
# 构建站点
pnpm docs:build

# 将 .vitepress/dist 目录推送到 GitHub Pages
```

### 自定义服务器部署

```bash
# 构建站点
pnpm docs:build

# 将 .vitepress/dist 目录部署到静态服务器
```

## 🔍 SEO 优化

### Meta 标签

在 `.vitepress/config.ts` 中配置 Meta 标签：

```typescript
export default defineConfig({
  head: [
    ['meta', { name: 'description', content: 'Thus-Note 文档中心' }],
    ['meta', { name: 'keywords', content: '笔记, 日程, 待办, AI' }]
  ]
})
```

### Sitemap

VitePress 自动生成 Sitemap，位于 `/sitemap.xml`。

## 🐛 故障排除

### 依赖安装失败

```bash
# 清除缓存并重新安装
rm -rf node_modules .vitepress/cache
pnpm install
```

### 构建失败

```bash
# 清除缓存并重新构建
rm -rf .vitepress/cache
pnpm docs:build
```

### 开发服务器启动失败

```bash
# 检查端口是否被占用
lsof -i :5174

# 修改 .vitepress/config.ts 中的端口
```

## 📚 相关资源

- [VitePress 官方文档](https://vitepress.dev/)
- [Vue 官方文档](https://vuejs.org/)
- [Markdown 语法指南](https://www.markdownguide.org/)

## 📝 贡献指南

我们欢迎您为文档中心做出贡献！

### 贡献方式

1. Fork 本项目
2. 创建特性分支 (`git checkout -b docs/amazing-feature`)
3. 添加或修改文档
4. 提交更改 (`git commit -m 'docs: add amazing documentation'`)
5. 推送到分支 (`git push origin docs/amazing-feature`)
6. 开启 Pull Request

### 文档规范

- 使用清晰简洁的语言
- 提供完整的示例
- 添加必要的截图和图表
- 保持文档结构清晰

## 🔄 版本管理

文档版本与 Thus-Note 主项目版本保持同步。

### 发布新版本

1. 更新文档内容
2. 更新版本号
3. 构建并部署
4. 发布更新日志

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
