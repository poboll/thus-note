import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { TokenType } from '../models/Token';
import Token from '../models/Token';

/**
 * JWT配置
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

/**
 * JWT载荷接口
 */
export interface JWTPayload {
  userId: string;
  type: TokenType;
  iat?: number;
  exp?: number;
}

/**
 * 令牌对接口
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * JWT工具类
 */
export class JWTUtils {
  /**
   * 生成访问令牌
   */
  static generateAccessToken(userId: Types.ObjectId): string {
    return jwt.sign(
      {
        userId: userId.toString(),
        type: TokenType.ACCESS,
      } as JWTPayload,
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES } as SignOptions
    );
  }

  /**
   * 生成刷新令牌
   */
  static generateRefreshToken(userId: Types.ObjectId): string {
    return jwt.sign(
      {
        userId: userId.toString(),
        type: TokenType.REFRESH,
      } as JWTPayload,
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES } as SignOptions
    );
  }

  /**
   * 生成令牌对
   */
  static async generateTokenPair(userId: Types.ObjectId): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // 解析访问令牌获取过期时间
    const decoded = jwt.decode(accessToken) as JWTPayload;
    const expiresIn = (decoded.exp || 0) - (decoded.iat || 0);

    // 保存刷新令牌到数据库
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天
    await Token.create({
      userId,
      token: refreshToken,
      type: TokenType.REFRESH,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * 验证令牌
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * 解码令牌（不验证）
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * 撤销刷新令牌
   */
  static async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    const tokenDoc = await Token.findOne({
      token: refreshToken,
      type: TokenType.REFRESH,
    });

    if (tokenDoc) {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
      return true;
    }

    return false;
  }

  /**
   * 刷新令牌
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
    // 验证刷新令牌
    const payload = this.verifyToken(refreshToken);
    if (!payload || payload.type !== TokenType.REFRESH) {
      return null;
    }

    // 检查令牌是否在数据库中且有效
    const tokenDoc = await (Token as any).findValid(refreshToken, TokenType.REFRESH);
    if (!tokenDoc) {
      return null;
    }

    // 撤销旧的刷新令牌
    await this.revokeRefreshToken(refreshToken);

    // 生成新的令牌对
    const userId = new Types.ObjectId(payload.userId);
    return this.generateTokenPair(userId);
  }

  /**
   * 撤销用户的所有令牌
   */
  static async revokeAllUserTokens(userId: Types.ObjectId): Promise<void> {
    await (Token as any).revokeAllByUser(userId, TokenType.REFRESH);
  }

  /**
   * 生成随机密钥
   */
  static generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * 清理过期令牌
   */
  static async cleanupExpiredTokens(): Promise<number> {
    return await (Token as any).cleanupExpired();
  }
}
