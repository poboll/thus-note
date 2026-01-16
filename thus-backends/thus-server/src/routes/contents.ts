import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { successResponse, errorResponse } from '../types/api.types';
import Content from '../models/Content';
import Thread from '../models/Thread';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 获取线程的内容列表
 * GET /api/contents?threadId=xxx
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { threadId, page = 1, limit = 20 } = req.query;

    if (!threadId) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少threadId参数')
      );
    }

    // 验证线程是否属于当前用户
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const contents = await Content.find({ threadId })
      .sort({ version: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Content.countDocuments({ threadId });

    return res.json(
      successResponse({
        contents,
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
      errorResponse('INTERNAL_ERROR', error.message || '获取内容列表失败')
    );
  }
});

/**
 * 获取最新内容
 * GET /api/contents/latest/:threadId
 */
router.get('/latest/:threadId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { threadId } = req.params;

    // 验证线程是否属于当前用户
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    const content = await (Content as any).findLatestByThread(
      new Types.ObjectId(threadId)
    );

    if (!content) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '内容不存在')
      );
    }

    return res.json(successResponse(content));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取最新内容失败')
    );
  }
});

/**
 * 获取内容历史
 * GET /api/contents/history/:threadId
 */
router.get('/history/:threadId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { threadId } = req.params;
    const { limit = 10 } = req.query;

    // 验证线程是否属于当前用户
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    const limitNum = parseInt(limit as string, 10);
    const contents = await (Content as any).findHistoryByThread(
      new Types.ObjectId(threadId),
      limitNum
    );

    return res.json(successResponse({ contents }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取内容历史失败')
    );
  }
});

/**
 * 创建新内容
 * POST /api/contents
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { threadId, blocks, isEncrypted, encryptedData } = req.body;

    if (!threadId || !blocks) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少必填字段')
      );
    }

    // 验证线程是否属于当前用户
    const thread = await Thread.findOne({ _id: threadId, userId });
    if (!thread) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '线程不存在')
      );
    }

    const content = new Content({
      threadId: new Types.ObjectId(threadId),
      userId,
      blocks,
      isEncrypted: isEncrypted || false,
      encryptedData,
    });

    await content.save();

    // 更新线程的最后修改时间
    thread.lastModifiedAt = new Date();
    await thread.save();

    return res.status(201).json(successResponse(content));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '创建内容失败')
    );
  }
});

/**
 * 更新内容
 * PUT /api/contents/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { blocks, isEncrypted, encryptedData } = req.body;

    const content = await Content.findOne({ _id: id, userId });

    if (!content) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '内容不存在')
      );
    }

    // 更新字段
    if (blocks !== undefined) content.blocks = blocks;
    if (isEncrypted !== undefined) content.isEncrypted = isEncrypted;
    if (encryptedData !== undefined) content.encryptedData = encryptedData;

    await content.save();

    // 更新线程的最后修改时间
    const thread = await Thread.findById(content.threadId);
    if (thread) {
      thread.lastModifiedAt = new Date();
      await thread.save();
    }

    return res.json(successResponse(content));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新内容失败')
    );
  }
});

/**
 * 添加内容块
 * POST /api/contents/:id/blocks
 */
router.post('/:id/blocks', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { block } = req.body;

    if (!block) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少block参数')
      );
    }

    const content = await Content.findOne({ _id: id, userId });

    if (!content) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '内容不存在')
      );
    }

    content.blocks.push(block);
    await content.save();

    // 更新线程的最后修改时间
    const thread = await Thread.findById(content.threadId);
    if (thread) {
      thread.lastModifiedAt = new Date();
      await thread.save();
    }

    return res.json(successResponse(content));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '添加内容块失败')
    );
  }
});

/**
 * 更新内容块
 * PUT /api/contents/:id/blocks/:index
 */
router.put('/:id/blocks/:index', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id, index } = req.params;
    const { block } = req.body;

    if (!block) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少block参数')
      );
    }

    const content = await Content.findOne({ _id: id, userId });

    if (!content) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '内容不存在')
      );
    }

    const indexNum = parseInt(index, 10);
    if (indexNum < 0 || indexNum >= content.blocks.length) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '内容块索引无效')
      );
    }

    content.blocks[indexNum] = { ...content.blocks[indexNum], ...block };
    await content.save();

    // 更新线程的最后修改时间
    const thread = await Thread.findById(content.threadId);
    if (thread) {
      thread.lastModifiedAt = new Date();
      await thread.save();
    }

    return res.json(successResponse(content));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新内容块失败')
    );
  }
});

/**
 * 删除内容块
 * DELETE /api/contents/:id/blocks/:index
 */
router.delete('/:id/blocks/:index', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id, index } = req.params;

    const content = await Content.findOne({ _id: id, userId });

    if (!content) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '内容不存在')
      );
    }

    const indexNum = parseInt(index, 10);
    if (indexNum < 0 || indexNum >= content.blocks.length) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '内容块索引无效')
      );
    }

    content.blocks.splice(indexNum, 1);
    await content.save();

    // 更新线程的最后修改时间
    const thread = await Thread.findById(content.threadId);
    if (thread) {
      thread.lastModifiedAt = new Date();
      await thread.save();
    }

    return res.json(successResponse(content));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '删除内容块失败')
    );
  }
});

/**
 * 删除内容
 * DELETE /api/contents/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const content = await Content.findOne({ _id: id, userId });

    if (!content) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '内容不存在')
      );
    }

    await Content.deleteOne({ _id: id });

    return res.json(successResponse({ message: '内容已删除' }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '删除内容失败')
    );
  }
});

export default router;
