import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { logger } from '../config/logger';
import { ConfigService } from './configService';
import {
  ISMSConfig,
  ITencentSMSConfig,
  IAliyunSMSConfig,
  IYunpianSMSConfig,
  SMSProvider,
} from '../models/SystemConfig';

/**
 * 短信发送结果
 */
export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 短信服务接口
 */
export interface ISMSService {
  sendVerificationCode(phone: string, code: string): Promise<SMSResult>;
  sendNotification(phone: string, message: string): Promise<SMSResult>;
}

/**
 * 短信服务错误
 */
export class SMSError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SMSError';
    this.code = code;
  }
}

/**
 * 腾讯云短信服务实现
 */
export class TencentSMSService implements ISMSService {
  private smsClient: any;
  private config: ITencentSMSConfig;

  constructor(config: ITencentSMSConfig) {
    this.config = config;
    const SmsClient = tencentcloud.sms.v20210111.Client;
    this.smsClient = new SmsClient({
      credential: {
        secretId: config.secretId,
        secretKey: config.secretKey,
      },
      region: config.region || 'ap-guangzhou',
    });
    logger.info('腾讯云短信服务已初始化');
  }

  async sendVerificationCode(phone: string, code: string): Promise<SMSResult> {
    try {
      const params = {
        PhoneNumberSet: [`+86${phone}`],
        SmsSdkAppId: this.config.appId,
        SignName: this.config.signName,
        TemplateId: this.config.templateId,
        TemplateParamSet: [code],
      };

      const response = await this.smsClient.SendSms(params);
      
      if (response.SendStatusSet && response.SendStatusSet[0]?.Code === 'Ok') {
        return {
          success: true,
          messageId: response.SendStatusSet[0].SerialNo,
        };
      }
      
      return {
        success: false,
        error: response.SendStatusSet?.[0]?.Message || '发送失败',
      };
    } catch (error: any) {
      logger.error('腾讯云短信发送失败:', error);
      return {
        success: false,
        error: error.message || '发送失败',
      };
    }
  }

  async sendNotification(phone: string, message: string): Promise<SMSResult> {
    return this.sendVerificationCode(phone, message);
  }
}

/**
 * 阿里云短信服务实现
 */
export class AliyunSMSService implements ISMSService {
  private config: IAliyunSMSConfig;

  constructor(config: IAliyunSMSConfig) {
    this.config = config;
    logger.info('阿里云短信服务已初始化');
  }

  async sendVerificationCode(phone: string, code: string): Promise<SMSResult> {
    try {
      // 阿里云短信 API 调用
      const crypto = await import('crypto');
      const https = await import('https');
      
      const timestamp = new Date().toISOString().replace(/\.\d{3}/, '');
      const nonce = crypto.randomUUID();
      
      const params: Record<string, string> = {
        AccessKeyId: this.config.accessKeyId,
        Action: 'SendSms',
        Format: 'JSON',
        PhoneNumbers: phone,
        RegionId: 'cn-hangzhou',
        SignName: this.config.signName,
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: nonce,
        SignatureVersion: '1.0',
        TemplateCode: this.config.templateCode,
        TemplateParam: JSON.stringify({ code }),
        Timestamp: timestamp,
        Version: '2017-05-25',
      };

      // 生成签名
      const sortedKeys = Object.keys(params).sort();
      const canonicalizedQueryString = sortedKeys
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;
      const signature = crypto
        .createHmac('sha1', `${this.config.accessKeySecret}&`)
        .update(stringToSign)
        .digest('base64');
      
      params.Signature = signature;

      const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

      return new Promise((resolve) => {
        const req = https.request({
          hostname: 'dysmsapi.aliyuncs.com',
          path: `/?${queryString}`,
          method: 'GET',
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.Code === 'OK') {
                resolve({
                  success: true,
                  messageId: result.BizId,
                });
              } else {
                resolve({
                  success: false,
                  error: result.Message || '发送失败',
                });
              }
            } catch {
              resolve({
                success: false,
                error: '响应解析失败',
              });
            }
          });
        });

        req.on('error', (error) => {
          resolve({
            success: false,
            error: error.message,
          });
        });

        req.end();
      });
    } catch (error: any) {
      logger.error('阿里云短信发送失败:', error);
      return {
        success: false,
        error: error.message || '发送失败',
      };
    }
  }

  async sendNotification(phone: string, message: string): Promise<SMSResult> {
    return this.sendVerificationCode(phone, message);
  }
}

/**
 * 云片短信服务实现
 */
export class YunpianSMSService implements ISMSService {
  private config: IYunpianSMSConfig;

  constructor(config: IYunpianSMSConfig) {
    this.config = config;
    logger.info('云片短信服务已初始化');
  }

  async sendVerificationCode(phone: string, code: string): Promise<SMSResult> {
    try {
      const https = await import('https');
      const querystring = await import('querystring');
      
      const postData = querystring.stringify({
        apikey: this.config.apiKey,
        mobile: phone,
        tpl_id: this.config.templateId,
        tpl_value: `#code#=${code}`,
      });

      return new Promise((resolve) => {
        const req = https.request({
          hostname: 'sms.yunpian.com',
          path: '/v2/sms/tpl_single_send.json',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
          },
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.code === 0) {
                resolve({
                  success: true,
                  messageId: result.sid?.toString(),
                });
              } else {
                resolve({
                  success: false,
                  error: result.msg || '发送失败',
                });
              }
            } catch {
              resolve({
                success: false,
                error: '响应解析失败',
              });
            }
          });
        });

        req.on('error', (error) => {
          resolve({
            success: false,
            error: error.message,
          });
        });

        req.write(postData);
        req.end();
      });
    } catch (error: any) {
      logger.error('云片短信发送失败:', error);
      return {
        success: false,
        error: error.message || '发送失败',
      };
    }
  }

  async sendNotification(phone: string, message: string): Promise<SMSResult> {
    return this.sendVerificationCode(phone, message);
  }
}

/**
 * 模拟短信服务（开发测试用）
 */
export class MockSMSService implements ISMSService {
  async sendVerificationCode(phone: string, code: string): Promise<SMSResult> {
    logger.info(`[模拟短信] 发送验证码到 ${phone}: ${code}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  async sendNotification(phone: string, message: string): Promise<SMSResult> {
    logger.info(`[模拟短信] 发送通知到 ${phone}: ${message}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }
}

/**
 * 短信服务工厂
 */
export class SMSServiceFactory {
  private static instance: ISMSService | null = null;
  private static currentConfig: ISMSConfig | null = null;

  /**
   * 创建短信服务实例
   */
  static create(config: ISMSConfig): ISMSService {
    if (!config.enabled) {
      logger.warn('短信服务未启用，使用模拟服务');
      return new MockSMSService();
    }

    switch (config.provider) {
      case SMSProvider.TENCENT:
        if (!config.tencent) {
          throw new SMSError('SMS_CONFIG_INVALID', '腾讯云短信配置不能为空');
        }
        return new TencentSMSService(config.tencent);

      case SMSProvider.ALIYUN:
        if (!config.aliyun) {
          throw new SMSError('SMS_CONFIG_INVALID', '阿里云短信配置不能为空');
        }
        return new AliyunSMSService(config.aliyun);

      case SMSProvider.YUNPIAN:
        if (!config.yunpian) {
          throw new SMSError('SMS_CONFIG_INVALID', '云片短信配置不能为空');
        }
        return new YunpianSMSService(config.yunpian);

      default:
        logger.warn('未知的短信服务商，使用模拟服务');
        return new MockSMSService();
    }
  }

  /**
   * 获取短信服务实例（单例模式，自动从配置加载）
   */
  static async getInstance(): Promise<ISMSService> {
    try {
      const smsConfig = await ConfigService.getSMSConfig();

      // 检查配置是否变化
      const configChanged = !this.currentConfig ||
        JSON.stringify(this.currentConfig) !== JSON.stringify(smsConfig);

      if (!this.instance || configChanged) {
        this.instance = this.create(smsConfig);
        this.currentConfig = smsConfig;
        logger.info(`短信服务已初始化: ${smsConfig.provider}`);
      }

      return this.instance;
    } catch (error: any) {
      logger.error('获取短信服务实例失败:', error);
      // 返回模拟服务
      if (!this.instance) {
        this.instance = new MockSMSService();
      }
      return this.instance;
    }
  }

  /**
   * 重置实例（配置变更时调用）
   */
  static resetInstance(): void {
    this.instance = null;
    this.currentConfig = null;
  }

  /**
   * 测试短信服务连接
   */
  static async testConnection(config: ISMSConfig, testPhone: string): Promise<{ success: boolean; message: string }> {
    try {
      const service = this.create(config);
      const testCode = '123456';
      
      const result = await service.sendVerificationCode(testPhone, testCode);
      
      if (result.success) {
        return {
          success: true,
          message: '短信服务测试成功',
        };
      } else {
        return {
          success: false,
          message: `短信服务测试失败: ${result.error}`,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `短信服务测试失败: ${error.message}`,
      };
    }
  }
}

// 兼容旧代码的导出
export class SMSService {
  private service: ISMSService;

  constructor() {
    this.service = new MockSMSService();
    this.init();
  }

  private async init() {
    try {
      this.service = await SMSServiceFactory.getInstance();
    } catch (error) {
      logger.error('初始化短信服务失败:', error);
    }
  }

  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    const result = await this.service.sendVerificationCode(phone, code);
    return result.success;
  }

  async sendNotification(phone: string, message: string): Promise<boolean> {
    const result = await this.service.sendNotification(phone, message);
    return result.success;
  }
}

// 导出单例
export const smsService = new SMSService();

export default SMSServiceFactory;
