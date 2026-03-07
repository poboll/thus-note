import { Router, Request, Response } from 'express';
import { successResponse, errorResponse, ApiResponse } from '../types/api.types';
import { emailService } from '../services/emailService';

const router = Router();

/**
 * 测试端点 - 用于验证前后端联调
 */

/**
 * 简单的ping测试
 */
router.get('/ping', (req: Request, res: Response) => {
  res.json(successResponse({ message: 'pong', timestamp: Date.now() }));
});

/**
 * 测试数据返回
 */
router.post('/echo', (req: Request, res: Response) => {
  res.json(successResponse({
    received: req.body,
    timestamp: Date.now(),
  }));
});

/**
 * 测试错误处理
 */
router.get('/error', (req: Request, res: Response) => {
  res.json(errorResponse('E0001', 'This is a test error'));
});

/**
 * 测试认证（占位符）
 */
router.get('/auth', (req: Request, res: Response) => {
  const token = req.headers['x_liu_token'];

  if (!token) {
    res.json(errorResponse('C0002', 'Unauthorized: No token provided'));
    return;
  }

  res.json(successResponse({
    authenticated: true,
    token: (typeof token === 'string' ? token.substring(0, 20) : 'unknown') + '...',
  }));
});

/**
 * 测试数据库连接
 */
router.get('/db-status', (req: Request, res: Response) => {
  // 这里会从数据库获取实际状态
  res.json(successResponse({
    mongodb: 'connected',
    redis: 'connected',
    timestamp: Date.now(),
  }));
});

/**
 * 测试邮件发送
 */
router.post('/send-email', async (req: Request, res: Response) => {
  try {
    const { email, type = 'verification' } = req.body;
    
    if (!email) {
      res.json(errorResponse('E0002', 'Email is required'));
      return;
    }

    let result = false;
    
    if (type === 'verification') {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      result = await emailService.sendVerificationCode(email, code);
    } else if (type === 'welcome') {
      result = await emailService.sendWelcomeEmail(email, 'Test User');
    } else if (type === 'reset') {
      result = await emailService.sendPasswordResetEmail(email, 'test-token-123');
    }

    if (result) {
      res.json(successResponse({ 
        message: 'Email sent successfully', 
        email,
        type 
      }));
    } else {
      res.json(errorResponse('E0003', 'Failed to send email'));
    }
  } catch (error: any) {
    res.json(errorResponse('E0004', error.message || 'Internal server error'));
  }
});

export default router;
