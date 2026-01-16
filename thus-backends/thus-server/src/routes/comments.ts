import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { successResponse, errorResponse } from '../types/api.types';
import Comment, { CommentStatus } from '../models/Comment';
import Content from '../models/Content';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * 获取线程的评论列表
 * GET /api/comments?threadId=xxx
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { threadId, contentId, page = 1, limit = 20 } = req.query;

    if (!threadId && !contentId) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少threadId或contentId参数')
      );
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let comments;
    let total;

    if (contentId) {
      // 获取内容的评论
      comments = await (Comment as any).findByContent(
        new Types.ObjectId(contentId as string)
      );
      total = comments.length;
    } else {
      // 获取线程的评论
      comments = await (Comment as any).findByThread(
        new Types.ObjectId(threadId as string)
      );
      total = comments.length;
    }

    return res.json(
      successResponse({
        comments,
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
      errorResponse('INTERNAL_ERROR', error.message || '获取评论列表失败')
    );
  }
});

/**
 * 获取评论的回复
 * GET /api/comments/:parentId/replies
 */
router.get('/:parentId/replies', async (req: Request, res: Response) => {
  try {
    const { parentId } = req.params;

    const replies = await (Comment as any).findReplies(
      new Types.ObjectId(parentId)
    );

    return res.json(successResponse({ replies }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '获取回复列表失败')
    );
  }
});

/**
 * 创建新评论
 * POST /api/comments
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { threadId, contentId, content, parentId, mentions } = req.body;

    if (!threadId || !contentId || !content) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '缺少必填字段')
      );
    }

    // 验证内容是否存在
    const contentDoc = await Content.findOne({ _id: contentId });
    if (!contentDoc) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '内容不存在')
      );
    }

    const comment = new Comment({
      threadId: new Types.ObjectId(threadId),
      contentId: new Types.ObjectId(contentId),
      userId,
      content,
      parentId: parentId ? new Types.ObjectId(parentId) : undefined,
      mentions: mentions || [],
    });

    await comment.save();

    return res.status(201).json(successResponse(comment));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '创建评论失败')
    );
  }
});

/**
 * 更新评论
 * PUT /api/comments/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '评论内容不能为空')
      );
    }

    const comment = await Comment.findOne({ _id: id, userId });

    if (!comment) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '评论不存在或无权修改')
      );
    }

    comment.content = content;
    await comment.save();

    return res.json(successResponse(comment));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '更新评论失败')
    );
  }
});

/**
 * 删除评论（软删除）
 * DELETE /api/comments/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const comment = await Comment.findOne({ _id: id, userId });

    if (!comment) {
      return res.status(404).json(
        errorResponse('NOT_FOUND', '评论不存在或无权删除')
      );
    }

    comment.status = CommentStatus.DELETED;
    await comment.save();

    return res.json(successResponse({ message: '评论已删除' }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '删除评论失败')
    );
  }
});

export default router;
