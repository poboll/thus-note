import VerificationCode, { IVerificationCode, VerificationCodeType } from '../models/VerificationCode';
import { SMSServiceFactory } from './smsService';
import { logger } from '../config/logger';

/**
 * 验证码服务错误
 */
export class VerificationCodeError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'VerificationCodeError';
    this.code = code;
  }
}

/**
 * 验证码发送结果
 */
export interface SendCodeResult {
  success: boolean;
  expiresIn: number; // 秒
  message?: string;
}

/**
 * 验证码验证结果
 */
export interface VerifyCodeResult {
  success: boolean;
  message?: string;
  remainingAttempts?: number;
}

/**
 * 验证码服务
 */
export class VerificationCodeService {
  // 验证码有效期（秒）
  private static readonly CODE_EXPIRY = 5 * 60; // 5分钟
  
  // 发送间隔（秒）
  private static readonly SEND_INTERVAL = 60; // 1分钟
  
  // 最大错误次数
  private static readonly MAX_ATTEMPTS = 5;
  
  // 锁定时间（秒）
  private static readonly LOCK_DURATION = 30 * 60; // 30分钟

  /**
   * 生成6位数字验证码
   */
  static generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码
   */
  static async sendCode(
    phone: string,
    type: VerificationCodeType
  ): Promise<SendCodeResult> {
    try {
      // 验证手机号格式
      if (!this.isValidPhone(phone)) {
        return {
          success: false,
          expiresIn: 0,
          message: '无效的手机号格式',
        };
      }

      // 检查是否被锁定
      const isLocked = await this.isPhoneLocked(phone, type);
      if (isLocked) {
        return {
          success: false,
          expiresIn: 0,
          message: '该手机号已被临时锁定，请稍后再试',
        };
      }

      // 检查发送间隔
      const canSend = await this.canSendCode(phone, type);
      if (!canSend.allowed) {
        return {
          success: false,
          expiresIn: 0,
          message: `请在 ${canSend.waitSeconds} 秒后重试`,
        };
      }

      // 生成验证码
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY * 1000);

      // 删除旧的验证码
      await VerificationCode.deleteMany({ phone, type });

      // 保存新验证码
      await VerificationCode.create({
        phone,
        code,
        type,
        expiresAt,
        attempts: 0,
        maxAttempts: this.MAX_ATTEMPTS,
      });

      // 发送短信
      const smsService = await SMSServiceFactory.getInstance();
      const smsResult = await smsService.sendVerificationCode(phone, code);

      if (!smsResult.success) {
        logger.error(`验证码发送失败: ${phone}`, smsResult.error);
        return {
          success: false,
          expiresIn: 0,
          message: smsResult.error || '验证码发送失败',
        };
      }

      logger.info(`验证码已发送: ${phone}, 类型: ${type}`);
      
      return {
        success: true,
        expiresIn: this.CODE_EXPIRY,
        message: '验证码已发送',
      };
    } catch (error: any) {
      logger.error('发送验证码失败:', error);
      return {
        success: false,
        expiresIn: 0,
        message: error.message || '发送验证码失败',
      };
    }
  }

  /**
   * 验证验证码
   */
  static async verifyCode(
    phone: string,
    code: string,
    type: VerificationCodeType
  ): Promise<VerifyCodeResult> {
    try {
      // 检查是否被锁定
      const isLocked = await this.isPhoneLocked(phone, type);
      if (isLocked) {
        return {
          success: false,
          message: '该手机号已被临时锁定，请稍后再试',
        };
      }

      // 查找验证码记录
      const record = await VerificationCode.findOne({
        phone,
        type,
        verified: false,
      });

      if (!record) {
        return {
          success: false,
          message: '验证码不存在或已过期，请重新获取',
        };
      }

      // 检查是否过期
      if (new Date() > record.expiresAt) {
        await VerificationCode.deleteOne({ _id: record._id });
        return {
          success: false,
          message: '验证码已过期，请重新获取',
        };
      }

      // 检查验证码是否正确
      if (record.code !== code) {
        // 增加错误次数
        record.attempts += 1;
        
        // 检查是否超过最大错误次数
        if (record.attempts >= record.maxAttempts) {
          // 锁定手机号
          record.lockedUntil = new Date(Date.now() + this.LOCK_DURATION * 1000);
          await record.save();
          
          logger.warn(`手机号已被锁定: ${phone}`);
          
          return {
            success: false,
            message: '错误次数过多，该手机号已被临时锁定',
            remainingAttempts: 0,
          };
        }
        
        await record.save();
        
        return {
          success: false,
          message: '验证码错误',
          remainingAttempts: record.maxAttempts - record.attempts,
        };
      }

      // 验证成功，标记为已验证
      record.verified = true;
      await record.save();

      logger.info(`验证码验证成功: ${phone}, 类型: ${type}`);

      return {
        success: true,
        message: '验证成功',
      };
    } catch (error: any) {
      logger.error('验证验证码失败:', error);
      return {
        success: false,
        message: error.message || '验证失败',
      };
    }
  }

  /**
   * 检查手机号是否被锁定
   */
  static async isPhoneLocked(phone: string, type: VerificationCodeType): Promise<boolean> {
    const record = await VerificationCode.findOne({
      phone,
      type,
      lockedUntil: { $gt: new Date() },
    });
    
    return !!record;
  }

  /**
   * 检查是否可以发送验证码
   */
  static async canSendCode(
    phone: string,
    type: VerificationCodeType
  ): Promise<{ allowed: boolean; waitSeconds: number }> {
    const record = await VerificationCode.findOne({
      phone,
      type,
    }).sort({ createdAt: -1 });

    if (!record) {
      return { allowed: true, waitSeconds: 0 };
    }

    const timeSinceLastSend = (Date.now() - record.createdAt.getTime()) / 1000;
    
    if (timeSinceLastSend < this.SEND_INTERVAL) {
      return {
        allowed: false,
        waitSeconds: Math.ceil(this.SEND_INTERVAL - timeSinceLastSend),
      };
    }

    return { allowed: true, waitSeconds: 0 };
  }

  /**
   * 验证手机号格式
   */
  static isValidPhone(phone: string): boolean {
    // 中国大陆手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 清理过期验证码
   */
  static async cleanupExpired(): Promise<number> {
    const result = await VerificationCode.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    
    if (result.deletedCount > 0) {
      logger.info(`已清理 ${result.deletedCount} 条过期验证码`);
    }
    
    return result.deletedCount;
  }

  /**
   * 解锁手机号
   */
  static async unlockPhone(phone: string, type: VerificationCodeType): Promise<boolean> {
    const result = await VerificationCode.updateMany(
      { phone, type },
      { $unset: { lockedUntil: 1 }, $set: { attempts: 0 } }
    );
    
    return result.modifiedCount > 0;
  }
}

export default VerificationCodeService;
