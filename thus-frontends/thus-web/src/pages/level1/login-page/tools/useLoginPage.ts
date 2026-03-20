import type { LpData, LoginByThirdParty } from "./types";
import type { BoolFunc, ThusTimeout } from "~/utils/basic/type-tool";
import cui from "~/components/custom-ui";
import {
  fetchInitLogin,
  fetchSubmitEmail,
  fetchEmailCode,
  fetchUsersSelect,
  fetchScanLogin,
  fetchRequestSMSCode,
  fetchPhoneCode,
} from "../../tools/requests";
import { getClientKey } from "../../tools/common-tools"
import {
  handle_google,
  handle_github,
  handle_wechat,
} from "./handle-tap-oauth";
import time from "~/utils/basic/time"
import { encryptTextWithRSA, afterFetchingLogin } from "../../tools/common-utils"
import { loadGoogleIdentityService } from "./handle-gis"
import {
  isEverythingOkay,
  showContactDev,
  showDisableTip,
  showEmojiTip,
  showErrMsg,
  showOtherTip,
} from "../../tools/show-msg"
import { useLoginStore } from "./useLoginStore";
import { storeToRefs } from "pinia";
import { useThusWatch } from "~/hooks/useThusWatch";
import { useRouteAndThusRouter, type RouteAndThusRouter } from "~/routes/liu-router";
import {
  onActivated,
  onDeactivated,
  toRef,
  watch,
  reactive,
  type WatchStopHandle,
  computed,
  onMounted,
} from "vue";
import middleBridge from "~/utils/middle-bridge";
import valTool from "~/utils/basic/val-tool";
import liuApi from "~/utils/thus-api";
import liuUtil from "~/utils/thus-util";
import liuConsole from "~/utils/debug/thus-console";
import localCache from "~/utils/system/local-cache";
import { useThrottleFn } from "~/hooks/useVueUse"
import liuEnv from "~/utils/thus-env";

// 等待向后端调用 init 的结果
let initPromise: Promise<boolean>

// 避免 initPromise 还没 resolve 时，用户多次点击多次触发
let hasTap = false

// 防止微信登录重复触发
let isWeChatLoginInProgress = false

// constants
const MIN_5 = 5 * time.MINUTE
const WECHAT_AUTH_RETRY_DELAYS = [0, 800, 1600]

function waitFor(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < WECHAT_AUTH_RETRY_DELAYS.length; i++) {
    const delay = WECHAT_AUTH_RETRY_DELAYS[i]
    if (delay > 0) {
      await waitFor(delay)
    }

    try {
      const res = await fetch(url, init)
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      return await res.json() as T
    }
    catch (err) {
      lastError = err
      if (i < WECHAT_AUTH_RETRY_DELAYS.length - 1) {
        console.warn("WeChat auth request failed, retrying...", err)
      }
    }
  }

  throw lastError ?? new Error("Failed to fetch auth service")
}

export function useLoginPage() {

  const rr = useRouteAndThusRouter()
  const { OPEN_WITH_BROWSER } = liuEnv.getEnv()

  const lpData = reactive<LpData>({
    enable: true,
    view: "main",
    email: "",
    clearCodeNum: 0,
    accounts: [],
    isSendingEmail: false,
    isSubmittingEmailCode: false,
    isSelectingAccount: false,
    openWithBrowser: OPEN_WITH_BROWSER,
    isLoggingByPhone: false,
    smsSendingNum: 0,
  })

  // 0. 去监听登录成功后的 路由切换
  listenRouteAndLastLogged(rr, lpData)

  // 1. 去监听 loginStore 的变化
  listenLoginStore(lpData)

  // 2. 去获取 init 时的数据，比如 state / publicKey
  toGetLoginInitData(rr, lpData)

  // 3. listen to `goto` query
  initGoTo(rr)


  // 等待 init 返回结果，并作简单的防抖节流
  const _waitInitLogin = async () => {
    if (hasTap) return false
    hasTap = true
    await initPromise
    hasTap = false
    return true
  }

  const onEmailSubmitted = async (email: string) => {
    const pass = await _waitInitLogin()
    if (!pass) return

    toSubmitEmailAddress(email, lpData)
  }

  // code 由 9 个字符组成，中间是一个 "-"
  const onSubmitCode = useThrottleFn((code: string) => {
    toSubmitEmailAndCode(rr, code, lpData)
  }, 1000)

  const onTapLoginViaThirdParty = async (tp: LoginByThirdParty) => {
    const pass = await _waitInitLogin()
    if (!pass) return

    whenTapLoginViaThirdParty(rr, tp, lpData)
  }

  // 选择了某个用户之后
  const onSelectedAnAccount = useThrottleFn((idx: number) => {
    toSelectAnAccount(rr, idx, lpData)
  }, 1000)

  const onTapBack = () => {
    handleBack(rr, lpData)
  }

  useTitle()

  const showBackBtn = computed(() => {
    const v = lpData.view
    if (v === "main") return false
    if (v === "accounts") return false
    return true
  })

  checkIfRedirectToA2HS(rr)

  const onTapRequestSmsCode = async (phone: string) => {
    const pass = await _waitInitLogin()
    if (!pass) return
    toRequestSMSCode(phone, lpData)
  }

  const onTapFinishForPhone = useThrottleFn((phone: string, code: string) => {
    toSubmitPhoneAndCode(rr, phone, code, lpData)
  }, 1000)

  const onSubmitPassword = useThrottleFn(async (email: string, password: string) => {
    const pass = await _waitInitLogin()
    if (!pass) return
    toSubmitEmailAndPassword(rr, email, password, lpData)
  }, 1000)

  return {
    lpData,
    showBackBtn,
    onEmailSubmitted,
    onSubmitPassword,
    onSubmitCode,
    onBackFromCode: () => runBackFromCode(lpData),
    onTapLoginViaThirdParty,
    onSelectedAnAccount,
    onTapBack,
    onTapRequestSmsCode,
    onTapFinishForPhone,
  }
}


function initGoTo(
  rr: RouteAndThusRouter,
) {
  onMounted(() => {
    const q = rr.route.query
    const q1 = q.goto
    let goto: string | undefined

    if (valTool.isStringWithVal(q1)) {
      goto = q1
    }

    localCache.setOnceData("goto", goto)
  })
}


// check out if redirect to A2HS
function checkIfRedirectToA2HS(
  rr: RouteAndThusRouter,
) {
  const res0 = liuEnv.hasBackend()
  if (!res0) return

  const res1 = liuUtil.check.isJustAppSetup()
  if (!res1) return

  const res2 = liuApi.canIUse.isRunningStandalone()
  if (res2) return

  const res3 = liuApi.canIUse.canAddToHomeScreenInSafari()
  if (!res3) return

  rr.router.push({ name: "a2hs", query: { fr: "login" } })
}


function useTitle() {
  onActivated(() => {
    middleBridge.setAppTitle({ val_key: "hello.login_title" })
  })
}

async function runBackFromCode(lpData: LpData) {
  lpData.view = "main"
  await valTool.waitMilli(300)
  lpData.clearCodeNum++
}


// 登录完成后，会进行路由切换
// 这个时候用户会等比较久，所以做一个变量（lastLogged）和路由监听
// 当监听到路由真的变化出去了（离开 login-）相关页面了
// 就关闭 loading 弹窗，否则 3s 后自动关闭
function listenRouteAndLastLogged(
  rr: RouteAndThusRouter,
  lpData: LpData,
) {
  let watchStop: WatchStopHandle | undefined
  let timeout: ThusTimeout
  const lastLogged = toRef(lpData, "lastLogged")

  const _close = (checkRoute = true) => {
    // 1. hide loading
    cui.hideLoading()
    lpData.lastLogged = 0

    // 2. clear timeout
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }

    // 3. reload if it's still in login page
    if (!checkRoute) return
    const name3 = rr.route.name
    if (!valTool.isStringWithVal(name3)) return
    const inLoginPage = name3.startsWith("login")
    if (inLoginPage) {
      console.log("去 reload......")
      liuApi.route.reload()
    }
  }

  const _setTimeout = () => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      console.warn("5s 到期............")
      timeout = undefined
      _close()
    }, 5000)
  }

  const _checkRoute = (routeName: string) => {
    if (routeName === "login" && !lpData.enable) {
      lpData.enable = true
      return
    }

    if (routeName !== "login") {
      if (lpData.enable) {
        lpData.enable = false
        lpData.view = "main"
      }
      else {
        watchStop?.()
      }
    }
  }

  const _toListen = () => {
    if (watchStop) watchStop()
    watchStop = watch([lastLogged, rr.route], (
      [newLastLogged, newRoute]
    ) => {
      const newName = newRoute.name
      if (!valTool.isStringWithVal(newName)) return

      _checkRoute(newName)

      if (!newLastLogged || newLastLogged <= 0) return

      const isInLoginPage = newName.startsWith("login")
      if (isInLoginPage) {
        // console.log("当前还在 login 相关页中，去新增三秒延迟以避免卡死")
        _setTimeout()
      }
      else {
        _close(false)
      }
    }, { immediate: true })
  }

  onActivated(() => {
    _toListen()
  })

  onDeactivated(() => {
    _close(false)
  })
}


function handleBack(
  rr: RouteAndThusRouter,
  lpData: LpData,
) {
  const vi = lpData.view

  // 已在选择账号了，不支持返回
  if (vi === "accounts") return

  // 在输入 email 验证码页，返回到 main
  if (vi === "code") {
    runBackFromCode(lpData)
    return
  }

  // [TODO] 剩下的，返回到 home

}



// 选定某一个用户
async function toSelectAnAccount(
  rr: RouteAndThusRouter,
  idx: number,
  lpData: LpData,
) {

  // 1. 获取 userId
  const item = lpData.accounts[idx]
  if (!item) return
  const userId = item.user_id
  if (!userId) return

  // 1.5 判断是否可再登录
  if (!canLoginUsingLastLogged(lpData)) return

  // 2. 获取 multi 相关的参数
  const {
    multi_credential: m1,
    multi_credential_id: m2,
    state,
  } = lpData
  if (!m1 || !m2 || !state) return

  // 3. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if (!enc_client_key) return

  if (lpData.isSelectingAccount) return
  lpData.isSelectingAccount = true
  const res = await fetchUsersSelect(userId, m1, m2, state, enc_client_key)
  lpData.isSelectingAccount = false
  const res2 = await afterFetchingLogin(rr, res)
  if (res2) {
    cui.showLoading({ title_key: "login.logging2" })
    lpData.lastLogged = time.getTime()
  }
}

// 使用 lastLogged 参数判断是否可登录
function canLoginUsingLastLogged(
  lpData: LpData,
) {
  const s = lpData.lastLogged
  if (!s) return true
  const isWithin = time.isWithinMillis(s, 6 * time.SECOND)
  if (isWithin) return false
  return true
}

async function toRequestSMSCode(
  phone: string,
  lpData: LpData,
) {
  if (!isEverythingOkay(lpData.initCode)) return
  const { state, publicKey } = lpData
  if (!state || !publicKey) return
  if (lpData.isLoggingByPhone) return

  const enc_phone = await encryptTextWithRSA(publicKey, phone)
  if (!enc_phone) {
    console.warn("加密 phone 失败......")
    return
  }

  const res = await fetchRequestSMSCode(enc_phone, state)
  console.log("fetchRequestSMSCode res: ")
  console.log(res)
  console.log(" ")
  lpData.smsSendingNum++

  const { code } = res
  if (code === "U0011") {
    showFollowToGetPermission()
  }
  else if (code !== "0000") {
    showErrMsg("login", res)
  }


}


// 去提交 email 地址以发送验证码
async function toSubmitEmailAddress(
  email: string,
  lpData: LpData,
) {
  if (!isEverythingOkay(lpData.initCode)) return
  const { state, lastSendEmail = 1, publicKey } = lpData
  if (!state || !publicKey) return
  if (lpData.isSendingEmail) return

  const now = time.getTime()
  const sec = (now - lastSendEmail) / time.SECOND

  let canSubmit = false
  if (email !== lpData.email) canSubmit = true
  else if (sec > 20) canSubmit = true    // 等 20s 就好，21~60s 去检查状态

  // 如果不允许提交，直接切换到 "code" view
  if (!canSubmit) {
    lpData.view = "code"
    return
  }

  console.log(`using ${email} to login`)
  liuConsole.sendMessage(`user submit email: ${email}`)

  const enc_email = await encryptTextWithRSA(publicKey, email)
  if (!enc_email) {
    console.warn("加密 email 失败......")
    return
  }

  lpData.isSendingEmail = true
  const res = await fetchSubmitEmail(enc_email, state)
  lpData.isSendingEmail = false

  console.log("fetchSubmitEmail res: ")
  console.log(res)
  console.log(" ")

  const { code, errMsg } = res

  if (code === "U0006") {
    showFollowToGetPermission()
    return
  }
  if (code === "E4003" && errMsg === "last_event: bounced") {
    showEmojiTip("login.err_3", "😭")
    return
  }
  if (code === "U0004" || code === "U0003") {
    console.warn("发送 email 出现关于 state 的异常")
    console.log(code)
    console.log(" ")
    showOtherTip("login.err_5", true)
    return
  }
  if (code === "U0005" || (code >= "E5001" && code < "E6000")) {
    showContactDev("login.err_9", "🫥")
    return
  }
  if (code === "E4003" && errMsg === "last_event: complained") {
    showEmojiTip("login.err_2", "🥲")
  }

  lpData.email = email
  lpData.view = "code"
  lpData.lastSendEmail = time.getTime()
}


async function showFollowToGetPermission() {
  const res = await cui.showModal({
    title: "🎫",
    content_key: "login.get_permission",
    confirm_key: "notification.to_follow",
    isTitleEqualToEmoji: true,
  })
  if (!res.confirm) return
  cui.previewImage({
    imgs: [{
      src: "/images/official-qrcode.jpg",
      id: "whatever",
      h2w: "1",
      width: 250,
      height: 250,
    }]
  })
}

let isAfterFetchingLogin = false


async function toSubmitPhoneAndCode(
  rr: RouteAndThusRouter,
  phone: string,
  code: string,
  lpData: LpData,
) {
  const { state, publicKey } = lpData
  if (!state || !publicKey) return

  // 0. 判断是否可再登录
  if (!canLoginUsingLastLogged(lpData)) return
  if (isAfterFetchingLogin) return

  // 1. 获取加密的 phone
  const enc_phone = await encryptTextWithRSA(publicKey, phone)
  if (!enc_phone) {
    console.warn("fail to encrypt phone")
    return
  }

  // 2. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if (!enc_client_key) return

  // 3. to login
  if (lpData.isLoggingByPhone) return
  lpData.isLoggingByPhone = true
  const res = await fetchPhoneCode(enc_phone, code, state, enc_client_key)
  lpData.isLoggingByPhone = false


  // 4. 登录后处理
  isAfterFetchingLogin = true
  const res4 = await afterFetchingLogin(rr, res)
  isAfterFetchingLogin = false

  if (res4) {
    cui.showLoading({ title_key: "login.logging2" })
    lpData.lastLogged = time.getTime()
  }
}


async function toSubmitEmailAndCode(
  rr: RouteAndThusRouter,
  code: string,
  lpData: LpData,
) {
  const { email, state, publicKey } = lpData
  if (!state || !publicKey || !email) return

  // 0. 判断是否可再登录
  if (!canLoginUsingLastLogged(lpData)) return
  if (isAfterFetchingLogin) return

  // 1. 获取加密的 email
  const enc_email = await encryptTextWithRSA(publicKey, email)
  if (!enc_email) {
    console.warn("加密 email 失败......")
    return
  }

  // 2. 获取 enc_client_key
  const { enc_client_key } = getClientKey()
  if (!enc_client_key) return

  // 3. 去登录
  if (lpData.isSubmittingEmailCode) return
  lpData.isSubmittingEmailCode = true
  const res = await fetchEmailCode(enc_email, code, state, enc_client_key)
  lpData.isSubmittingEmailCode = false

  // 4. 登录后处理
  isAfterFetchingLogin = true
  const res4 = await afterFetchingLogin(rr, res)
  isAfterFetchingLogin = false

  if (res4) {
    cui.showLoading({ title_key: "login.logging2" })
    lpData.lastLogged = time.getTime()
  }
}


async function toSubmitEmailAndPassword(
  rr: RouteAndThusRouter,
  email: string,
  password: string,
  lpData: LpData,
) {
  // 0. 判断是否可再登录
  if (!canLoginUsingLastLogged(lpData)) return
  if (isAfterFetchingLogin) return

  // 1. 去登录
  if (lpData.isSendingEmail) return
  lpData.isSendingEmail = true

  // 1.1 生成 client_key（用于后续加密通信）
  const aesKey = await liuUtil.crypto.createKeyWithAES()
  if (!aesKey) {
    lpData.isSendingEmail = false
    console.error("生成 AES 密钥失败")
    cui.showModal({
      title: "❌",
      content_key: "login.err_9",
      isTitleEqualToEmoji: true,
      showCancel: false,
    })
    return
  }

  // 1.2 存储 client_key 到 onceData（登录成功后会转移到 preference）
  localCache.setOnceData("client_key", aesKey)

  // 调用后端密码登录API（直接发送明文，不加密）
  try {
    const res = await fetch(`${import.meta.env.VITE_API_DOMAIN}/api/auth/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        client_key: aesKey,  // 发送 client_key 给后端
      }),
    })

    const result = await res.json()
    lpData.isSendingEmail = false

    // 2. 登录后处理
    isAfterFetchingLogin = true
    const res4 = await afterFetchingLogin(rr, result)
    isAfterFetchingLogin = false

    if (res4) {
      cui.showLoading({ title_key: "login.logging2" })
      lpData.lastLogged = time.getTime()
    }
  } catch (error) {
    lpData.isSendingEmail = false
    console.error("密码登录失败:", error)
    cui.showModal({
      title: "❌",
      content_key: "login.err_9",
      isTitleEqualToEmoji: true,
      showCancel: false,
    })
  }
}


function listenLoginStore(lpData: LpData) {
  const loginStore = useLoginStore()
  const { view } = storeToRefs(loginStore)

  const whenViewChange = () => {
    const _v = view.value
    if (!_v) return

    const data = loginStore.getData()
    lpData.view = _v

    if (_v === "code") {
      lpData.email = data.email
      lpData.lastSendEmail = time.getTime()
    }
    else if (_v === "accounts") {
      lpData.accounts = data.accounts
      lpData.multi_credential = data.multi_credential
      lpData.multi_credential_id = data.multi_credential_id
    }
    loginStore.reset()
  }

  useThusWatch(view, whenViewChange)
}

function whenTapLoginViaThirdParty(
  rr: RouteAndThusRouter,
  tp: LoginByThirdParty,
  lpData: LpData,
) {
  const { initCode } = lpData
  const isOkay = isEverythingOkay(initCode)
  if (!isOkay) return

  if (tp === "wechat") {
    whenTapWeChat(rr, lpData)
  }
  else if (tp === "github") {
    handle_github(lpData)
  }
  else if (tp === "google") {
    handle_google(lpData)
  }
  else if (tp === "apple") {

  }
}

async function whenTapWeChat(
  rr: RouteAndThusRouter,
  lpData: LpData,
) {
  const cha = liuApi.getCharacteristic()
  if (cha.isWeChat) {
    handle_wechat(lpData)
    return
  }

  if (!canLoginUsingLastLogged(lpData)) return
  if (isAfterFetchingLogin) return
  if (isWeChatLoginInProgress) return
  
  isWeChatLoginInProgress = true

  try {
    const authServiceURL = liuEnv.getAuthServiceURL()
    const authLoginUrl = new URL("/wx/login", authServiceURL).toString()
    if (import.meta.env.DEV) {
      console.debug("[WeChat Login] auth service:", authServiceURL)
    }
    const data = await fetchJsonWithRetry<{ wx_url?: string, poll_key?: string }>(authLoginUrl)
    if (import.meta.env.DEV) {
      console.debug("[WeChat Login] auth service response:", data)
    }
    const { wx_url, poll_key } = data
    if (!wx_url || !poll_key) {
      throw new Error("Invalid auth service response")
    }

    const res2 = await cui.showQRCodePopup({ 
      bindType: "wx_unified",
      wx_url,
      poll_key
    })

    if (res2.resultType !== "plz_check") {
      isWeChatLoginInProgress = false
      return
    }
    const token = res2.credential
    if (!token) {
      isWeChatLoginInProgress = false
      return
    }

    cui.showLoading({ title_key: "login.ready_to_login" })

    const loginRes = await fetch(`${import.meta.env.VITE_API_DOMAIN}/api/auth/wechat/unified`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    if (!loginRes.ok) {
      throw new Error(`Unified login failed with status ${loginRes.status}`)
    }
    const result = await loginRes.json()

    isAfterFetchingLogin = true
    const res5 = await afterFetchingLogin(rr, result)
    isAfterFetchingLogin = false
    isWeChatLoginInProgress = false

    if (res5) {
      cui.showLoading({ title_key: "login.logging2" })
      lpData.lastLogged = time.getTime()
    } else {
      cui.hideLoading()
    }
  } catch (error) {
    console.error('WeChat unified login error:', error)
    cui.hideLoading()
    isWeChatLoginInProgress = false
    showErrMsg("login", { code: "E5000", errMsg: "微信登录失败" })
  }
}



function toGetLoginInitData(
  rr: RouteAndThusRouter,
  lpData: LpData,
) {
  const _request = async (a: BoolFunc) => {
    const res = await fetchInitLogin()
    const code = res?.code
    const data = res?.data

    lpData.initCode = code
    if (!data || !data.publicKey) {
      a(false)
      return
    }

    lpData.publicKey = data.publicKey
    lpData.githubOAuthClientId = data.githubOAuthClientId
    lpData.googleOAuthClientId = data.googleOAuthClientId
    lpData.wxGzhAppid = data.wxGzhAppid
    lpData.state = data.state
    lpData.initStamp = time.getTime()
    
    localCache.setOnceData("login_state", data.state)

    // google one-tap 登录后端流程已跑通
    loadGoogleIdentityService(rr, lpData)
    a(true)
  }

  onActivated(() => {
    const initStamp = lpData.initStamp ?? 0
    const now = time.getTime()
    const diff = now - initStamp
    if (diff > MIN_5) {
      initPromise = new Promise(_request)
      return
    }

    const { enc_client_key } = localCache.getOnceData()
    if (!enc_client_key) {
      initPromise = new Promise(_request)
      return
    }
  })
}
