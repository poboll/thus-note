import { reactive, watch } from "vue"
import type { CwData } from "./types"
import { WebhookHandler } from "../../shared/webhook-handler"
import liuEnv from "~/utils/liu-env"
import { 
  type RouteAndLiuRouter, 
  useRouteAndLiuRouter,
} from "~/routes/liu-router"
import type { 
  Res_OC_GetWps, 
  Res_OC_SetWps,
} from "~/requests/req-types"
import { pageStates } from "~/utils/atom"
import { useAwakeNum } from "~/hooks/useCommon"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import APIs from "~/requests/APIs"
import liuReq from "~/requests/liu-req"
import { useThrottleFn } from "~/hooks/useVueUse"
import { showErrMsg } from "~/pages/level1/tools/show-msg"
import cui from "~/components/custom-ui"
import liuApi from "~/utils/liu-api"
import time from "~/utils/basic/time"

let lastSetStamp = 0

export function useConnectWps() {
  const hasBE = liuEnv.hasBackend()
  const rr = useRouteAndLiuRouter()

  const cwData = reactive<CwData>({
    pageState: hasBE ? pageStates.LOADING : pageStates.NEED_BACKEND,
    webhook_toggle: false,
    canSave: false,
    isSaving: false,
    original_webhook_url: "",
  })

  const { awakeNum, syncNum } = useAwakeNum()
  watch(awakeNum, (newV) => {
    if(newV < 1) return
    if(syncNum.value < 1) return
    if(!hasBE) return
    checkoutData(cwData, rr)
  }, { immediate: true })

  const onWebhookChanged = useThrottleFn((newV: boolean) => {
    toChangeWebhook(cwData, newV)
  }, 400)

  const onTapCopyWebhookPassword = async () => {
    const pw = cwData.webhook_password
    if(!pw) return
    const res1 = await liuApi.copyToClipboard(pw)
    if(res1) {
      cui.showSnackBar({ text_key: "common.copied" })
    }
  }

  const onWebhookUrlInput = (e: Event) => {
    //@ts-ignore
    const val = e.target.value ?? ""
    const newUrl = val.trim()
    const oldUrl = cwData.original_webhook_url ?? ""
    const isSame = Boolean(newUrl === oldUrl)
    cwData.canSave = !isSame
  }

  const onTapConfigMethod = () => {
    const link = "https://docs.idrop.in/guide/connect/wps"
    window.open(link, "_blank")
  }
  
  return {
    cwData,
    onWebhookChanged,
    onWebhookUrlInput,
    onTapCopyWebhookPassword,
    onTapSave: () => toSave(cwData),
    onTapConfigMethod,
  }
}

async function toSave(
  cwData: CwData,
) {
  if(!cwData.canSave) return
  if(cwData.isSaving) return

  // 1. get member id
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 2. check out webhook
  const tmp_url = cwData.webhook_url ?? ""
  const webhook_url = tmp_url.trim()
  if(webhook_url) {
    const res1 = WebhookHandler.isWpsWebhookUrl(webhook_url)
    if(!res1) {
      cwData.canSave = false
      cui.showModal({
        title: "🤔",
        content_key: "connect.wps_webhook_err",
        isTitleEqualToEmoji: true,
        showCancel: false,
      })
      return
    }
  }

  // 3. construct query
  const url3 = APIs.OPEN_CONNECT
  const q3 = {
    operateType: "set-wps",
    memberId,
    enable: "Y",
    plz_enc_webhook_url: webhook_url
  }
  lastSetStamp = time.getTime()
  cwData.isSaving = true
  const res3 = await liuReq.request<Res_OC_SetWps>(url3, q3)
  cwData.isSaving = false
  
  // 4. handle result
  const code4 = res3.code
  const data4 = res3.data
  if(code4 !== "0000") {
    showErrMsg("other", res3)
    return
  }
  if(data4?.webhook_password) {
    cwData.webhook_password = data4.webhook_password
  }
  cwData.original_webhook_url = webhook_url
  cwData.canSave = false
  cui.showSnackBar({ text_key: "common.saved" })
}

async function toChangeWebhook(
  cwData: CwData,
  newVal: boolean,
) {
  cwData.webhook_toggle = newVal

  // 1. get member id
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 2. construct query
  const data2 = {
    operateType: "set-wps",
    memberId,
    enable: newVal ? "Y" : "N",
  }
  lastSetStamp = time.getTime()
  const url2 = APIs.OPEN_CONNECT
  const res2 = await liuReq.request<Res_OC_SetWps>(url2, data2)
  
  // 3. handle result
  const data3 = res2.data
  const code3 = res2.code
  if(code3 !== "0000") {
    cwData.webhook_toggle = !newVal
    showErrMsg("other", res2)
    return
  }
  const webhook_password = data3?.webhook_password
  if(webhook_password) {
    cwData.webhook_password = webhook_password
  }

  if(newVal && cwData.webhook_url) {
    cui.showSnackBar({ text_key: "common.opened" })
  }
  else if(!newVal) {
    cui.showSnackBar({ text_key: "common.closed" })
  }
}

async function checkoutData(
  cwData: CwData,
  rr: RouteAndLiuRouter,
) {

  // 1. get member id
  const wStore = useWorkspaceStore()
  const memberId = wStore.memberId
  if(!memberId) return

  // 2. fetch data
  const url2 = APIs.OPEN_CONNECT
  const w2 = {
    operateType: "get-wps",
    memberId,
  }
  const res2 = await liuReq.request<Res_OC_GetWps>(url2, w2)

  // 3. handle data
  const code3 = res2.code
  const data3 = res2.data

  // 4. handle response
  if(code3 === "E4003") {
    cwData.pageState = pageStates.NO_AUTH
  }
  else if(code3 === "E4004") {
    cwData.pageState = pageStates.NO_DATA
  }
  else if(code3 === "0000") {
    cwData.pageState = pageStates.OK
  }
  else {
    cwData.pageState = pageStates.NETWORK_ERR
  }

  // 5. handle some required data
  if(code3 !== "0000" || !data3) return
  if(time.isWithinMillis(lastSetStamp, 1000)) return
  cwData.webhook_toggle = Boolean(data3.enable === "Y")
  cwData.webhook_password = data3.webhook_password

  const new_url = data3.webhook_url ?? ""
  if(new_url !== cwData.original_webhook_url) {
    cwData.webhook_url = data3.webhook_url
    cwData.original_webhook_url = new_url
  }
}