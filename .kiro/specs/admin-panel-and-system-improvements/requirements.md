# 需求文档

## 简介

本功能改进包含六个主要模块：服务协议和隐私政策页面美化、头像设置交互优化、存储系统升级（支持S3兼容存储）、微信绑定功能修复、手机号验证码功能完善、以及后台管理配置界面。这些改进旨在提升用户体验、增强系统可配置性和扩展性。

## 术语表

- **Admin_Panel**: 管理员后台面板，用于配置系统各项参数
- **Storage_Service**: 存储服务，负责文件和图片的上传、下载和管理
- **S3_Compatible_Storage**: S3兼容存储，包括AWS S3、阿里云OSS、腾讯云COS等
- **SMS_Service**: 短信服务，负责发送验证码和通知短信
- **WeChat_Binding_Service**: 微信绑定服务，处理微信账号与系统账号的关联
- **Policy_Page**: 政策页面，包括服务协议和隐私政策
- **Avatar_Component**: 头像组件，显示和管理用户头像
- **System_Config**: 系统配置，存储各项系统参数

## 需求

### 需求 1：服务协议和隐私政策页面改进

**用户故事：** 作为用户，我希望看到设计精美、内容完整的服务协议和隐私政策页面，以便我能清楚了解平台的使用条款和隐私保护措施。

#### 验收标准

1. WHEN 用户访问服务协议页面 THEN Policy_Page SHALL 显示美观的页面布局，包含标题、更新日期、目录导航和分章节内容
2. WHEN 用户访问隐私政策页面 THEN Policy_Page SHALL 显示美观的页面布局，包含标题、更新日期、目录导航和分章节内容
3. WHEN 页面内容较长 THEN Policy_Page SHALL 提供平滑滚动和返回顶部功能
4. WHEN 用户在移动端访问 THEN Policy_Page SHALL 自适应显示，保持良好的可读性
5. WHEN 管理员在后台修改政策内容 THEN Policy_Page SHALL 动态加载最新内容

### 需求 2：头像设置交互优化

**用户故事：** 作为用户，我希望头像组件有明确的交互提示，以便我知道可以点击更换头像。

#### 验收标准

1. WHEN 用户鼠标悬停在头像上 THEN Avatar_Component SHALL 显示悬停动画效果（如放大、边框高亮或遮罩层）
2. WHEN 用户鼠标悬停在头像上 THEN Avatar_Component SHALL 显示"点击更换头像"的提示文字或图标
3. WHEN 用户点击头像 THEN Avatar_Component SHALL 触发头像选择/上传流程
4. WHEN 头像处于可编辑状态 THEN Avatar_Component SHALL 显示编辑图标（如相机或铅笔图标）
5. WHEN 用户在移动端长按头像 THEN Avatar_Component SHALL 触发与桌面端悬停相同的交互效果

### 需求 3：存储系统升级

**用户故事：** 作为系统管理员，我希望能够配置第三方S3兼容存储服务，以便将文件存储到云端，提高系统的可扩展性和可靠性。

#### 验收标准

1. WHEN 管理员配置存储类型为"本地存储" THEN Storage_Service SHALL 将文件保存到本地 uploads 目录
2. WHEN 管理员配置存储类型为"S3兼容存储" THEN Storage_Service SHALL 将文件上传到配置的S3兼容存储桶
3. WHEN 上传文件到S3兼容存储 THEN Storage_Service SHALL 支持 AWS S3、阿里云 OSS、腾讯云 COS 等主流服务商
4. WHEN 配置S3存储 THEN Admin_Panel SHALL 提供配置界面，包含 Endpoint、Access Key、Secret Key、Bucket Name、Region 等参数
5. WHEN 文件上传成功 THEN Storage_Service SHALL 返回可访问的文件URL
6. WHEN 存储配置变更 THEN Storage_Service SHALL 无缝切换存储后端，不影响已存储文件的访问
7. IF 存储服务连接失败 THEN Storage_Service SHALL 返回明确的错误信息并记录日志

### 需求 4：微信绑定功能修复

**用户故事：** 作为用户，我希望能够通过微信扫码绑定我的账号，以便使用微信快捷登录。

#### 验收标准

1. WHEN 用户访问 `/api/open-connect` 接口 THEN WeChat_Binding_Service SHALL 返回正确的响应而非404错误
2. WHEN 用户请求获取微信绑定状态 THEN WeChat_Binding_Service SHALL 返回当前账号的微信绑定信息
3. WHEN 用户发起微信绑定请求 THEN WeChat_Binding_Service SHALL 生成微信授权二维码或跳转链接
4. WHEN 用户完成微信授权 THEN WeChat_Binding_Service SHALL 将微信 OpenID 与用户账号关联
5. WHEN 用户已绑定微信 THEN WeChat_Binding_Service SHALL 支持解绑操作
6. IF 微信授权失败 THEN WeChat_Binding_Service SHALL 返回明确的错误信息
7. IF 微信账号已被其他用户绑定 THEN WeChat_Binding_Service SHALL 拒绝绑定并提示用户

### 需求 5：手机号验证码功能

**用户故事：** 作为用户，我希望能够通过手机验证码验证身份，以便安全地登录或绑定手机号。

#### 验收标准

1. WHEN 管理员配置短信服务商 THEN SMS_Service SHALL 支持腾讯云、阿里云、云片等主流短信服务商
2. WHEN 用户请求发送验证码 THEN SMS_Service SHALL 生成6位数字验证码并发送到用户手机
3. WHEN 验证码发送成功 THEN SMS_Service SHALL 返回成功状态和验证码有效期
4. WHEN 用户提交验证码 THEN SMS_Service SHALL 验证验证码的正确性和有效期
5. WHEN 验证码验证成功 THEN SMS_Service SHALL 完成相应的业务操作（登录/绑定）
6. IF 验证码过期 THEN SMS_Service SHALL 拒绝验证并提示用户重新获取
7. IF 验证码错误次数超过限制 THEN SMS_Service SHALL 临时锁定该手机号的验证功能
8. WHEN 配置短信服务 THEN Admin_Panel SHALL 提供配置界面，包含服务商选择、API密钥、签名、模板ID等参数

### 需求 6：后台管理配置界面

**用户故事：** 作为系统管理员，我希望有一个统一的后台管理面板，以便集中配置系统的各项参数。

#### 验收标准

1. WHEN 管理员访问后台面板 THEN Admin_Panel SHALL 显示系统配置概览页面
2. WHEN 管理员配置数据库连接 THEN Admin_Panel SHALL 提供 MongoDB 连接字符串配置界面
3. WHEN 管理员配置基础URL THEN Admin_Panel SHALL 提供 API 基础URL和前端URL配置界面
4. WHEN 管理员配置反向代理 THEN Admin_Panel SHALL 提供代理设置配置界面
5. WHEN 管理员配置短信服务 THEN Admin_Panel SHALL 提供短信服务商配置界面
6. WHEN 管理员配置微信绑定 THEN Admin_Panel SHALL 提供微信公众号 AppID、AppSecret 等配置界面
7. WHEN 管理员编辑服务协议 THEN Admin_Panel SHALL 提供富文本编辑器编辑服务协议内容
8. WHEN 管理员编辑隐私政策 THEN Admin_Panel SHALL 提供富文本编辑器编辑隐私政策内容
9. WHEN 管理员配置存储桶 THEN Admin_Panel SHALL 提供存储类型选择和S3兼容存储配置界面
10. WHEN 配置保存成功 THEN Admin_Panel SHALL 显示成功提示并立即生效
11. IF 配置参数无效 THEN Admin_Panel SHALL 显示验证错误信息
12. WHEN 管理员访问后台 THEN Admin_Panel SHALL 验证管理员权限，拒绝非管理员访问
