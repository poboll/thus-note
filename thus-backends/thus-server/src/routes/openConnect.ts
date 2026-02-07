import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import { wechatService, WeChatError } from '../services/wechatService';
import { ConfigService } from '../services/configService';
import { logger } from '../config/logger';

const router = Router();

/**
 * 获取微信绑定状态
 * POST /api/open-connect (operateType: 'get-wechat')
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!.toString();
    const { operateType, memberId, oauth_code } = req.body;

    switch (operateType) {
      case 'get-wechat':
        return await handleGetWeChatStatus(userId, res);

      case 'bind-wechat':
        return await handleBindWeChat(userId, oauth_code, res);

      case 'unbind-wechat':
        return await handleUnbindWeChat(userId, res);

      case 'get-wechat-qrcode':
        return await handleGetWeChatQRCode(userId, req, res);

      default:
        return res.status(400).json(
          errorResponse('BAD_REQUEST', `不支持的操作类型: ${operateType}`)
        );
    }
  } catch (error: any) {
    logger.error('open-connect 错误:', error);
    
    if (error instanceof WeChatError) {
      return res.status(400).json(
        errorResponse(error.code, error.message)
      );
    }
    
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '操作失败')
    );
  }
});

/**
 * 获取微信绑定状态
 */
async function handleGetWeChatStatus(userId: string, res: Response) {
  const status = await wechatService.getBindingStatus(userId);
  
  return res.json(successResponse({
    wechat: status,
  }));
}

/**
 * 绑定微信
 */
async function handleBindWeChat(userId: string, oauthCode: string | undefined, res: Response) {
  // 检查微信功能是否启用
  const wechatConfig = await ConfigService.getWeChatConfig();
  if (!wechatConfig.enabled) {
    return res.status(400).json(
      errorResponse('WECHAT_NOT_ENABLED', '微信功能未启用')
    );
  }

  if (!oauthCode) {
    // 没有授权码，返回授权 URL
    const systemConfig = await ConfigService.getConfig();
    const redirectUri = `${systemConfig.frontendUrl}/wechat-callback`;
    const state = `bind_${userId}_${Date.now()}`;
    
    const authUrl = await wechatService.getOAuthUrl(redirectUri, state);
    
    return res.json(successResponse({
      authUrl,
      state,
    }));
  }

  // 有授权码，进行绑定
  try {
    // 获取 access_token
    const tokenResult = await wechatService.getAccessToken(oauthCode);
    
    // 获取用户信息
    const userInfo = await wechatService.getUserInfo(
      tokenResult.accessToken,
      tokenResult.openId
    );
    
    // 绑定用户
    await wechatService.bindUser(userId, tokenResult.openId, userInfo);
    
    // 获取绑定状态
    const status = await wechatService.getBindingStatus(userId);
    
    return res.json(successResponse({
      message: '微信绑定成功',
      wechat: status,
    }));
  } catch (error: any) {
    if (error instanceof WeChatError) {
      throw error;
    }
    throw new WeChatError('WECHAT_BIND_ERROR', error.message || '绑定失败');
  }
}

/**
 * 解绑微信
 */
async function handleUnbindWeChat(userId: string, res: Response) {
  await wechatService.unbindUser(userId);
  
  return res.json(successResponse({
    message: '微信解绑成功',
    wechat: { bound: false },
  }));
}

/**
 * 获取微信扫码登录二维码 URL
 */
async function handleGetWeChatQRCode(userId: string, req: Request, res: Response) {
  // 检查微信功能是否启用
  const wechatConfig = await ConfigService.getWeChatConfig();
  if (!wechatConfig.enabled) {
    return res.status(400).json(
      errorResponse('WECHAT_NOT_ENABLED', '微信功能未启用')
    );
  }

  const systemConfig = await ConfigService.getConfig();
  const redirectUri = `${systemConfig.frontendUrl}/wechat-callback`;
  const state = `bind_${userId}_${Date.now()}`;
  
  const qrcodeUrl = await wechatService.getQRCodeUrl(redirectUri, state);
  
  return res.json(successResponse({
    qrcodeUrl,
    state,
  }));
}

/**
 * 微信授权回调
 * GET /api/open-connect/callback
 */
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少必要参数')
      );
    }

    // 解析 state 获取用户 ID
    const stateStr = state as string;
    const parts = stateStr.split('_');
    
    if (parts.length < 2 || parts[0] !== 'bind') {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '无效的 state 参数')
      );
    }

    const userId = parts[1];
    
    // 获取 access_token
    const tokenResult = await wechatService.getAccessToken(code as string);
    
    // 获取用户信息
    const userInfo = await wechatService.getUserInfo(
      tokenResult.accessToken,
      tokenResult.openId
    );
    
    // 绑定用户
    await wechatService.bindUser(userId, tokenResult.openId, userInfo);
    
    // 重定向到前端
    const systemConfig = await ConfigService.getConfig();
    return res.redirect(`${systemConfig.frontendUrl}/settings?wechat=success`);
  } catch (error: any) {
    logger.error('微信回调错误:', error);
    
    const systemConfig = await ConfigService.getConfig();
    const errorMsg = encodeURIComponent(error.message || '绑定失败');
    return res.redirect(`${systemConfig.frontendUrl}/settings?wechat=error&message=${errorMsg}`);
  }
});

export default router;
