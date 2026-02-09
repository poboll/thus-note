import SystemConfig, {
  ISystemConfig,
  IStorageConfig,
  ISMSConfig,
  IEmailConfig,
  IWeChatConfig,
  IPoliciesConfig,
  IAIConfig,
  StorageType,
  SMSProvider,
  S3Provider,
} from '../models/SystemConfig';
import { Types } from 'mongoose';
import { logger } from '../config/logger';

/**
 * 配置验证错误
 */
export class ConfigValidationError extends Error {
  public field: string;
  public details: string;

  constructor(field: string, details: string) {
    super(`配置验证失败: ${field} - ${details}`);
    this.name = 'ConfigValidationError';
    this.field = field;
    this.details = details;
  }
}

/**
 * 配置缓存
 */
let configCache: ISystemConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60 * 1000; // 1分钟缓存

/**
 * 配置服务类
 */
export class ConfigService {
  /**
   * 获取系统配置（带缓存）
   */
  static async getConfig(forceRefresh: boolean = false): Promise<ISystemConfig> {
    const now = Date.now();
    
    // 检查缓存是否有效
    if (!forceRefresh && configCache && (now - cacheTimestamp) < CACHE_TTL) {
      return configCache;
    }
    
    try {
      const config = await SystemConfig.getConfig();
      configCache = config;
      cacheTimestamp = now;
      return config;
    } catch (error) {
      logger.error('获取系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 清除配置缓存
   */
  static clearCache(): void {
    configCache = null;
    cacheTimestamp = 0;
  }

  /**
   * 更新基础配置
   */
  static async updateBaseConfig(
    baseUrl: string,
    frontendUrl: string,
    proxy?: { enabled: boolean; host?: string; port?: number },
    updatedBy?: Types.ObjectId
  ): Promise<ISystemConfig> {
    // 验证 URL 格式
    this.validateUrl(baseUrl, 'baseUrl');
    this.validateUrl(frontendUrl, 'frontendUrl');
    
    const updates: Partial<ISystemConfig> = {
      baseUrl,
      frontendUrl,
    };
    
    if (proxy !== undefined) {
      updates.proxy = proxy;
    }
    
    const config = await SystemConfig.updateConfig(updates, updatedBy);
    this.clearCache();
    
    logger.info('基础配置已更新');
    return config;
  }

  /**
   * 更新存储配置
   */
  static async updateStorageConfig(
    storageConfig: IStorageConfig,
    updatedBy?: Types.ObjectId
  ): Promise<ISystemConfig> {
    // 验证存储配置
    this.validateStorageConfig(storageConfig);
    
    const config = await SystemConfig.updateConfig(
      { storage: storageConfig },
      updatedBy
    );
    this.clearCache();
    
    logger.info(`存储配置已更新: ${storageConfig.type}`);
    return config;
  }

  /**
   * 更新短信配置
   */
  static async updateSMSConfig(
    smsConfig: ISMSConfig,
    updatedBy?: Types.ObjectId
  ): Promise<ISystemConfig> {
    // 验证短信配置
    this.validateSMSConfig(smsConfig);
    
    const config = await SystemConfig.updateConfig(
      { sms: smsConfig },
      updatedBy
    );
    this.clearCache();
    
    logger.info(`短信配置已更新: ${smsConfig.provider}`);
    return config;
  }

  static async updateEmailConfig(
    emailConfig: IEmailConfig,
    updatedBy?: Types.ObjectId
  ): Promise<ISystemConfig> {
    if (emailConfig.enabled) {
      if (!emailConfig.host?.trim()) {
        throw new ConfigValidationError('email.host', 'SMTP 主机不能为空');
      }
      if (!emailConfig.user?.trim()) {
        throw new ConfigValidationError('email.user', 'SMTP 用户名不能为空');
      }
      if (!emailConfig.pass?.trim()) {
        throw new ConfigValidationError('email.pass', 'SMTP 密码不能为空');
      }
    }

    const config = await SystemConfig.updateConfig(
      { email: emailConfig } as any,
      updatedBy
    );
    this.clearCache();

    logger.info('邮箱配置已更新');
    return config;
  }

  /**
   * 更新微信配置
   */
  static async updateWeChatConfig(
    wechatConfig: IWeChatConfig,
    updatedBy?: Types.ObjectId
  ): Promise<ISystemConfig> {
    // 验证微信配置
    this.validateWeChatConfig(wechatConfig);
    
    const config = await SystemConfig.updateConfig(
      { wechat: wechatConfig },
      updatedBy
    );
    this.clearCache();
    
    logger.info('微信配置已更新');
    return config;
  }

  /**
   * 更新政策内容
   */
  static async updatePolicies(
    policies: Partial<IPoliciesConfig>,
    updatedBy?: Types.ObjectId
  ): Promise<ISystemConfig> {
    const currentConfig = await this.getConfig(true);
    
    const updatedPolicies: IPoliciesConfig = {
      terms: policies.terms || currentConfig.policies.terms,
      privacy: policies.privacy || currentConfig.policies.privacy,
    };
    
    // 更新版本和时间
    if (policies.terms) {
      updatedPolicies.terms.lastUpdated = new Date();
    }
    if (policies.privacy) {
      updatedPolicies.privacy.lastUpdated = new Date();
    }
    
    const config = await SystemConfig.updateConfig(
      { policies: updatedPolicies },
      updatedBy
    );
    this.clearCache();
    
    logger.info('政策内容已更新');
    return config;
  }

  /**
   * 验证 URL 格式
   */
  private static validateUrl(url: string, fieldName: string): void {
    if (!url || url.trim() === '') {
      throw new ConfigValidationError(fieldName, 'URL 不能为空');
    }
    
    try {
      new URL(url);
    } catch {
      throw new ConfigValidationError(fieldName, '无效的 URL 格式');
    }
  }

  /**
   * 验证存储配置
   */
  private static validateStorageConfig(config: IStorageConfig): void {
    if (!config.type) {
      throw new ConfigValidationError('storage.type', '存储类型不能为空');
    }
    
    if (!Object.values(StorageType).includes(config.type)) {
      throw new ConfigValidationError('storage.type', '无效的存储类型');
    }
    
    if (config.type === StorageType.S3) {
      if (!config.s3) {
        throw new ConfigValidationError('storage.s3', 'S3 配置不能为空');
      }
      
      const s3 = config.s3;
      
      if (!s3.endpoint || s3.endpoint.trim() === '') {
        throw new ConfigValidationError('storage.s3.endpoint', 'S3 端点不能为空');
      }
      
      if (!s3.accessKeyId || s3.accessKeyId.trim() === '') {
        throw new ConfigValidationError('storage.s3.accessKeyId', 'Access Key ID 不能为空');
      }
      
      if (!s3.secretAccessKey || s3.secretAccessKey.trim() === '') {
        throw new ConfigValidationError('storage.s3.secretAccessKey', 'Secret Access Key 不能为空');
      }
      
      if (!s3.bucket || s3.bucket.trim() === '') {
        throw new ConfigValidationError('storage.s3.bucket', 'Bucket 名称不能为空');
      }
      
      if (!s3.region || s3.region.trim() === '') {
        throw new ConfigValidationError('storage.s3.region', 'Region 不能为空');
      }
      
      if (!Object.values(S3Provider).includes(s3.provider)) {
        throw new ConfigValidationError('storage.s3.provider', '无效的 S3 服务商');
      }
    }
    
    if (config.type === StorageType.LOCAL) {
      if (!config.local?.uploadDir || config.local.uploadDir.trim() === '') {
        throw new ConfigValidationError('storage.local.uploadDir', '上传目录不能为空');
      }
    }
  }

  /**
   * 验证短信配置
   */
  private static validateSMSConfig(config: ISMSConfig): void {
    if (!config.enabled) {
      return; // 未启用时不验证
    }
    
    if (!Object.values(SMSProvider).includes(config.provider)) {
      throw new ConfigValidationError('sms.provider', '无效的短信服务商');
    }
    
    switch (config.provider) {
      case SMSProvider.TENCENT:
        if (!config.tencent) {
          throw new ConfigValidationError('sms.tencent', '腾讯云短信配置不能为空');
        }
        if (!config.tencent.secretId) {
          throw new ConfigValidationError('sms.tencent.secretId', 'Secret ID 不能为空');
        }
        if (!config.tencent.secretKey) {
          throw new ConfigValidationError('sms.tencent.secretKey', 'Secret Key 不能为空');
        }
        if (!config.tencent.appId) {
          throw new ConfigValidationError('sms.tencent.appId', 'App ID 不能为空');
        }
        if (!config.tencent.signName) {
          throw new ConfigValidationError('sms.tencent.signName', '签名不能为空');
        }
        if (!config.tencent.templateId) {
          throw new ConfigValidationError('sms.tencent.templateId', '模板 ID 不能为空');
        }
        break;
        
      case SMSProvider.ALIYUN:
        if (!config.aliyun) {
          throw new ConfigValidationError('sms.aliyun', '阿里云短信配置不能为空');
        }
        if (!config.aliyun.accessKeyId) {
          throw new ConfigValidationError('sms.aliyun.accessKeyId', 'Access Key ID 不能为空');
        }
        if (!config.aliyun.accessKeySecret) {
          throw new ConfigValidationError('sms.aliyun.accessKeySecret', 'Access Key Secret 不能为空');
        }
        if (!config.aliyun.signName) {
          throw new ConfigValidationError('sms.aliyun.signName', '签名不能为空');
        }
        if (!config.aliyun.templateCode) {
          throw new ConfigValidationError('sms.aliyun.templateCode', '模板代码不能为空');
        }
        break;
        
      case SMSProvider.YUNPIAN:
        if (!config.yunpian) {
          throw new ConfigValidationError('sms.yunpian', '云片短信配置不能为空');
        }
        if (!config.yunpian.apiKey) {
          throw new ConfigValidationError('sms.yunpian.apiKey', 'API Key 不能为空');
        }
        break;
    }
  }

  /**
   * 验证微信配置
   */
  private static validateWeChatConfig(config: IWeChatConfig): void {
    if (!config.enabled) {
      return; // 未启用时不验证
    }
    
    if (!config.gzhAppId || config.gzhAppId.trim() === '') {
      throw new ConfigValidationError('wechat.gzhAppId', '公众号 AppID 不能为空');
    }
    
    if (!config.gzhAppSecret || config.gzhAppSecret.trim() === '') {
      throw new ConfigValidationError('wechat.gzhAppSecret', '公众号 AppSecret 不能为空');
    }
  }

  /**
   * 获取存储配置
   */
  static async getStorageConfig(): Promise<IStorageConfig> {
    const config = await this.getConfig();
    return config.storage;
  }

  /**
   * 获取短信配置
   */
  static async getSMSConfig(): Promise<ISMSConfig> {
    const config = await this.getConfig();
    return config.sms;
  }

  static async getEmailConfig(): Promise<IEmailConfig> {
    const config = await this.getConfig();
    return config.email;
  }

  /**
   * 获取微信配置
   */
  static async getWeChatConfig(): Promise<IWeChatConfig> {
    const config = await this.getConfig();
    return config.wechat;
  }

  /**
   * 获取政策内容
   */
  static async getPolicies(): Promise<IPoliciesConfig> {
    const config = await this.getConfig();
    return config.policies;
  }

  /**
   * 获取服务协议
   */
  static async getTerms(): Promise<{ content: string; version: string; lastUpdated: Date }> {
    const config = await this.getConfig();
    return config.policies.terms;
  }

  /**
   * 获取隐私政策
   */
  static async getPrivacy(): Promise<{ content: string; version: string; lastUpdated: Date }> {
    const config = await this.getConfig();
    return config.policies.privacy;
  }

  /**
   * 更新AI配置
   */
  static async updateAIConfig(
    aiConfig: IAIConfig,
    updatedBy?: Types.ObjectId
  ): Promise<ISystemConfig> {
    this.validateAIConfig(aiConfig);

    const config = await SystemConfig.updateConfig(
      { ai: aiConfig } as any,
      updatedBy
    );
    this.clearCache();

    logger.info('AI配置已更新');
    return config;
  }

  /**
   * 获取AI配置
   */
  static async getAIConfig(): Promise<IAIConfig> {
    const config = await this.getConfig();
    return config.ai;
  }

  private static validateAIConfig(config: IAIConfig): void {
    if (config.providers && Array.isArray(config.providers)) {
      for (const provider of config.providers) {
        if (!provider.name || provider.name.trim() === '') {
          throw new ConfigValidationError('ai.providers.name', '提供商名称不能为空');
        }
        if (!provider.baseUrl || provider.baseUrl.trim() === '') {
          throw new ConfigValidationError('ai.providers.baseUrl', 'API地址不能为空');
        }
        if (!provider.apiKey || provider.apiKey.trim() === '') {
          throw new ConfigValidationError('ai.providers.apiKey', 'API密钥不能为空');
        }
        if (!provider.defaultModel || provider.defaultModel.trim() === '') {
          throw new ConfigValidationError('ai.providers.defaultModel', '默认模型不能为空');
        }
      }
    }
  }
}

export default ConfigService;
