import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { JWTUtils, JWTPayload } from '../utils/jwt';
import { TokenType } from '../models/Token';
import { errorResponse } from '../types/api.types';
import User, { UserRole } from '../models/User';

/**
 * 扩展Express Request接口，添加用户信息
 */
declare global {
  namespace Express {
    interface Request {
      userId?: Types.ObjectId;
      userPayload?: JWTPayload;
    }
  }
}

/**
 * 认证中间件
 * 验证JWT令牌并提取用户信息
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 从Authorization头获取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(
        errorResponse('UNAUTHORIZED', '未提供认证令牌')
      );
      return;
    }

    const token = authHeader.substring(7); // 移除"Bearer "前缀

    // 验证令牌
    const payload = JWTUtils.verifyToken(token);
    if (!payload) {
      res.status(401).json(errorResponse('UNAUTHORIZED', '无效或过期的令牌'));
      return;
    }

    // 检查令牌类型
    if (payload.type !== TokenType.ACCESS) {
      res.status(401).json(
        errorResponse('UNAUTHORIZED', '令牌类型错误')
      );
      return;
    }

    // 将用户信息添加到请求对象
    req.userId = new Types.ObjectId(payload.userId);
    req.userPayload = payload;

    next();
  } catch (error) {
    res.status(500).json(
      errorResponse('INTERNAL_ERROR', '认证过程中发生错误')
    );
  }
};

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行
 */
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = JWTUtils.verifyToken(token);

    if (payload && payload.type === TokenType.ACCESS) {
      req.userId = new Types.ObjectId(payload.userId);
      req.userPayload = payload;
    }

    next();
  } catch (error) {
    // 可选认证失败不阻止请求
    next();
  }
};

/**
 * 角色检查中间件（预留）
 */
export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userId) {
      res.status(401).json(errorResponse('UNAUTHORIZED', '未认证'));
      return;
    }

    try {
      // 获取用户信息
      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
        return;
      }

      // 检查用户角色是否在允许的角色列表中
      if (!allowedRoles.includes(user.role)) {
        res.status(403).json(
          errorResponse('FORBIDDEN', '权限不足，需要以下角色之一: ' + allowedRoles.join(', '))
        );
        return;
      }

      next();
    } catch (error) {
      console.error('角色检查失败:', error);
      res.status(500).json(errorResponse('INTERNAL_ERROR', '角色检查失败'));
    }
  };
};
