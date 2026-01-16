import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 成员状态
 */
export enum MemberStatus {
  OK = 'OK',
  LEFT = 'LEFT',
  DEACTIVATED = 'DEACTIVATED',
  DELETED = 'DELETED',
}

/**
 * 成员接口
 */
export interface IMember extends Document {
  _id: Types.ObjectId;
  spaceId: Types.ObjectId;
  userId: Types.ObjectId;
  status: MemberStatus;
  name?: string;
  avatar?: {
    id: string;
    name: string;
    lastModified: number;
    mimeType?: string;
    width?: number;
    height?: number;
    h2w?: string;
    url: string;
    url_2?: string;
    blurhash?: string;
    size?: number;
  };
  config?: any; // MemberConfig
  notification?: any; // MemberNotification
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 成员Schema
 */
const MemberSchema = new Schema<IMember>(
  {
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(MemberStatus),
      default: MemberStatus.OK,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    avatar: {
      id: String,
      name: String,
      lastModified: Number,
      mimeType: String,
      width: Number,
      height: Number,
      h2w: String,
      url: String,
      url_2: String,
      blurhash: String,
      size: Number,
    },
    config: Schema.Types.Mixed,
    notification: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// 索引
MemberSchema.index({ spaceId: 1 });
MemberSchema.index({ userId: 1 });
MemberSchema.index({ status: 1 });
MemberSchema.index({ createdAt: -1 });
// 复合索引：查询用户的所有空间成员
MemberSchema.index({ userId: 1, status: 1 });

/**
 * Member模型
 */
const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema);

export default Member;
