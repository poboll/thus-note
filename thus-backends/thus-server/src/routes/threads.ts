import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { successResponse, errorResponse } from '../types/api.types';
import { ThreadType, ThreadStatus } from '../models/Thread';
import Thread from '../models/Thread';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 获取用户的线程列表
 * GET /api/threads
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, status, tag, page = 1, limit = 20 } = req.query;

    // 构建查询条件
    const query: any = { userId };
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    } else {
      query.status = ThreadStatus.ACTIVE;
    }
    if (tag) {
      query.tags = tag;
    }

    // 分页查询
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const threads = await Thread.find(query)
      .sort({ lastModifiedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Thread.countDocuments(query);

    return res.json(
      successResponse({
        threads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取线程列表失败')
    );
  }
});

/**
 * 获取单个线程详情
 * GET /api/threads/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const thread = await Thread.findOne({ _id: id, userId });

    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    return res.json(successResponse(thread));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取线程详情失败')
    );
  }
});

/**
 * 创建新线程
 * POST /api/threads
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { type, title, description, tags, isPublic, settings } = req.body;

    if (!title) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '标题不能为空')
      );
    }

    const thread = new Thread({
      userId,
      type: type || ThreadType.NOTE,
      title,
      description,
      tags: tags || [],
      isPublic: isPublic || false,
      settings: settings || {},
      status: ThreadStatus.ACTIVE,
    });

    await thread.save();

    return res.status(201).json(successResponse(thread));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '创建线程失败')
    );
  }
});

/**
 * 更新线程
 * PUT /api/threads/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { title, description, tags, isPublic, settings } = req.body;

    const thread = await Thread.findOne({ _id: id, userId });

    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    // 更新字段
    if (title !== undefined) thread.title = title;
    if (description !== undefined) thread.description = description;
    if (tags !== undefined) thread.tags = tags;
    if (isPublic !== undefined) thread.isPublic = isPublic;
    if (settings !== undefined) thread.settings = { ...thread.settings, ...settings };

    thread.lastModifiedAt = new Date();
    await thread.save();

    return res.json(successResponse(thread));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新线程失败')
    );
  }
});

/**
 * 删除线程（软删除）
 * DELETE /api/threads/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const thread = await Thread.findOne({ _id: id, userId });

    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    thread.status = ThreadStatus.DELETED;
    await thread.save();

    return res.json(successResponse({ message: '线程已删除' }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '删除线程失败')
    );
  }
});

/**
 * 归档线程
 * POST /api/threads/:id/archive
 */
router.post('/:id/archive', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const thread = await Thread.findOne({ _id: id, userId });

    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    thread.status = ThreadStatus.ARCHIVED;
    await thread.save();

    return res.json(successResponse(thread));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '归档线程失败')
    );
  }
});

/**
 * 搜索线程
 * GET /api/threads/search?q=keyword
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { q, type, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '搜索关键词不能为空')
      );
    }

    const query: any = {
      userId,
      status: ThreadStatus.ACTIVE,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ],
    };

    if (type) {
      query.type = type;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const threads = await Thread.find(query)
      .sort({ lastModifiedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Thread.countDocuments(query);

    return res.json(
      successResponse({
        threads,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '搜索线程失败')
    );
  }
});

export default router;
