import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Types } from 'mongoose';
import User from '../models/User';
import Thread from '../models/Thread';
import Content from '../models/Content';
import { successResponse, errorResponse } from '../types/api.types';
import { logger } from '../config/logger';

const router = Router();

// 微信Webhook配置
const WECHAT_WEBHOOK_TOKEN = process.env.WECHAT_WEBHOOK_TOKEN || 'your_webhook_token';

/**
 * 微信Webhook请求接口
 */
interface WeChatWebhookRequest {
  userId: string;
  messageType: 'text' | 'image' | 'voice';
  content?: string;
  mediaId?: string;
  mediaUrl?: string;
  timestamp: number;
}

/**
 * 验证微信签名中间件
 */
function verifyWeChatSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-wechat-signature'] as string;
  const timestamp = req.headers['x-wechat-timestamp'] as string;
  const nonce = req.headers['x-wechat-nonce'] as string;

  if (!signature || !timestamp || !nonce) {
    logger.warn('WeChat webhook: Missing signature headers');
    return res.status(401).json(errorResponse('E0001', 'Missing signature headers'));
  }

  // 验证时间戳（5分钟内有效）
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 5 * 60 * 1000) {
    logger.warn('WeChat webhook: Invalid or expired timestamp');
    return res.status(401).json(errorResponse('E0002', 'Invalid or expired timestamp'));
  }

  // 验证签名
  const body = JSON.stringify(req.body);
  const arr = [WECHAT_WEBHOOK_TOKEN, timestamp, nonce, body].sort();
  const str = arr.join('');
  const hash = crypto.createHash('sha1').update(str).digest('hex');

  if (hash !== signature) {
    logger.warn('WeChat webhook: Invalid signature');
    return res.status(401).json(errorResponse('E0003', 'Invalid signature'));
  }

  next();
}

/**
 * POST /api/wechat/webhook
 * 接收微信小程序消息并自动创建笔记
 */
router.post('/webhook', verifyWeChatSignature, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      messageType,
      content,
      mediaId,
      mediaUrl,
      timestamp,
    } = req.body as WeChatWebhookRequest;

    // 验证必需字段
    if (!userId || !messageType || !timestamp) {
      logger.warn('WeChat webhook: Missing required fields');
      return res.status(400).json(errorResponse('E0004', 'Missing required fields: userId, messageType, timestamp'));
    }

    // 验证消息类型
    if (!['text', 'image', 'voice'].includes(messageType)) {
      logger.warn(`WeChat webhook: Invalid message type: ${messageType}`);
      return res.status(400).json(errorResponse('E0005', 'Invalid message type. Must be text, image, or voice'));
    }

    // 验证用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`WeChat webhook: User not found: ${userId}`);
      return res.status(404).json(errorResponse('E0006', 'User not found'));
    }

    // 获取用户的默认空间
    const Member = (await import('../models/Member')).default;
    const Space = (await import('../models/Space')).default;
    
    const member = await Member.findOne({ userId: user._id, status: 'active' });
    if (!member) {
      logger.warn(`WeChat webhook: No active space found for user: ${userId}`);
      return res.status(404).json(errorResponse('E0007', 'No active space found for user'));
    }

    const space = await Space.findById(member.spaceId);
    if (!space) {
      logger.warn(`WeChat webhook: Space not found: ${member.spaceId}`);
      return res.status(404).json(errorResponse('E0008', 'Space not found'));
    }

    // 根据消息类型创建笔记内容
    let threadContent = '';
    let contentType: 'text' | 'image' | 'voice' | 'mixed' = 'text';

    switch (messageType) {
      case 'text':
        if (!content) {
          return res.status(400).json(errorResponse('E0009', 'Text message requires content field'));
        }
        threadContent = content;
        contentType = 'text';
        break;

      case 'image':
        if (!mediaUrl && !mediaId) {
          return res.status(400).json(errorResponse('E0010', 'Image message requires mediaUrl or mediaId field'));
        }
        threadContent = `[图片消息]\n${mediaUrl || `MediaID: ${mediaId}`}`;
        contentType = 'image';
        break;

      case 'voice':
        if (!mediaUrl && !mediaId) {
          return res.status(400).json(errorResponse('E0011', 'Voice message requires mediaUrl or mediaId field'));
        }
        threadContent = `[语音消息]\n${mediaUrl || `MediaID: ${mediaId}`}`;
        contentType = 'voice';
        break;
    }

    // 创建Thread（笔记）
    const thread = new Thread({
      userId: user._id,
      spaceId: space._id,
      title: `微信消息 - ${new Date(timestamp).toLocaleString('zh-CN')}`,
      content: threadContent,
      contentType,
      tags: ['微信', '自动创建'],
      status: 'active',
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
    });

    await thread.save();

    // 创建Content记录
    const contentRecord = new Content({
      threadId: thread._id,
      userId: user._id,
      spaceId: space._id,
      content: threadContent,
      contentType,
      mediaUrl: mediaUrl || undefined,
      mediaId: mediaId || undefined,
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
    });

    await contentRecord.save();

    logger.info(`WeChat webhook: Created thread ${thread._id} for user ${userId}`);

    return res.status(200).json(successResponse({
      threadId: thread._id.toString(),
      contentId: contentRecord._id.toString(),
    }));

  } catch (error: any) {
    logger.error('WeChat webhook error:', error);
    return res.status(500).json(errorResponse('E0012', 'Internal server error', error.message));
  }
});

/**
 * GET /api/wechat/webhook/test
 * 测试Webhook端点是否正常工作
 */
router.get('/webhook/test', (req: Request, res: Response) => {
  return res.json(successResponse({
    message: 'WeChat webhook endpoint is working',
    timestamp: Date.now(),
  }));
});

export default router;
