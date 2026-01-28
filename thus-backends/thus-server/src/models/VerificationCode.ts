import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 验证码类型
 */
export enum VerificationCodeType {
  LOGIN = 'login',
  BIND = 'bind',
  RESET = 'reset',
  REGISTER = 'register',
}

/**
 * 验证码接口
 */
export interface IVerificationCode extends Document {
  _id: Types.ObjectId;
  phone: string;
  code: string;
  type: VerificationCodeType;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  lockedUntil?: Date;
}

/**
 * 验证码 Schema
 */
const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(VerificationCodeType),
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'verification_codes',
  }
);

// 复合索引
VerificationCodeSchema.index({ phone: 1, type: 1 });
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL 索引

/**
 * VerificationCode 模型
 */
const VerificationCode: Model<IVerificationCode> = mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;
