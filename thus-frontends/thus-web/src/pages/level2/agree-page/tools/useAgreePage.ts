import { reactive, watch } from "vue"
import type { ApData } from "./types"
import { pageStates } from "~/utils/atom"
import { 
  type RouteAndThusRouter, 
  useRouteAndThusRouter,
} from "~/routes/liu-router"
import valTool from "~/utils/basic/val-tool"
import type { SyncOperateAPI } from "~/types/types-cloud"
import liuReq from "~/requests/thus-req"
import APIs from "~/requests/APIs"
import { 
  getGlobalWx,
  invokeWxJsSdk,
} from "~/utils/third-party/weixin/handle-wx-js-sdk"
import liuApi from "~/utils/thus-api"
import cui from "~/components/custom-ui"

export function useAgreePage() {
  const cha = liuApi.getCharacteristic()
  const apData = reactive<ApData>({
    pageState: pageStates.LOADING,
    contentType: "note",
    showNaviBar: cha.isWeChat,
  })

  const rr = useRouteAndThusRouter()
  watch(rr.route, (newV) => {
    const { name, query } = newV
    if(name !== "agree") return
    const chatId = query.chatId
    if(!valTool.isStringWithVal(chatId)) return
    if(apData.chatId === chatId) return
    apData.chatId = chatId

    // to fetch data
    toGetData(apData)
  }, { immediate: true })

  const onTapHome = () => {
    rr.router.goHome()
  }

  return {
    apData,
    onTapHome,
    onTapOK: () => toTapOK(apData, rr),
    onTapCheckItOut: () => toTapCheckItOut(apData, rr),
  }
}

async function toGetData(
  apData: ApData
) {
  // 1. contruct param
  const chatId = apData.chatId as string
  const param1: SyncOperateAPI.Param = {
    operateType: "agree-aichat",
    chatId,
  }

  // 2. request
  const url = APIs.SYNC_OPERATE
  const res2 = await liuReq.request<SyncOperateAPI.Res_AgreeAichat>(url, param1)
  const { code, data } = res2

  // 3. handle result
  if(code === "E4003") {
    apData.pageState = pageStates.NO_AUTH
  }
  else if(code === "E4004") {
    apData.pageState = pageStates.NO_DATA
  }
  else if(code === "0000") {
    apData.pageState = pageStates.OK
  }
  else {
    apData.pageState = pageStates.NETWORK_ERR
  }

  // 4. handle data
  if(!data) return
  apData.contentId = data.contentId
  apData.contentType = data.contentType

  // 5. init wx-js-sdk
  const cha = liuApi.getCharacteristic()
  if(cha.isWeChat) {
    invokeWxJsSdk()
  }
}


async function toTapOK(
  apData: ApData,
  rr: RouteAndThusRouter,
) {
  const cha = liuApi.getCharacteristic()
  if(!cha.isWeChat) {
    // go to index page
    rr.router.goHome()
    return
  }

  const res1 = await invokeWxJsSdk(1000)
  if(!res1) {
    rr.router.goHome()
    return
  }

  console.log("try to close window!")
  const wx = getGlobalWx()
  wx.closeWindow()
}

function toTapCheckItOut(
  apData: ApData,
  rr: RouteAndThusRouter,
) {
  const { contentId } = apData
  if(!contentId) {
    cui.showModal({ content: "no contentId" })
    return
  }
  rr.router.push({ name: "detail", params: { contentId } })
}
