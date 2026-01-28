# Implementation Plan: UI Improvements and WeChat Notes

## Overview

本实现计划将UI美化、全局错误处理、登录方式优化、微信小程序自动记录笔记功能以及功能完整性检查分解为可执行的编码任务。任务按照依赖关系组织，确保每个步骤都建立在前一步的基础上。

## Tasks

- [x] 1. 创建全局错误处理基础设施
  - [x] 1.1 创建错误类型定义和错误代码映射
    - 在`thus-frontends/thus-web/src/types/`创建`types-error.ts`
    - 定义`ErrorType`、`ErrorCode`、`ErrorState`接口
    - 创建`ERROR_CODES`映射对象，包含所有错误代码及其类型和消息
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 1.2 实现错误处理Composable
    - 在`thus-frontends/thus-web/src/hooks/`创建`useErrorHandler.ts`
    - 实现`showError`、`clearError`函数
    - 使用`ref`管理`errorState`
    - 提供错误代码到错误类型的映射逻辑
    - _Requirements: 2.1, 2.5_

  - [ ]* 1.3 编写错误处理Composable的属性测试
    - **Property 1: API错误统一处理**
    - **Validates: Requirements 2.1, 2.3, 2.4**

  - [ ]* 1.4 编写错误处理Composable的单元测试
    - 测试`showError`正确设置错误状态
    - 测试`clearError`清除错误状态
    - 测试错误代码映射逻辑
    - _Requirements: 2.1, 2.5_

- [x] 2. 创建全局错误弹窗组件
  - [x] 2.1 实现ErrorModal组件基础结构
    - 在`thus-frontends/thus-web/src/components/common/`创建`ErrorModal.vue`
    - 定义props: `visible`, `errorType`, `errorCode`, `errorMessage`, `details`
    - 定义emits: `close`, `retry`
    - 实现基础模板结构（弹窗容器、标题、消息、按钮）
    - _Requirements: 2.1_

  - [x] 2.2 实现ErrorModal的样式和动画
    - 根据`errorType`应用不同的颜色和图标
    - 实现淡入淡出动画（200-300ms过渡）
    - 实现响应式布局（移动端和桌面端）
    - 使用Vue Teleport挂载到body
    - _Requirements: 2.1_

  - [x] 2.3 集成多语言支持
    - 在`thus-frontends/thus-web/src/locales/messages/`添加错误消息翻译
    - 使用`useI18n`在ErrorModal中获取翻译
    - 支持中文和英文错误消息
    - _Requirements: 2.7_

  - [ ]* 2.4 编写ErrorModal组件的属性测试
    - **Property 2: 错误弹窗关闭清除状态**
    - **Property 3: 多语言错误消息支持**
    - **Validates: Requirements 2.5, 2.7**

  - [ ]* 2.5 编写ErrorModal组件的单元测试
    - 测试不同错误类型显示不同样式
    - 测试关闭按钮触发close事件
    - 测试重试按钮触发retry事件
    - 测试网络错误显示特定提示
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 3. 集成错误处理到API请求层
  - [x] 3.1 更新thus-req.ts集成错误处理
    - 导入`useErrorHandler`
    - 在所有错误捕获点调用`showError`
    - 确保所有错误代码都被正确映射
    - 保持现有的错误返回逻辑
    - _Requirements: 2.1_

  - [x] 3.2 在App.vue中添加ErrorModal组件
    - 导入ErrorModal组件
    - 使用`useErrorHandler`获取`errorState`
    - 绑定ErrorModal的props到`errorState`
    - 处理close和retry事件
    - _Requirements: 2.1, 2.5_

  - [ ]* 3.3 编写API错误处理的集成测试
    - 测试API请求失败触发ErrorModal显示
    - 测试不同错误类型正确显示
    - 测试关闭ErrorModal清除错误状态
    - _Requirements: 2.1, 2.5_

- [ ] 4. Checkpoint - 验证错误处理功能
  - 确保所有测试通过，询问用户是否有问题

- [x] 5. 优化登录页面默认行为
  - [x] 5.1 更新登录页面状态管理
    - 在`thus-frontends/thus-web/src/pages/level1/login-page/lp-main/`找到状态定义
    - 将`emailLoginMethod`默认值改为`'password'`
    - 确保`current`默认为`1`，`btnOne`默认为`'email'`
    - _Requirements: 3.1_

  - [x] 5.2 更新登录页面UI显示逻辑
    - 确保默认显示邮箱密码登录表单
    - 添加切换到验证码登录的按钮
    - 保持第三方登录选项在第二个tab
    - 更新相关的条件渲染逻辑
    - _Requirements: 3.1, 3.3, 3.5_

  - [x] 5.3 更新登录页面多语言文本
    - 在`thus-frontends/thus-web/src/locales/messages/`更新登录相关翻译
    - 添加"使用密码登录"和"使用验证码登录"的切换文本
    - 确保所有登录选项都有清晰的标签
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ]* 5.4 编写登录页面的单元测试
    - 测试页面默认显示邮箱密码表单
    - 测试点击切换按钮显示验证码表单
    - 测试页面显示所有登录选项
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ]* 5.5 编写登录验证的属性测试
    - **Property 4: 邮箱密码登录验证**
    - **Property 5: 第三方登录OAuth启动**
    - **Validates: Requirements 3.2, 3.4**

- [x] 6. 实现微信Webhook端点
  - [x] 6.1 创建微信Webhook路由文件
    - 在`thus-backends/thus-server/src/routes/`创建`wechat.ts`
    - 定义`POST /api/wechat/webhook`路由
    - 导入必要的模型（User, Thread, Content）
    - 导出router
    - _Requirements: 4.5_

  - [x] 6.2 实现Webhook签名验证中间件
    - 创建`verifyWeChatSignature`函数
    - 验证`X-WeChat-Signature`、`X-WeChat-Timestamp`、`X-WeChat-Nonce`头
    - 使用SHA1哈希验证签名
    - 验证时间戳在5分钟内
    - 无效签名返回401错误
    - _Requirements: 4.8_

  - [x] 6.3 实现消息类型识别和笔记创建逻辑
    - 解析请求body获取`messageType`、`content`、`mediaId`、`mediaUrl`
    - 根据`messageType`创建对应类型的Thread
    - 创建Content记录关联到Thread
    - 处理文本、图片、语音三种消息类型
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.4 实现Webhook响应和错误处理
    - 成功创建返回`{ code: "0000", data: { threadId, contentId } }`
    - 无效消息格式返回400错误和描述性消息
    - 用户不存在返回404错误
    - 内部错误返回500错误
    - _Requirements: 4.6, 4.7_

  - [x] 6.5 在主应用中注册Webhook路由
    - 在`thus-backends/thus-server/src/index.ts`导入wechat路由
    - 注册路由到Express应用
    - 添加速率限制中间件（100请求/分钟/用户）
    - _Requirements: 4.5_

  - [ ]* 6.6 编写Webhook端点的属性测试
    - **Property 6: 微信消息自动创建笔记**
    - **Property 7: 无效消息格式错误处理**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.6, 4.7**

  - [ ]* 6.7 编写Webhook端点的单元测试
    - 测试签名验证拒绝无效请求
    - 测试文本消息创建文本笔记
    - 测试图片消息创建图片笔记
    - 测试语音消息创建语音笔记
    - 测试无效格式返回错误
    - 测试成功响应包含threadId和contentId
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7, 4.8_

- [ ] 7. Checkpoint - 验证Webhook功能
  - 确保所有测试通过，询问用户是否有问题

- [x] 8. UI美化和样式优化
  - [x] 8.1 更新全局CSS变量和主题
    - 在`thus-frontends/thus-web/src/styles/theme.css`更新颜色变量
    - 确保浅色和深色主题都有良好的对比度
    - 统一间距和字体大小变量
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 8.2 优化组件过渡动画
    - 在`thus-frontends/thus-web/src/styles/custom-style.css`添加通用过渡类
    - 使用`cubic-bezier(0.4, 0, 0.2, 1)`缓动函数
    - 设置200-300ms过渡时间
    - 应用到主要交互元素
    - _Requirements: 1.2_

  - [x] 8.3 优化响应式布局
    - 检查关键页面在不同屏幕尺寸下的显示
    - 调整移动端（<768px）的布局和间距
    - 确保平板（768-1024px）和桌面（>1024px）的良好体验
    - _Requirements: 1.3_

  - [ ]* 8.4 进行视觉回归测试
    - 使用Playwright截图测试关键页面
    - 对比浅色和深色主题
    - 验证不同屏幕尺寸的布局
    - _Requirements: 1.1, 1.3, 1.4_

- [ ] 9. 功能完整性测试
  - [ ] 9.1 创建集成测试脚本
    - 在`thus-backends/thus-server/tests/integration/`创建测试文件
    - 测试所有认证端点（邮箱、验证码、OAuth）
    - 测试笔记CRUD操作
    - 测试文件上传下载
    - 测试同步功能
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [ ] 9.2 创建AI功能测试
    - 测试AI智能笔记功能可用性
    - 验证AI API端点正常响应
    - 测试AI生成内容的基本质量
    - _Requirements: 5.3_

  - [ ] 9.3 创建前后端集成测试
    - 使用Playwright测试完整的用户流程
    - 测试登录→创建笔记→查看笔记→登出
    - 测试错误处理的端到端流程
    - 测试微信Webhook的端到端流程
    - _Requirements: 5.6_

  - [ ] 9.4 创建自动化测试运行脚本
    - 创建`run_all_tests.sh`脚本
    - 按顺序运行单元测试、属性测试、集成测试
    - 收集测试覆盖率报告
    - 失败时记录详细错误日志
    - _Requirements: 5.7, 5.8_

  - [ ]* 9.5 运行完整的功能测试套件
    - 执行所有单元测试
    - 执行所有属性测试
    - 执行所有集成测试
    - 生成测试报告
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 10. Final Checkpoint - 完整性验证
  - 确保所有测试通过，询问用户是否有问题

- [ ] 11. 文档和部署准备
  - [ ] 11.1 更新API文档
    - 在后端添加Webhook端点的API文档
    - 记录请求格式、响应格式、错误代码
    - 添加签名验证的说明
    - _Requirements: 4.5_

  - [ ] 11.2 更新环境变量配置文档
    - 在`.env.example`添加微信相关配置
    - 记录所有新增的环境变量
    - 提供配置示例和说明
    - _Requirements: 4.5_

  - [ ] 11.3 创建部署检查清单
    - 列出所有需要配置的环境变量
    - 列出需要的数据库索引
    - 列出需要的第三方服务配置
    - 提供部署后的验证步骤
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

## Notes

- 标记`*`的任务为可选测试任务，可以跳过以加快MVP开发
- 每个任务都标注了对应的需求编号，便于追溯
- Checkpoint任务确保在关键节点进行验证
- 属性测试使用fast-check库，每个测试运行100次迭代
- 集成测试使用Playwright和Supertest
- 所有测试都应该标记对应的设计属性编号