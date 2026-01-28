# Requirements Document

## Introduction

本需求文档定义了如是记录(Thus-Note)系统的UI美化、全局错误处理、登录方式优化、微信小程序自动记录笔记功能以及功能完整性检查的需求。这些改进旨在提升用户体验、增强系统稳定性、优化登录流程，并扩展微信小程序的自动记录能力。

## Glossary

- **System**: 如是记录(Thus-Note)系统，包括Web前端、Node.js后端和微信小程序
- **Web_Frontend**: Vue 3 + TypeScript构建的Web应用前端
- **Backend_API**: Node.js + Express构建的RESTful API服务
- **WeChat_MiniProgram**: 微信小程序客户端
- **Error_Modal**: 全局错误弹窗组件，用于统一展示API错误信息
- **Email_Login**: 使用邮箱和密码进行身份验证的登录方式
- **Verification_Code_Login**: 使用邮箱/手机号和验证码进行身份验证的登录方式
- **OAuth_Login**: 使用第三方平台(GitHub、Google、微信)进行身份验证的登录方式
- **Webhook_Endpoint**: 接收微信小程序消息的HTTP接口
- **Note**: 系统中的笔记记录，对应数据模型中的Thread
- **Message_Type**: 消息类型，包括文本、图片、语音等
- **Auto_Save**: 自动将接收到的消息保存为笔记的功能

## Requirements

### Requirement 1: 前端UI美化

**User Story:** 作为用户，我希望看到更美观、现代化的界面，以便获得更好的视觉体验和使用感受。

#### Acceptance Criteria

1. WHEN 用户访问任何页面 THEN THE Web_Frontend SHALL 展示统一的现代化设计风格
2. WHEN 用户与界面元素交互 THEN THE Web_Frontend SHALL 提供流畅的动画过渡效果
3. WHEN 用户在不同设备上访问 THEN THE Web_Frontend SHALL 保持一致的视觉体验和响应式布局
4. WHEN 用户切换主题模式 THEN THE Web_Frontend SHALL 在浅色和深色模式下都保持良好的视觉效果
5. THE Web_Frontend SHALL 使用统一的颜色方案、字体和间距规范

### Requirement 2: 全局错误处理

**User Story:** 作为用户，我希望在遇到错误时能看到清晰、友好的错误提示，以便了解发生了什么问题以及如何解决。

#### Acceptance Criteria

1. WHEN 任何API请求失败 THEN THE Error_Modal SHALL 显示包含错误信息的弹窗
2. WHEN 网络连接失败 THEN THE Error_Modal SHALL 显示网络错误提示并建议用户检查网络连接
3. WHEN 业务逻辑错误发生 THEN THE Error_Modal SHALL 显示具体的业务错误信息
4. WHEN 验证错误发生 THEN THE Error_Modal SHALL 显示字段级别的验证错误信息
5. WHEN 用户点击错误弹窗的关闭按钮 THEN THE Error_Modal SHALL 关闭并清除错误状态
6. THE Error_Modal SHALL 根据错误类型使用不同的视觉样式(颜色、图标)
7. THE Error_Modal SHALL 支持显示多语言错误消息

### Requirement 3: 登录方式优化

**User Story:** 作为用户，我希望默认使用邮箱密码登录，以便快速访问我的账户，同时保留其他登录选项。

#### Acceptance Criteria

1. WHEN 用户访问登录页面 THEN THE Web_Frontend SHALL 默认显示邮箱密码登录表单
2. WHEN 用户输入邮箱和密码并提交 THEN THE Backend_API SHALL 验证凭据并返回认证令牌
3. WHEN 用户点击验证码登录选项 THEN THE Web_Frontend SHALL 切换到验证码登录表单
4. WHEN 用户点击第三方登录按钮 THEN THE System SHALL 启动对应的OAuth认证流程
5. THE Web_Frontend SHALL 在登录页面显示邮箱密码、验证码和第三方登录的所有选项
6. WHEN 邮箱密码登录失败 THEN THE Error_Modal SHALL 显示具体的失败原因

### Requirement 4: 微信小程序自动记录笔记

**User Story:** 作为用户，我希望能从微信小程序发送消息到系统并自动保存为笔记，以便随时随地快速记录想法。

#### Acceptance Criteria

1. WHEN 用户从WeChat_MiniProgram发送文本消息 THEN THE Backend_API SHALL 接收消息并创建文本类型的Note
2. WHEN 用户从WeChat_MiniProgram发送图片消息 THEN THE Backend_API SHALL 接收图片并创建包含图片的Note
3. WHEN 用户从WeChat_MiniProgram发送语音消息 THEN THE Backend_API SHALL 接收语音文件并创建包含语音的Note
4. WHEN Backend_API接收到消息 THEN THE System SHALL 自动识别Message_Type并创建对应格式的Note
5. THE Backend_API SHALL 提供Webhook_Endpoint用于接收微信小程序消息
6. WHEN Webhook_Endpoint接收到无效消息格式 THEN THE Backend_API SHALL 返回描述性错误响应
7. WHEN 创建Note成功 THEN THE Backend_API SHALL 返回包含Note ID的成功响应
8. THE Backend_API SHALL 验证Webhook请求的来源以确保安全性

### Requirement 5: 功能完整性检查

**User Story:** 作为开发者，我希望验证所有现有功能正常工作，以便确保系统的稳定性和可靠性。

#### Acceptance Criteria

1. WHEN 执行功能测试 THEN THE System SHALL 验证所有认证端点正常响应
2. WHEN 执行功能测试 THEN THE System SHALL 验证所有笔记CRUD操作正常工作
3. WHEN 执行功能测试 THEN THE System SHALL 验证AI智能笔记功能可用
4. WHEN 执行功能测试 THEN THE System SHALL 验证文件上传和下载功能正常
5. WHEN 执行功能测试 THEN THE System SHALL 验证同步功能正常工作
6. WHEN 执行功能测试 THEN THE System SHALL 验证前后端集成正常
7. THE System SHALL 提供自动化测试脚本用于功能完整性检查
8. WHEN 任何功能测试失败 THEN THE System SHALL 记录详细的错误日志
