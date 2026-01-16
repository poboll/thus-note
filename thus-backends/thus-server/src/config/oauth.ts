/**
 * OAuth配置
 */

export interface OAuthConfig {
  github: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  google: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  wechat: {
    appId: string;
    appSecret: string;
    callbackURL: string;
  };
}

export const oauthConfig: OAuthConfig = {
  github: {
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
    callbackURL: process.env.WECHAT_CALLBACK_URL || 'http://localhost:3000/api/auth/wechat/callback',
  },
};
