import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import User from '../models/User';
import Space, { SpaceType, SpaceStatus } from '../models/Space';
import Member, { MemberStatus } from '../models/Member';

const router = Router();

/**
 * 获取用户的 spaceMemberList
 */
async function getSpaceMemberList(userId: any) {
  const members = await Member.find({
    userId,
    status: MemberStatus.OK
  }).exec();

  if (members.length === 0) {
    // 创建默认个人空间
    const space = new Space({
      ownerId: userId,
      spaceType: SpaceType.ME,
      status: SpaceStatus.OK,
    });
    await space.save();

    const member = new Member({
      spaceId: space._id,
      userId,
      status: MemberStatus.OK,
    });
    await member.save();

    return [{
      memberId: member._id.toString(),
      member_oState: member.status,
      spaceId: space._id.toString(),
      spaceType: space.spaceType,
      space_oState: space.status,
      space_owner: userId.toString(),
    }];
  }

  const spaceIds = members.map(m => m.spaceId);
  const spaces = await Space.find({ _id: { $in: spaceIds } }).exec();
  const spaceMap = new Map(spaces.map(s => [s._id.toString(), s]));

  return members.map(member => {
    const space = spaceMap.get(member.spaceId.toString());
    return {
      memberId: member._id.toString(),
      member_name: member.name,
      member_avatar: member.avatar,
      member_oState: member.status,
      member_config: member.config,
      member_notification: member.notification,
      spaceId: member.spaceId.toString(),
      spaceType: space?.spaceType || SpaceType.ME,
      space_oState: space?.status || SpaceStatus.OK,
      space_owner: space?.ownerId.toString() || userId.toString(),
      space_name: space?.name,
      space_avatar: space?.avatar,
      space_stateConfig: space?.stateConfig,
      space_tagList: space?.tagList,
      space_config: space?.config,
    };
  });
}

/**
 * 用户设置路由
 * POST /user-settings
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { operateType } = req.body;

    switch (operateType) {
      case 'enter':
      case 'latest':
        return handleEnter(req, res, userId);
      case 'membership':
        return handleMembership(req, res, userId);
      case 'logout':
        return handleLogout(req, res);
      default:
        return res.json(successResponse({ message: 'OK' }));
    }
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '操作失败')
    );
  }
});

/**
 * 处理 enter/latest 请求
 */
async function handleEnter(req: Request, res: Response, userId: any) {
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
  }

  const spaceMemberList = await getSpaceMemberList(userId);

  return res.json(successResponse({
    email: user.email,
    theme: user.settings?.theme || 'system',
    language: user.settings?.language || 'system',
    spaceMemberList,
  }));
}

/**
 * 处理 membership 请求
 */
async function handleMembership(req: Request, res: Response, userId: any) {
  return res.json(successResponse({
    subscription: undefined,
  }));
}

/**
 * 处理 logout 请求
 */
async function handleLogout(req: Request, res: Response) {
  return res.json(successResponse({ message: 'Logged out' }));
}

export default router;
