/**
 * API类型定义
 * 与前端ThusRqReturn类型保持兼容
 */

/**
 * API响应格式（与前端ThusRqReturn兼容）
 */
export interface ApiResponse<T = any> {
  code: string;
  errMsg?: string;
  showMsg?: string;
  data?: T;
}

/**
 * API请求选项
 */
export interface ApiRequestOptions {
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
  signal?: AbortSignal;
  timeout?: number;
}

/**
 * 通用通过格式
 */
export interface CommonPass {
  pass: false;
  err: {
    code: string;
    errMsg?: string;
    showMsg?: string;
  };
}

/**
 * 数据通过格式
 */
export interface DataPass<T> {
  pass: true;
  data: T;
}

/**
 * 通过类型（联合类型）
 */
export type PassResult<T> = CommonPass | DataPass<T>;

/**
 * API错误代码
 */
export enum ApiErrorCode {
  // 成功
  SUCCESS = '0000',

  // 客户端错误 (1xxx)
  BAD_REQUEST = 'C0001',
  UNAUTHORIZED = 'C0002',
  FORBIDDEN = 'C0003',
  NOT_FOUND = 'C0004',
  METHOD_NOT_ALLOWED = 'C0005',
  VALIDATION_ERROR = 'C0006',

  // 服务端错误 (5xxx)
  INTERNAL_SERVER_ERROR = 'E0001',
  NOT_IMPLEMENTED = 'E0002',
  DECRYPT_ERROR = 'E4009',

  // 后端维护错误 (5xxx-6xxx)
  MAINTENANCE = 'B0001',
  SERVER_DOWN = 'B0500',

  // 网络错误 (Fxxx)
  TIMEOUT = 'F0002',
  ABORTED = 'F0003',
  NETWORK_ERROR = 'C0001',
}

/**
 * 创建成功响应
 */
export function successResponse<T>(data?: T): ApiResponse<T> {
  return {
    code: ApiErrorCode.SUCCESS,
    data,
  };
}

/**
 * 创建错误响应
 */
export function errorResponse(
  code: string,
  errMsg?: string,
  showMsg?: string,
): ApiResponse {
  return {
    code,
    errMsg,
    showMsg,
  };
}

/**
 * 创建通过响应
 */
export function passResponse<T>(result: PassResult<T>): ApiResponse<T> {
  if ('pass' in result && result.pass) {
    return {
      code: ApiErrorCode.SUCCESS,
      data: result.data,
    };
  } else {
    const errResult = result as CommonPass;
    return {
      code: errResult.err.code,
      errMsg: errResult.err.errMsg,
      showMsg: errResult.err.showMsg,
    };
  }
}
