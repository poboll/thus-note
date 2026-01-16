import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { logger } from '../config/logger';

/**
 * 短信发送工具
 */

// 初始化腾讯云 SMS 客户端
const SmsClient = tencentcloud.sms.v20210111.Client;

const createSmsClient = () => {
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_SMS_SECRET_ID,
      secretKey: process.env.TENCENT_SMS_SECRET_KEY,
    },
    region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou',
    profile: {
      httpProfile: {
        endpoint: 'sms.tencentcloudapi.com',
      },
    },
  };
  return new SmsClient(clientConfig);
};

/**
 * 发送短信验证码
 * @param phoneNumber 手机号（格式：+8613800138000）
 * @param code 验证码
 */
export async function sendSMS(phoneNumber: string, code: string): Promise<void> {
  try {
    const client = createSmsClient();

    const params = {
      PhoneNumberSet: [phoneNumber],
      SmsSdkAppId: process.env.TENCENT_SMS_APP_ID || '',
      SignName: process.env.TENCENT_SMS_SIGN_NAME || '',
      TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID || '',
      TemplateParamSet: [code, '5'], // 验证码和有效期（分钟）
    };

    const result = await client.SendSms(params as any);

    logger.info(`短信发送成功: ${phoneNumber}, RequestId: ${result.RequestId}`);
  } catch (error) {
    logger.error('短信发送失败:', error);
    throw new Error('短信发送失败');
  }
}

/**
 * 发送通知短信
 * @param phoneNumber 手机号
 * @param templateParams 模板参数
 */
export async function sendNotificationSMS(
  phoneNumber: string,
  templateId: string,
  templateParams: string[]
): Promise<void> {
  try {
    const client = createSmsClient();

    const params = {
      PhoneNumberSet: [phoneNumber],
      SmsSdkAppId: process.env.TENCENT_SMS_APP_ID || '',
      SignName: process.env.TENCENT_SMS_SIGN_NAME || '',
      TemplateId: templateId,
      TemplateParamSet: templateParams,
    };

    const result = await client.SendSms(params as any);

    logger.info(`通知短信发送成功: ${phoneNumber}, RequestId: ${result.RequestId}`);
  } catch (error) {
    logger.error('通知短信发送失败:', error);
    throw new Error('通知短信发送失败');
  }
}
