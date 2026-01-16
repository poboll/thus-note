import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * 任务优先级
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * 任务状态
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 任务接口
 */
export interface ITask extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  threadId?: Types.ObjectId;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  subtasks: Array<{
    title: string;
    completed: boolean;
    completedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 子任务Schema
 */
const SubtaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
  { _id: false }
);

/**
 * 任务Schema
 */
const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    threadId: {
      type: Schema.Types.ObjectId,
      ref: 'Thread',
      index: true,
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
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
      index: true,
    },
    dueDate: {
      type: Date,
      index: true,
    },
    completedAt: Date,
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    subtasks: {
      type: [SubtaskSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// 索引
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, tags: 1 });
TaskSchema.index({ createdAt: -1 });

// 中间件：保存前更新时间
TaskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// 中间件：完成任务时设置完成时间
TaskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === TaskStatus.COMPLETED && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// 静态方法：获取用户的待办任务
TaskSchema.statics.findTodoByUser = function (
  userId: Types.ObjectId
): Promise<ITask[]> {
  return this.find({
    userId,
    status: { $in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
  })
    .sort({ priority: -1, dueDate: 1 })
    .populate('threadId', 'title type');
};

// 静态方法：获取今日到期任务
TaskSchema.statics.findTodayDue = function (
  userId: Types.ObjectId
): Promise<ITask[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    userId,
    dueDate: { $gte: today, $lt: tomorrow },
    status: { $ne: TaskStatus.COMPLETED },
  }).sort({ dueDate: 1 });
};

// 静态方法：获取逾期任务
TaskSchema.statics.findOverdue = function (
  userId: Types.ObjectId
): Promise<ITask[]> {
  const now = new Date();

  return this.find({
    userId,
    dueDate: { $lt: now },
    status: { $ne: TaskStatus.COMPLETED },
  }).sort({ dueDate: 1 });
};

// 实例方法：完成任务
TaskSchema.methods.complete = function (): Promise<ITask> {
  this.status = TaskStatus.COMPLETED;
  this.completedAt = new Date();
  return this.save();
};

// 实例方法：取消任务
TaskSchema.methods.cancel = function (): Promise<ITask> {
  this.status = TaskStatus.CANCELLED;
  return this.save();
};

// 实例方法：添加子任务
TaskSchema.methods.addSubtask = function (
  title: string
): Promise<ITask> {
  this.subtasks.push({ title, completed: false });
  return this.save();
};

// 实例方法：完成子任务
TaskSchema.methods.completeSubtask = function (
  index: number
): Promise<ITask> {
  if (index >= 0 && index < this.subtasks.length) {
    this.subtasks[index].completed = true;
    this.subtasks[index].completedAt = new Date();
  }
  return this.save();
};

/**
 * Task模型
 */
const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
