import { Router, Request, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { successResponse, errorResponse } from '../types/api.types';
import { ConfigService, ConfigValidationError } from '../services/configService';
import { StorageServiceFactory } from '../services/storageService';
import { SMSServiceFactory } from '../services/smsService';
import { EmailService } from '../services/emailService';
import { wechatService } from '../services/wechatService';
import { aiService } from '../services/aiService';
import { logger } from '../config/logger';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis';
import User, { UserRole, UserStatus } from '../models/User';
import Thread from '../models/Thread';

const router = Router();

// 所有管理员路由都需要管理员认证
router.use(adminAuthMiddleware);

/**
 * 获取系统配置
 * GET /api/admin/config
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await ConfigService.getConfig(true);
    
    // 隐藏敏感信息
    const safeConfig = {
      baseUrl: config.baseUrl,
      frontendUrl: config.frontendUrl,
      proxy: config.proxy,
      storage: {
        type: config.storage.type,
        local: config.storage.local,
        s3: config.storage.s3 ? {
          provider: config.storage.s3.provider,
          endpoint: config.storage.s3.endpoint,
          bucket: config.storage.s3.bucket,
          region: config.storage.s3.region,
          publicUrl: config.storage.s3.publicUrl,
          // 隐藏密钥
          accessKeyId: config.storage.s3.accessKeyId ? '******' : '',
          secretAccessKey: config.storage.s3.secretAccessKey ? '******' : '',
        } : undefined,
      },
      sms: {
        enabled: config.sms.enabled,
        provider: config.sms.provider,
        // 隐藏敏感配置
        configured: !!(config.sms.tencent?.secretId || config.sms.aliyun?.accessKeyId || config.sms.yunpian?.apiKey),
      },
      email: {
        enabled: config.email?.enabled || false,
        host: config.email?.host || '',
        port: config.email?.port || 587,
        from: config.email?.from || '',
        configured: !!(config.email?.user),
      },
      wechat: {
        enabled: config.wechat.enabled,
        gzhAppId: config.wechat.gzhAppId,
        miniAppId: config.wechat.miniAppId,
        // 隐藏密钥
        gzhAppSecret: config.wechat.gzhAppSecret ? '******' : '',
        miniAppSecret: config.wechat.miniAppSecret ? '******' : '',
      },
      policies: {
        terms: {
          version: config.policies.terms.version,
          lastUpdated: config.policies.terms.lastUpdated,
          contentLength: config.policies.terms.content?.length || 0,
        },
        privacy: {
          version: config.policies.privacy.version,
          lastUpdated: config.policies.privacy.lastUpdated,
          contentLength: config.policies.privacy.content?.length || 0,
        },
      },
      updatedAt: config.updatedAt,
    };
    
    return res.json(successResponse(safeConfig));
  } catch (error: any) {
    logger.error('获取系统配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取配置失败')
    );
  }
});

/**
 * 获取完整配置（包含敏感信息，用于编辑）
 * GET /api/admin/config/full
 */
router.get('/config/full', async (req: Request, res: Response) => {
  try {
    const config = await ConfigService.getConfig(true);
    return res.json(successResponse(config));
  } catch (error: any) {
    logger.error('获取完整配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取配置失败')
    );
  }
});

/**
 * 更新基础配置
 * POST /api/admin/config/base
 */
router.post('/config/base', async (req: Request, res: Response) => {
  try {
    const { baseUrl, frontendUrl, proxy } = req.body;
    const userId = new Types.ObjectId(req.userId!);
    
    const config = await ConfigService.updateBaseConfig(
      baseUrl,
      frontendUrl,
      proxy,
      userId
    );
    
    return res.json(successResponse({
      message: '基础配置已更新',
      baseUrl: config.baseUrl,
      frontendUrl: config.frontendUrl,
      proxy: config.proxy,
    }));
  } catch (error: any) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json(
        errorResponse('ADMIN_CONFIG_INVALID', error.message)
      );
    }
    logger.error('更新基础配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新配置失败')
    );
  }
});

/**
 * 更新存储配置
 * POST /api/admin/config/storage
 */
router.post('/config/storage', async (req: Request, res: Response) => {
  try {
    const { storage } = req.body;
    const userId = new Types.ObjectId(req.userId!);
    
    const config = await ConfigService.updateStorageConfig(storage, userId);
    
    // 重置存储服务实例
    StorageServiceFactory.resetInstance();
    
    return res.json(successResponse({
      message: '存储配置已更新',
      storage: {
        type: config.storage.type,
      },
    }));
  } catch (error: any) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json(
        errorResponse('ADMIN_CONFIG_INVALID', error.message)
      );
    }
    logger.error('更新存储配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新配置失败')
    );
  }
});

/**
 * 更新短信配置
 * POST /api/admin/config/sms
 */
router.post('/config/sms', async (req: Request, res: Response) => {
  try {
    const { sms } = req.body;
    const userId = new Types.ObjectId(req.userId!);
    
    const config = await ConfigService.updateSMSConfig(sms, userId);
    
    // 重置短信服务实例
    SMSServiceFactory.resetInstance();
    
    return res.json(successResponse({
      message: '短信配置已更新',
      sms: {
        enabled: config.sms.enabled,
        provider: config.sms.provider,
      },
    }));
  } catch (error: any) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json(
        errorResponse('ADMIN_CONFIG_INVALID', error.message)
      );
    }
    logger.error('更新短信配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新配置失败')
    );
  }
});

router.post('/config/email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const userId = new Types.ObjectId(req.userId!);

    const config = await ConfigService.updateEmailConfig(email, userId);

    return res.json(successResponse({
      message: '邮箱配置已更新',
      email: {
        enabled: config.email.enabled,
        host: config.email.host,
      },
    }));
  } catch (error: any) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json(
        errorResponse('ADMIN_CONFIG_INVALID', error.message)
      );
    }
    logger.error('更新邮箱配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新邮箱配置失败')
    );
  }
});

router.post('/config/test/email', async (req: Request, res: Response) => {
  try {
    const { email, testAddress } = req.body;

    if (!testAddress) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '请提供测试邮箱地址')
      );
    }

    const transporter = new EmailService();
    if (email?.host) {
      const nodemailer = await import('nodemailer');
      const testTransporter = nodemailer.createTransport({
        host: email.host,
        port: email.port || 587,
        secure: email.secure || false,
        auth: { user: email.user, pass: email.pass },
      });

      await testTransporter.sendMail({
        from: email.from || email.user,
        to: testAddress,
        subject: '如是笔记 - 邮箱配置测试',
        html: '<p>这是一封测试邮件，说明您的邮箱配置正确。</p>',
      });
    } else {
      await transporter.sendVerificationCode(testAddress, '000000');
    }

    return res.json(successResponse({
      success: true,
      message: `测试邮件已发送至 ${testAddress}`,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '发送测试邮件失败')
    );
  }
});

/**
 * 更新微信配置
 * POST /api/admin/config/wechat
 */
router.post('/config/wechat', async (req: Request, res: Response) => {
  try {
    const { wechat } = req.body;
    const userId = new Types.ObjectId(req.userId!);
    
    const config = await ConfigService.updateWeChatConfig(wechat, userId);
    
    // 重置微信服务配置缓存
    wechatService.resetConfig();
    
    return res.json(successResponse({
      message: '微信配置已更新',
      wechat: {
        enabled: config.wechat.enabled,
        gzhAppId: config.wechat.gzhAppId,
      },
    }));
  } catch (error: any) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json(
        errorResponse('ADMIN_CONFIG_INVALID', error.message)
      );
    }
    logger.error('更新微信配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新配置失败')
    );
  }
});

/**
 * 测试存储连接
 * POST /api/admin/config/test/storage
 */
router.post('/config/test/storage', async (req: Request, res: Response) => {
  try {
    const { storage } = req.body;
    const config = await ConfigService.getConfig();
    
    const result = await StorageServiceFactory.testConnection(
      storage || config.storage,
      config.baseUrl
    );
    
    return res.json(successResponse(result));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '测试失败')
    );
  }
});

/**
 * 测试短信服务
 * POST /api/admin/config/test/sms
 */
router.post('/config/test/sms', async (req: Request, res: Response) => {
  try {
    const { sms, testPhone } = req.body;
    
    if (!testPhone) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '请提供测试手机号')
      );
    }
    
    const config = await ConfigService.getConfig();
    const result = await SMSServiceFactory.testConnection(
      sms || config.sms,
      testPhone
    );
    
    return res.json(successResponse(result));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '测试失败')
    );
  }
});

/**
 * 测试微信配置
 * POST /api/admin/config/test/wechat
 */
router.post('/config/test/wechat', async (req: Request, res: Response) => {
  try {
    const result = await wechatService.testConfig();
    return res.json(successResponse(result));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '测试失败')
    );
  }
});

/**
 * 获取服务协议内容
 * GET /api/admin/policies/terms
 */
router.get('/policies/terms', async (req: Request, res: Response) => {
  try {
    const terms = await ConfigService.getTerms();
    return res.json(successResponse(terms));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取失败')
    );
  }
});

/**
 * 更新服务协议
 * PUT /api/admin/policies/terms
 */
router.put('/policies/terms', async (req: Request, res: Response) => {
  try {
    const { content, version } = req.body;
    const userId = new Types.ObjectId(req.userId!);
    
    if (!content) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '内容不能为空')
      );
    }
    
    const config = await ConfigService.updatePolicies({
      terms: {
        content,
        version: version || '1.0.0',
        lastUpdated: new Date(),
      },
    }, userId);
    
    return res.json(successResponse({
      message: '服务协议已更新',
      terms: config.policies.terms,
    }));
  } catch (error: any) {
    logger.error('更新服务协议失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新失败')
    );
  }
});

/**
 * 获取隐私政策内容
 * GET /api/admin/policies/privacy
 */
router.get('/policies/privacy', async (req: Request, res: Response) => {
  try {
    const privacy = await ConfigService.getPrivacy();
    return res.json(successResponse(privacy));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取失败')
    );
  }
});

/**
 * 更新隐私政策
 * PUT /api/admin/policies/privacy
 */
router.put('/policies/privacy', async (req: Request, res: Response) => {
  try {
    const { content, version } = req.body;
    const userId = new Types.ObjectId(req.userId!);
    
    if (!content) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '内容不能为空')
      );
    }
    
    const config = await ConfigService.updatePolicies({
      privacy: {
        content,
        version: version || '1.0.0',
        lastUpdated: new Date(),
      },
    }, userId);
    
    return res.json(successResponse({
      message: '隐私政策已更新',
      privacy: config.policies.privacy,
    }));
  } catch (error: any) {
    logger.error('更新隐私政策失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新失败')
    );
  }
});

router.get('/config/ai', async (req: Request, res: Response) => {
  try {
    const aiConfig = await ConfigService.getAIConfig();
    const safeConfig = {
      enabled: aiConfig.enabled,
      autoTag: aiConfig.autoTag,
      autoSummary: aiConfig.autoSummary,
      similarRecommend: aiConfig.similarRecommend,
      providers: aiConfig.providers.map((p: any) => ({
        enabled: p.enabled,
        name: p.name,
        baseUrl: p.baseUrl,
        apiKey: p.apiKey ? `${p.apiKey.substring(0, 8)}******` : '',
        defaultModel: p.defaultModel,
        models: p.models,
      })),
    };
    return res.json(successResponse(safeConfig));
  } catch (error: any) {
    logger.error('获取AI配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取AI配置失败')
    );
  }
});

router.post('/config/ai', async (req: Request, res: Response) => {
  try {
    const { ai } = req.body;
    const userId = new Types.ObjectId(req.userId!);

    const config = await ConfigService.updateAIConfig(ai, userId);

    aiService.reloadProviders();

    return res.json(successResponse({
      message: 'AI配置已更新',
      ai: {
        enabled: config.ai.enabled,
        autoTag: config.ai.autoTag,
        autoSummary: config.ai.autoSummary,
        similarRecommend: config.ai.similarRecommend,
        providerCount: config.ai.providers.length,
      },
    }));
  } catch (error: any) {
    if (error instanceof ConfigValidationError) {
      return res.status(400).json(
        errorResponse('ADMIN_CONFIG_INVALID', error.message)
      );
    }
    logger.error('更新AI配置失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新AI配置失败')
    );
  }
});

/**
 * 系统概览
 * GET /api/admin/overview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const startTime = process.uptime();

    // 并行获取所有统计数据
    const [userCount, threadCount, dbStatus, redisStatus] = await Promise.all([
      User.countDocuments(),
      Thread.countDocuments(),
      (async () => {
        try {
          const state = mongoose.connection.readyState;
          // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
          return { connected: state === 1, state };
        } catch {
          return { connected: false, state: 0 };
        }
      })(),
      (async () => {
        try {
          const client = getRedisClient();
          const pong = await client.ping();
          return { connected: pong === 'PONG' };
        } catch {
          return { connected: false };
        }
      })(),
    ]);

    const activeUsers = await User.countDocuments({ status: UserStatus.ACTIVE });
    const bannedUsers = await User.countDocuments({ status: UserStatus.BANNED });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({ createdAt: { $gte: todayStart } });
    const todayThreads = await Thread.countDocuments({ createdAt: { $gte: todayStart } });

    return res.json(successResponse({
      uptime: Math.floor(startTime),
      database: dbStatus,
      redis: redisStatus,
      stats: {
        users: { total: userCount, active: activeUsers, banned: bannedUsers, today: todayUsers },
        threads: { total: threadCount, today: todayThreads },
      },
      serverTime: new Date().toISOString(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
    }));
  } catch (error: any) {
    logger.error('获取系统概览失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取系统概览失败')
    );
  }
});

/**
 * 用户列表
 * GET /api/admin/users
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const role = req.query.role as string;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status && Object.values(UserStatus).includes(status as UserStatus)) {
      filter.status = status;
    }
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username email phone avatar status role createdAt lastLoginAt settings.aiEnabled')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json(successResponse({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }));
  } catch (error: any) {
    logger.error('获取用户列表失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取用户列表失败')
    );
  }
});

/**
 * 修改用户角色
 * PUT /api/admin/users/:id/role
 */
router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json(errorResponse('BAD_REQUEST', '无效的角色值'));
    }

    if (id === String(req.userId)) {
      return res.status(400).json(errorResponse('BAD_REQUEST', '不能修改自己的角色'));
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true })
      .select('username email role');

    if (!user) {
      return res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
    }

    return res.json(successResponse({ message: '角色已更新', user }));
  } catch (error: any) {
    logger.error('修改用户角色失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '修改角色失败')
    );
  }
});

/**
 * 修改用户状态
 * PUT /api/admin/users/:id/status
 */
router.put('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(UserStatus).includes(status)) {
      return res.status(400).json(errorResponse('BAD_REQUEST', '无效的状态值'));
    }

    if (id === String(req.userId)) {
      return res.status(400).json(errorResponse('BAD_REQUEST', '不能修改自己的状态'));
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true })
      .select('username email status');

    if (!user) {
      return res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
    }

    return res.json(successResponse({ message: '状态已更新', user }));
  } catch (error: any) {
    logger.error('修改用户状态失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '修改状态失败')
    );
  }
});

export default router;
