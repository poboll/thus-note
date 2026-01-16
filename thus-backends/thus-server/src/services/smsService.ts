import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { smsConfig } from '../config/sms';

/**
 * 短信服务类（腾讯云）
 */
export class SMSService {
  private smsClient: any;

  constructor() {
    // 使用正确的导入方式
    const SmsClient = tencentcloud.sms.v20210111.Client;
    this.smsClient = new SmsClient({
      credential: {
        secretId: smsConfig.secretId,
        secretKey: smsConfig.secretKey,
      },
      region: smsConfig.region,
    });
  }

  /**
   * 发送验证码短信
   */
  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    try {
      const params = {
        PhoneNumberSet: [`+86${phone}`],
        SmsSdkAppId: smsConfig.appId,
        SignName: smsConfig.signName,
        TemplateId: smsConfig.templateId,
        TemplateParamSet: [code],
      };

      await this.smsClient.SendSms(params);
      return true;
    } catch (error) {
      console.error('发送验证码短信失败:', error);
      return false;
    }
  }

  /**
   * 发送通知短信
   */
  async sendNotification(phone: string, message: string): Promise<boolean> {
    try {
      const params = {
        PhoneNumberSet: [`+86${phone}`],
        SmsSdkAppId: smsConfig.appId,
        SignName: smsConfig.signName,
        TemplateId: smsConfig.templateId,
        TemplateParamSet: [message],
      };

      await this.smsClient.SendSms(params);
      return true;
    } catch (error) {
      console.error('发送通知短信失败:', error);
      return false;
    }
  }
}

// 导出单例
export const smsService = new SMSService();
