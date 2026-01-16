import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';

const router = Router();

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// 配置multer
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // 允许所有文件类型
    cb(null, true);
  },
});

/**
 * 上传文件
 * POST /api/files/upload
 */
router.post('/upload', authMiddleware, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // 检查是否有文件
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '没有上传文件')
      );
    }

    const files = req.files as Express.Multer.File[];
    const uploadedFiles = [];

    // 导入User模型
    const User = (await import('../models/User')).default;

    for (const file of files) {
      // 生成文件ID
      const fileId = new Types.ObjectId();

      // 保存文件信息（实际文件已经通过multer保存到本地）
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(
          errorResponse('NOT_FOUND', '用户不存在')
        );
      }

      // 添加文件到用户的文件列表
      if (!user.files) {
        user.files = [];
      }

      const fileData = {
        _id: fileId,
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/api/files/${fileId}`,
        createdAt: new Date(),
      };

      user.files.push(fileData);
      await user.save();

      uploadedFiles.push(fileData);
    }

    return res.json(successResponse({
      files: uploadedFiles,
      count: uploadedFiles.length,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '文件上传失败')
    );
  }
});

/**
 * 获取文件列表
 * GET /api/files
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const User = (await import('../models/User')).default;

    const user = await User.findById(userId).select('files');
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    return res.json(successResponse({
      files: user.files || [],
      count: (user.files || []).length,
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取文件列表失败')
    );
  }
});

/**
 * 获取文件详情
 * GET /api/files/:id
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const fileId = req.params.id;
    const User = (await import('../models/User')).default;

    const user = await User.findById(userId).select('files');
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    const file = (user.files || []).find((f: any) => f._id.toString() === fileId);
    if (!file) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '文件不存在')
      );
    }

    return res.json(successResponse(file));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取文件详情失败')
    );
  }
});

/**
 * 下载文件
 * GET /api/files/:id/download
 */
router.get('/:id/download', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const fileId = req.params.id;
    const User = (await import('../models/User')).default;

    const user = await User.findById(userId).select('files');
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    const file = (user.files || []).find((f: any) => f._id.toString() === fileId);
    if (!file) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '文件不存在')
      );
    }

    // 从URL中提取文件名
    const fileName = file.name;
    const filePath = path.join(uploadDir, fileName);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '文件不存在')
      );
    }

    // 发送文件
    res.download(filePath, fileName);
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '文件下载失败')
    );
  }
});

/**
 * 删除文件
 * DELETE /api/files/:id
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const fileId = req.params.id;
    const User = (await import('../models/User')).default;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '用户不存在')
      );
    }

    if (!user.files) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '文件列表为空')
      );
    }

    const fileIndex = (user.files || []).findIndex((f: any) => f._id.toString() === fileId);
    if (fileIndex === -1) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '文件不存在')
      );
    }

    // 删除文件
    const file = user.files[fileIndex];
    const filePath = path.join(uploadDir, file.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    user.files.splice(fileIndex, 1);
    await user.save();

    return res.json(successResponse({
      message: '文件删除成功',
    }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '文件删除失败')
    );
  }
});

export default router;
