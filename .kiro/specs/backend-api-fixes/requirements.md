# Requirements Document

## Introduction

本规范定义了后端API修复和增强功能，解决当前系统中的关键问题：任务创建API失败、图片上传后丢失、缺失的政策页面以及虚假的版本检查功能。这些修复将确保系统的核心功能正常运行，并提供必要的法律合规页面。

## Glossary

- **Task_API**: 任务管理的RESTful API端点
- **File_Service**: 处理文件上传、存储和检索的服务组件
- **Note_System**: 用户创建和管理笔记的系统，支持文本和图片内容
- **Policy_Pages**: 服务条款和隐私政策的静态或动态页面
- **Version_Checker**: 检查应用程序更新的功能模块
- **Frontend**: 向后端发送请求的客户端应用程序
- **Backend**: 处理业务逻辑和数据持久化的服务器端应用程序

## Requirements

### Requirement 1: 任务创建API修复

**User Story:** 作为前端开发者，我需要任务创建API能够接受并处理所有前端发送的字段，以便用户可以成功创建任务。

#### Acceptance Criteria

1. WHEN Frontend发送包含title、description、category、allowAnonymous、requireLogin和deadline字段的POST请求到/api/tasks，THEN THE Task_API SHALL成功创建任务并返回201状态码
2. WHEN Frontend发送的请求包含allowAnonymous字段，THEN THE Task_API SHALL将该字段存储到Task模型中
3. WHEN Frontend发送的请求包含requireLogin字段，THEN THE Task_API SHALL将该字段存储到Task模型中
4. WHEN Task_API接收到无效的字段值（如空标题或过去的截止日期），THEN THE Task_API SHALL返回400状态码和描述性错误消息
5. WHEN Task_API处理请求时发生数据库错误，THEN THE Task_API SHALL返回500状态码和通用错误消息，不暴露内部实现细节
6. WHEN Task_API成功创建任务，THEN THE Backend SHALL返回完整的任务对象，包括生成的ID和时间戳

### Requirement 2: 文件上传和引用持久化

**User Story:** 作为用户，我需要上传到笔记中的图片在保存后仍然可见，以便我可以创建包含图文混合内容的笔记。

#### Acceptance Criteria

1. WHEN File_Service接收到文件上传请求，THEN THE File_Service SHALL将文件存储到持久化存储位置并返回可访问的URL
2. WHEN Note_System保存包含图片引用的笔记，THEN THE Note_System SHALL将图片URL与笔记内容一起存储到数据库
3. WHEN用户重新打开包含图片的笔记，THEN THE Backend SHALL返回包含有效图片URL的笔记内容
4. WHEN Backend返回图片URL，THEN THE File_Service SHALL确保该URL可以通过HTTP GET请求访问到对应的图片文件
5. WHEN文件上传失败（如磁盘空间不足或文件类型不支持），THEN THE File_Service SHALL返回描述性错误消息
6. WHEN笔记被删除，THEN THE File_Service SHALL标记关联的图片文件以便后续清理（可选的垃圾回收）

### Requirement 3: 服务条款和隐私政策页面

**User Story:** 作为产品负责人，我需要提供服务条款和隐私政策页面，以便满足法律合规要求。

#### Acceptance Criteria

1. WHEN用户访问/api/policies/terms路径，THEN THE Backend SHALL返回服务条款内容和200状态码
2. WHEN用户访问/api/policies/privacy路径，THEN THE Backend SHALL返回隐私政策内容和200状态码
3. THE Policy_Pages SHALL支持HTML格式的内容返回
4. THE Policy_Pages SHALL支持内容的版本管理，包括最后更新日期
5. WHEN Policy_Pages内容不存在，THEN THE Backend SHALL返回404状态码和友好的错误消息
6. THE Backend SHALL提供管理接口用于更新政策内容（可选功能）

### Requirement 4: 版本检查功能实现

**User Story:** 作为用户，我需要应用程序能够检查并通知我有新版本可用，以便我可以及时更新到最新版本。

#### Acceptance Criteria

1. WHEN Frontend请求版本检查（GET /api/version/check），THEN THE Version_Checker SHALL返回当前服务器版本和最新可用版本信息
2. WHEN Version_Checker比较版本号，THEN THE Version_Checker SHALL正确识别当前版本是否为最新版本
3. WHEN有新版本可用，THEN THE Version_Checker SHALL在响应中包含updateAvailable标志为true和新版本的下载URL
4. WHEN当前版本是最新版本，THEN THE Version_Checker SHALL在响应中包含updateAvailable标志为false
5. THE Version_Checker SHALL支持语义化版本号比较（major.minor.patch格式）
6. WHEN版本检查服务不可用，THEN THE Backend SHALL返回缓存的版本信息或明确的错误状态

### Requirement 5: API错误处理标准化

**User Story:** 作为前端开发者，我需要一致的错误响应格式，以便我可以统一处理各种错误情况。

#### Acceptance Criteria

1. WHEN任何API端点返回错误，THEN THE Backend SHALL使用统一的错误响应格式，包含code、message和timestamp字段
2. WHEN发生验证错误（400），THEN THE Backend SHALL在响应中包含具体的字段验证错误信息
3. WHEN发生认证错误（401），THEN THE Backend SHALL返回清晰的认证失败消息
4. WHEN发生授权错误（403），THEN THE Backend SHALL返回清晰的权限不足消息
5. WHEN发生资源未找到错误（404），THEN THE Backend SHALL返回清晰的资源标识信息
6. WHEN发生服务器内部错误（500），THEN THE Backend SHALL记录详细错误日志但只向客户端返回通用错误消息

### Requirement 6: 数据模型完整性

**User Story:** 作为系统架构师，我需要确保数据模型与API契约一致，以便避免运行时错误和数据不一致。

#### Acceptance Criteria

1. THE Task模型 SHALL包含所有前端发送的字段：title、description、category、allowAnonymous、requireLogin、deadline
2. THE Note模型 SHALL包含存储图片URL列表或引用的字段
3. THE File模型 SHALL包含文件路径、原始文件名、MIME类型、上传时间和关联实体ID的字段
4. WHEN数据库模式与模型定义不一致，THEN THE Backend SHALL在启动时检测并报告模式不匹配错误
5. THE Backend SHALL为所有模型字段提供适当的数据库约束（如NOT NULL、唯一性约束）
6. THE Backend SHALL为日期时间字段使用一致的时区处理（建议使用UTC）

### Requirement 7: 文件存储安全性

**User Story:** 作为安全工程师，我需要确保文件上传功能不会引入安全漏洞，以便保护系统和用户数据。

#### Acceptance Criteria

1. WHEN File_Service接收文件上传，THEN THE File_Service SHALL验证文件类型是否在允许的白名单中
2. WHEN File_Service接收文件上传，THEN THE File_Service SHALL验证文件大小不超过配置的最大限制
3. THE File_Service SHALL为上传的文件生成唯一的、不可预测的文件名
4. THE File_Service SHALL将文件存储在Web根目录之外的安全位置
5. WHEN提供文件访问，THEN THE Backend SHALL通过专用的文件服务端点提供文件，而不是直接暴露文件系统路径
6. THE File_Service SHALL对文件内容进行病毒扫描（如果可用）或至少验证文件头部魔数

### Requirement 8: API性能和可靠性

**User Story:** 作为运维工程师，我需要API具有良好的性能和可靠性，以便为用户提供流畅的体验。

#### Acceptance Criteria

1. WHEN Task_API处理创建请求，THEN THE Task_API SHALL在正常负载下500ms内返回响应
2. WHEN File_Service处理文件上传，THEN THE File_Service SHALL支持流式上传以处理大文件
3. THE Backend SHALL实现数据库连接池以优化数据库访问性能
4. THE Backend SHALL为频繁访问的数据（如政策页面）实现缓存机制
5. WHEN系统负载过高，THEN THE Backend SHALL实现请求限流以保护系统稳定性
6. THE Backend SHALL记录所有API请求的响应时间和错误率用于监控
