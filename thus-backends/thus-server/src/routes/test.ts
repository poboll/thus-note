import { Router, Request, Response } from 'express';
import { successResponse, errorResponse, ApiResponse } from '../types/api.types';

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

export default router;
