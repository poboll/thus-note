import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { PasswordUtil } from '../utils/password';

/**
 * OAuth提供商类型
 */
export enum OAuthProvider {
  GITHUB = 'github',
  GOOGLE = 'google',
  WECHAT_GZH = 'wechat_gzh',
  WECHAT_MINI = 'wechat_mini',
  EMAIL = 'email',
  PHONE = 'phone',
}

/**
 * 用户状态
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
  DELETED = 'deleted',
}

/**
 * OAuth账号接口
 */
export interface IOAuthAccount {
  provider: OAuthProvider;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  avatar?: string;
  name?: string;
  linkedAt: Date;
}

/**
 * 用户接口
 */
export interface IFile {
  _id: Types.ObjectId;
  name: string;
  storedFilename?: string;
  size: number;
  mimetype: string;
  url: string;
  createdAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  avatar?: string;
  status: UserStatus;
  role: UserRole;
  oauthAccounts: IOAuthAccount[];
  files: IFile[];
  subscription?: {
    plan: string;
    isOn: boolean;
    expireStamp: number;
    firstChargedStamp?: number;
    chargeTimes?: number;
    autoRecharge?: boolean;
    isLifelong?: boolean;
  };
  credits: number;
  settings: {
    language: string;
    theme: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
    aiEnabled: boolean;
    aiTagCount: number;
    aiTagStyle: 'concise' | 'detailed';
    aiFavoriteTags: string[];
    aiAutoTagMode: 'manual' | 'silent';
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

/**
 * OAuth账号Schema
 */
const OAuthAccountSchema = new Schema<IOAuthAccount>(
  {
    provider: {
      type: String,
      enum: Object.values(OAuthProvider),
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      select: false, // 默认不查询敏感信息
    },
    refreshToken: {
      type: String,
      select: false,
    },
    email: String,
    avatar: String,
    name: String,
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// 创建复合索引，确保同一provider下providerId唯一
OAuthAccountSchema.index({ provider: 1, providerId: 1 });

/**
 * 用户Schema
 */
const FileSchema = new Schema<IFile>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    storedFilename: {
      type: String,
      required: false,
    },
    size: {
      type: Number,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // 允许多个null值
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      select: false, // 默认不查询密码
    },
    avatar: String,
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
    oauthAccounts: [OAuthAccountSchema],
    files: [FileSchema],
    subscription: {
      plan: { type: String, default: '' },
      isOn: { type: Boolean, default: false },
      expireStamp: { type: Number, default: 0 },
      firstChargedStamp: { type: Number },
      chargeTimes: { type: Number, default: 0 },
      autoRecharge: { type: Boolean, default: false },
      isLifelong: { type: Boolean, default: false },
    },
    credits: {
      type: Number,
      default: 0,
    },
    settings: {
      language: {
        type: String,
        default: 'zh-CN',
      },
      theme: {
        type: String,
        default: 'light',
      },
      timezone: {
        type: String,
        default: 'Asia/Shanghai',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
      aiEnabled: {
        type: Boolean,
        default: true,
      },
      aiTagCount: {
        type: Number,
        default: 5,
        min: 3,
        max: 10,
      },
      aiTagStyle: {
        type: String,
        enum: ['concise', 'detailed'],
        default: 'concise',
      },
      aiFavoriteTags: {
        type: [String],
        default: [],
      },
      aiAutoTagMode: {
        type: String,
        enum: ['manual', 'silent'],
        default: 'manual',
      },
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

// 索引
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

// 中间件：保存前自动哈希密码
UserSchema.pre('save', async function (next) {
  // 只有密码被修改时才进行哈希
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const hashedPassword = await PasswordUtil.hashPassword(this.password);
    this.password = hashedPassword;
    next();
  } catch (error: any) {
    next(error);
  }
});

// 中间件：保存前更新时间
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * 根据OAuth信息查找用户
 */
UserSchema.statics.findByOAuth = async function (
  provider: OAuthProvider,
  providerId: string
): Promise<IUser | null> {
  return this.findOne({
    'oauthAccounts.provider': provider,
    'oauthAccounts.providerId': providerId,
  });
};

/**
 * 添加OAuth账号
 */
UserSchema.methods.addOAuthAccount = function (
  account: IOAuthAccount
): Promise<IUser> {
  this.oauthAccounts.push(account);
  return this.save();
};

/**
 * 移除OAuth账号
 */
UserSchema.methods.removeOAuthAccount = function (
  provider: OAuthProvider
): Promise<IUser> {
  this.oauthAccounts = this.oauthAccounts.filter(
    (acc: IOAuthAccount) => acc.provider !== provider
  );
  return this.save();
};

/**
 * 更新最后登录时间
 */
UserSchema.methods.updateLastLogin = function (): Promise<IUser> {
  this.lastLoginAt = new Date();
  return this.save();
};

/**
 * User模型
 */
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
