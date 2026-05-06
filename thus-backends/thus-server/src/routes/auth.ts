import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { OAuthProvider, UserStatus } from '../models/User';
import { MemberStatus } from '../models/Member';
import { SpaceType, SpaceStatus } from '../models/Space';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtil } from '../utils/password';
import { verifyCode, VerificationCodeType, saveVerificationCode } from '../utils/verificationCode';
import { GitHubOAuth, GoogleOAuth, WeChatOAuth } from '../utils/oauth';
import { successResponse, errorResponse, passResponse } from '../types/api.types';
import User from '../models/User';
import Member from '../models/Member';
import Space from '../models/Space';
import { authMiddleware } from '../middleware/auth';
import { sendEmail } from '../utils/email';
import { sendSMS } from '../utils/sms';
import { getRedisClient } from '../config/redis';
import { saveUserClientKey } from '../utils/clientKeyStore';

const router = Router();

/**
 * 获取 GitHub OAuth 授权 URL
 * GET /api/auth/github/url
 */
router.get('/github/url', (req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(2, 15);
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_OAUTH_CONFIG.clientId}&redirect_uri=${encodeURIComponent(GITHUB_OAUTH_CONFIG.redirectUri)}&scope=user:email&state=${state}`;
  return res.json(successResponse({ url, state }));
});

// OAuth 配置
const GITHUB_OAUTH_CONFIG = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5175/auth/github/callback',
};

const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5175/auth/google/callback',
};

const WECHAT_OAUTH_CONFIG = {
  appId: process.env.WECHAT_APP_ID,
  appSecret: process.env.WECHAT_APP_SECRET,
  redirectUri: process.env.WECHAT_REDIRECT_URI || 'http://localhost:5175/auth/wechat/callback',
};

/**
 * GitHub OAuth登录
 * POST /api/auth/github
 */
router.post('/github', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少授权码')
      );
    }

    // 1. 使用code换取access_token
    const accessToken = await GitHubOAuth.exchangeCodeForToken(code);

    // 2. 获取用户信息
    const userInfo = await GitHubOAuth.getUserInfo(accessToken);

    // 3. 查找或创建用户
    let user = await User.findOne({
      'oauthAccounts.provider': OAuthProvider.GITHUB,
      'oauthAccounts.providerId': userInfo.id.toString(),
    });

    if (!user) {
      // 创建新用户
      const oauthAccount = GitHubOAuth.createOAuthAccount(userInfo, accessToken);
      user = new User({
        username: userInfo.login,
        email: userInfo.email,
        avatar: userInfo.avatar_url,
        status: UserStatus.ACTIVE,
        oauthAccounts: [oauthAccount],
      });
      await user.save();
    } else {
      // 更新 OAuth 账号信息
      const oauthIndex = user.oauthAccounts.findIndex(
        acc => acc.provider === OAuthProvider.GITHUB
      );
      if (oauthIndex !== -1) {
        user.oauthAccounts[oauthIndex] = GitHubOAuth.createOAuthAccount(userInfo, accessToken);
        await user.save();
      }
    }

    // 4. 生成JWT令牌
    const tokenPair = await JWTUtils.generateTokenPair(user._id);

    // 查询用户的空间成员列表
    const members = await Member.find({
      userId: user._id,
      status: MemberStatus.OK,
    }).populate('spaceId');

    // 格式化空间成员列表以匹配前端的 ThusSpaceAndMember 接口
    const spaceMemberList = members
      .filter(member => member.spaceId && (member.spaceId as any).status === SpaceStatus.OK)
      .map(member => {
        const space = member.spaceId as any;
        return {
          memberId: member._id.toString(),
          member_name: member.name,
          member_avatar: member.avatar,
          member_oState: member.status,
          member_config: member.config,
          member_notification: member.notification,
          spaceId: space._id.toString(),
          spaceType: space.spaceType,
          space_oState: space.status,
          space_owner: space.ownerId.toString(),
          space_name: space.name,
          space_avatar: space.avatar,
          space_stateConfig: space.stateConfig,
          space_tagList: space.tagList,
          space_config: space.config,
        };
      });

    // 返回前端期望的 Res_UserLoginNormal 格式
    return res.json({
      code: "0000",
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        token: tokenPair.accessToken,
        serial_id: tokenPair.refreshToken,
        theme: user.settings?.theme || "light",
        language: user.settings?.language || "zh-Hans",
        spaceMemberList,
        open_id: userInfo.id.toString(),
        github_id: userInfo.id,
      },
    });
  } catch (error: any) {
    console.error('GitHub OAuth登录失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'GitHub登录失败')
    );
  }
});

/**
 * 获取 Google OAuth 授权 URL
 * GET /api/auth/google/url
 */
router.get('/google/url', (req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(2, 15);
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_OAUTH_CONFIG.clientId}&redirect_uri=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}`;
  return res.json(successResponse({ url, state }));
});

/**
 * Google OAuth登录
 * POST /api/auth/google
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少ID令牌')
      );
    }

    // 1. 验证idToken并获取用户信息
    const userInfo = await GoogleOAuth.getUserInfo(idToken);

    // 2. 查找或创建用户
    let user = await User.findOne({
      'oauthAccounts.provider': OAuthProvider.GOOGLE,
      'oauthAccounts.providerId': userInfo.sub,
    });

    if (!user) {
      // 创建新用户
      const oauthAccount = GoogleOAuth.createOAuthAccount(userInfo, userInfo.sub);
      user = new User({
        username: userInfo.name || userInfo.email.split('@')[0],
        email: userInfo.email,
        avatar: userInfo.picture,
        status: UserStatus.ACTIVE,
        oauthAccounts: [oauthAccount],
      });
      await user.save();
    } else {
      // 更新 OAuth 账号信息
      const oauthIndex = user.oauthAccounts.findIndex(
        acc => acc.provider === OAuthProvider.GOOGLE
      );
      if (oauthIndex !== -1) {
        user.oauthAccounts[oauthIndex] = GoogleOAuth.createOAuthAccount(userInfo, userInfo.sub);
        await user.save();
      }
    }

    // 3. 生成JWT令牌
    const tokenPair = await JWTUtils.generateTokenPair(user._id);

    // 查询用户的空间成员列表
    const members = await Member.find({
      userId: user._id,
      status: MemberStatus.OK,
    }).populate('spaceId');

    // 格式化空间成员列表以匹配前端的 ThusSpaceAndMember 接口
    const spaceMemberList = members
      .filter(member => member.spaceId && (member.spaceId as any).status === SpaceStatus.OK)
      .map(member => {
        const space = member.spaceId as any;
        return {
          memberId: member._id.toString(),
          member_name: member.name,
          member_avatar: member.avatar,
          member_oState: member.status,
          member_config: member.config,
          member_notification: member.notification,
          spaceId: space._id.toString(),
          spaceType: space.spaceType,
          space_oState: space.status,
          space_owner: space.ownerId.toString(),
          space_name: space.name,
          space_avatar: space.avatar,
          space_stateConfig: space.stateConfig,
          space_tagList: space.tagList,
          space_config: space.config,
        };
      });

    // 返回前端期望的 Res_UserLoginNormal 格式
    return res.json({
      code: "0000",
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        token: tokenPair.accessToken,
        serial_id: tokenPair.refreshToken,
        theme: user.settings?.theme || "light",
        language: user.settings?.language || "zh-Hans",
        spaceMemberList,
        open_id: userInfo.sub,
      },
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'Google登录失败')
    );
  }
});

/**
 * 获取微信公众号 OAuth 授权 URL
 * GET /api/auth/wechat/url
 */
router.get('/wechat/url', (req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(2, 15);
  const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_OAUTH_CONFIG.appId}&redirect_uri=${encodeURIComponent(WECHAT_OAUTH_CONFIG.redirectUri)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
  return res.json(successResponse({ url, state }));
});

/**
 * 微信公众号OAuth登录
 * POST /api/auth/wechat/gzh
 */
router.post('/wechat/gzh', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少授权码')
      );
    }

    // 实现微信OAuth流程
    // 1. 获取 access_token
    const { access_token } = await WeChatOAuth.getAccessToken();

    // 2. 获取用户信息
    const userInfo = await WeChatOAuth.getUserInfo(code);

    // 3. 查找或创建用户
    let user = await User.findOne({
      'oauthAccounts.provider': OAuthProvider.WECHAT_GZH,
      'oauthAccounts.providerId': userInfo.openid,
    });

    if (!user) {
      // 创建新用户
      const oauthAccount = WeChatOAuth.createOAuthAccount(userInfo);
      user = new User({
        username: userInfo.nickname || `wx_${userInfo.openid.slice(-6)}`,
        avatar: userInfo.headimgurl,
        status: UserStatus.ACTIVE,
        oauthAccounts: [oauthAccount],
      });
      await user.save();
    } else {
      // 更新 OAuth 账号信息
      const oauthIndex = user.oauthAccounts.findIndex(
        acc => acc.provider === OAuthProvider.WECHAT_GZH
      );
      if (oauthIndex !== -1) {
        user.oauthAccounts[oauthIndex] = WeChatOAuth.createOAuthAccount(userInfo);
        await user.save();
      }
    }

    // 4. 生成JWT令牌
    const tokenPair = await JWTUtils.generateTokenPair(user._id);

    // 查询用户的空间成员列表
    const members = await Member.find({
      userId: user._id,
      status: MemberStatus.OK,
    }).populate('spaceId');

    // 格式化空间成员列表以匹配前端的 ThusSpaceAndMember 接口
    const spaceMemberList = members
      .filter(member => member.spaceId && (member.spaceId as any).status === SpaceStatus.OK)
      .map(member => {
        const space = member.spaceId as any;
        return {
          memberId: member._id.toString(),
          member_name: member.name,
          member_avatar: member.avatar,
          member_oState: member.status,
          member_config: member.config,
          member_notification: member.notification,
          spaceId: space._id.toString(),
          spaceType: space.spaceType,
          space_oState: space.status,
          space_owner: space.ownerId.toString(),
          space_name: space.name,
          space_avatar: space.avatar,
          space_stateConfig: space.stateConfig,
          space_tagList: space.tagList,
          space_config: space.config,
        };
      });

    // 返回前端期望的 Res_UserLoginNormal 格式
    return res.json({
      code: "0000",
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        token: tokenPair.accessToken,
        serial_id: tokenPair.refreshToken,
        theme: user.settings?.theme || "light",
        language: user.settings?.language || "zh-Hans",
        spaceMemberList,
        open_id: userInfo.openid,
      },
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '微信登录失败')
    );
  }
});

/**
 * 微信小程序登录
 * POST /api/auth/wechat/mini
 */
router.post('/wechat/mini', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少授权码')
      );
    }

    // TODO: 实现微信小程序登录流程
    return res.json(
      successResponse({
        message: '微信小程序登录功能待实现',
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '微信小程序登录失败')
    );
  }
});

/**
 * 微信统一认证登录（通过 caiths-auth JWT）
 * POST /api/auth/wechat/unified
 */
router.post('/wechat/unified', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少认证令牌')
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'caiths_jwt_secret_2026_shared_with_all_products_min_32_chars';
    
    let payload: any;
    try {
      const jwt = require('jsonwebtoken');
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err: any) {
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', 'JWT 验证失败')
      );
    }

    const open_id = payload.open_id || payload.openid;
    const union_id = payload.union_id || payload.unionid;
    const nickname = payload.nickname || payload.name;
    const avatar = payload.avatar || payload.headimgurl;
    
    console.log('[WeChat Unified Auth] JWT payload:', JSON.stringify(payload, null, 2));
    console.log('[WeChat Unified Auth] Extracted:', { open_id, union_id, nickname, avatar });
    
    if (!open_id) {
      console.error('[WeChat Unified Auth] JWT payload missing openid:', payload);
      return res.status(400).json(
        errorResponse('BAD_REQUEST', 'Token中缺少openid')
      );
    }

    let user = await User.findOne({
      'oauthAccounts.provider': OAuthProvider.WECHAT_GZH,
      'oauthAccounts.providerId': open_id,
    });

    if (!user) {
      user = new User({
        username: nickname || `wx_${open_id.slice(-6)}`,
        avatar: avatar,
        status: UserStatus.ACTIVE,
        oauthAccounts: [{
          provider: OAuthProvider.WECHAT_GZH,
          providerId: open_id,
          name: nickname,
          avatar: avatar,
          linkedAt: new Date(),
        }],
      });
      await user.save();
    } else {
      const oauthIndex = user.oauthAccounts.findIndex(
        acc => acc.provider === OAuthProvider.WECHAT_GZH
      );
      if (oauthIndex !== -1) {
        user.oauthAccounts[oauthIndex].name = nickname;
        user.oauthAccounts[oauthIndex].avatar = avatar;
        if (nickname && !user.username) {
          user.username = nickname;
        }
        if (avatar && !user.avatar) {
          user.avatar = avatar;
        }
        await user.save();
      }
    }

    const tokenPair = await JWTUtils.generateTokenPair(user._id);

    const members = await Member.find({
      userId: user._id,
      status: MemberStatus.OK,
    }).populate('spaceId');
    
    if (members.length > 0 && nickname) {
      for (const member of members) {
        if (!member.name || member.name.startsWith('wx_')) {
          member.name = nickname;
          if (avatar) {
            member.avatar = avatar;
          }
          await member.save();
        }
      }
    }

    const spaceMemberList = members
      .filter(member => member.spaceId && (member.spaceId as any).status === SpaceStatus.OK)
      .map(member => {
        const space = member.spaceId as any;
        return {
          memberId: member._id.toString(),
          member_name: member.name,
          member_avatar: member.avatar,
          member_oState: member.status,
          member_config: member.config,
          member_notification: member.notification,
          spaceId: space._id.toString(),
          spaceType: space.spaceType,
          space_oState: space.status,
          space_owner: space.ownerId.toString(),
          space_name: space.name,
          space_avatar: space.avatar,
          space_stateConfig: space.stateConfig,
          space_tagList: space.tagList,
          space_config: space.config,
        };
      });

    return res.json({
      code: "0000",
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        token: tokenPair.accessToken,
        serial_id: tokenPair.refreshToken,
        theme: user.settings?.theme || "light",
        language: user.settings?.language || "zh-Hans",
        spaceMemberList,
        open_id: open_id,
      },
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '微信统一认证登录失败')
    );
  }
});

/**
 * 邮箱登录
 * POST /api/auth/email
 */
router.post('/email', async (req: Request, res: Response) => {
  try {
    const { email, password, client_key: frontendClientKey } = req.body;

    console.log('🔐 登录请求:', { email, passwordLength: password?.length, hasClientKey: !!frontendClientKey });

    if (!email || !password) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少邮箱或密码')
      );
    }

    // 查找用户（需要包含password字段）
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    console.log('👤 查找用户结果:', user ? `找到用户 ${user._id}` : '用户不存在');
    console.log('🔑 用户密码哈希存在:', !!user?.password);

    // 如果用户不存在，返回提示
    if (!user) {
      return res.status(404).json(
        errorResponse('USER_NOT_FOUND', '用户不存在，请先注册')
      );
    }

    // 验证密码
    if (!user.password) {
      console.log('❌ 用户没有密码');
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', '邮箱或密码错误')
      );
    }

    const isValidPassword = await PasswordUtil.comparePassword(password, user.password);
    console.log('🔒 密码验证结果:', isValidPassword ? '成功' : '失败');

    if (!isValidPassword) {
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', '邮箱或密码错误')
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

    // 处理 client_key（用于加密通信）
    const redisClient = getRedisClient();
    const clientKeyRedisKey = `client_key:${user._id.toString()}`;
    
    if (frontendClientKey) {
      await saveUserClientKey(redisClient, user._id.toString(), frontendClientKey);
      console.log(`✅ 使用前端发送的 client_key 并存储到 Redis`);
    } else {
      // 前端没有发送 client_key，检查是否已有
      let existingClientKey = await redisClient.get(clientKeyRedisKey);
      
      if (!existingClientKey) {
        // 生成新的 client_key（32字节的随机字符串，Base64编码）
        const crypto = require('crypto');
        const randomBytes = crypto.randomBytes(32);
        const clientKey = randomBytes.toString('base64');
        await saveUserClientKey(redisClient, user._id.toString(), clientKey);
        console.log(`✅ 为用户 ${user._id} 生成并存储了新的 client_key`);
      } else {
        console.log(`✅ 用户 ${user._id} 已有 client_key，继续使用`);
      }
    }

    // 生成令牌
    const tokenPair = await JWTUtils.generateTokenPair(user._id);

    // 查找 OAuth 账号信息
    const githubAccount = user.oauthAccounts?.find(acc => acc.provider === OAuthProvider.GITHUB);
    const googleAccount = user.oauthAccounts?.find(acc => acc.provider === OAuthProvider.GOOGLE);
    const wechatAccount = user.oauthAccounts?.find(acc => acc.provider === OAuthProvider.WECHAT_GZH || acc.provider === OAuthProvider.WECHAT_MINI);

    // 查询用户的空间成员列表
    const members = await Member.find({
      userId: user._id,
      status: MemberStatus.OK,
    }).populate('spaceId');

    // 如果用户没有空间，创建默认空间
    if (members.length === 0) {
      console.log('🏗️ 用户没有空间，创建默认空间...');

      // 创建个人空间
      const defaultSpace = new Space({
        ownerId: user._id,
        spaceType: SpaceType.ME,
        status: SpaceStatus.OK,
        name: '个人空间',
        description: '默认的个人空间',
        stateConfig: {},
        config: {},
        tagList: [],
      });

      await defaultSpace.save();
      console.log(`  ✅ 创建空间: ${defaultSpace._id}`);

      // 创建成员记录
      const defaultMember = new Member({
        spaceId: defaultSpace._id,
        userId: user._id,
        status: MemberStatus.OK,
        name: user.username,
        avatar: user.avatar,
        config: {},
        notification: {
          email: true,
          push: true,
        },
      });

      await defaultMember.save();
      console.log(`  ✅ 创建成员: ${defaultMember._id}`);

      // 重新查询成员列表以获取完整的 populate 信息
      members.length = 0; // 清空数组
      const allMembers = await Member.find({
        userId: user._id,
        status: MemberStatus.OK,
      }).populate('spaceId');
      members.push(...allMembers);
      console.log(`  ✅ 重新查询成员列表，共 ${members.length} 个成员`);
    }

    // 格式化空间成员列表以匹配前端的 ThusSpaceAndMember 接口
    const spaceMemberList = members
      .filter(member => member.spaceId && (member.spaceId as any).status === SpaceStatus.OK)
      .map(member => {
        const space = member.spaceId as any;
        return {
          memberId: member._id.toString(),
          member_name: member.name,
          member_avatar: member.avatar,
          member_oState: member.status,
          member_config: member.config,
          member_notification: member.notification,
          spaceId: space._id.toString(),
          spaceType: space.spaceType,
          space_oState: space.status,
          space_owner: space.ownerId.toString(),
          space_name: space.name,
          space_avatar: space.avatar,
          space_stateConfig: space.stateConfig,
          space_tagList: space.tagList,
          space_config: space.config,
        };
      });

    // 返回前端期望的 Res_UserLoginNormal 格式
    return res.json({
      code: "0000",
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        token: tokenPair.accessToken,
        serial_id: tokenPair.refreshToken,
        theme: user.settings?.theme || "light",
        language: user.settings?.language || "zh-Hans",
        spaceMemberList,
        open_id: githubAccount?.providerId || googleAccount?.providerId || wechatAccount?.providerId,
        github_id: githubAccount ? parseInt(githubAccount.providerId) : undefined,
      },
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '邮箱登录失败')
    );
  }
});

/**
 * 手机验证码登录
 * POST /api/auth/phone
 */
router.post('/phone', async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少手机号或验证码')
      );
    }

    // 验证短信验证码
    const codeVerification = await verifyCode(VerificationCodeType.PHONE, phone, code);
    if (!codeVerification.valid) {
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', codeVerification.message || '验证码错误或已过期')
      );
    }

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
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '手机登录失败')
    );
  }
});

/**
 * 发送验证码
 * POST /api/auth/send-code
 */
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { type, identifier } = req.body;

    if (!type || !identifier) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少类型或标识符')
      );
    }

    // 验证类型
    if (type !== 'EMAIL' && type !== 'PHONE') {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '无效的验证码类型')
      );
    }

    // 生成 6 位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存验证码到 Redis
    await saveVerificationCode(
      type === 'EMAIL' ? VerificationCodeType.EMAIL : VerificationCodeType.PHONE,
      identifier,
      code,
      5 * 60 * 1000 // 5 分钟过期
    );

    // 发送验证码
    if (type === 'EMAIL') {
      await sendEmail(
        identifier,
        '如是(Thus-Note) 验证码',
        `您的验证码是：${code}，5分钟内有效。`
      );
    } else if (type === 'PHONE') {
      await sendSMS(identifier, code);
    }

    return res.json(successResponse({
      message: '验证码已发送',
      expiresIn: 300, // 5 分钟
    }));
  } catch (error: any) {
    console.error('发送验证码失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '发送验证码失败')
    );
  }
});

/**
 * 验证码登录
 * POST /api/auth/verify-code
 */
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { type, identifier, code } = req.body;

    if (!type || !identifier || !code) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少类型、标识符或验证码')
      );
    }

    // 验证验证码
    const codeVerification = await verifyCode(
      type === 'EMAIL' ? VerificationCodeType.EMAIL : VerificationCodeType.PHONE,
      identifier,
      code
    );

    if (!codeVerification.valid) {
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', codeVerification.message || '验证码错误或已过期')
      );
    }

    // 查找或创建用户
    let user;
    if (type === 'EMAIL') {
      user = await User.findOne({ email: identifier.toLowerCase() });
      if (!user) {
        user = new User({
          username: identifier.split('@')[0],
          email: identifier.toLowerCase(),
          status: UserStatus.ACTIVE,
        });
        await user.save();
      }
    } else if (type === 'PHONE') {
      user = await User.findOne({ phone: identifier });
      if (!user) {
        user = new User({
          username: `user_${identifier.slice(-4)}`,
          phone: identifier,
          status: UserStatus.ACTIVE,
        });
        await user.save();
      }
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

    // 查找 OAuth 账号信息
    const githubAccount = user.oauthAccounts?.find(acc => acc.provider === OAuthProvider.GITHUB);
    const googleAccount = user.oauthAccounts?.find(acc => acc.provider === OAuthProvider.GOOGLE);
    const wechatAccount = user.oauthAccounts?.find(acc => acc.provider === OAuthProvider.WECHAT_GZH || acc.provider === OAuthProvider.WECHAT_MINI);

    // 查询用户的空间成员列表
    const members = await Member.find({
      userId: user._id,
      status: MemberStatus.OK,
    }).populate('spaceId');

    // 格式化空间成员列表以匹配前端的 ThusSpaceAndMember 接口
    const spaceMemberList = members
      .filter(member => member.spaceId && (member.spaceId as any).status === SpaceStatus.OK)
      .map(member => {
        const space = member.spaceId as any;
        return {
          memberId: member._id.toString(),
          member_name: member.name,
          member_avatar: member.avatar,
          member_oState: member.status,
          member_config: member.config,
          member_notification: member.notification,
          spaceId: space._id.toString(),
          spaceType: space.spaceType,
          space_oState: space.status,
          space_owner: space.ownerId.toString(),
          space_name: space.name,
          space_avatar: space.avatar,
          space_stateConfig: space.stateConfig,
          space_tagList: space.tagList,
          space_config: space.config,
        };
      });

    // 返回前端期望的 Res_UserLoginNormal 格式
    return res.json({
      code: "0000",
      data: {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        token: tokenPair.accessToken,
        serial_id: tokenPair.refreshToken,
        theme: user.settings?.theme || "light",
        language: user.settings?.language || "zh-Hans",
        spaceMemberList,
        open_id: githubAccount?.providerId || googleAccount?.providerId || wechatAccount?.providerId,
        github_id: githubAccount ? parseInt(githubAccount.providerId) : undefined,
      },
    });
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '验证码登录失败')
    );
  }
});

/**
 * 注册
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少必填字段')
      );
    }

    // 验证密码强度
    const passwordValidation = PasswordUtil.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', `密码强度不足: ${passwordValidation.errors.join(', ')}`)
      );
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json(
          errorResponse('CONFLICT', '用户名已被使用')
        );
      }
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json(
          errorResponse('CONFLICT', '邮箱已被注册')
        );
      }
    }

    // 创建用户（密码会由User模型的pre-save中间件自动哈希）
    const user = new User({
      username,
      email: email.toLowerCase(),
      password, // 明文密码，会在保存前自动哈希
      status: UserStatus.ACTIVE,
    });

    await user.save();

    // 生成令牌
    const tokenPair = await JWTUtils.generateTokenPair(user._id);

    return res.status(201).json(
      successResponse({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        ...tokenPair,
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '注册失败')
    );
  }
});

/**
 * 刷新令牌
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少刷新令牌')
      );
    }

    // 刷新令牌
    const tokenPair = await JWTUtils.refreshAccessToken(refreshToken);

    if (!tokenPair) {
      return res.status(401).json(
        errorResponse('UNAUTHORIZED', '无效或过期的刷新令牌')
      );
    }

    return res.json(successResponse(tokenPair));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '刷新令牌失败')
    );
  }
});

/**
 * 登出
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // 撤销刷新令牌
      await JWTUtils.revokeRefreshToken(refreshToken);
    }

    return res.json(successResponse({ message: '登出成功' }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '登出失败')
    );
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    // 从中间件获取用户ID（已经由authMiddleware验证）
    const userId = req.userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    return res.json(successResponse(user));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取用户信息失败')
    );
  }
});

/**
 * 创建测试用户（仅用于开发环境）
 */
router.post('/create-test-user', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少邮箱或密码')
      );
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json(
        errorResponse('CONFLICT', '用户已存在')
      );
    }

    // 创建用户（密码会由User模型的pre-save中间件自动哈希）
    const user = new User({
      username: email.split('@')[0],
      email: email.toLowerCase(),
      password, // 明文密码，会在保存前自动哈希
      status: UserStatus.ACTIVE,
    });

    await user.save();

    return res.status(201).json(
      successResponse({
        message: '测试用户创建成功',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '创建用户失败')
    );
  }
});

export default router;
