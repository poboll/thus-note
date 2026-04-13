import { Router, Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import { successResponse, errorResponse } from '../types/api.types';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/wechat/scan-callback
 * 接收认证服务的扫码回调通知
 */
router.post('/scan-callback', async (req: Request, res: Response) => {
  try {
    const { credential, openid, nickname, headimgurl, state } = req.body;
    
    // 验证必需参数
    if (!credential || !openid) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少必要参数')
      );
    }
    
    // 验证请求来源（简单的密钥验证）
    const authSecret = req.headers['x-auth-secret'];
    const expectedSecret = process.env.AUTH_SERVICE_SECRET || 'default-secret';
    
    if (authSecret !== expectedSecret) {
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', '无效的认证密钥')
      );
    }
    
    // 生成 credential_2
    const credential_2 = crypto.randomBytes(32).toString('hex');
    
    // 更新 Redis 中的扫码状态
    const redisClient = getRedisClient();
    const data = await redisClient.get(`wx_scan:${credential}`);
    
    if (!data) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '凭证不存在或已过期')
      );
    }
    
    const scanData = JSON.parse(data);
    scanData.status = 'scanned';
    scanData.credential_2 = credential_2;
    scanData.openid = openid;
    scanData.nickname = nickname;
    scanData.headimgurl = headimgurl;
    scanData.state = state;
    scanData.scannedAt = Date.now();
    
    // 更新 Redis，延长过期时间到10分钟
    await redisClient.set(`wx_scan:${credential}`, JSON.stringify(scanData), 'EX', 600);
    
    return res.json(
      successResponse({
        message: '扫码状态已更新',
        credential_2,
      })
    );
    
  } catch (error: any) {
    console.error('Wechat scan callback error:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '处理回调失败')
    );
  }
});

export default router;
