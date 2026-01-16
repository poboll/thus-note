import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * AI 模型类型
 */
export enum AIModel {
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_3_5 = 'gpt-3.5',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  CLAUDE_3_HAIKU = 'claude-3-haiku',
  GEMINI_PRO = 'gemini-pro',
}

/**
 * AI 使用记录接口
 */
export interface IAIUsage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  model: AIModel;
  operationType: 'chat' | 'completion' | 'embedding';
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number; // 成本（美元）
  prompt?: string;
  response?: string;
  metadata?: any; // 额外的元数据
  createdAt: Date;
}

/**
 * AI 使用记录Schema
 */
const AIUsageSchema = new Schema<IAIUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    model: {
      type: String,
      enum: Object.values(AIModel),
      required: true,
    },
    operationType: {
      type: String,
      enum: ['chat', 'completion', 'embedding'],
      required: true,
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    prompt: {
      type: String,
      maxlength: 10000,
    },
    response: {
      type: String,
      maxlength: 10000,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
AIUsageSchema.index({ userId: 1 });
AIUsageSchema.index({ model: 1 });
AIUsageSchema.index({ operationType: 1 });
AIUsageSchema.index({ createdAt: -1 });

/**
 * AI 使用记录模型
 */
const AIUsageModel: Model<IAIUsage> = mongoose.models.AIUsage || mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);

export default AIUsageModel;
