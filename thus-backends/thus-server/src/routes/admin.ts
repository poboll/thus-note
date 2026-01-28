import { Router, Request, Response } from 'express';
import { adminAuthMiddleware } from '../middleware/adminAuth';
import { successResponse, errorResponse } from '../types/api.types';
import { ConfigService, ConfigValidationError } from '../services/configService';
import { StorageServiceFactory } from '../services/storageService';
import { SMSServiceFactory } from '../services/smsService';
import { wechatService } from '../services/wechatService';
import { logger } from '../config/logger';
import { Types } from 'mongoose';

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

export default router;
