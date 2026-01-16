import { Router, Request, Response } from 'express';
import { successResponse, errorResponse } from '../types/api.types';

const router = Router();

/**
 * @route   POST /hello-world
 * @desc    获取服务器时间戳（用于时间校准）
 * @access  Public
 */
router.post('/', (req: Request, res: Response) => {
  try {
    // 返回服务器当前时间戳（毫秒）
    const stamp = Date.now();

    res.json(successResponse({ stamp }));
  } catch (error) {
    console.error('Hello World error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'E0001',
        message: '服务器内部错误'
      }
    });
  }
});

export default router;
