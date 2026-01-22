import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserStatus } from '../models/User';
import { JWTUtils } from '../utils/jwt';
import { successResponse, errorResponse } from '../types/api.types';
import User from '../models/User';
import Space, { SpaceType, SpaceStatus } from '../models/Space';
import Member, { MemberStatus } from '../models/Member';
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
 * 获取或创建用户的 spaceMemberList
 * 如果用户没有任何 space，则创建一个默认的个人空间
 */
async function getOrCreateSpaceMemberList(userId: Types.ObjectId) {
  // 查找用户的所有成员记录
  let members = await Member.find({
    userId,
    status: MemberStatus.OK
  }).exec();

  // 如果没有成员记录，创建默认的个人空间
  if (members.length === 0) {
    // 创建个人空间
    const space = new Space({
      ownerId: userId,
      spaceType: SpaceType.ME,
      status: SpaceStatus.OK,
    });
    await space.save();

    // 创建成员记录
    const member = new Member({
      spaceId: space._id,
      userId,
      status: MemberStatus.OK,
    });
    await member.save();

    members = [member];
  }

  // 获取所有相关的空间信息
  const spaceIds = members.map(m => m.spaceId);
  const spaces = await Space.find({ _id: { $in: spaceIds } }).exec();
  const spaceMap = new Map(spaces.map(s => [s._id.toString(), s]));

  // 构建 spaceMemberList
  const spaceMemberList = members.map(member => {
    const space = spaceMap.get(member.spaceId.toString());
    return {
      memberId: member._id.toString(),
      member_name: member.name,
      member_avatar: member.avatar,
      member_oState: member.status,
      member_config: member.config,
      member_notification: member.notification,
      spaceId: member.spaceId.toString(),
      spaceType: space?.spaceType || SpaceType.ME,
      space_oState: space?.status || SpaceStatus.OK,
      space_owner: space?.ownerId.toString() || userId.toString(),
      space_name: space?.name,
      space_avatar: space?.avatar,
      space_stateConfig: space?.stateConfig,
      space_tagList: space?.tagList,
      space_config: space?.config,
    };
  });

  return spaceMemberList;
}

/**
 * 生成登录成功响应
 */
async function generateLoginResponse(user: any) {
  // 生成令牌
  const tokenPair = await JWTUtils.generateTokenPair(user._id);

  // 获取或创建 spaceMemberList
  const spaceMemberList = await getOrCreateSpaceMemberList(user._id);

  // 生成 serial_id
  const serial_id = crypto.randomBytes(16).toString('hex');

  return {
    userId: user._id.toString(),
    token: tokenPair.accessToken,
    serial_id,
    spaceMemberList,
    email: user.email,
    theme: user.settings?.theme || 'system',
    language: user.settings?.language || 'system',
  };
}

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

  // 解密并存储 client_key（用于后续加密通信）
  if (enc_client_key && privateKey) {
    const clientKey = await decryptWithRSA(enc_client_key, privateKey);
    if (clientKey) {
      // 存储 client_key 到 Redis，关联用户 ID，有效期 7 天
      const clientKeyRedisKey = `client_key:${user._id.toString()}`;
      await redisClient.set(clientKeyRedisKey, clientKey, 'EX', 7 * 24 * 60 * 60);
      console.log(`✅ 已存储用户 ${user._id} 的 client_key`);
    }
  }

  // 生成登录响应
  const loginData = await generateLoginResponse(user);

  return res.json(successResponse(loginData));
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

  // 解密并存储 client_key（用于后续加密通信）
  if (enc_client_key && privateKey) {
    const clientKey = await decryptWithRSA(enc_client_key, privateKey);
    if (clientKey) {
      // 存储 client_key 到 Redis，关联用户 ID，有效期 7 天
      const clientKeyRedisKey = `client_key:${user._id.toString()}`;
      await redisClient.set(clientKeyRedisKey, clientKey, 'EX', 7 * 24 * 60 * 60);
      console.log(`✅ 已存储用户 ${user._id} 的 client_key (短信登录)`);
    }
  }

  // 生成登录响应
  const loginData = await generateLoginResponse(user);

  return res.json(successResponse(loginData));
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

  // 生成登录响应
  const loginData = await generateLoginResponse(user);

  return res.json(successResponse(loginData));
}

export default router;
