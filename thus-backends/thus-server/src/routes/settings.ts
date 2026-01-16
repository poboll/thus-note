import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import User from '../models/User';

const router = Router();

/**
 * 获取用户设置
 * GET /api/settings
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    return res.json(successResponse({
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      settings: user.settings,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取设置失败')
    );
  }
});

/**
 * 更新用户设置
 * PUT /api/settings
 */
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { username, avatar, settings } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    // 更新用户名
    if (username !== undefined) {
      // 检查用户名是否已被使用
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        username,
      });
      if (existingUser) {
        return res.status(409).json(
          errorResponse('CONFLICT', '用户名已被使用')
        );
      }
      user.username = username;
    }

    // 更新头像
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    // 更新设置
    if (settings !== undefined) {
      user.settings = {
        ...user.settings,
        ...settings,
      };
    }

    await user.save();

    return res.json(successResponse({
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      settings: user.settings,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新设置失败')
    );
  }
});

/**
 * 更新通知设置
 * PUT /api/settings/notifications
 */
router.put('/notifications', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { notifications } = req.body;

    if (!notifications || typeof notifications !== 'object') {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', 'notifications参数错误')
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    user.settings.notifications = {
      ...user.settings.notifications,
      ...notifications,
    };

    await user.save();

    return res.json(successResponse({
      notifications: user.settings.notifications,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新通知设置失败')
    );
  }
});

/**
 * 更新语言设置
 * PUT /api/settings/language
 */
router.put('/language', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { language } = req.body;

    if (!language || typeof language !== 'string') {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', 'language参数错误')
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    user.settings.language = language;
    await user.save();

    return res.json(successResponse({
      language: user.settings.language,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新语言设置失败')
    );
  }
});

/**
 * 更新主题设置
 * PUT /api/settings/theme
 */
router.put('/theme', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { theme } = req.body;

    if (!theme || typeof theme !== 'string') {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', 'theme参数错误')
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    user.settings.theme = theme;
    await user.save();

    return res.json(successResponse({
      theme: user.settings.theme,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新主题设置失败')
    );
  }
});

/**
 * 更新时区设置
 * PUT /api/settings/timezone
 */
router.put('/timezone', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { timezone } = req.body;

    if (!timezone || typeof timezone !== 'string') {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', 'timezone参数错误')
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    user.settings.timezone = timezone;
    await user.save();

    return res.json(successResponse({
      timezone: user.settings.timezone,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新时区设置失败')
    );
  }
});

export default router;
