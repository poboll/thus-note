import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '../utils/jwt';
import User, { UserRole } from '../models/User';
import { errorResponse } from '../types/api.types';
import { logger } from '../config/logger';

/**
 * 管理员认证中间件
 * 验证用户是否为管理员
 */
export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 获取 token
    const token = req.headers['x-liu-token'] as string ||
      req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json(
        errorResponse('ADMIN_UNAUTHORIZED', '未提供认证令牌')
      );
      return;
    }

    // 验证 token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      res.status(401).json(
        errorResponse('ADMIN_UNAUTHORIZED', '无效的认证令牌')
      );
      return;
    }

    // 查找用户并验证管理员权限
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json(
        errorResponse('ADMIN_UNAUTHORIZED', '用户不存在')
      );
      return;
    }

    // 检查是否为管理员
    if (user.role !== UserRole.ADMIN) {
      logger.warn(`非管理员用户尝试访问管理接口: ${user._id}`);
      res.status(403).json(
        errorResponse('ADMIN_FORBIDDEN', '权限不足，需要管理员权限')
      );
      return;
    }

    // 将用户信息添加到请求对象
    req.userId = decoded.userId;
    (req as any).user = user;
    (req as any).isAdmin = true;

    next();
  } catch (error: any) {
    logger.error('管理员认证失败:', error);
    res.status(401).json(
      errorResponse('ADMIN_UNAUTHORIZED', '认证失败')
    );
  }
};

/**
 * 可选的管理员认证中间件
 * 如果提供了 token 且是管理员，则设置 isAdmin 标志
 * 不会阻止非管理员访问
 */
export const optionalAdminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers['x-liu-token'] as string ||
      req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      (req as any).isAdmin = false;
      next();
      return;
    }

    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      (req as any).isAdmin = false;
      next();
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      (req as any).isAdmin = false;
      next();
      return;
    }

    req.userId = decoded.userId;
    (req as any).user = user;
    (req as any).isAdmin = user.role === UserRole.ADMIN;

    next();
  } catch (error) {
    (req as any).isAdmin = false;
    next();
  }
};

export default adminAuthMiddleware;
