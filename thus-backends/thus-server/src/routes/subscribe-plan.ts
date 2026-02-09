import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import User from '../models/User';

const router = Router();

const PLAN_DATA = {
  id: 'plan_premium_yearly',
  payment_circle: 'yearly' as const,
  badge: '年度会员',
  title: '如是 · 高级会员',
  desc: [
    '无限笔记存储空间',
    'AI 智能标签 / 摘要 / 相似推荐',
    '多端实时同步',
    '优先技术支持',
    '更多高级功能持续更新中',
  ].join('\n'),
  price: '128.00',
  currency: 'CNY',
  symbol: '¥',
  original_price: '198.00',
  stripe: null,
  wxpay: null,
  alipay: { isOn: 'Y' },
};

const CREDIT_PACKAGES = [
  { id: 'credits_10', amount: 10, price: '9.90', currency: 'CNY', symbol: '¥' },
  { id: 'credits_50', amount: 50, price: '39.90', currency: 'CNY', symbol: '¥' },
  { id: 'credits_100', amount: 100, price: '68.00', currency: 'CNY', symbol: '¥' },
];

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { operateType } = req.body;

    if (operateType === 'info') {
      return res.json(successResponse(PLAN_DATA));
    }

    if (operateType === 'credit_packages') {
      return res.json(successResponse({ packages: CREDIT_PACKAGES }));
    }

    if (operateType === 'status') {
      const user = await User.findById(userId).select('subscription credits');
      if (!user) {
        return res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
      }
      const sub = user.subscription;
      const now = Date.now();
      const isActive = sub?.isOn && (sub.isLifelong || (sub.expireStamp > now));
      return res.json(successResponse({
        subscribed: !!isActive,
        subscription: sub || null,
        credits: user.credits ?? 0,
      }));
    }

    if (operateType === 'subscribe') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
      }
      const now = Date.now();
      const existingSub = user.subscription;
      if (existingSub?.isOn && (existingSub.isLifelong || existingSub.expireStamp > now)) {
        return res.status(400).json(errorResponse('ALREADY_SUBSCRIBED', '已有生效的订阅'));
      }

      user.subscription = {
        plan: PLAN_DATA.id,
        isOn: true,
        expireStamp: now + YEAR_MS,
        firstChargedStamp: now,
        chargeTimes: 1,
        autoRecharge: false,
        isLifelong: false,
      };
      await user.save();
      return res.json(successResponse({ subscription: user.subscription }));
    }

    if (operateType === 'buy_credits') {
      const { packageId } = req.body;
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!pkg) {
        return res.status(400).json(errorResponse('BAD_REQUEST', '无效的点数包'));
      }
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: pkg.amount } },
        { new: true },
      );
      if (!user) {
        return res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
      }
      return res.json(successResponse({ credits: user.credits, added: pkg.amount }));
    }

    if (operateType === 'cancel_and_refund') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json(errorResponse('NOT_FOUND', '用户不存在'));
      }
      const sub = user.subscription;
      if (!sub?.isOn) {
        return res.status(400).json(errorResponse('NO_SUBSCRIPTION', '当前无有效订阅'));
      }
      const now = Date.now();
      const firstCharged = sub.firstChargedStamp ?? 0;
      const withinRefundPeriod = (now - firstCharged) < WEEK_MS && (sub.chargeTimes ?? 0) <= 1;

      sub.isOn = false;
      sub.expireStamp = now;
      user.subscription = sub;
      await user.save();

      return res.json(successResponse({
        cancelled: true,
        refunded: withinRefundPeriod,
      }));
    }

    return res.status(400).json(
      errorResponse('BAD_REQUEST', `不支持的操作类型: ${operateType}`)
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '订阅服务异常')
    );
  }
});

export default router;
