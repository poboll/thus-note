import { Router, Request, Response } from 'express';
import { successResponse, errorResponse } from '../types/api.types';

const router = Router();

// 当前应用版本信息
const APP_VERSION = '1.0.0';
const RELEASE_DATE = '2025-01-27';

// 版本信息（实际应用中应该从数据库或配置文件读取）
const versionInfo = {
  currentVersion: APP_VERSION,
  latestVersion: APP_VERSION,
  releaseDate: RELEASE_DATE,
  downloadUrl: 'https://github.com/your-repo/releases',
  releaseNotes: '初始版本发布',
  mandatory: false,
};

/**
 * 比较语义化版本号
 * @param version1 版本号1 (e.g., "1.2.3")
 * @param version2 版本号2 (e.g., "1.2.4")
 * @returns 1 if version1 > version2, -1 if version1 < version2, 0 if equal
 */
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

/**
 * 检查版本更新
 * GET /api/version/check?currentVersion=1.0.0&platform=web
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    const { currentVersion, platform } = req.query;
    
    if (!currentVersion || typeof currentVersion !== 'string') {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少currentVersion参数')
      );
    }
    
    // 比较版本
    const comparison = compareVersions(versionInfo.latestVersion, currentVersion);
    const updateAvailable = comparison > 0;
    
    const response = {
      currentVersion: currentVersion,
      latestVersion: versionInfo.latestVersion,
      updateAvailable,
      downloadUrl: updateAvailable ? versionInfo.downloadUrl : undefined,
      releaseNotes: updateAvailable ? versionInfo.releaseNotes : undefined,
      releaseDate: versionInfo.releaseDate,
      mandatory: updateAvailable ? versionInfo.mandatory : false,
      platform: platform || 'all',
    };
    
    return res.json(successResponse(response));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '版本检查失败')
    );
  }
});

/**
 * 获取当前版本信息
 * GET /api/version/current
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    return res.json(successResponse({
      version: versionInfo.currentVersion,
      releaseDate: versionInfo.releaseDate,
      releaseNotes: versionInfo.releaseNotes,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取版本信息失败')
    );
  }
});

export default router;
