export interface AIConfig {
  openai: {
    apiKey: string;
    baseURL?: string;
    defaultModel: string;
  };
  anthropic: {
    apiKey: string;
    baseURL?: string;
    defaultModel: string;
  };
  gemini: {
    apiKey: string;
    defaultModel: string;
  };
}

// Lazy proxy: reads process.env at access time (after dotenv.config)
export const aiConfig: AIConfig = new Proxy({} as AIConfig, {
  get(_target, prop: string) {
    const configs: AIConfig = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseURL: process.env.OPENAI_BASE_URL,
        defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        baseURL: process.env.ANTHROPIC_BASE_URL,
        defaultModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-sonnet-20240229',
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        defaultModel: process.env.GEMINI_DEFAULT_MODEL || 'gemini-pro',
      },
    };
    return configs[prop as keyof AIConfig];
  },
});

export const AI_MODELS = {
  GPT_4: 'gpt-4',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_OPAUS: 'claude-3-opus-20240229',
  GEMINI_PRO: 'gemini-pro',
} as const;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];
