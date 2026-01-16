import { getRedisClient } from '../config/redis';

/**
 * 验证码类型
 */
export enum VerificationCodeType {
  EMAIL = 'email',
  PHONE = 'phone',
}

/**
 * 验证码接口
 */
export interface IVerificationCode {
  code: string;
  phone?: string;
  email?: string;
  type: VerificationCodeType;
  expiresAt: number; // 过期时间戳（毫秒）
  createdAt: number; // 创建时间戳（毫秒）
}

/**
 * Redis 键前缀
 */
const REDIS_KEY_PREFIX = 'verification_code:';

/**
 * 生成 Redis 键
 */
function getRedisKey(type: VerificationCodeType, identifier: string): string {
  return `${REDIS_KEY_PREFIX}${type}:${identifier}`;
}

/**
 * 保存验证码到 Redis
 */
export async function saveVerificationCode(
  type: VerificationCodeType,
  identifier: string,
  code: string,
  expiresInMinutes: number = 5,
): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const key = getRedisKey(type, identifier);
    const now = Date.now();
    const expiresAt = now + expiresInMinutes * 60 * 1000;

    const verificationCode: IVerificationCode = {
      code,
      type,
      expiresAt,
      createdAt: now,
    };

    if (type === VerificationCodeType.EMAIL) {
      (verificationCode as any).email = identifier;
    } else if (type === VerificationCodeType.PHONE) {
      (verificationCode as any).phone = identifier;
    }

    // 保存到 Redis，设置过期时间
    await redisClient.set(
      key,
      JSON.stringify(verificationCode),
      'EX',
      expiresInMinutes * 60
    );

    return true;
  } catch (error) {
    console.error('保存验证码失败:', error);
    return false;
  }
}

/**
 * 验证验证码
 */
export async function verifyCode(
  type: VerificationCodeType,
  identifier: string,
  code: string,
): Promise<{ valid: boolean; message?: string }> {
  try {
    const redisClient = getRedisClient();
    const key = getRedisKey(type, identifier);
    const data = await redisClient.get(key);

    if (!data) {
      return { valid: false, message: '验证码不存在或已过期' };
    }

    const verificationCode: IVerificationCode = JSON.parse(data);
    const now = Date.now();

    // 检查验证码是否过期
    if (now > verificationCode.expiresAt) {
      // 删除过期的验证码
      await redisClient.del(key);
      return { valid: false, message: '验证码已过期' };
    }

    // 验证验证码是否匹配
    if (verificationCode.code !== code) {
      return { valid: false, message: '验证码错误' };
    }

    // 验证成功，删除验证码
    await redisClient.del(key);

    return { valid: true };
  } catch (error) {
    console.error('验证验证码失败:', error);
    return { valid: false, message: '验证验证码失败' };
  }
}

/**
 * 删除验证码
 */
export async function deleteVerificationCode(
  type: VerificationCodeType,
  identifier: string,
): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const key = getRedisKey(type, identifier);
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('删除验证码失败:', error);
    return false;
  }
}

/**
 * 检查验证码是否存在
 */
export async function checkVerificationCodeExists(
  type: VerificationCodeType,
  identifier: string,
): Promise<boolean> {
  try {
    const redisClient = getRedisClient();
    const key = getRedisKey(type, identifier);
    const data = await redisClient.get(key);
    return !!data;
  } catch (error) {
    console.error('检查验证码失败:', error);
    return false;
  }
}
