import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 空间类型
 */
export enum SpaceType {
  ME = 'ME',
  TEAM = 'TEAM',
}

/**
 * 空间状态
 */
export enum SpaceStatus {
  OK = 'OK',
  REMOVED = 'REMOVED',
  DELETED = 'DELETED',
}

/**
 * 空间接口
 */
export interface ISpace extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  spaceType: SpaceType;
  status: SpaceStatus;
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
  stateConfig?: any; // LiuStateConfig
  tagList?: any[]; // TagView[]
  config?: any; // WorkspaceConfig
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 空间Schema
 */
const SpaceSchema = new Schema<ISpace>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    spaceType: {
      type: String,
      enum: Object.values(SpaceType),
      default: SpaceType.ME,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SpaceStatus),
      default: SpaceStatus.OK,
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
    stateConfig: Schema.Types.Mixed,
    tagList: [Schema.Types.Mixed],
    config: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// 索引
SpaceSchema.index({ ownerId: 1 });
SpaceSchema.index({ status: 1 });
SpaceSchema.index({ createdAt: -1 });

/**
 * Space模型
 */
const Space: Model<ISpace> = mongoose.models.Space || mongoose.model<ISpace>('Space', SpaceSchema);

export default Space;
