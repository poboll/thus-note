import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiConfig, AIModel } from '../config/ai';

/**
 * AI消息接口
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI响应接口
 */
export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  cost?: number;
}

/**
 * AI服务类
 * 统一管理多个AI提供商的调用
 */
export class AIService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    // 初始化OpenAI客户端
    if (aiConfig.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: aiConfig.openai.apiKey,
        baseURL: aiConfig.openai.baseURL,
      });
    }

    // 初始化Anthropic客户端
    if (aiConfig.anthropic.apiKey) {
      this.anthropic = new Anthropic({
        apiKey: aiConfig.anthropic.apiKey,
        baseURL: aiConfig.anthropic.baseURL,
      });
    }

    // 初始化Gemini客户端
    if (aiConfig.gemini.apiKey) {
      this.gemini = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
    }
  }

  /**
   * 调用OpenAI
   */
  async callOpenAI(
    messages: AIMessage[],
    model: string = aiConfig.openai.defaultModel,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI未配置');
    }

    try {
      // 过滤掉system消息，因为OpenAI的ChatCompletionMessageParam类型不支持system角色
      // 实际上OpenAI是支持system角色的，但TypeScript类型定义可能有问题
      // 我们使用类型断言来解决这个问题
      const completion = await this.openai.chat.completions.create({
        model,
        messages: messages as any,
        temperature,
        max_tokens: maxTokens,
      });

      return {
        content: completion.choices[0]?.message?.content || '',
        model: completion.model,
        tokensUsed: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage?.total_tokens || 0, model),
      };
    } catch (error: any) {
      console.error('OpenAI调用失败:', error);
      throw new Error(`OpenAI调用失败: ${error.message}`);
    }
  }

  /**
   * 调用Anthropic Claude
   */
  async callClaude(
    messages: AIMessage[],
    model: string = aiConfig.anthropic.defaultModel,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<AIResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic未配置');
    }

    try {
      // 使用类型断言来绕过TypeScript类型检查
      const completion = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: messages.map(m => ({
          role: m.role as any,
          content: m.content,
        })) as any,
      });

      return {
        content: completion.content[0]?.type === 'text' ? completion.content[0].text : '',
        model: completion.model,
        tokensUsed: completion.usage?.input_tokens + completion.usage?.output_tokens || 0,
        cost: this.calculateCost(
          completion.usage?.input_tokens + completion.usage?.output_tokens || 0,
          model
        ),
      };
    } catch (error: any) {
      console.error('Claude调用失败:', error);
      throw new Error(`Claude调用失败: ${error.message}`);
    }
  }

  /**
   * 调用Gemini
   */
  async callGemini(
    messages: AIMessage[],
    model: string = aiConfig.gemini.defaultModel,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<AIResponse> {
    if (!this.gemini) {
      throw new Error('Gemini未配置');
    }

    try {
      const geminiModel = this.gemini.getGenerativeModel({ model });

      // 合并所有消息
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;

      return {
        content: response.text() || '',
        model,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        cost: 0, // Gemini定价待确认
      };
    } catch (error: any) {
      console.error('Gemini调用失败:', error);
      throw new Error(`Gemini调用失败: ${error.message}`);
    }
  }

  /**
   * 统一AI调用接口
   */
  async callAI(
    messages: AIMessage[],
    model: AIModel,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<AIResponse> {
    // 根据模型选择对应的AI服务
    if (model.startsWith('gpt')) {
      return this.callOpenAI(messages, model, temperature, maxTokens);
    } else if (model.startsWith('claude')) {
      return this.callClaude(messages, model, temperature, maxTokens);
    } else if (model.startsWith('gemini')) {
      return this.callGemini(messages, model, temperature, maxTokens);
    } else {
      throw new Error(`不支持的模型: ${model}`);
    }
  }

  /**
   * 计算费用
   */
  private calculateCost(tokens: number, model: string): number {
    // 简化的费用计算，实际应根据各AI提供商的最新定价
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    };

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    // 假设50%输入，50%输出
    return (tokens * 0.5 * modelPricing.input) + (tokens * 0.5 * modelPricing.output);
  }
}

// 导出单例
export const aiService = new AIService();
