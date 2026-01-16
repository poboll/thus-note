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
 * 线程接口
 */
export interface IThread extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: ThreadType;
  title: string;
  description?: string;
  tags: string[];
  status: ThreadStatus;
  isPublic: boolean;
  settings: {
    color?: string;
    icon?: string;
    sort?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastModifiedAt: Date;
}

/**
 * 线程Schema
 */
const ThreadSchema = new Schema<IThread>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
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
