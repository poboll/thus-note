

export interface LiuReqOptions {
  method?: "POST" | "GET"
  timeout?: number           // 超时的毫秒数，默认为 10000
}

export interface ThusRqReturn<T> {
  code: string
  errMsg?: string
  showMsg?: string
  data?: T
}