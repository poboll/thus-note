import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 令牌类型
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFY = 'email_verify',
}

/**
 * 令牌接口
 */
export interface IToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  type: TokenType;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

/**
 * 令牌Schema
 */
const TokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TokenType),
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
TokenSchema.index({ userId: 1, type: 1 });
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL索引，自动删除过期令牌

// 静态方法：查找有效令牌
TokenSchema.statics.findValid = async function (
  token: string,
  type: TokenType
): Promise<IToken | null> {
  return this.findOne({
    token,
    type,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate('userId');
};

// 静态方法：撤销用户的所有令牌
TokenSchema.statics.revokeAllByUser = async function (
  userId: Types.ObjectId,
  type?: TokenType
): Promise<number> {
  const query: any = { userId, isRevoked: false };
  if (type) {
    query.type = type;
  }
  const result = await this.updateMany(query, { isRevoked: true });
  return result.modifiedCount;
};

// 静态方法：撤销令牌
TokenSchema.statics.revoke = async function (
  token: string
): Promise<IToken | null> {
  const tokenDoc = await this.findOne({ token });
  if (tokenDoc) {
    tokenDoc.isRevoked = true;
    await tokenDoc.save();
  }
  return tokenDoc;
};

// 静态方法：清理过期令牌
TokenSchema.statics.cleanupExpired = async function (): Promise<number> {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

// 实例方法：撤销
TokenSchema.methods.revoke = function (): Promise<IToken> {
  this.isRevoked = true;
  return this.save();
};

// 实例方法：检查是否有效
TokenSchema.methods.isValid = function (): boolean {
  return !this.isRevoked && this.expiresAt > new Date();
};

/**
 * Token模型
 */
const Token: Model<IToken> =
  mongoose.models.Token || mongoose.model<IToken>('Token', TokenSchema);

export default Token;
