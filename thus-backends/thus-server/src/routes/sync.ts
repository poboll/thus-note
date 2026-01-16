import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import Thread from '../models/Thread';
import Content from '../models/Content';
import Comment from '../models/Comment';
import User from '../models/User';

const router = Router();

/**
 * 同步获取API
 * POST /api/sync/get
 */
router.post('/get', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { atoms } = req.body;

    if (!atoms || !Array.isArray(atoms)) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', 'atoms参数错误')
      );
    }

    const results: any[] = [];

    for (const atom of atoms) {
      const { taskType, taskId } = atom;
      let result: any = { taskId };

      try {
        if (taskType === 'thread_list') {
          result = await getThreadList(userId, atom);
        } else if (taskType === 'content_list') {
          result = await getContentList(userId, atom);
        } else if (taskType === 'thread_data') {
          result = await getThreadData(userId, atom);
        } else if (taskType === 'comment_list') {
          result = await getCommentList(userId, atom);
        } else {
          result = {
            code: 'E5001',
            taskId,
            errMsg: '未知的taskType',
          };
        }
      } catch (error: any) {
        result = {
          code: 'E5001',
          taskId,
          errMsg: error.message || '处理失败',
        };
      }

      results.push(result);
    }

    return res.json(successResponse({ results }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '同步获取失败')
    );
  }
});

/**
 * 同步设置API
 * POST /api/sync/set
 */
router.post('/set', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { atoms } = req.body;

    if (!atoms || !Array.isArray(atoms)) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', 'atoms参数错误')
      );
    }

    const results: any[] = [];

    for (const atom of atoms) {
      const { taskType, taskId } = atom;
      let result: any = { taskId };

      try {
        if (taskType === 'thread-post') {
          result = await postThread(userId, atom);
        } else if (taskType === 'thread-edit') {
          result = await editThread(userId, atom);
        } else if (taskType === 'thread-delete') {
          result = await deleteThread(userId, atom);
        } else if (taskType === 'comment-post') {
          result = await postComment(userId, atom);
        } else if (taskType === 'comment-edit') {
          result = await editComment(userId, atom);
        } else if (taskType === 'comment-delete') {
          result = await deleteComment(userId, atom);
        } else {
          result = {
            code: 'E5001',
            taskId,
            errMsg: '未知的taskType',
          };
        }
      } catch (error: any) {
        result = {
          code: 'E5001',
          taskId,
          errMsg: error.message || '处理失败',
        };
      }

      results.push(result);
    }

    return res.json(successResponse({ results }));
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '同步设置失败')
    );
  }
});

/**
 * 获取线程列表
 */
async function getThreadList(userId: Types.ObjectId, atom: any) {
  const { taskId, type, limit = 20, skip = 0 } = atom;

  const query: any = { userId };
  if (type && type !== 'ALL') {
    query.type = type;
  }

  const threads = await Thread.find(query)
    .sort({ lastModifiedAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    code: '0000',
    taskId,
    list: threads,
  };
}

/**
 * 获取内容列表
 */
async function getContentList(userId: Types.ObjectId, atom: any) {
  const { taskId, threadId, limit = 20, skip = 0 } = atom;

  if (!threadId) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'threadId是必需的',
    };
  }

  const contents = await Content.find({ threadId })
    .sort({ version: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    code: '0000',
    taskId,
    list: contents,
  };
}

/**
 * 获取线程数据
 */
async function getThreadData(userId: Types.ObjectId, atom: any) {
  const { taskId, threadId } = atom;

  if (!threadId) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'threadId是必需的',
    };
  }

  const thread = await Thread.findOne({ _id: threadId, userId });
  if (!thread) {
    return {
      code: 'E4004',
      taskId,
      errMsg: '线程不存在',
    };
  }

  const contents = await Content.find({ threadId })
    .sort({ version: -1 })
    .limit(10)
    .exec();

  return {
    code: '0000',
    taskId,
    thread,
    contents,
  };
}

/**
 * 获取评论列表
 */
async function getCommentList(userId: Types.ObjectId, atom: any) {
  const { taskId, threadId, limit = 20, skip = 0 } = atom;

  if (!threadId) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'threadId是必需的',
    };
  }

  const comments = await Comment.find({ threadId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    code: '0000',
    taskId,
    list: comments,
  };
}

/**
 * 发布线程
 */
async function postThread(userId: Types.ObjectId, atom: any) {
  const { taskId, thread } = atom;

  if (!thread) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'thread是必需的',
    };
  }

  const { title, type = 'note', description, tags = [] } = thread;

  const newThread = new Thread({
    userId,
    type,
    title,
    description,
    tags,
    status: 'active',
    isPublic: false,
  });

  await newThread.save();

  return {
    code: '0000',
    taskId,
    first_id: thread.first_id || newThread._id.toString(),
    new_id: newThread._id.toString(),
  };
}

/**
 * 编辑线程
 */
async function editThread(userId: Types.ObjectId, atom: any) {
  const { taskId, thread } = atom;

  if (!thread || !thread.id) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'thread.id是必需的',
    };
  }

  const existingThread = await Thread.findOne({ _id: thread.id, userId });
  if (!existingThread) {
    return {
      code: 'E4004',
      taskId,
      errMsg: '线程不存在',
    };
  }

  const { title, description, tags } = thread;
  if (title !== undefined) existingThread.title = title;
  if (description !== undefined) existingThread.description = description;
  if (tags !== undefined) existingThread.tags = tags;

  await existingThread.save();

  return {
    code: '0000',
    taskId,
  };
}

/**
 * 删除线程
 */
async function deleteThread(userId: Types.ObjectId, atom: any) {
  const { taskId, thread } = atom;

  if (!thread || !thread.id) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'thread.id是必需的',
    };
  }

  const existingThread = await Thread.findOne({ _id: thread.id, userId });
  if (!existingThread) {
    return {
      code: 'E4004',
      taskId,
      errMsg: '线程不存在',
    };
  }

  await (existingThread as any).softDelete();

  return {
    code: '0000',
    taskId,
  };
}

/**
 * 发布评论
 */
async function postComment(userId: Types.ObjectId, atom: any) {
  const { taskId, comment } = atom;

  if (!comment) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'comment是必需的',
    };
  }

  const { threadId, content, parentId } = comment;

  if (!threadId) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'threadId是必需的',
    };
  }

  const newComment = new Comment({
    userId,
    threadId,
    content,
    parentId,
    status: 'active',
  });

  await newComment.save();

  return {
    code: '0000',
    taskId,
    first_id: comment.first_id || newComment._id.toString(),
    new_id: newComment._id.toString(),
  };
}

/**
 * 编辑评论
 */
async function editComment(userId: Types.ObjectId, atom: any) {
  const { taskId, comment } = atom;

  if (!comment || !comment.id) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'comment.id是必需的',
    };
  }

  const existingComment = await Comment.findOne({ _id: comment.id, userId });
  if (!existingComment) {
    return {
      code: 'E4004',
      taskId,
      errMsg: '评论不存在',
    };
  }

  const { content } = comment;
  if (content !== undefined) existingComment.content = content;

  await existingComment.save();

  return {
    code: '0000',
    taskId,
  };
}

/**
 * 删除评论
 */
async function deleteComment(userId: Types.ObjectId, atom: any) {
  const { taskId, comment } = atom;

  if (!comment || !comment.id) {
    return {
      code: 'E4000',
      taskId,
      errMsg: 'comment.id是必需的',
    };
  }

  const existingComment = await Comment.findOne({ _id: comment.id, userId });
  if (!existingComment) {
    return {
      code: 'E4004',
      taskId,
      errMsg: '评论不存在',
    };
  }

  await (existingComment as any).softDelete();

  return {
    code: '0000',
    taskId,
  };
}

export default router;
