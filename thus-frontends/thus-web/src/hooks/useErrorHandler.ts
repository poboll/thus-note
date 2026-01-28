/**
 * 全局错误处理 Composable
 * 提供统一的错误状态管理和错误显示功能
 */

import { ref, readonly } from 'vue';
import type { ApiError, ErrorState } from '~/types/types-error';
import { getErrorType, getErrorMessage } from '~/types/types-error';

// 全局错误状态
const errorState = ref<ErrorState | null>(null);

/**
 * 错误处理 Composable
 */
export function useErrorHandler() {
  
  /**
   * 显示错误
   * @param error API错误对象
   */
  const showError = (error: ApiError) => {
    const code = error.code || 'C0001';
    const type = getErrorType(code);
    const message = error.errMsg || getErrorMessage(code);
    const details = error.data ? JSON.stringify(error.data) : undefined;
    
    errorState.value = {
      type,
      code,
      message,
      details,
    };
    
    console.warn('Error occurred:', errorState.value);
  };
  
  /**
   * 清除错误状态
   */
  const clearError = () => {
    errorState.value = null;
  };
  
  return {
    errorState: readonly(errorState),
    showError,
    clearError,
  };
}
