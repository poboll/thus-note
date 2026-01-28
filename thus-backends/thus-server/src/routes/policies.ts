import { Router, Request, Response } from 'express';
import { successResponse, errorResponse } from '../types/api.types';
import { ConfigService } from '../services/configService';
import { logger } from '../config/logger';

const router = Router();

/**
 * 获取服务条款
 * GET /api/policies/terms
 */
router.get('/terms', async (req: Request, res: Response) => {
  try {
    const terms = await ConfigService.getTerms();
    
    return res.json(successResponse({
      type: 'TERMS_OF_SERVICE',
      content: terms.content,
      version: terms.version,
      lastUpdated: terms.lastUpdated.toISOString(),
      effectiveDate: terms.lastUpdated.toISOString(),
    }));
  } catch (error: any) {
    logger.error('获取服务条款失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取服务条款失败')
    );
  }
});

/**
 * 获取隐私政策
 * GET /api/policies/privacy
 */
router.get('/privacy', async (req: Request, res: Response) => {
  try {
    const privacy = await ConfigService.getPrivacy();
    
    return res.json(successResponse({
      type: 'PRIVACY_POLICY',
      content: privacy.content,
      version: privacy.version,
      lastUpdated: privacy.lastUpdated.toISOString(),
      effectiveDate: privacy.lastUpdated.toISOString(),
    }));
  } catch (error: any) {
    logger.error('获取隐私政策失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取隐私政策失败')
    );
  }
});

export default router;
