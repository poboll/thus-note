/**
 * 错误类型定义和错误代码映射
 * 用于全局错误处理系统
 */

// 错误类型枚举
export type ErrorType = 'network' | 'business' | 'validation' | 'auth' | 'unknown';

// 错误代码类型
export type ErrorCode = 
  | `F${string}` // Frontend errors
  | `B${string}` // Backend errors
  | `C${string}` // Client errors
  | `E${string}` // Business logic errors
  | `V${string}` // Validation errors
  | '0000';      // Success

// 错误状态接口
export interface ErrorState {
  type: ErrorType;
  code: string;
  message: string;
  details?: string;
}

// API错误接口
export interface ApiError {
  code: string;
  errMsg?: string;
  data?: any;
}

// 错误代码映射配置
interface ErrorCodeConfig {
  type: ErrorType;
  message: string;
}

// 错误代码映射表
export const ERROR_CODES: Record<string, ErrorCodeConfig> = {
  // Success
  '0000': { type: 'unknown', message: 'Success' },
  
  // Frontend Errors (F)
  'F0002': { type: 'network', message: '请求超时，请检查网络连接' },
  'F0003': { type: 'network', message: '请求已取消' },
  
  // Backend Errors (B)
  'B0001': { type: 'network', message: '无法连接到服务器，请检查网络或服务器地址' },
  'B0500': { type: 'network', message: '服务器内部错误' },
  
  // Client Errors (C)
  'C0001': { type: 'network', message: '网络连接失败，请检查网络设置或服务器地址' },
  'C0002': { type: 'auth', message: '登录已过期，请重新登录' },
  
  // Business Logic Errors (E)
  'E4009': { type: 'business', message: '数据解密失败' },
  'E0002': { type: 'business', message: '资源不存在' },
  'E0003': { type: 'business', message: '服务器内部错误' },
  
  // Validation Errors (V)
  'V0001': { type: 'validation', message: '输入格式不正确' },
  'V0002': { type: 'validation', message: '缺少必填字段' },
} as const;

/**
 * 根据错误代码获取错误类型
 */
export function getErrorType(code: string): ErrorType {
  const config = ERROR_CODES[code];
  if (config) {
    return config.type;
  }
  
  // 根据错误代码前缀推断类型
  if (code.startsWith('F')) return 'network';
  if (code.startsWith('B')) return 'network';
  if (code.startsWith('C')) return 'auth';
  if (code.startsWith('E')) return 'business';
  if (code.startsWith('V')) return 'validation';
  
  return 'unknown';
}

/**
 * 根据错误代码获取默认错误消息
 */
export function getErrorMessage(code: string): string {
  const config = ERROR_CODES[code];
  return config?.message || 'An error occurred';
}
