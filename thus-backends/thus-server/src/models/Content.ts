import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 内容块类型
 */
export enum ContentType {
  TEXT = 'text',
  HEADING = 'heading',
  LIST = 'list',
  CHECKLIST = 'checklist',
  CODE = 'code',
  QUOTE = 'quote',
  DIVIDER = 'divider',
  IMAGE = 'image',
  FILE = 'file',
  TABLE = 'table',
}

/**
 * 内容块接口
 */
export interface IContentBlock {
  type: ContentType;
  content?: string;
  properties?: Record<string, any>;
  order: number;
}

/**
 * 内容接口
 */
export interface IContent extends Document {
  _id: Types.ObjectId;
  threadId: Types.ObjectId;
  userId: Types.ObjectId;
  version: number;
  blocks: IContentBlock[];
  isEncrypted: boolean;
  encryptedData?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 内容块Schema
 */
const ContentBlockSchema = new Schema<IContentBlock>(
  {
    type: {
      type: String,
      enum: Object.values(ContentType),
      required: true,
    },
    content: String,
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

/**
 * 内容Schema
 */
const ContentSchema = new Schema<IContent>(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'Thread',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    blocks: {
      type: [ContentBlockSchema],
      default: [],
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    encryptedData: {
      type: String,
      select: false, // 默认不查询加密数据
    },
  },
  {
    timestamps: true,
  }
);

// 索引
ContentSchema.index({ threadId: 1, version: -1 });
ContentSchema.index({ userId: 1, createdAt: -1 });
ContentSchema.index({ threadId: 1, createdAt: -1 });

// 中间件：保存前更新版本号
ContentSchema.pre('save', function (next) {
  if (this.isNew) {
    this.version = 1;
  } else {
    this.version += 1;
  }
  this.updatedAt = new Date();
  next();
});

// 静态方法：获取线程的最新内容
ContentSchema.statics.findLatestByThread = async function (
  threadId: Types.ObjectId
): Promise<IContent | null> {
  return this.findOne({ threadId }).sort({ version: -1 });
};

// 静态方法：获取线程的内容历史
ContentSchema.statics.findHistoryByThread = function (
  threadId: Types.ObjectId,
  limit: number = 10
): Promise<IContent[]> {
  return this.find({ threadId })
    .sort({ version: -1 })
    .limit(limit);
};

// 实例方法：添加内容块
ContentSchema.methods.addBlock = function (
  block: IContentBlock
): Promise<IContent> {
  this.blocks.push(block);
  return this.save();
};

// 实例方法：更新内容块
ContentSchema.methods.updateBlock = function (
  index: number,
  block: Partial<IContentBlock>
): Promise<IContent> {
  if (index >= 0 && index < this.blocks.length) {
    this.blocks[index] = { ...this.blocks[index], ...block };
  }
  return this.save();
};

// 实例方法：删除内容块
ContentSchema.methods.removeBlock = function (
  index: number
): Promise<IContent> {
  if (index >= 0 && index < this.blocks.length) {
    this.blocks.splice(index, 1);
  }
  return this.save();
};

/**
 * Content模型
 */
const Content: Model<IContent> =
  mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

export default Content;
