import axios from 'axios';
import { OAuthProvider } from '../models/User';
import { IOAuthAccount } from '../models/User';

/**
 * GitHub OAuth 配置
 */
const GITHUB_OAUTH_CONFIG = {
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userUrl: 'https://api.github.com/user',
  scope: 'user:email',
};

/**
 * Google OAuth 配置
 */
const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
};

/**
 * 微信公众号 OAuth 配置
 */
const WECHAT_OAUTH_CONFIG = {
  appId: process.env.WECHAT_APP_ID || '',
  appSecret: process.env.WECHAT_APP_SECRET || '',
  tokenUrl: 'https://api.weixin.qq.com/cgi-bin/token',
  userInfoUrl: 'https://api.weixin.qq.com/cgi-bin/user/info',
};

/**
 * GitHub OAuth 工具类
 */
export class GitHubOAuth {
  /**
   * 使用授权码换取 access_token
   */
  static async exchangeCodeForToken(code: string): Promise<string> {
    const response = await axios.post(GITHUB_OAUTH_CONFIG.tokenUrl, {
      client_id: GITHUB_OAUTH_CONFIG.clientId,
      client_secret: GITHUB_OAUTH_CONFIG.clientSecret,
      code,
    }, {
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data.access_token;
  }

  /**
   * 获取 GitHub 用户信息
   */
  static async getUserInfo(accessToken: string): Promise<{
    id: number;
    login: string;
    email: string;
    avatar_url: string;
    name: string;
  }> {
    const response = await axios.get(GITHUB_OAUTH_CONFIG.userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * 创建 OAuth 账户对象
   */
  static createOAuthAccount(userInfo: any, accessToken: string): IOAuthAccount {
    return {
      provider: OAuthProvider.GITHUB,
      providerId: userInfo.id.toString(),
      accessToken,
      email: userInfo.email,
      avatar: userInfo.avatar_url,
      name: userInfo.name || userInfo.login,
      linkedAt: new Date(),
    };
  }
}

/**
 * Google OAuth 工具类
 */
export class GoogleOAuth {
  /**
   * 使用授权码换取 access_token
   */
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    id_token: string;
  }> {
    const response = await axios.post(GITHUB_OAUTH_CONFIG.tokenUrl, {
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
    });

    return {
      access_token: response.data.access_token,
      id_token: response.data.id_token,
    };
  }

  /**
   * 获取 Google 用户信息
   */
  static async getUserInfo(idToken: string): Promise<{
    sub: string;
    email: string;
    name: string;
    picture: string;
  }> {
    const response = await axios.get(GOOGLE_OAUTH_CONFIG.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    return response.data;
  }

  /**
   * 创建 OAuth 账户对象
   */
  static createOAuthAccount(userInfo: any, accessToken: string): IOAuthAccount {
    return {
      provider: OAuthProvider.GOOGLE,
      providerId: userInfo.sub,
      accessToken,
      email: userInfo.email,
      avatar: userInfo.picture,
      name: userInfo.name,
      linkedAt: new Date(),
    };
  }
}

/**
 * 微信 OAuth 工具类
 */
export class WeChatOAuth {
  /**
   * 获取 access_token
   */
  static async getAccessToken(): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await axios.get(WECHAT_OAUTH_CONFIG.tokenUrl, {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_OAUTH_CONFIG.appId,
        secret: WECHAT_OAUTH_CONFIG.appSecret,
      },
    });

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    };
  }

  /**
   * 获取微信用户信息
   */
  static async getUserInfo(openid: string): Promise<{
    openid: string;
    nickname: string;
    headimgurl: string;
  }> {
    const { access_token } = await this.getAccessToken();
    const response = await axios.get(WECHAT_OAUTH_CONFIG.userInfoUrl, {
      params: {
        access_token,
        openid,
        lang: 'zh_CN',
      },
    });

    return response.data;
  }

  /**
   * 创建 OAuth 账户对象
   */
  static createOAuthAccount(userInfo: any): IOAuthAccount {
    return {
      provider: OAuthProvider.WECHAT_GZH,
      providerId: userInfo.openid,
      email: undefined,
      avatar: userInfo.headimgurl,
      name: userInfo.nickname,
      linkedAt: new Date(),
    };
  }
}
