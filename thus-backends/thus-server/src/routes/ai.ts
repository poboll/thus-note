import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { successResponse, errorResponse } from '../types/api.types';
import { aiService } from '../services/aiService';
import AIUsageModel, { AIModel } from '../models/AIUsage';

const router = Router();

/**
 * AI提示词类型
 */
export enum AIPromptType {
  WRITING = 'writing',
  SUMMARIZATION = 'summarization',
  ANALYSIS = 'analysis',
  TRANSLATION = 'translation',
  CODE_GENERATION = 'code_generation',
  QUESTION_ANSWERING = 'question_answering',
}

/**
 * AI模型类型
 */
export enum AIModelType {
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  CLAUDE_3 = 'claude-3',
  GEMINI = 'gemini',
  LOCAL = 'local',
}

/**
 * AI请求接口
 */
interface AIRequest {
  prompt: string;
  model?: AIModelType;
  type?: AIPromptType;
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * AI响应接口
 */
interface AIResponse {
  content: string;
  model: AIModelType;
  tokensUsed: number;
  cost?: number;
}

/**
 * AI聊天消息接口
 */
interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 发送AI提示
 * POST /api/ai/prompt
 */
router.post('/prompt', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { prompt, model = AIModelType.GPT_3_5_TURBO, type = AIPromptType.WRITING, context, temperature = 0.7, maxTokens = 1000 } = req.body as AIRequest;

    // 验证必需参数
    if (!prompt) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '提示词不能为空')
      );
    }

    // 构建AI请求
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: getSystemPrompt(type),
      },
    ];

    // 添加上下文（如果有）
    if (context) {
      messages.push({
        role: 'user',
        content: `上下文：${context}\n\n问题：${prompt}`,
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt,
      });
    }

    // 调用AI服务
    const aiResponse = await callAIService(messages, model, temperature, maxTokens);

    // 保存AI使用记录
    await saveAIUsage(userId, prompt, aiResponse, model, type);

    return res.json(successResponse({
      content: aiResponse.content,
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      cost: aiResponse.cost,
    }));
  } catch (error: any) {
    console.error('AI请求失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'AI请求失败')
    );
  }
});

/**
 * AI内容总结
 * POST /api/ai/summarize
 */
router.post('/summarize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, maxLength = 200 } = req.body;

    if (!content) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '内容不能为空')
      );
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: '你是一个专业的内容总结助手，能够准确、简洁地总结长文本内容。',
      },
      {
        role: 'user',
        content: `请将以下内容总结为${maxLength}字以内的摘要：\n\n${content}`,
      },
    ];

    const aiResponse = await callAIService(messages, AIModelType.GPT_3_5_TURBO, 0.3, 500);

    return res.json(successResponse({
      summary: aiResponse.content,
      originalLength: content.length,
      summaryLength: aiResponse.content.length,
    }));
  } catch (error: any) {
    console.error('AI总结失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'AI总结失败')
    );
  }
});

/**
 * AI内容分析
 * POST /api/ai/analyze
 */
router.post('/analyze', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, analysisType = 'sentiment' } = req.body;

    if (!content) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '内容不能为空')
      );
    }

    const systemPrompts: Record<string, string> = {
      sentiment: '你是一个情感分析专家，能够分析文本的情感倾向（正面、负面、中性）。',
      keywords: '你是一个关键词提取专家，能够从文本中提取最重要的关键词。',
      topics: '你是一个主题分析专家，能够识别文本中的主要主题。',
      summary: '你是一个内容分析专家，能够分析文本的核心观点和结构。',
    };

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompts[analysisType] || systemPrompts.sentiment,
      },
      {
        role: 'user',
        content: `请分析以下内容：\n\n${content}`,
      },
    ];

    const aiResponse = await callAIService(messages, AIModelType.GPT_3_5_TURBO, 0.5, 500);

    return res.json(successResponse({
      analysisType,
      result: aiResponse.content,
    }));
  } catch (error: any) {
    console.error('AI分析失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'AI分析失败')
    );
  }
});

/**
 * AI翻译
 * POST /api/ai/translate
 */
router.post('/translate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { content, targetLanguage = 'English' } = req.body;

    if (!content) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '内容不能为空')
      );
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的翻译助手，能够准确地将文本翻译为${targetLanguage}。`,
      },
      {
        role: 'user',
        content: `请将以下内容翻译为${targetLanguage}：\n\n${content}`,
      },
    ];

    const aiResponse = await callAIService(messages, AIModelType.GPT_3_5_TURBO, 0.3, 1000);

    return res.json(successResponse({
      originalContent: content,
      translatedContent: aiResponse.content,
      targetLanguage,
    }));
  } catch (error: any) {
    console.error('AI翻译失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'AI翻译失败')
    );
  }
});

/**
 * AI代码生成
 * POST /api/ai/code
 */
router.post('/code', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { description, language = 'JavaScript', framework } = req.body;

    if (!description) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '描述不能为空')
      );
    }

    let systemPrompt = `你是一个专业的${language}程序员，能够根据描述生成高质量、可运行的代码。`;
    if (framework) {
      systemPrompt += ` 使用${framework}框架。`;
    }

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `请根据以下描述生成${language}代码：\n\n${description}`,
      },
    ];

    const aiResponse = await callAIService(messages, AIModelType.GPT_4, 0.2, 2000);

    return res.json(successResponse({
      code: aiResponse.content,
      language,
      framework,
    }));
  } catch (error: any) {
    console.error('AI代码生成失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'AI代码生成失败')
    );
  }
});

/**
 * AI问答
 * POST /api/ai/chat
 */
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { messages, model = AIModelType.GPT_3_5_TURBO, temperature = 0.7, maxTokens = 1000 } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json(
        errorResponse('BAD_REQUEST', '消息列表不能为空')
      );
    }

    // 添加系统提示
    const systemMessage: AIMessage = {
      role: 'system',
      content: '你是如是(Thus-Note)的AI助手，帮助用户进行笔记管理、内容创作、信息分析等任务。',
    };

    const allMessages = [systemMessage, ...messages];

    const aiResponse = await callAIService(allMessages, model, temperature, maxTokens);

    return res.json(successResponse({
      content: aiResponse.content,
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
    }));
  } catch (error: any) {
    console.error('AI问答失败:', error);
    return res.status(500).json(
      errorResponse('INTERNAL_ERROR', error.message || 'AI问答失败')
    );
  }
});

/**
 * 获取系统提示词
 */
function getSystemPrompt(type: AIPromptType): string {
  const prompts: Record<AIPromptType, string> = {
    [AIPromptType.WRITING]: '你是一个专业的写作助手，能够帮助用户创作高质量的内容。',
    [AIPromptType.SUMMARIZATION]: '你是一个专业的内容总结助手，能够准确、简洁地总结长文本内容。',
    [AIPromptType.ANALYSIS]: '你是一个专业的内容分析助手，能够深入分析文本并提供有价值的见解。',
    [AIPromptType.TRANSLATION]: '你是一个专业的翻译助手，能够准确地进行多语言翻译。',
    [AIPromptType.CODE_GENERATION]: '你是一个专业的程序员，能够根据需求生成高质量、可运行的代码。',
    [AIPromptType.QUESTION_ANSWERING]: '你是一个知识渊博的问答助手，能够准确回答各种问题。',
  };

  return prompts[type] || prompts[AIPromptType.WRITING];
}

/**
 * 调用AI服务
 */
async function callAIService(
  messages: AIMessage[],
  model: AIModelType,
  temperature: number,
  maxTokens: number
): Promise<AIResponse> {
  try {
    // 将AIModelType映射到实际的模型名称
    const modelMapping: Record<AIModelType, string> = {
      [AIModelType.GPT_4]: 'gpt-4',
      [AIModelType.GPT_3_5_TURBO]: 'gpt-3.5-turbo',
      [AIModelType.CLAUDE_3]: 'claude-3-sonnet-20240229',
      [AIModelType.GEMINI]: 'gemini-pro',
      [AIModelType.LOCAL]: 'local',
    };

    const actualModel = modelMapping[model] || modelMapping[AIModelType.GPT_3_5_TURBO];

    // 调用AI服务
    const aiResult = await aiService.callAI(messages, actualModel as AIModel, temperature, maxTokens);

    return {
      content: aiResult.content,
      model,
      tokensUsed: aiResult.tokensUsed,
      cost: aiResult.cost,
    };
  } catch (error: any) {
    console.error('AI服务调用失败:', error);
    // 如果AI服务调用失败，返回错误信息
    return {
      content: `AI服务暂时不可用: ${error.message || '未知错误'}`,
      model,
      tokensUsed: 0,
      cost: 0,
    };
  }
}

/**
 * 保存AI使用记录（可选）
 */
async function saveAIUsage(
  userId: any,
  prompt: string,
  response: AIResponse,
  model: AIModelType,
  type: AIPromptType
): Promise<void> {
  try {
    const aiUsage = new AIUsageModel({
      userId,
      model: actualModelTypeToAIModel(model),
      operationType: type,
      inputTokens: response.tokensUsed || 0,
      outputTokens: 0,
      totalTokens: response.tokensUsed || 0,
      prompt: prompt.substring(0, 500),
      response: response.content?.substring(0, 500),
      metadata: {
        cost: response.cost,
        temperature: 0.7,
      },
    });
    await aiUsage.save();
    console.log(`✅ AI使用记录已保存: 用户=${userId}, 模型=${model}, 类型=${type}`);
  } catch (error) {
    console.error('❌ 保存AI使用记录失败:', error);
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 将 AIModelType 转换为 AIModel
 */
function actualModelTypeToAIModel(modelType: AIModelType): AIModel {
  const mapping: Record<AIModelType, AIModel> = {
    [AIModelType.GPT_4]: 'gpt-4',
    [AIModelType.GPT_3_5_TURBO]: 'gpt-3.5-turbo',
    [AIModelType.CLAUDE_3]: 'claude-3-sonnet-20240229',
    [AIModelType.GEMINI]: 'gemini-pro',
    [AIModelType.LOCAL]: 'local',
  };
  return mapping[modelType] || 'gpt-3.5-turbo';
}

export default router;
