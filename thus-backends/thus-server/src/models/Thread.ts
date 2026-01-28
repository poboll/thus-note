import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 线程类型
 */
export enum ThreadType {
  NOTE = 'note',
  TASK = 'task',
  CALENDAR = 'calendar',
  KANBAN = 'kanban',
  DRAWING = 'drawing',
}

/**
 * 线程状态
 */
export enum ThreadStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

/**
 * oState 状态枚举（与前端一致）
 */
export enum OState {
  OK = 'OK',
  DELETED = 'DELETED',
  ONLY_LOCAL = 'ONLY_LOCAL',
}

/**
 * AI可读状态
 */
export type AiReadable = 'Y' | 'N';

/**
 * 图片数据接口
 */
export interface ThreadImage {
  id: string;
  name?: string;
  url?: string;
  blurhash?: string;
  width?: number;
  height?: number;
  h2w?: string;
  lastModified?: number;
  mimeType?: string;
  cloud_url?: string;
  cloud_id?: string;
}

/**
 * 文件数据接口
 */
export interface ThreadFile {
  id: string;
  name: string;
  suffix?: string;
  size?: number;
  url?: string;
  cloud_url?: string;
  cloud_id?: string;
  lastModified?: number;
  mimeType?: string;
}

/**
 * emoji数据接口
 */
export interface EmojiData {
  total: number;
  system?: Array<{ value: string; num: number }>;
  items?: Array<{ value: string; num: number }>;
}

/**
 * 线程接口 - 完整匹配前端 LiuUploadThread 格式
 */
export interface IThread extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  spaceId?: Types.ObjectId;  // 工作区ID
  
  // 前端原始ID（用于同步）
  first_id?: string;
  
  type: ThreadType;
  title: string;
  description?: string;  // 纯文本描述（用于搜索）
  
  // 富文本内容（TipTap JSON格式）
  thusDesc?: any[];
  
  // 媒体文件
  images?: ThreadImage[];
  files?: ThreadFile[];
  
  // 时间戳
  editedStamp?: number;
  createdStamp?: number;
  removedStamp?: number;
  calendarStamp?: number;
  remindStamp?: number;
  whenStamp?: number;
  pinStamp?: number;
  stateStamp?: number;
  
  // 提醒设置
  remindMe?: any;
  
  // 状态
  oState: OState;
  status: ThreadStatus;
  
  // 标签
  tags: string[];
  tagIds?: string[];
  tagSearched?: string[];
  
  // 状态ID
  stateId?: string;
  
  // 表情数据
  emojiData?: EmojiData;
  
  // 配置
  config?: any;
  
  // AI相关
  aiChatId?: string;
  aiReadable?: AiReadable;
  
  isPublic: boolean;
  settings: {
    color?: string;
    icon?: string;
    sort?: number;
    showCountdown?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  lastModifiedAt: Date;
}

const ThreadSchema = new Schema<IThread>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Space',
      index: true,
    },
    first_id: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ThreadType),
      default: ThreadType.NOTE,
      required: true,
    },
    title: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 10000,
    },
    thusDesc: {
      type: Schema.Types.Mixed,
      default: [],
    },
    images: {
      type: [{
        id: String,
        name: String,
        url: String,
        blurhash: String,
        width: Number,
        height: Number,
        h2w: String,
        lastModified: Number,
        mimeType: String,
        cloud_url: String,
        cloud_id: String,
      }],
      default: [],
    },
    files: {
      type: [{
        id: String,
        name: String,
        suffix: String,
        size: Number,
        url: String,
        cloud_url: String,
        cloud_id: String,
        lastModified: Number,
        mimeType: String,
      }],
      default: [],
    },
    editedStamp: Number,
    createdStamp: Number,
    removedStamp: Number,
    calendarStamp: Number,
    remindStamp: Number,
    whenStamp: Number,
    pinStamp: Number,
    stateStamp: Number,
    remindMe: Schema.Types.Mixed,
    oState: {
      type: String,
      enum: Object.values(OState),
      default: OState.OK,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    tagIds: {
      type: [String],
      default: [],
    },
    tagSearched: {
      type: [String],
      default: [],
    },
    stateId: String,
    emojiData: {
      type: Schema.Types.Mixed,
      default: { total: 0, system: [] },
    },
    config: Schema.Types.Mixed,
    aiChatId: String,
    aiReadable: {
      type: String,
      enum: ['Y', 'N'],
      default: 'Y',
    },
    status: {
      type: String,
      enum: Object.values(ThreadStatus),
      default: ThreadStatus.ACTIVE,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    settings: {
      color: String,
      icon: String,
      sort: {
        type: Number,
        default: 0,
      },
      showCountdown: Boolean,
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
ThreadSchema.index({ userId: 1, status: 1 });
ThreadSchema.index({ userId: 1, type: 1 });
ThreadSchema.index({ userId: 1, tags: 1 });
ThreadSchema.index({ userId: 1, lastModifiedAt: -1 });
ThreadSchema.index({ createdAt: -1 });

// 中间件：保存前更新时间
ThreadSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  this.lastModifiedAt = new Date();
  next();
});

// 静态方法：获取用户的活跃线程
ThreadSchema.statics.findActiveByUser = function (
  userId: Types.ObjectId
): Promise<IThread[]> {
  return this.find({ userId, status: ThreadStatus.ACTIVE }).sort({
    lastModifiedAt: -1,
  });
};

// 静态方法：按标签搜索
ThreadSchema.statics.findByTags = function (
  userId: Types.ObjectId,
  tags: string[]
): Promise<IThread[]> {
  return this.find({
    userId,
    tags: { $in: tags },
    status: ThreadStatus.ACTIVE,
  }).sort({ lastModifiedAt: -1 });
};

// 实例方法：归档
ThreadSchema.methods.archive = function (): Promise<IThread> {
  this.status = ThreadStatus.ARCHIVED;
  return this.save();
};

// 实例方法：软删除
ThreadSchema.methods.softDelete = function (): Promise<IThread> {
  this.status = ThreadStatus.DELETED;
  return this.save();
};

/**
 * Thread模型
 */
const Thread: Model<IThread> =
  mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);

export default Thread;
