# 微信登录功能修复说明

## 修改内容

### 1. 后端修改 (thus-server)

#### 文件修改：
- `src/routes/user-login.ts` - 添加了三个微信扫码登录的处理函数
  - `handleWxGzhScan` - 生成二维码和凭证
  - `handleScanCheck` - 检查扫码状态
  - `handleScanLogin` - 完成扫码登录

#### 新增文件：
- `src/routes/wechat-scan-callback.ts` - 接收认证服务的扫码回调通知

#### 路由注册：
- `src/index.ts` - 注册了 `/api/wechat/scan-callback` 端点

### 2. 支持的 operateType

现在 `/user-login` 端点支持以下微信相关的 operateType：
- `wx_gzh_scan` - 生成扫码二维码
- `scan_check` - 检查扫码状态
- `scan_login` - 完成扫码登录
- `wx_gzh_oauth` - OAuth 登录（已有）

### 3. 新增环境变量

需要在 `.env` 文件中添加：

```env
# 微信配置
WECHAT_APPID=your_wechat_appid
WECHAT_APP_SECRET=your_wechat_app_secret

# 认证服务配置
AUTH_SERVICE_URL=https://auth.caiths.com
AUTH_SERVICE_SECRET=your_auth_service_secret
```

### 4. 认证服务集成

认证服务需要在用户扫码后调用：
```
POST https://thus.caiths.com/api/wechat/scan-callback
Headers:
  x-auth-secret: your_auth_service_secret
Body:
{
  "credential": "扫码凭证",
  "openid": "微信openid",
  "nickname": "用户昵称",
  "headimgurl": "头像URL",
  "state": "原始state参数"
}
```

## 工作流程

1. 前端调用 `POST /user-login` with `operateType: "wx_gzh_scan"`
2. 后端生成 credential 和二维码URL，返回给前端
3. 用户扫码，微信回调到认证服务 `https://auth.caiths.com/wechat/callback`
4. 认证服务获取用户信息后，调用 `POST /api/wechat/scan-callback` 通知后端
5. 后端更新 Redis 中的扫码状态
6. 前端轮询 `POST /user-login` with `operateType: "scan_check"` 检查状态
7. 状态变为 `plz_check` 后，前端调用 `POST /user-login` with `operateType: "scan_login"` 完成登录

## Redis 数据结构

```
Key: wx_scan:{credential}
Value: {
  "status": "pending" | "scanned",
  "createdAt": timestamp,
  "credential_2": "二次凭证",
  "openid": "微信openid",
  "nickname": "用户昵称",
  "headimgurl": "头像URL",
  "state": "原始state",
  "scannedAt": timestamp
}
TTL: 1800秒（30分钟）-> 扫码后变为600秒（10分钟）
```

## 部署步骤

见 `DEPLOY.sh` 脚本
