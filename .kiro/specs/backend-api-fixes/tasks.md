# Implementation Plan: Backend API Fixes

## Overview

本实现计划将修复后端API的关键问题，包括任务创建API的字段不匹配、文件上传后图片丢失、缺失的政策页面以及虚假的版本检查功能。实现将按照分层架构进行，先建立基础设施（数据模型、异常处理），然后实现各个功能模块，最后进行集成和测试。

## Tasks

- [ ] 1. 数据库模式更新和数据模型修改
  - [ ] 1.1 创建数据库迁移脚本
    - 编写SQL脚本更新tasks表（添加allow_anonymous和require_login字段）
    - 编写SQL脚本创建files表
    - 编写SQL脚本创建policies表
    - 编写SQL脚本创建app_versions表
    - 插入默认政策数据和初始版本数据
    - _Requirements: 1.2, 1.3, 2.1, 3.1, 3.2, 4.1, 6.1, 6.2, 6.3_
  
  - [x] 1.2 更新Task实体模型
    - 在Task.java中添加allowAnonymous字段（Boolean类型，非空）
    - 在Task.java中添加requireLogin字段（Boolean类型，非空）
    - 更新相关的构造函数和getter/setter方法
    - _Requirements: 1.2, 1.3, 6.1_
  
  - [ ] 1.3 创建File实体模型
    - 创建File.java实体类，包含所有必需字段（uniqueFileName、originalFileName、storagePath、contentType、fileSize、entityType、entityId、uploadedBy、uploadedAt、deleted）
    - 添加与User的多对一关系
    - 添加适当的数据库约束注解
    - _Requirements: 2.1, 6.3_
  
  - [ ] 1.4 创建Policy实体模型
    - 创建Policy.java实体类和PolicyType枚举
    - 包含type、content、version、lastUpdated、effectiveDate、updatedBy字段
    - 添加与User的多对一关系
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 1.5 创建AppVersion实体模型
    - 创建AppVersion.java实体类
    - 包含version、platform、downloadUrl、releaseNotes、releaseDate、mandatory、active字段
    - 添加唯一约束（version + platform）
    - _Requirements: 4.1, 4.2, 4.5_
  
  - [ ] 1.6 更新Note实体模型
    - 在Note.java中添加与File的一对多关系
    - 使用@Where注解过滤已删除的文件
    - _Requirements: 2.2, 2.3, 6.2_
  
  - [ ]* 1.7 编写数据模型单元测试
    - 测试实体的创建和字段验证
    - 测试实体关系的正确性
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 2. 统一异常处理和错误响应
  - [ ] 2.1 创建自定义异常类
    - 创建BusinessException基类
    - 创建ResourceNotFoundException、ValidationException、FileStorageException、UnauthorizedException、ForbiddenException子类
    - 每个异常包含errorCode和httpStatus字段
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 2.2 创建ErrorResponse DTO
    - 创建ErrorResponse.java，包含code、message、timestamp、path、fieldErrors字段
    - 添加构造函数和builder模式支持
    - _Requirements: 5.1, 5.2_
  
  - [ ] 2.3 实现全局异常处理器
    - 创建GlobalExceptionHandler类，使用@RestControllerAdvice注解
    - 实现handleValidationException方法（处理MethodArgumentNotValidException）
    - 实现handleResourceNotFoundException方法
    - 实现handleUnauthorizedException方法
    - 实现handleForbiddenException方法
    - 实现handleFileStorageException方法
    - 实现handleGenericException方法（处理所有未捕获异常）
    - 确保所有错误响应包含统一格式
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 2.4 编写异常处理单元测试
    - 测试每种异常类型的处理
    - 验证错误响应格式的一致性
    - _Requirements: 5.1, 5.2_
  
  - [ ]* 2.5 编写Property 11测试：错误响应格式统一性
    - **Property 11: 错误响应格式统一性**
    - **Validates: Requirements 5.1**
  
  - [ ]* 2.6 编写Property 12测试：验证错误详细信息
    - **Property 12: 验证错误详细信息**
    - **Validates: Requirements 5.2**

- [ ] 3. 任务创建API修复
  - [ ] 3.1 创建Task相关的DTO类
    - 创建TaskCreateRequest DTO，包含所有必需字段和验证注解
    - 创建TaskUpdateRequest DTO
    - 创建TaskResponse DTO
    - 添加字段验证注解（@NotBlank、@Size、@Future等）
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 3.2 更新TaskRepository接口
    - 添加必要的查询方法
    - 确保支持新字段的查询
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 3.3 更新TaskService实现
    - 更新createTask方法，处理allowAnonymous和requireLogin字段
    - 实现字段验证逻辑
    - 添加错误处理，抛出适当的业务异常
    - 确保返回完整的任务对象（包含ID和时间戳）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_
  
  - [ ] 3.4 更新TaskController
    - 更新createTask端点，接受新的请求DTO
    - 添加@Valid注解进行请求验证
    - 返回201状态码和完整的任务对象
    - 添加适当的错误处理
    - _Requirements: 1.1, 1.4, 1.6_
  
  - [ ]* 3.5 编写任务创建单元测试
    - 测试有效请求的成功创建
    - 测试无效请求的验证失败
    - 测试边缘情况（空标题、过去的截止日期等）
    - _Requirements: 1.1, 1.4_
  
  - [ ]* 3.6 编写Property 1测试：任务创建字段完整性
    - **Property 1: 任务创建字段完整性**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.6**
  
  - [ ]* 3.7 编写Property 2测试：任务字段持久化一致性
    - **Property 2: 任务字段持久化一致性**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ]* 3.8 编写Property 3测试：输入验证拒绝无效数据
    - **Property 3: 输入验证拒绝无效数据**
    - **Validates: Requirements 1.4**

- [ ] 4. Checkpoint - 验证任务API修复
  - 运行所有任务相关的测试
  - 使用curl或Postman测试任务创建端点
  - 确认allowAnonymous和requireLogin字段正确保存和返回
  - 如有问题，询问用户

- [ ] 5. 文件上传和存储功能
  - [ ] 5.1 创建文件存储配置
    - 创建FileStorageProperties配置类
    - 配置上传目录、最大文件大小、允许的文件类型白名单
    - 在application.properties中添加配置项
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [ ] 5.2 创建File相关的DTO类
    - 创建FileUploadResponse DTO
    - 创建FileMetadata DTO
    - _Requirements: 2.1_
  
  - [ ] 5.3 创建FileRepository接口
    - 添加按entityType和entityId查询的方法
    - 添加按uploadedBy查询的方法
    - _Requirements: 2.1, 2.6_
  
  - [ ] 5.4 实现FileService
    - 实现uploadFile方法（接受MultipartFile、entityType、entityId、userId）
    - 实现validateFile方法（验证文件类型和大小）
    - 实现generateUniqueFileName方法（使用UUID生成唯一文件名）
    - 实现storeFile方法（保存文件到磁盘）
    - 实现loadFileAsResource方法（加载文件资源）
    - 实现deleteFile方法（软删除，标记deleted=true）
    - 实现getFilesByEntity方法
    - 添加文件头部魔数验证
    - _Requirements: 2.1, 2.4, 2.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ] 5.5 实现FileController
    - 实现uploadFile端点（POST /api/files/upload）
    - 实现downloadFile端点（GET /api/files/{fileId}）
    - 实现deleteFile端点（DELETE /api/files/{fileId}）
    - 添加认证和授权检查
    - 添加适当的错误处理
    - _Requirements: 2.1, 2.4, 7.5_
  
  - [ ]* 5.6 编写文件上传单元测试
    - 测试有效文件的上传
    - 测试文件类型验证
    - 测试文件大小验证
    - 测试文件名生成的唯一性
    - _Requirements: 2.1, 7.1, 7.2, 7.3_
  
  - [ ]* 5.7 编写Property 4测试：文件上传Round-Trip一致性
    - **Property 4: 文件上传Round-Trip一致性**
    - **Validates: Requirements 2.1, 2.4**
  
  - [ ]* 5.8 编写Property 15测试：文件类型白名单验证
    - **Property 15: 文件类型白名单验证**
    - **Validates: Requirements 7.1**
  
  - [ ]* 5.9 编写Property 16测试：文件大小限制验证
    - **Property 16: 文件大小限制验证**
    - **Validates: Requirements 7.2**
  
  - [ ]* 5.10 编写Property 17测试：文件名唯一性和不可预测性
    - **Property 17: 文件名唯一性和不可预测性**
    - **Validates: Requirements 7.3**
  
  - [ ]* 5.11 编写Property 19测试：文件头部验证
    - **Property 19: 文件头部验证**
    - **Validates: Requirements 7.6**

- [ ] 6. 笔记文件关联功能
  - [ ] 6.1 更新NoteService
    - 实现attachFilesToNote方法（关联文件到笔记）
    - 实现getNoteFiles方法（获取笔记的所有文件）
    - 更新createNote和updateNote方法，支持文件关联
    - 实现deleteNote方法，级联标记关联文件为删除
    - _Requirements: 2.2, 2.3, 2.6_
  
  - [ ] 6.2 更新NoteController
    - 更新创建和更新笔记的端点，支持文件ID列表
    - 添加获取笔记文件的端点
    - _Requirements: 2.2, 2.3_
  
  - [ ]* 6.3 编写笔记文件关联单元测试
    - 测试文件关联的创建
    - 测试笔记检索时文件的返回
    - 测试笔记删除时文件的级联标记
    - _Requirements: 2.2, 2.3, 2.6_
  
  - [ ]* 6.4 编写Property 5测试：笔记文件关联持久化
    - **Property 5: 笔记文件关联持久化**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ]* 6.5 编写Property 6测试：笔记删除级联标记
    - **Property 6: 笔记删除级联标记**
    - **Validates: Requirements 2.6**

- [ ] 7. Checkpoint - 验证文件上传和笔记关联
  - 运行所有文件和笔记相关的测试
  - 测试文件上传功能
  - 测试笔记中添加图片并保存
  - 测试重新打开笔记，确认图片仍然显示
  - 如有问题，询问用户

- [ ] 8. 服务条款和隐私政策功能
  - [ ] 8.1 创建Policy相关的DTO类
    - 创建PolicyResponse DTO
    - 创建PolicyUpdateRequest DTO
    - 创建PolicyVersion DTO（用于历史记录）
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ] 8.2 创建PolicyRepository接口
    - 添加按type查询的方法
    - 添加查询历史版本的方法
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ] 8.3 实现PolicyService
    - 实现getPolicy方法（按类型获取政策）
    - 实现updatePolicy方法（更新政策内容，增加版本号）
    - 实现getPolicyHistory方法（获取历史版本）
    - 添加缓存支持（使用Spring Cache）
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 8.4_
  
  - [ ] 8.4 实现PolicyController
    - 实现getTermsOfService端点（GET /api/policies/terms）
    - 实现getPrivacyPolicy端点（GET /api/policies/privacy）
    - 实现updateTermsOfService端点（PUT /api/policies/terms，需要ADMIN角色）
    - 实现updatePrivacyPolicy端点（PUT /api/policies/privacy，需要ADMIN角色）
    - 添加404错误处理
    - _Requirements: 3.1, 3.2, 3.5, 3.6_
  
  - [ ]* 8.5 编写政策功能单元测试
    - 测试政策的获取
    - 测试政策的更新
    - 测试不存在政策的404响应
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ]* 8.6 编写Property 7测试：政策内容格式和版本信息
    - **Property 7: 政策内容格式和版本信息**
    - **Validates: Requirements 3.3, 3.4**
  
  - [ ]* 8.7 编写Property 8测试：政策更新版本递增
    - **Property 8: 政策更新版本递增**
    - **Validates: Requirements 3.6**
  
  - [ ]* 8.8 编写Property 20测试：缓存数据一致性
    - **Property 20: 缓存数据一致性**
    - **Validates: Requirements 8.4**

- [ ] 9. 版本检查功能
  - [ ] 9.1 创建Version相关的DTO类
    - 创建VersionCheckResponse DTO
    - 创建VersionInfo DTO
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ] 9.2 创建AppVersionRepository接口
    - 添加按platform和active查询最新版本的方法
    - _Requirements: 4.1, 4.2_
  
  - [ ] 9.3 实现VersionService
    - 实现checkForUpdates方法（比较版本并返回更新信息）
    - 实现getCurrentVersion方法
    - 实现getLatestVersion方法（按平台）
    - 实现compareVersions方法（语义化版本比较）
    - 实现isNewerVersion方法
    - 添加缓存支持
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ] 9.4 实现VersionController
    - 实现checkVersion端点（GET /api/version/check）
    - 实现getCurrentVersion端点（GET /api/version/current）
    - 添加错误处理和降级策略
    - _Requirements: 4.1, 4.6_
  
  - [ ]* 9.5 编写版本检查单元测试
    - 测试版本比较逻辑
    - 测试各种版本号格式
    - 测试更新可用和不可用的情况
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 9.6 编写Property 9测试：版本号比较正确性
    - **Property 9: 版本号比较正确性**
    - **Validates: Requirements 4.2, 4.5**
  
  - [ ]* 9.7 编写Property 10测试：版本检查响应完整性
    - **Property 10: 版本检查响应完整性**
    - **Validates: Requirements 4.1, 4.3, 4.4**

- [ ] 10. Checkpoint - 验证政策和版本功能
  - 运行所有政策和版本相关的测试
  - 测试访问服务条款和隐私政策页面
  - 测试版本检查功能
  - 如有问题，询问用户

- [ ] 11. 数据完整性和安全性增强
  - [ ] 11.1 添加数据库约束验证
    - 在实体类中添加@Column约束（nullable、unique等）
    - 配置Hibernate在启动时验证模式
    - _Requirements: 6.5_
  
  - [ ] 11.2 实现时区处理
    - 配置应用程序使用UTC时区
    - 在所有日期时间字段上使用统一的时区处理
    - 添加时区转换工具类（如需要）
    - _Requirements: 6.6_
  
  - [ ] 11.3 实现文件访问权限检查
    - 在FileService中添加权限验证逻辑
    - 确保用户只能访问自己上传的文件或公开的文件
    - _Requirements: 7.5_
  
  - [ ]* 11.4 编写Property 13测试：数据库约束强制执行
    - **Property 13: 数据库约束强制执行**
    - **Validates: Requirements 6.5**
  
  - [ ]* 11.5 编写Property 14测试：时区处理一致性
    - **Property 14: 时区处理一致性**
    - **Validates: Requirements 6.6**
  
  - [ ]* 11.6 编写Property 18测试：文件访问通过API端点
    - **Property 18: 文件访问通过API端点**
    - **Validates: Requirements 7.5**

- [ ] 12. API监控和日志记录
  - [ ] 12.1 实现请求日志拦截器
    - 创建LoggingInterceptor类
    - 记录所有API请求的路径、方法、状态码、响应时间
    - 配置日志级别和格式
    - 实现敏感数据脱敏
    - _Requirements: 8.6_
  
  - [ ] 12.2 配置日志框架
    - 配置Logback或Log4j2
    - 设置不同级别的日志输出
    - 配置日志文件滚动策略
    - _Requirements: 5.6, 8.6_
  
  - [ ]* 12.3 编写Property 21测试：API监控日志完整性
    - **Property 21: API监控日志完整性**
    - **Validates: Requirements 8.6**

- [ ] 13. 集成测试
  - [ ]* 13.1 编写任务API集成测试
    - 使用Testcontainers启动测试数据库
    - 测试完整的任务创建流程
    - 测试错误场景
    - _Requirements: 1.1, 1.4_
  
  - [ ]* 13.2 编写文件上传集成测试
    - 测试完整的文件上传和下载流程
    - 测试文件与笔记的关联
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 13.3 编写政策和版本API集成测试
    - 测试政策页面的访问
    - 测试版本检查流程
    - _Requirements: 3.1, 3.2, 4.1_
  
  - [ ]* 13.4 编写端到端测试
    - 测试完整的用户工作流（创建任务、上传文件、创建笔记）
    - 测试错误处理和恢复
    - _Requirements: 所有需求_

- [ ] 14. 文档和配置
  - [ ] 14.1 更新API文档
    - 使用Swagger/OpenAPI注解更新所有端点
    - 添加请求和响应示例
    - 文档化错误响应格式
    - _Requirements: 所有需求_
  
  - [ ] 14.2 更新配置文件
    - 在application.properties中添加所有新配置项
    - 创建application-dev.properties和application-prod.properties
    - 文档化所有配置选项
    - _Requirements: 7.1, 7.2, 7.4, 8.4_
  
  - [ ] 14.3 创建数据库迁移指南
    - 编写迁移步骤文档
    - 提供回滚脚本
    - 文档化数据迁移注意事项
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 15. Final Checkpoint - 完整验证
  - 运行所有测试（单元测试、属性测试、集成测试）
  - 使用Postman或curl测试所有修复的功能
  - 验证所有原始问题已解决：
    - 任务创建API返回201而不是500
    - 图片上传后在笔记中正确显示
    - 服务条款和隐私政策页面可访问
    - 版本检查返回真实的版本信息
  - 检查代码覆盖率是否达到目标（80%行覆盖率）
  - 如有问题，询问用户

## Notes

- 任务标记为`*`的是可选任务，主要是测试相关的任务，可以跳过以加快MVP开发
- 每个任务都引用了具体的需求编号，确保可追溯性
- Checkpoint任务确保增量验证，及早发现问题
- 属性测试使用jqwik框架，每个测试至少运行100次迭代
- 单元测试验证具体例子和边缘情况
- 集成测试验证端到端流程
