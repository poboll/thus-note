import type { Ref, ShallowRef } from "vue";
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore";
import type { TipTapEditor } from "~/types/types-editor"
import type { ContentLocalTable } from "~/types/types-table";
import ider from "~/utils/basic/ider";
import localCache from "~/utils/system/local-cache";
import type { CeData, CeEmits } from "./types"
import time from "~/utils/basic/time";
import transferUtil from "~/utils/transfer-util";
import liuUtil from "~/utils/thus-util";
import localReq from "./req/local-req";
import type { ThreadShowStore } from "~/hooks/stores/useThreadShowStore";
import { storeToRefs } from "pinia";
import { equipThreads } from "~/utils/controllers/equip/threads";
import { getTagIdsParents, addATag, formatTagText } from "~/utils/system/tag-related";
import type { SpaceType } from "~/types/types-basic";
import { LocalToCloud } from "~/utils/cloud/LocalToCloud";
import { resetBasicCeData } from "./some-funcs";
import cui from "~/components/custom-ui";
import liuEnv from "~/utils/thus-env";
import aiReq from "~/requests/ai-req";
import { searchLocal } from "~/utils/system/tag-related/search";

// 本文件处理发表的逻辑

export interface CepContext {
  editor: ShallowRef<TipTapEditor | undefined>
  ceData: CeData
  threadShowStore: ThreadShowStore
  emits: CeEmits
}

export type CepToPost = (focusRequired: boolean) => void

let spaceIdRef: Ref<string>
let spaceTypeRef: Ref<SpaceType>
let member: Ref<string>

export function useCeFinish(ctx: CepContext) {
  const { PHONE_BOUND_REQUIRED } = liuEnv.getEnv()
  const wStore = useWorkspaceStore()
  const spaceRefs = storeToRefs(wStore)
  spaceIdRef = spaceRefs.spaceId
  spaceTypeRef = spaceRefs.spaceType as Ref<SpaceType>
  member = spaceRefs.memberId

  const toFinish: CepToPost = async (focusRequired: boolean) => {
    // 1. check out context
    const { ceData } = ctx
    if(!member.value) return
    if(!ceData.canSubmit) return

    // 2. check out phone bound
    if(PHONE_BOUND_REQUIRED) {
      const res2 = detectPhoneBound(ceData)
      if(!res2) {
        popupForPhone(ceData)
        return
      }
    }
    
    // 3. to update or release
    const { threadEdited } = ceData
    if(threadEdited) toUpdate(ctx)
    else toRelease(ctx, focusRequired)
  }

  return { toFinish }
}


function detectPhoneBound(ceData: CeData) {
  const { phoneBound, storageState: ss } = ceData
  if(!phoneBound || phoneBound === "Y") return true
  if(ss === "LOCAL" || ss === "ONLY_LOCAL") return true
  return false
}

async function popupForPhone(ceData: CeData) {
  const res = await cui.showBindPopup({ bindType: "phone", compliance: true })
  if(res.bound) {
    ceData.phoneBound = "Y"
  }
}

// to release
async function toRelease(
  ctx: CepContext,
  focusRequired: boolean
) {
  
  const { local_id: user } = localCache.getPreference()
  if(!user) return

  // 1. get new thread data
  const { ceData } = ctx
  const preThread = _getThreadData(ceData)
  if(!preThread) return

  const now = time.getTime()
  const newId = ider.createThreadId()
  preThread._id = newId
  preThread.first_id = newId
  preThread.user = user
  preThread.member = member.value
  preThread.levelOne = 0
  preThread.levelOneAndTwo = 0
  preThread.emojiData = { total: 0, system: [] }
  preThread.createdStamp = now
  preThread.insertedStamp = now
  preThread.aiChatId = ceData.aiChatId
  const newThread = preThread as ContentLocalTable
  
  // 2. to release
  releaseAsync(ctx, newThread)

  // 3. reset ceData
  _resetState(ctx)
 
  // 4. reset editor
  _resetEditor(ctx, focusRequired)
}

async function releaseAsync(
  ctx: CepContext,
  newThread: ContentLocalTable,
) {
  const ceData = ctx.ceData
  const draftId = ceData.draftId
  const newId = newThread._id
  const stamp = newThread.insertedStamp

  // 1. add new thread into db
  await localReq.addContent(newThread)

  // 2. delete drafts
  if(draftId) {
    localReq.clearDraftOnCloud(draftId)
    await localReq.setDraftAsPosted(draftId)
    if(!ceData.reject_draft_ids) {
      ceData.reject_draft_ids = []
    }
    ceData.reject_draft_ids.push(draftId)
  }

  // 3. notify other components
  const threadShows = await equipThreads([newThread])
  ctx.threadShowStore.setNewThreadShows(threadShows)

  // 3.1 emit
  ctx.emits("updated", newId)
  trySilentAutoTag(newThread, newId)

  // 4. ignore if it's a local thread
  const storageState = newThread.storageState
  if(storageState === "LOCAL" || storageState === "ONLY_LOCAL") return

  // 5. upload to cloud
  LocalToCloud.addTask({ 
    uploadTask: "thread-post", 
    target_id: newId,
    operateStamp: stamp,
  }, { speed: "instant" })
}


function _resetEditor(
  ctx: CepContext,
  focusRequired: boolean,
) {
  const editor = ctx.editor.value
  if(!editor) return
  if(focusRequired) {
    editor.chain().setContent('<p></p>').focus().run()
  }
  else {
    editor.chain().setContent('<p></p>').run()
  }
}


// reset
function _resetState(
  ctx: CepContext
) {
  const { ceData } = ctx
  resetBasicCeData(ceData)
  delete ceData.editorContent
}

// _id / createdStamp / insertedStamp / user / member / commentNum / emojiData
// 没有被添加进 ceData
function _getThreadData(
  ceData: CeData,
) {
  const now = time.getTime()
  const { editorContent } = ceData
  const contentJSON = editorContent?.json
  const list = contentJSON?.type === "doc" && contentJSON.content ? contentJSON.content : []
  const liuList = list.length > 0 ? transferUtil.tiptapToLiu(list) : undefined
  const thusDesc = liuUtil.getRawList(liuList)

  const { storageState, aiReadable } = ceData
  const images = liuUtil.getRawList(ceData.images)
  const files = liuUtil.getRawList(ceData.files)
  
  console.log(`📝 [_getThreadData] Creating thread with ${images?.length || 0} images from ceData`)
  console.log(`   ceData.images:`, ceData.images?.map(img => ({ id: img.id, name: img.name, hasCloudUrl: !!img.cloud_url })))
  console.log(`   Processed images:`, images?.map(img => ({ id: img.id, name: img.name, hasCloudUrl: !!img.cloud_url })))
  
  const remindMe = liuUtil.toRawData(ceData.remindMe)
  const calendarStamp = liuUtil.getCalendarStamp(ceData.whenStamp, remindMe)
  const whenStamp = ceData.whenStamp ? liuUtil.formatStamp(ceData.whenStamp) : undefined
  const remindStamp = liuUtil.getRemindStamp(remindMe, whenStamp)
  const tagIds = liuUtil.getRawList(ceData.tagIds)
  const tagSearched = getTagIdsParents(tagIds)

  const search_title = (ceData.title ?? "").toLowerCase()
  const search_other = transferUtil.packSearchOther(thusDesc, files)

  // console.log("看一下 search_title: ", search_title)
  // console.log("看一下 search_other: ", search_other)
  
  const aThread: Partial<ContentLocalTable> = {
    infoType: "THREAD",
    oState: "OK",
    visScope: ceData.visScope,
    storageState,
    aiReadable,
    title: ceData.title,
    thusDesc,
    images,
    files,
    calendarStamp,
    remindStamp,
    whenStamp,
    remindMe,
    updatedStamp: now,
    editedStamp: now,
    tagIds,
    tagSearched,
    stateId: ceData.stateId,
    stateStamp: ceData.stateId ? now : undefined,
    search_title,
    search_other,
  }

  // 没有 threadEdited 代表当前是发表模式，必须设置 workspace
  if(!ceData.threadEdited) {
    aThread.spaceId = spaceIdRef.value
    aThread.spaceType = spaceTypeRef.value

    if(storageState === "CLOUD") {
      aThread.storageState = "WAIT_UPLOAD"
    }
  }

  return aThread
}


// 去更新
async function toUpdate(ctx: CepContext) {
  const { ceData } = ctx
  const preThread = _getThreadData(ceData)
  if(!preThread) return
  const threadId = ceData.threadEdited as string

  // 1. get old content
  const oldContent = await localReq.getContentById(threadId)
  if(!oldContent) return

  // 2. update
  updateAsync(ctx, oldContent, preThread)

  // 3. reset
  _resetState(ctx)

  // 4. reset editor
  _resetEditor(ctx, false)
}


async function updateAsync(
  ctx: CepContext,
  oldContent: ContentLocalTable,
  preThread: Partial<ContentLocalTable>,
) {
  const ceData = ctx.ceData
  const threadId = ceData.threadEdited as string
  const draftId = ceData.draftId

  // 1. recheck storageState
  const oldSs = oldContent.storageState
  if(oldSs === "LOCAL" && preThread.storageState === "CLOUD") {
    preThread.storageState = "WAIT_UPLOAD"
  }
  const newSs = preThread.storageState
  let goThreadOnlyLocal = false
  if(oldSs === "CLOUD" && newSs === "LOCAL") {
    goThreadOnlyLocal = true
    preThread.storageState = "ONLY_LOCAL"
  }
  else if(oldSs === "WAIT_UPLOAD" && newSs === "LOCAL") {
    goThreadOnlyLocal = true
  }

  // 2. update content in db
  await localReq.updateContent(threadId, preThread)

  // 3. delete drafts
  if(draftId) {
    localReq.clearDraftOnCloud(draftId)
    await localReq.setDraftAsDeleted(draftId)
    if(!ceData.reject_draft_ids) {
      ceData.reject_draft_ids = []
    }
    ceData.reject_draft_ids.push(draftId)
  }

  // 4. notify other components
  const theThread = await localReq.getContentById(threadId)
  if(!theThread) return
  const threadShows = await equipThreads([theThread])
  ctx.threadShowStore.setUpdatedThreadShows(threadShows, "edit")

  ctx.emits("updated", threadId)
  trySilentAutoTag(theThread, threadId)

  // 6. If it is a local post, check whether to go to thread-only_local
  const target_id = threadId
  const operateStamp = theThread.updatedStamp
  if(newSs === "LOCAL" || newSs === "ONLY_LOCAL") {
    if(goThreadOnlyLocal) {
      LocalToCloud.addTask({ 
        uploadTask: "thread-only_local", 
        target_id,
        operateStamp,
      }, { speed: "instant" })
    }
    return
  }

  // 7. otherwise, to post or upload
  const uploadTask = newSs === "WAIT_UPLOAD" ? "thread-post" : "thread-edit"
  LocalToCloud.addTask({ 
    uploadTask, 
    target_id,
    operateStamp,
  }, { speed: "instant" })
}

async function trySilentAutoTag(
  thread: Partial<ContentLocalTable>,
  threadId: string,
) {
  try {
    const res = await aiReq.getAiSettings()
    if(!res.ok || res.data?.aiAutoTagMode !== 'silent') return
    if(!res.data?.aiEnabled) return

    const desc = thread.thusDesc
    if(!desc || !Array.isArray(desc)) return

    const plainText = transferUtil.tiptapToText(desc)
    if(!plainText || plainText.trim().length < 10) return

    const existingTagIds = thread.tagIds ?? []
    const existingTagNames = existingTagIds.map(id => {
      const found = searchLocal(id)
      return found.length > 0 ? found[0].text : ""
    }).filter(t => t.length > 0)

    const tagRes = await aiReq.autoTag(plainText, existingTagNames)
    if(!tagRes.ok || !tagRes.data?.tags?.length) return

    const newTagIds = [...existingTagIds]
    for(const tagName of tagRes.data.tags) {
      const found = searchLocal(tagName)
      let tagId = found.length > 0 ? found[0].tagId : ""
      if(!tagId) {
        const formatted = formatTagText(tagName)
        if(!formatted) continue
        const addRes = await addATag({ text: formatted })
        if(!addRes.isOk || !addRes.id) continue
        tagId = addRes.id
      }
      if(newTagIds.includes(tagId)) continue
      newTagIds.push(tagId)
    }

    if(newTagIds.length <= existingTagIds.length) return

    const newTagSearched = getTagIdsParents(newTagIds)
    await localReq.updateContent(threadId, {
      tagIds: newTagIds,
      tagSearched: newTagSearched,
    })
  }
  catch { }
}

