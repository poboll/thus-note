import liuEnv from "~/utils/thus-env"

const env = liuEnv.getEnv()
const d = env.API_DOMAIN ?? ""

// 确保 API_DOMAIN 以 / 结尾
const apiDomain = d.endsWith('/') ? d : d + '/'

export default {
  TIME: apiDomain + `hello-world`,
  LOGIN: apiDomain + `user-login`,
  LOGOUT: apiDomain + `user-settings`,
  USER_ENTER: apiDomain + `user-settings`,
  USER_LATEST: apiDomain + `user-settings`,
  USER_SET: apiDomain + `user-settings`,
  USER_MEMBERSHIP: apiDomain + `user-settings`,
  WECHAT_BIND: apiDomain + `user-settings`,
  SUBSCRIBE_PLAN: apiDomain + `subscribe-plan`,
  REQUEST_REFUND: apiDomain + `subscribe-plan`,
  UPLOAD_FILE: apiDomain + `api/files/upload`,
  SYNC_SET: apiDomain + `sync-set`,
  SYNC_GET: apiDomain + `sync-get`,
  SYNC_OPERATE: apiDomain + `sync-operate`,
  OPEN_CONNECT: apiDomain + `open-connect`,
  PAYMENT_ORDER: apiDomain + `payment-order`,
  SERVICE_POLY: apiDomain + `service-poly`,
  BIND_DATA: apiDomain + `user-settings`,
  AUTHORIZE: apiDomain + `user-settings`,
  AI_CONSOLE: apiDomain + `user-settings`,
}