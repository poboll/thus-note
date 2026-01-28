import https from 'https';
import { logger } from '../config/logger';
import { ConfigService } from './configService';
import { IWeChatConfig } from '../models/SystemConfig';
import User, { IUser, OAuthProvider } from '../models/User';
import { Types } from 'mongoose';

/**
 * 微信 Token 结果
 */
export interface WeChatTokenResult {
  accessToken: string;
  refreshToken: string;
  openId: string;
  unionId?: string;
  expiresIn: number;
}

/**
 * 微信用户信息
 */
export interface WeChatUserInfo {
  openId: string;
  unionId?: string;
  nickname: string;
  headimgurl: string;
  sex?: number;
  province?: string;
  city?: string;
  country?: string;
}

/**
 * 微信绑定状态
 */
export interface WeChatBindingStatus {
  bound: boolean;
  openId?: string;
  nickname?: string;
  headimgurl?: string;
  bindTime?: Date;
}

/**
 * 微信服务错误
 */
export class WeChatError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'WeChatError';
    this.code = code;
  }
}

/**
 * 微信服务
 */
export class WeChatService {
  private config: IWeChatConfig | null = null;

  /**
   * 获取配置
   */
  private async getConfig(): Promise<IWeChatConfig> {
    if (!this.config) {
      this.config = await ConfigService.getWeChatConfig();
    }
    return this.config;
  }

  /**
   * 重置配置缓存
   */
  resetConfig(): void {
    this.config = null;
  }

  /**
   * 生成微信 OAuth 授权 URL
   */
  async getOAuthUrl(redirectUri: string, state: string): Promise<string> {
    const config = await this.getConfig();
    
    if (!config.enabled) {
      throw new WeChatError('WECHAT_NOT_ENABLED', '微信功能未启用');
    }

    if (!config.gzhAppId) {
      throw new WeChatError('WECHAT_CONFIG_INVALID', '微信 AppID 未配置');
    }

    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const scope = 'snsapi_userinfo';
    
    return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${config.gzhAppId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
  }

  /**
   * 生成微信扫码登录 URL（PC端）
   */
  async getQRCodeUrl(redirectUri: string, state: string): Promise<string> {
    const config = await this.getConfig();
    
    if (!config.enabled) {
      throw new WeChatError('WECHAT_NOT_ENABLED', '微信功能未启用');
    }

    if (!config.gzhAppId) {
      throw new WeChatError('WECHAT_CONFIG_INVALID', '微信 AppID 未配置');
    }

    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const scope = 'snsapi_login';
    
    return `https://open.weixin.qq.com/connect/qrconnect?appid=${config.gzhAppId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
  }

  /**
   * 通过授权码获取 access_token
   */
  async getAccessToken(code: string): Promise<WeChatTokenResult> {
    const config = await this.getConfig();
    
    if (!config.enabled) {
      throw new WeChatError('WECHAT_NOT_ENABLED', '微信功能未启用');
    }

    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${config.gzhAppId}&secret=${config.gzhAppSecret}&code=${code}&grant_type=authorization_code`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.errcode) {
              reject(new WeChatError('WECHAT_AUTH_ERROR', result.errmsg || '获取 access_token 失败'));
              return;
            }

            resolve({
              accessToken: result.access_token,
              refreshToken: result.refresh_token,
              openId: result.openid,
              unionId: result.unionid,
              expiresIn: result.expires_in,
            });
          } catch (error) {
            reject(new WeChatError('WECHAT_AUTH_ERROR', '解析响应失败'));
          }
        });
      }).on('error', (error) => {
        reject(new WeChatError('WECHAT_AUTH_ERROR', error.message));
      });
    });
  }

  /**
   * 获取微信用户信息
   */
  async getUserInfo(accessToken: string, openId: string): Promise<WeChatUserInfo> {
    const url = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openId}&lang=zh_CN`;

    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.errcode) {
              reject(new WeChatError('WECHAT_USER_INFO_ERROR', result.errmsg || '获取用户信息失败'));
              return;
            }

            resolve({
              openId: result.openid,
              unionId: result.unionid,
              nickname: result.nickname,
              headimgurl: result.headimgurl,
              sex: result.sex,
              province: result.province,
              city: result.city,
              country: result.country,
            });
          } catch (error) {
            reject(new WeChatError('WECHAT_USER_INFO_ERROR', '解析响应失败'));
          }
        });
      }).on('error', (error) => {
        reject(new WeChatError('WECHAT_USER_INFO_ERROR', error.message));
      });
    });
  }

  /**
   * 绑定微信账号到用户
   */
  async bindUser(
    userId: string | Types.ObjectId,
    openId: string,
    userInfo?: WeChatUserInfo
  ): Promise<boolean> {
    try {
      // 检查该微信是否已被其他用户绑定
      const existingUser = await User.findOne({
        'oauthAccounts.provider': OAuthProvider.WECHAT_GZH,
        'oauthAccounts.providerId': openId,
      });

      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        throw new WeChatError('WECHAT_ALREADY_BOUND', '该微信账号已被其他用户绑定');
      }

      // 查找用户
      const user = await User.findById(userId);
      if (!user) {
        throw new WeChatError('USER_NOT_FOUND', '用户不存在');
      }

      // 检查用户是否已绑定微信
      const existingBinding = user.oauthAccounts.find(
        acc => acc.provider === OAuthProvider.WECHAT_GZH
      );

      if (existingBinding) {
        // 更新现有绑定
        existingBinding.providerId = openId;
        if (userInfo) {
          existingBinding.name = userInfo.nickname;
          existingBinding.avatar = userInfo.headimgurl;
        }
        existingBinding.linkedAt = new Date();
      } else {
        // 添加新绑定
        user.oauthAccounts.push({
          provider: OAuthProvider.WECHAT_GZH,
          providerId: openId,
          name: userInfo?.nickname,
          avatar: userInfo?.headimgurl,
          linkedAt: new Date(),
        });
      }

      await user.save();
      logger.info(`用户 ${userId} 已绑定微信: ${openId}`);
      
      return true;
    } catch (error: any) {
      if (error instanceof WeChatError) {
        throw error;
      }
      logger.error('绑定微信失败:', error);
      throw new WeChatError('WECHAT_BIND_ERROR', error.message || '绑定失败');
    }
  }

  /**
   * 解绑微信账号
   */
  async unbindUser(userId: string | Types.ObjectId): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new WeChatError('USER_NOT_FOUND', '用户不存在');
      }

      const bindingIndex = user.oauthAccounts.findIndex(
        acc => acc.provider === OAuthProvider.WECHAT_GZH
      );

      if (bindingIndex === -1) {
        throw new WeChatError('WECHAT_NOT_BOUND', '用户未绑定微信');
      }

      user.oauthAccounts.splice(bindingIndex, 1);
      await user.save();

      logger.info(`用户 ${userId} 已解绑微信`);
      return true;
    } catch (error: any) {
      if (error instanceof WeChatError) {
        throw error;
      }
      logger.error('解绑微信失败:', error);
      throw new WeChatError('WECHAT_UNBIND_ERROR', error.message || '解绑失败');
    }
  }

  /**
   * 获取用户微信绑定状态
   */
  async getBindingStatus(userId: string | Types.ObjectId): Promise<WeChatBindingStatus> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { bound: false };
      }

      const binding = user.oauthAccounts.find(
        acc => acc.provider === OAuthProvider.WECHAT_GZH
      );

      if (!binding) {
        return { bound: false };
      }

      return {
        bound: true,
        openId: binding.providerId,
        nickname: binding.name,
        headimgurl: binding.avatar,
        bindTime: binding.linkedAt,
      };
    } catch (error: any) {
      logger.error('获取微信绑定状态失败:', error);
      return { bound: false };
    }
  }

  /**
   * 通过微信 OpenID 查找用户
   */
  async findUserByOpenId(openId: string): Promise<IUser | null> {
    return User.findOne({
      'oauthAccounts.provider': OAuthProvider.WECHAT_GZH,
      'oauthAccounts.providerId': openId,
    });
  }

  /**
   * 测试微信配置
   */
  async testConfig(): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getConfig();
      
      if (!config.enabled) {
        return {
          success: false,
          message: '微信功能未启用',
        };
      }

      if (!config.gzhAppId || !config.gzhAppSecret) {
        return {
          success: false,
          message: '微信配置不完整',
        };
      }

      // 尝试获取 access_token（使用 client_credential 方式）
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.gzhAppId}&secret=${config.gzhAppSecret}`;

      return new Promise((resolve) => {
        https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              
              if (result.errcode) {
                resolve({
                  success: false,
                  message: `微信配置验证失败: ${result.errmsg}`,
                });
              } else {
                resolve({
                  success: true,
                  message: '微信配置验证成功',
                });
              }
            } catch {
              resolve({
                success: false,
                message: '响应解析失败',
              });
            }
          });
        }).on('error', (error) => {
          resolve({
            success: false,
            message: `连接失败: ${error.message}`,
          });
        });
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '测试失败',
      };
    }
  }
}

// 导出单例
export const wechatService = new WeChatService();

export default WeChatService;
