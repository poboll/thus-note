import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserStatus } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { successResponse, errorResponse } from '../types/api.types';
import User from '../models/User';
import { getRedisClient } from '../config/redis';
import { EmailService } from '../services/emailService';
import { SMSService } from '../services/smsService';
import crypto from 'crypto';
import { PasswordUtil } from '../utils/password';

const router = Router();

// 验证码有效期（5分钟）
const CODE_EXPIRE_TIME = 5 * 60;
// 验证码长度
const CODE_LENGTH = 6;

/**
 * 生成随机验证码
 */
function generateVerificationCode(length: number): string {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 统一的登录路由处理器
 * POST /user-login
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { operateType } = req.body;

    // 根据操作类型分发到不同的处理逻辑
    switch (operateType) {
      case 'init':
        return handleInit(req, res);
      case 'email':
        return handleSendEmailCode(req, res);
      case 'email_code':
        return handleEmailCodeLogin(req, res);
      case 'phone':
        return handleSendSMSCode(req, res);
      case 'phone_code':
        return handleSMSCodeLogin(req, res);
      case 'github':
      case 'google':
      case 'wechat':
        return handleOAuthLogin(req, res);
      case 'users_select':
        return handleUserSelect(req, res);
      default:
        return res.status(400).json(
          errorResponse('BAD_REQUEST', '不支持的操作类型')
        );
    }
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '操作失败')
    );
  }
});

/**
 * 初始化登录
 */
async function handleInit(req: Request, res: Response) {
  // 生成state（用于防止CSRF攻击）
  const state = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // 生成真实的 RSA 公钥
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // 将私钥存储到 Redis（用于后续解密）
  const redisClient = getRedisClient();
  const privateKeyKey = `rsa_private_key:${state}`;
  await redisClient.set(privateKeyKey, privateKey, 'EX', 300); // 5分钟过期

  // 获取OAuth客户端ID（从环境变量读取）
  const githubOAuthClientId = process.env.GITHUB_CLIENT_ID || '';
  const googleOAuthClientId = process.env.GOOGLE_CLIENT_ID || '';
  const wxGzhAppid = process.env.WECHAT_APPID || '';

  return res.json(
    successResponse({
      state,
      publicKey,
      githubOAuthClientId,
      googleOAuthClientId,
      wxGzhAppid,
    })
  );
}

/**
 * 使用 RSA 私钥解密数据
 */
async function decryptWithRSA(encryptedData: string, privateKey: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      buffer
    );
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('RSA 解密失败:', error);
    return null;
  }
}

/**
 * 发送邮箱验证码
 */
async function handleSendEmailCode(req: Request, res: Response) {
  const { enc_email, state } = req.body;

  // 从 Redis 获取私钥
  const redisClient = getRedisClient();
  const privateKeyKey = `rsa_private_key:${state}`;
  const privateKey = await redisClient.get(privateKeyKey);

  if (!privateKey) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '会话已过期，请刷新页面')
    );
  }

  // 使用 RSA 私钥解密邮箱
  const email = await decryptWithRSA(enc_email, privateKey);
  if (!email) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '解密失败')
    );
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '邮箱格式不正确')
    );
  }

  // 检查邮箱是否被禁用（例如： bounced, complained）
  // 这里简化处理，实际应该查询数据库
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user && user.status === UserStatus.BANNED) {
    return res.status(403).json(
      errorResponse('FORBIDDEN', '该邮箱已被禁用')
    );
  }

  // 检查发送频率（使用Redis）
  const rateLimitKey = `email_code_rate:${email}`;
  const lastSent = await redisClient.get(rateLimitKey);

  if (lastSent) {
    const timeDiff = Date.now() - parseInt(lastSent);
    if (timeDiff < 20000) { // 20秒内不能重复发送
      return res.status(429).json(
        errorResponse('TOO_MANY_REQUESTS', '发送过于频繁，请稍后再试')
      );
    }
  }

  // 生成验证码
  const code = generateVerificationCode(CODE_LENGTH);

  // 存储验证码到Redis（5分钟过期）
  const codeKey = `email_code:${email}`;
  await redisClient.setex(codeKey, CODE_EXPIRE_TIME, code);
  await redisClient.set(rateLimitKey, Date.now().toString(), 'EX', 60); // 60秒内只能发送一次

  // 发送邮件
  try {
    const emailService = new EmailService();
    await emailService.sendVerificationCode(email, code);
  } catch (emailError: any) {
    console.error('发送邮件失败:', emailError);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', '发送验证码失败，请稍后再试')
    );
  }

  return res.json(
    successResponse({
      message: '验证码已发送',
    })
  );
}

/**
 * 使用邮箱验证码登录
 */
async function handleEmailCodeLogin(req: Request, res: Response) {
  const { enc_email, email_code, state, enc_client_key } = req.body;

  // 从 Redis 获取私钥
  const redisClient = getRedisClient();
  const privateKeyKey = `rsa_private_key:${state}`;
  const privateKey = await redisClient.get(privateKeyKey);

  if (!privateKey) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '会话已过期，请刷新页面')
    );
  }

  // 使用 RSA 私钥解密邮箱
  const email = await decryptWithRSA(enc_email, privateKey);
  if (!email) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '解密失败')
    );
  }

  // 验证验证码
  const codeKey = `email_code:${email}`;
  const storedCode = await redisClient.get(codeKey);

  if (!storedCode || storedCode !== email_code) {
    return res.status(401).json(
      errorResponse('UNAUTHORIZED', '验证码错误或已过期')
    );
  }

  // 删除已使用的验证码
  await redisClient.del(codeKey);

  // 查找或创建用户
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // 创建新用户
    user = new User({
      username: email.split('@')[0],
      email: email.toLowerCase(),
      status: UserStatus.ACTIVE,
    });
    await user.save();
  }

  // 检查用户状态
  if (user.status !== UserStatus.ACTIVE) {
    return res.status(403).json(
      errorResponse('FORBIDDEN', '账户已被禁用或删除')
    );
  }

  // 更新最后登录时间
  user.lastLoginAt = new Date();
  await user.save();

  // 生成令牌
  const tokenPair = await JWTUtils.generateTokenPair(user._id);

  return res.json(
    successResponse({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      ...tokenPair,
    })
  );
}

/**
 * 发送短信验证码
 */
async function handleSendSMSCode(req: Request, res: Response) {
  const { enc_phone, state } = req.body;

  // 从 Redis 获取私钥
  const redisClient = getRedisClient();
  const privateKeyKey = `rsa_private_key:${state}`;
  const privateKey = await redisClient.get(privateKeyKey);

  if (!privateKey) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '会话已过期，请刷新页面')
    );
  }

  // 使用 RSA 私钥解密手机号
  const phone = await decryptWithRSA(enc_phone, privateKey);
  if (!phone) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '解密失败')
    );
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '手机号格式不正确')
    );
  }

  // 检查发送频率（使用Redis）
  const rateLimitKey = `sms_code_rate:${phone}`;
  const lastSent = await redisClient.get(rateLimitKey);

  if (lastSent) {
    const timeDiff = Date.now() - parseInt(lastSent);
    if (timeDiff < 60000) { // 60秒内不能重复发送
      return res.status(429).json(
        errorResponse('TOO_MANY_REQUESTS', '发送过于频繁，请稍后再试')
      );
    }
  }

  // 生成验证码
  const code = generateVerificationCode(CODE_LENGTH);

  // 存储验证码到Redis（5分钟过期）
  const codeKey = `sms_code:${phone}`;
  await redisClient.setex(codeKey, CODE_EXPIRE_TIME, code);
  await redisClient.set(rateLimitKey, Date.now().toString(), 'EX', 60); // 60秒内只能发送一次

  // 发送短信
  try {
    const smsService = new SMSService();
    await smsService.sendVerificationCode(phone, code);
  } catch (smsError: any) {
    console.error('发送短信失败:', smsError);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', '发送验证码失败，请稍后再试')
    );
  }

  return res.json(
    successResponse({
      message: '验证码已发送',
    })
  );
}

/**
 * 使用短信验证码登录
 */
async function handleSMSCodeLogin(req: Request, res: Response) {
  const { enc_phone, phone_code, state, enc_client_key } = req.body;

  // 从 Redis 获取私钥
  const redisClient = getRedisClient();
  const privateKeyKey = `rsa_private_key:${state}`;
  const privateKey = await redisClient.get(privateKeyKey);

  if (!privateKey) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '会话已过期，请刷新页面')
    );
  }

  // 使用 RSA 私钥解密手机号
  const phone = await decryptWithRSA(enc_phone, privateKey);
  if (!phone) {
    return res.status(400).json(
      errorResponse('BAD_REQUEST', '解密失败')
    );
  }

  // 验证验证码
  const codeKey = `sms_code:${phone}`;
  const storedCode = await redisClient.get(codeKey);

  if (!storedCode || storedCode !== phone_code) {
    return res.status(401).json(
      errorResponse('UNAUTHORIZED', '验证码错误或已过期')
    );
  }

  // 删除已使用的验证码
  await redisClient.del(codeKey);

  // 查找或创建用户
  let user = await User.findOne({ phone });
  if (!user) {
    // 创建新用户
    user = new User({
      username: `user_${phone.slice(-4)}`,
      phone,
      status: UserStatus.ACTIVE,
    });
    await user.save();
  }

  // 检查用户状态
  if (user.status !== UserStatus.ACTIVE) {
    return res.status(403).json(
      errorResponse('FORBIDDEN', '账户已被禁用或删除')
    );
  }

  // 更新最后登录时间
  user.lastLoginAt = new Date();
  await user.save();

  // 生成令牌
  const tokenPair = await JWTUtils.generateTokenPair(user._id);

  return res.json(
    successResponse({
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        avatar: user.avatar,
      },
      ...tokenPair,
    })
  );
}

/**
 * OAuth登录（GitHub/Google/微信）
 */
async function handleOAuthLogin(req: Request, res: Response) {
  const { operateType, oauth_code, state, enc_client_key, oauth_redirect_uri } = req.body;

  // TODO: 实现OAuth流程
  // 1. 使用oauth_code换取access_token
  // 2. 获取用户信息
  // 3. 查找或创建用户
  // 4. 生成JWT令牌

  return res.json(
    successResponse({
      message: `${operateType} OAuth功能待实现`,
    })
  );
}

/**
 * 选择账号登录（多账号情况）
 */
async function handleUserSelect(req: Request, res: Response) {
  const { userId, multi_credential, multi_credential_id, state, enc_client_key } = req.body;

  // 查找用户
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json(
      errorResponse('NOT_FOUND', '用户不存在')
    );
  }

  // 检查用户状态
  if (user.status !== UserStatus.ACTIVE) {
    return res.status(403).json(
      errorResponse('FORBIDDEN', '账户已被禁用或删除')
    );
  }

  // 更新最后登录时间
  user.lastLoginAt = new Date();
  await user.save();

  // 生成令牌
  const tokenPair = await JWTUtils.generateTokenPair(user._id);

  return res.json(
    successResponse({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
      ...tokenPair,
    })
  );
}

export default router;
