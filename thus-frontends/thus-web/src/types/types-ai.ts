

export namespace LiuAi {

  export type AiProvider = "aliyun-bailian" | "baichuan" | "deepseek" | "tencent-hunyuan" 
  | "minimax" | "moonshot" | "stepfun" | "zero-one" | "zhipu"

  export type AiSecondaryProvider = "siliconflow" | "gitee-ai" | "qiniu" | "tencent-lkeap"
  | "suanleme"

  export type ComputingProvider = AiProvider | AiSecondaryProvider
  
}