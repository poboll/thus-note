import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import Thread from '../models/Thread';
import Content from '../models/Content';
import Comment from '../models/Comment';
import User from '../models/User';
import Member from '../models/Member';
import { getRedisClient } from '../config/redis';
import { EncryptionUtil } from '../utils/encryption';

const router = Router();

/**
 * 解密 liu_enc_atoms 数据
 * @param liu_enc_atoms 加密的数据 { cipherText, iv }
 * @param userId 用户 ID
 * @returns 解密后的 atoms 数组，如果解密失败返回 null
 */
async function decryptLiuEncAtoms(liu_enc_atoms: { cipherText: string; iv: string }, userId: string): Promise<any[] | null> {
  try {
    // 1. 从 Redis 获取用户的 client_key
    const redisClient = getRedisClient();
    const clientKeyRedisKey = `client_key:${userId}`;
    const clientKey = await redisClient.get(clientKeyRedisKey);

    if (!clientKey) {
      console.warn(`⚠️ 用户 ${userId} 的 client_key 不存在，无法解密`);
      return null;
    }

    // 2. client_key 格式是 "client_key_<base64_aes_key>"，需要提取 base64 部分
    const aesKey = clientKey.replace('client_key_', '');

    // 3. 使用 AES-GCM 解密
    const decryptedStr = EncryptionUtil.decryptAESGCM(
      liu_enc_atoms.cipherText,
      liu_enc_atoms.iv,
      aesKey
    );

    // 4. 解析 JSON（前端加密的是 LiuPlainText 格式）
    const liuPlainText = JSON.parse(decryptedStr);

    // 5. 验证 pre 前缀（前端会在加密时添加 client_key 的前5位作为校验）
    if (liuPlainText.pre !== aesKey.substring(0, 5)) {
      console.warn(`⚠️ 解密校验失败: pre=${liuPlainText.pre}, expected=${aesKey.substring(0, 5)}`);
      return null;
    }

    // 6. 返回实际的数据
    const atoms = liuPlainText.data;
    console.log(`✅ 成功解密 liu_enc_atoms，包含 ${Array.isArray(atoms) ? atoms.length : 0} 个 atoms`);
    return Array.isArray(atoms) ? atoms : null;

  } catch (error: any) {
    console.error(`❌ 解密 liu_enc_atoms 失败:`, error.message);
    return null;
  }
}

/**
 * 同步API - 根路径（前端兼容）
 * POST /sync-get 和 /sync-set
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { operateType, atoms, plz_enc_atoms, liu_enc_atoms } = req.body;

    console.log(`\n📥 收到 sync-set 请求:`, JSON.stringify({
      operateType,
      atomsCount: atoms?.length,
      plz_enc_atomsCount: plz_enc_atoms?.length,
      liu_enc_atomsCount: liu_enc_atoms ? 1 : 0
    }, null, 2));

    // 使用 plz_enc_atoms、liu_enc_atoms 或 atoms
    let atomList = plz_enc_atoms || atoms;

    // 如果有 liu_enc_atoms（加密数据），尝试解密
    if (liu_enc_atoms && liu_enc_atoms.cipherText && liu_enc_atoms.iv) {
      console.log(`🔐 检测到 liu_enc_atoms（加密数据），尝试解密...`);
      const decryptedAtoms = await decryptLiuEncAtoms(liu_enc_atoms, userId.toString());
      if (decryptedAtoms) {
        atomList = decryptedAtoms;
        console.log(`✅ 解密成功，获取到 ${atomList.length} 个 atoms`);
      } else {
        console.warn(`⚠️ 解密失败，无法处理加密请求`);
        return res.json(successResponse({ results: [] }));
      }
    }

    // 如果没有 atoms，返回空结果
    if (!atomList || !Array.isArray(atomList)) {
      console.warn(`⚠️ atomList 为空或不是数组`);
      console.warn(`atomList:`, atomList);
      return res.json(successResponse({ results: [] }));
    }

    const results: any[] = [];

    // 判断是 sync-set 还是 sync-get
    // 使用 req.baseUrl 获取完整路径，因为在子路由中 req.path 是相对路径
    const fullPath = req.baseUrl + req.path;
    const isSet = fullPath.includes('set');
    const isGet = fullPath.includes('get') || operateType === 'general_sync';

    console.log(`🔍 处理模式: isSet=${isSet}, isGet=${isGet}, fullPath=${fullPath}, baseUrl=${req.baseUrl}, path=${req.path}`);

    for (const atom of atomList) {
      const { taskType, taskId } = atom;
      let result: any = { taskId };

      try {
        console.log(`\n🔍 处理 atom: taskType=${taskType}, taskId=${taskId}`);

        if (isSet) {
          // sync-set 操作
          if (taskType === 'thread-post') {
            console.log(`📝 调用 postThread`);
            result = await postThread(userId, atom);
            console.log(`✅ postThread 返回:`, JSON.stringify(result, null, 2));
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
            console.log(`⚠️ 未知的 taskType: ${taskType}`);
            result = { code: '0000', taskId };
          }
        } else if (isGet) {
          // sync-get 操作
          if (taskType === 'thread_list') {
            console.log(`📝 调用 getThreadList`);
            result = await getThreadList(userId, atom);
            console.log(`✅ getThreadList 返回:`, JSON.stringify(result, null, 2));
          } else if (taskType === 'content_list') {
            result = await getContentList(userId, atom);
          } else if (taskType === 'thread_data') {
            result = await getThreadData(userId, atom);
          } else if (taskType === 'comment_list') {
            result = await getCommentList(userId, atom);
          } else {
            result = { code: '0000', taskId };
          }
        }
      } catch (error: any) {
        console.error(`❌ 处理 atom 时出错:`, error);
        result = {
          code: 'E5001',
          taskId,
          errMsg: error.message
        };
      }

      results.push(result);
    }

    console.log(`\n✅ 返回 results:`, JSON.stringify(results, null, 2));
    return res.json(successResponse({ results }));
  } catch (error: any) {
    console.error(`❌ sync 路由错误:`, error);
    return res.json(successResponse({ results: [] }));
  }
});

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
 *
 * 注意：前端期望的是 LiuDownloadContent 格式的数据
 * 原始 LAF 云函数使用 Content 表，其中 infoType: 'THREAD' 表示线程
 *
 * 当前实现：查询 Thread 表，然后转换为 LiuDownloadContent 格式
 */
async function getThreadList(userId: Types.ObjectId, atom: any) {
  const { taskId, viewType, spaceId, limit = 20, skip = 0 } = atom;

  // 查询 Thread 表
  const query: any = { userId };

  // 🔥 强制修复：完全忽略前端传递的 spaceId，确保能查到所有数据
  // if (spaceId) {
  //   query.spaceId = new Types.ObjectId(spaceId);
  // }
  if(query.spaceId) delete query.spaceId; // 双重保险

  console.log(`🔍 [DEBUG] getThreadList 查询条件:`, JSON.stringify(query));

  // 处理不同的视图类型
  if (viewType === 'TRASH') {
    query.status = 'deleted';
  } else if (viewType === 'ARCHIVED') {
    query.status = 'archived';
  } else {
    query.status = 'active';
  }

  // 查询 Thread 表
  const threads = await Thread.find(query)
    .sort({ lastModifiedAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();

  console.log(`📝 getThreadList: userId=${userId}, spaceId=${spaceId}, viewType=${viewType}, 查询到 ${threads.length} 个线程`);

  // 转换为前端期望的格式：ThusDownloadParcel[]
  const parcels = threads.map((thread: any) => {
    const threadObj = thread.toObject();
    const now = Date.now();

    return {
      id: threadObj._id.toString(),
      status: 'has_data',
      parcelType: 'content',
      content: {
        _id: threadObj._id.toString(),
        first_id: threadObj._id.toString(),

        isMine: true,
        author: {
          space_id: threadObj.spaceId?.toString() || '',
          user_id: threadObj.userId?.toString() || '',
        },
        spaceId: threadObj.spaceId?.toString() || '',
        spaceType: 'ME',

        infoType: 'THREAD',
        oState: 'OK',
        visScope: 'PUBLIC',
        storageState: 'CLOUD',

        title: threadObj.title || '',
        // 修复：前端使用 content 字段，不是 children
        thusDesc: threadObj.description ? [{
          type: 'paragraph',
          content: [{ type: 'text', text: threadObj.description }]
        }] : [],
        images: [],
        files: [],

        calendarStamp: 0,
        remindStamp: 0,
        whenStamp: 0,
        remindMe: null,
        emojiData: { total: 0, items: [] },
        parentThread: null,
        parentComment: null,
        replyToComment: null,
        pinStamp: 0,

        createdStamp: threadObj.createdAt ? new Date(threadObj.createdAt).getTime() : now,
        editedStamp: threadObj.updatedAt ? new Date(threadObj.updatedAt).getTime() : now,
        removedStamp: 0,

        tagIds: threadObj.tags || [],
        tagSearched: threadObj.tags || [],
        stateId: null,
        stateStamp: 0,
        config: {},
        search_title: threadObj.title || '',
        search_other: threadObj.description || '',

        levelOne: 0,
        levelOneAndTwo: 0,
        aiCharacter: null,
        aiReadable: 1,
        ideType: null,
        computingProvider: null,
        aiModel: null,

        myFavorite: undefined,
        myEmoji: undefined,
      },
    };
  });

  return {
    code: '0000',
    taskId,
    list: parcels,
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

  console.log(`📝 postThread 收到数据:`, JSON.stringify({ taskId, thread }, null, 2));

  if (!thread) {
    console.warn(`⚠️ postThread: thread 为空`);
    return {
      code: 'E4000',
      taskId,
      errMsg: 'thread是必需的',
    };
  }

  // 从 thread 对象中提取所有字段
  const {
    first_id,
    title,
    type = 'note',
    description,
    tags = [],
    thusDesc,
    spaceId,
    calendarStamp,
    remindStamp,
    whenStamp,
    stateId,
    images,
    files,
  } = thread;

  // 获取用户的默认 spaceId
  let finalSpaceId = spaceId;

  // 如果传入的是字符串格式的 spaceId，直接使用
  if (finalSpaceId && typeof finalSpaceId === 'string') {
    try {
      finalSpaceId = new Types.ObjectId(finalSpaceId);
      console.log(`✅ 使用前端传入的 spaceId: ${finalSpaceId}`);
    } catch (e) {
      console.warn(`⚠️ spaceId 格式无效: ${spaceId}`);
      finalSpaceId = undefined;
    }
  }

  // 如果没有有效的 spaceId，从 Member 表查找
  if (!finalSpaceId) {
    try {
      // 查找用户的第一个成员记录
      const member = await Member.findOne({ userId }).exec();
      if (member) {
        finalSpaceId = member.spaceId;
        console.log(`✅ 从 Member 表找到 spaceId: ${finalSpaceId}`);
      } else {
        console.warn(`⚠️ 用户 ${userId} 没有找到默认 space`);
      }
    } catch (error) {
      console.error(`❌ 查找 spaceId 时出错:`, error);
    }
  }

  // 构建描述文本（从 thusDesc 中提取）
  let finalDescription = description;
  if (!finalDescription && thusDesc && Array.isArray(thusDesc)) {
    // 从 thusDesc 中提取文本内容
    const textParts: string[] = [];
    for (const block of thusDesc) {
      // 前端使用 content 字段，不是 children
      if (block.content && Array.isArray(block.content)) {
        for (const child of block.content) {
          if (child.text) {
            textParts.push(child.text);
          }
        }
      }
      // 兼容旧格式 children
      if (block.children && Array.isArray(block.children)) {
        for (const child of block.children) {
          if (child.text) {
            textParts.push(child.text);
          }
        }
      }
    }
    finalDescription = textParts.join(' ').trim();
  }

  const newThread = new Thread({
    userId,
    spaceId: finalSpaceId,
    type,
    title: title || '',
    description: finalDescription || '',
    tags: tags || [],
    status: 'active',
    isPublic: false,
  });

  await newThread.save();

  console.log(`✅ 线程创建成功: _id=${newThread._id}, first_id=${first_id || newThread._id.toString()}`);

  return {
    code: '0000',
    taskId,
    first_id: first_id || newThread._id.toString(),
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
