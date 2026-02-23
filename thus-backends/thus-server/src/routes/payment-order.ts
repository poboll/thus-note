import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';

const router = Router();

// Payment order route - handles wxpay_jsapi and alipay_wap operations
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { operateType, order_id, wx_gzh_openid } = req.body;

    if (operateType === 'wxpay_jsapi') {
      // Mock response for WeChat Pay JSAPI
      return res.json(successResponse({
        param: {
          appId: 'mock_app_id',
          timeStamp: String(Math.floor(Date.now() / 1000)),
          nonceStr: 'mock_nonce_' + Date.now(),
          package: 'prepay_id=mock_prepay_id',
          signType: 'RSA',
          paySign: 'mock_pay_sign',
        }
      }));
    }

    if (operateType === 'alipay_wap') {
      // Mock response for Alipay WAP
      const mockWapUrl = `https://openapi.alipay.com/gateway.do?mock_order=${order_id}`;
      return res.json(successResponse({
        wap_url: mockWapUrl
      }));
    }

    return res.status(400).json(
      errorResponse('BAD_REQUEST', `不支持的操作类型: ${operateType}`)
    );
  } catch (error: any) {
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || '支付订单服务异常')
    );
  }
});

export default router;
