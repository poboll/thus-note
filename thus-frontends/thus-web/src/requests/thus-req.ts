
import localCache from "~/utils/system/local-cache"
import type { ThusRqOpt, ThusRqReturn } from "./tools/types"
import valTool from "~/utils/basic/val-tool"
import time from "~/utils/basic/time"
import typeCheck from "~/utils/basic/type-check"
import liuApi from "~/utils/thus-api"
import { 
  handleBeforeFetching,
  handleAfterFetching,
} from "./tools/req-funcs"
import { useErrorHandler } from "~/hooks/useErrorHandler"

// 初始化错误处理器
const { showError } = useErrorHandler()

async function _getBody<U extends Record<string, any>>(
  body?: U,
) {
  
  const p = localCache.getPreference()

  // 1. encrypt some data in body
  if(body && p.client_key) {
    await handleBeforeFetching(body, p.client_key)
  }

  // 2. add some common data
  const b: Record<string, any> = {
    x_liu_language: navigator.language,
    x_liu_theme: liuApi.getThemeFromSystem(),
    x_liu_version: THUS_ENV.version,
    x_liu_stamp: time.getTime(),
    x_liu_timezone: time.getTimezone().toFixed(1),
    x_liu_client: THUS_ENV.client,
    x_liu_device: liuApi.getDeviceString(),
    ...body,
  }

  if(p.token && p.serial) {
    b.x_liu_token = p.token
    b.x_liu_serial = p.serial
  }

  const b2 = valTool.objToStr(b)
  return b2
}


/**
 * 向后端发起网络请求
 * T: 出参的 data 类型
 * U: 入参类型
 * @param url 请求地址
 * @param body 请求的 body
 */
async function request<
  T extends Record<string, any>,
  U extends Record<string, any> = Record<string, any>,
>(
  url: string,
  body?: U,
  opt?: ThusRqOpt,
): Promise<ThusRqReturn<T>> {

  const b = await _getBody(body)
  const p = localCache.getPreference()

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  }

  // 将 token 和 serial 添加到请求头
  if(p.token && p.serial) {
    headers["x-liu-token"] = p.token
    headers["x-liu-serial"] = p.serial
  }

  const init: RequestInit = {
    method: opt?.method ?? "POST",
    headers,
    body: b,
  }

  // to avoid TypeError: AbortSignal.timeout is not a function
  if(opt?.signal) {
    init.signal = opt.signal
  }
  else if(liuApi.canIUse.abortSignalTimeout()) {
    init.signal = AbortSignal.timeout(opt?.timeout ?? 10000)
  }
  
  let res: Response
  try {
    res = await fetch(url, init)
  }
  catch(err: any) {
    console.warn("fetch err...........")
    console.log(err)
    console.log(" ")

    const errMsg: unknown = err.toString?.()
    const errName = err.name
    let errMsg2 = ""  // 转成小写的 errMsg

    if(typeCheck.isString(errMsg)) {
      errMsg2 = errMsg.toLowerCase()
    }

    let errorResult: ThusRqReturn<T>

    if(errName === "TimeoutError") {
      errorResult = { code: "F0002" }
    }
    else if(errName === "AbortError") {
      errorResult = { code: "F0003" }
    }
    else if(errName === "TypeError") {

      // 当后端整个 Shut Down 时，可能抛出这个错误
      // 欠费时，也可能抛出这个错误
      if(errMsg2.includes("failed to fetch")) {
        errorResult = { code: "B0001" }
      }
      else {
        errorResult = { code: "C0001" }
      }
      
    }
    else {
      errorResult = { code: "C0001" }
    }

    // 显示错误弹窗
    showError(errorResult)
    return errorResult
  }

  if(!res) {
    console.warn("thus-req fail: ")
    console.log(res)
    console.log(" ")
    const errorResult = { code: "C0001" }
    showError(errorResult)
    return errorResult
  }

  const status = res.status

  // Token Expired / Unauthorized
  if(status === 401) {
    console.warn("Token expired or unauthorized")
    localCache.clearPreference() // Clear token/serial only
    // Don't clear Dexie here to protect user data
    
    // Redirect to login if not already there
    if(!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login"
    }
    const errorResult = { code: "C0002", errMsg: "Login expired" }
    showError(errorResult)
    return errorResult
  }

  // Laf 底层异常
  if(status === 500) {
    const errorResult = { code: "B0500" }
    showError(errorResult)
    return errorResult
  }
  // 其他错误皆视为后端在维护中
  if(status > 500 && status < 600) {
    const errorResult = { code: `B0001` }
    showError(errorResult)
    return errorResult
  }

  const res2 = await res.json() as ThusRqReturn<T>

  if(res2.data) {
    const newData = await handleAfterFetching(res2.data)
    if(!newData) {
      const errorResult = { code: "E4009", errMsg: "decrypt error on local client" }
      showError(errorResult)
      return errorResult
    }
    res2.data = newData
  }

  // 如果返回的code不是0000，也显示错误
  if(res2.code && res2.code !== '0000') {
    showError(res2)
  }

  return res2
}



export default {
  request,
}