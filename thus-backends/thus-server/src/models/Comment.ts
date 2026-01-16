import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 评论状态
 */
export enum CommentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
}

/**
 * 评论接口
 */
export interface IComment extends Document {
  _id: Types.ObjectId;
  threadId: Types.ObjectId;
  contentId: Types.ObjectId;
  userId: Types.ObjectId;
  parentId?: Types.ObjectId; // 用于回复评论
  content: string;
  status: CommentStatus;
  mentions: Types.ObjectId[]; // @提到的用户
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 评论Schema
 */
const CommentSchema = new Schema<IComment>(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'Thread',
      required: true,
      index: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: Object.values(CommentStatus),
      default: CommentStatus.ACTIVE,
      index: true,
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 索引
CommentSchema.index({ threadId: 1, status: 1 });
CommentSchema.index({ contentId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1, createdAt: -1 });
CommentSchema.index({ parentId: 1, createdAt: 1 }); // 用于获取回复

// 中间件：保存前更新时间
CommentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：获取线程的所有评论
CommentSchema.statics.findByThread = function (
  threadId: Types.ObjectId,
  status: CommentStatus = CommentStatus.ACTIVE
): Promise<IComment[]> {
  return this.find({ threadId, status })
    .populate('userId', 'username avatar')
    .populate('parentId', 'userId content')
    .sort({ createdAt: -1 });
};

// 静态方法：获取内容的评论
CommentSchema.statics.findByContent = function (
  contentId: Types.ObjectId
): Promise<IComment[]> {
  return this.find({ contentId, status: CommentStatus.ACTIVE })
    .populate('userId', 'username avatar')
    .sort({ createdAt: -1 });
};

// 静态方法：获取回复
CommentSchema.statics.findReplies = function (
  parentId: Types.ObjectId
): Promise<IComment[]> {
  return this.find({ parentId, status: CommentStatus.ACTIVE })
    .populate('userId', 'username avatar')
    .sort({ createdAt: 1 });
};

// 实例方法：软删除
CommentSchema.methods.softDelete = function (): Promise<IComment> {
  this.status = CommentStatus.DELETED;
  return this.save();
};

// 实例方法：隐藏
CommentSchema.methods.hide = function (): Promise<IComment> {
  this.status = CommentStatus.HIDDEN;
  return this.save();
};

/**
 * Comment模型
 */
const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
