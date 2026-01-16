/**
 * 短信服务配置（腾讯云）
 */

export interface SMSConfig {
  secretId: string;
  secretKey: string;
  region: string;
  appId: string;
  signName: string;
  templateId: string;
}

export const smsConfig: SMSConfig = {
  secretId: process.env.TENCENT_SMS_SECRET_ID || '',
  secretKey: process.env.TENCENT_SMS_SECRET_KEY || '',
  region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou',
  appId: process.env.TENCENT_SMS_APP_ID || '',
  signName: process.env.TENCENT_SMS_SIGN_NAME || '如是笔记',
  templateId: process.env.TENCENT_SMS_TEMPLATE_ID || '',
};
