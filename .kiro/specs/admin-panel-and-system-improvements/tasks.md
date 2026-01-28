# 实现计划：管理员后台面板和系统改进

## 概述

本实现计划将设计文档转化为可执行的编码任务。采用增量开发方式，每个任务都建立在前一个任务的基础上，确保代码始终处于可运行状态。

## 任务列表

- [x] 1. 创建系统配置基础设施
  - [x] 1.1 创建 SystemConfig 数据模型
    - 在 `thus-backends/thus-server/src/models/` 创建 `SystemConfig.ts`
    - 定义配置 Schema，包含存储、短信、微信、政策等配置字段
    - 实现敏感字段加密存储
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.9_
  - [x] 1.2 创建配置服务
    - 在 `thus-backends/thus-server/src/services/` 创建 `configService.ts`
    - 实现配置读取、更新、验证功能
    - 实现配置缓存机制
    - _Requirements: 6.10, 6.11_
  - [x] 1.3 编写配置服务属性测试
    - **Property 14: 配置保存生效属性**
    - **Property 15: 配置验证属性**
    - **Validates: Requirements 6.10, 6.11**

- [x] 2. 实现存储服务升级
  - [x] 2.1 创建存储服务接口和工厂
    - 在 `thus-backends/thus-server/src/services/` 创建 `storageService.ts`
    - 定义 IStorageService 接口
    - 实现 StorageServiceFactory 工厂类
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 2.2 实现本地存储服务
    - 实现 LocalStorageService 类
    - 支持文件上传、下载、删除、URL生成
    - _Requirements: 3.1_
  - [x] 2.3 实现 S3 兼容存储服务
    - 实现 S3StorageService 类
    - 支持 AWS S3、阿里云 OSS、腾讯云 COS
    - 使用 @aws-sdk/client-s3 库
    - _Requirements: 3.2, 3.3_
  - [x] 2.4 更新文件上传路由
    - 修改 `thus-backends/thus-server/src/routes/files.ts`
    - 集成新的存储服务
    - 根据配置自动选择存储后端
    - _Requirements: 3.5, 3.6_
  - [x] 2.5 编写存储服务属性测试
    - **Property 3: 存储服务上传属性**
    - **Property 4: 存储服务多服务商支持属性**
    - **Property 5: 存储服务错误处理属性**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.5, 3.7**

- [x] 3. 检查点 - 确保存储服务测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 4. 实现短信服务升级
  - [x] 4.1 重构短信服务接口
    - 修改 `thus-backends/thus-server/src/services/smsService.ts`
    - 定义 ISMSService 接口
    - 实现 SMSServiceFactory 工厂类
    - _Requirements: 5.1_
  - [x] 4.2 实现多服务商支持
    - 实现 TencentSMSService（腾讯云）
    - 实现 AliyunSMSService（阿里云）
    - 实现 YunpianSMSService（云片）
    - _Requirements: 5.1_
  - [x] 4.3 创建验证码管理服务
    - 创建 VerificationCode 数据模型
    - 实现验证码生成、存储、验证、过期处理
    - 实现错误次数限制和手机号锁定
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 4.4 编写短信服务属性测试
    - **Property 10: 短信服务多服务商支持属性**
    - **Property 11: 验证码生成属性**
    - **Property 12: 验证码验证属性**
    - **Property 13: 验证码失败处理属性**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

- [x] 5. 实现微信绑定功能修复
  - [x] 5.1 创建微信服务
    - 在 `thus-backends/thus-server/src/services/` 创建 `wechatService.ts`
    - 实现 OAuth URL 生成
    - 实现 access_token 获取
    - 实现用户信息获取
    - _Requirements: 4.3_
  - [x] 5.2 创建 open-connect 路由
    - 在 `thus-backends/thus-server/src/routes/` 创建 `openConnect.ts`
    - 实现 GET /api/open-connect 获取绑定状态
    - 实现 POST /api/open-connect 绑定/解绑操作
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  - [x] 5.3 扩展用户模型
    - 修改 `thus-backends/thus-server/src/models/User.ts`
    - 添加 wechatBinding 字段
    - _Requirements: 4.4_
  - [x] 5.4 注册路由到主应用
    - 修改 `thus-backends/thus-server/src/index.ts`
    - 注册 open-connect 路由
    - _Requirements: 4.1_
  - [x] 5.5 编写微信服务属性测试
    - **Property 6: 微信绑定状态查询属性**
    - **Property 7: 微信授权URL生成属性**
    - **Property 8: 微信绑定数据关联属性**
    - **Property 9: 微信绑定错误处理属性**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7**

- [x] 6. 检查点 - 确保后端服务测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 7. 实现管理员后台 API
  - [x] 7.1 创建管理员认证中间件
    - 在 `thus-backends/thus-server/src/middleware/` 创建 `adminAuth.ts`
    - 实现管理员权限验证
    - _Requirements: 6.12_
  - [x] 7.2 创建管理员配置路由
    - 在 `thus-backends/thus-server/src/routes/` 创建 `admin.ts`
    - 实现 GET /api/admin/config 获取配置
    - 实现 POST /api/admin/config 更新配置
    - 实现 POST /api/admin/config/test 测试配置连接
    - _Requirements: 6.1, 6.10, 6.11_
  - [x] 7.3 实现政策内容管理 API
    - 实现 PUT /api/admin/policies/terms 更新服务协议
    - 实现 PUT /api/admin/policies/privacy 更新隐私政策
    - _Requirements: 6.7, 6.8_
  - [x] 7.4 编写管理员 API 属性测试
    - **Property 16: 管理员权限验证属性**
    - **Validates: Requirements 6.12**

- [x] 8. 更新政策页面后端
  - [x] 8.1 修改政策路由
    - 修改 `thus-backends/thus-server/src/routes/policies.ts`
    - 从数据库读取政策内容而非硬编码
    - _Requirements: 1.5_

- [x] 9. 实现前端政策页面改进
  - [x] 9.1 创建政策页面组件
    - 修改 `thus-frontends/thus-web/src/pages/level1/privacy/privacy.vue`
    - 修改 `thus-frontends/thus-web/src/pages/level1/terms/terms.vue`
    - 实现美观的页面布局
    - 添加目录导航和分章节显示
    - _Requirements: 1.1, 1.2_
  - [x] 9.2 添加页面交互功能
    - 实现平滑滚动
    - 添加返回顶部按钮
    - 实现响应式布局
    - _Requirements: 1.3, 1.4_
  - [x] 9.3 编写政策页面属性测试
    - **Property 1: 政策页面内容渲染属性**
    - **Validates: Requirements 1.1, 1.2, 1.5**

- [x] 10. 实现头像组件交互优化
  - [x] 10.1 增强头像组件
    - 修改 `thus-frontends/thus-web/src/components/common/liu-avatar/liu-avatar.vue`
    - 添加悬停动画效果
    - 添加编辑图标和提示文字
    - 实现点击触发上传流程
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 10.2 添加移动端支持
    - 实现长按触发交互
    - _Requirements: 2.5_
  - [x] 10.3 编写头像组件属性测试
    - **Property 2: 头像组件可编辑状态属性**
    - **Validates: Requirements 2.4**

- [x] 11. 检查点 - 确保前端组件测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [x] 12. 实现管理员后台前端面板
  - [x] 12.1 创建管理员面板页面结构
    - 在 `thus-frontends/thus-web/src/pages/` 创建 `admin-panel/` 目录
    - 创建 `admin-panel.vue` 主页面
    - 创建侧边导航组件
    - _Requirements: 6.1_
  - [x] 12.2 实现存储配置界面
    - 创建 `StorageConfig.vue` 组件
    - 支持本地存储和 S3 配置切换
    - 实现配置表单验证
    - _Requirements: 3.4, 6.9_
  - [x] 12.3 实现短信配置界面
    - 创建 `SMSConfig.vue` 组件
    - 支持多服务商选择
    - 实现配置表单验证
    - _Requirements: 5.8, 6.5_
  - [x] 12.4 实现微信配置界面
    - 创建 `WeChatConfig.vue` 组件
    - 配置公众号和小程序参数
    - _Requirements: 6.6_
  - [x] 12.5 实现政策编辑界面
    - 创建 `PolicyEditor.vue` 组件
    - 集成富文本编辑器
    - _Requirements: 6.7, 6.8_
  - [x] 12.6 实现基础配置界面
    - 创建 `BaseConfig.vue` 组件
    - 配置数据库连接、基础URL、反代设置
    - _Requirements: 6.2, 6.3, 6.4_

- [x] 13. 添加管理员面板路由
  - [x] 13.1 配置前端路由
    - 修改 `thus-frontends/thus-web/src/routes/router.ts`
    - 添加管理员面板路由
    - 添加路由守卫验证管理员权限
    - _Requirements: 6.12_

- [x] 14. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [-] 15. 仓库整理和推送到 GitHub
  - [x] 15.1 清理临时文件和文档
    - 删除根目录下的临时 .md 文档（设计文档、报告等）
    - 删除临时测试脚本文件
    - 删除 .txt 临时文件
  - [x] 15.2 更新 .gitignore
    - 添加 uploads/ 目录到忽略列表
    - 添加日志文件到忽略列表
    - 添加缓存文件到忽略列表
    - 添加 .env 文件到忽略列表（保留 .env.example）
  - [-] 15.3 提交并推送到 GitHub
    - 使用规范的 commit message 格式
    - 推送到远程仓库

## 注意事项

- 所有任务均为必需任务，包括属性测试
- 每个任务都引用了具体的需求，确保可追溯性
- 属性测试验证通用正确性属性
- 检查点确保增量验证
