import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * 安全中间件配置
 */

// Helmet安全头
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
});

// 请求频率限制
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
  message: {
    code: 'E0001',
    errMsg: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 严格的API请求频率限制
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 30, // 限制每个IP 30个API请求
  message: {
    code: 'E0001',
    errMsg: 'API请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录请求频率限制
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 5次登录尝试
  message: {
    code: 'E0001',
    errMsg: '登录尝试过于频繁，请15分钟后再试',
  },
  skipSuccessfulRequests: true,
});

/**
 * XSS防护中间件
 */
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  // 清理请求体中的XSS攻击
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

/**
 * 清理对象中的XSS攻击
 */
function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * 清理字符串中的XSS攻击
 */
function sanitizeString(str: string): string {
  return str
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * SQL注入防护中间件
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION',
    'OR', 'AND', 'WHERE', 'EXEC', 'XP_', 'SP_',
  ];

  const checkSQLInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      return sqlKeywords.some(keyword => upperValue.includes(keyword));
    }
    return false;
  };

  if (req.body) {
    for (const key in req.body) {
      if (checkSQLInjection(req.body[key])) {
        return res.status(400).json({
          code: 'E0002',
          errMsg: '检测到非法输入',
        });
      }
    }
  }

  if (req.query) {
    for (const key in req.query) {
      if (checkSQLInjection(req.query[key])) {
        return res.status(400).json({
          code: 'E0002',
          errMsg: '检测到非法输入',
        });
      }
    }
  }

  next();
};
