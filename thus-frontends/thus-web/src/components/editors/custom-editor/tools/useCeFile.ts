import { inject, onDeactivated, ref, watch, type Ref } from "vue"
import type { Editor } from "@tiptap/vue-3"
import { uploadViaLocal } from "~/utils/cloud/upload-tasks/tools/upload-via-local"
import type { ImageShow, ThusFileStore, ThusImageStore } from "~/types"
import imgHelper from "~/utils/files/img-helper"
import liuUtil from "~/utils/thus-util"
import { mvFileKey } from "~/utils/provide-keys"
import type { CeData } from "./types"
import valTool from "~/utils/basic/val-tool"
import ider from "~/utils/basic/ider"
import limit from "~/utils/limit"
import { useGlobalStateStore } from "~/hooks/stores/useGlobalStateStore";
import { onLiuActivated } from "~/hooks/useCommon"

export function useCeFile(
  ceData: CeData,
  editor: Ref<Editor | undefined>,
) {
  const covers = ref<ImageShow[]>([])

  // 监听文件拖动掉落
  listenFilesDrop(ceData, editor)

  // 监听文件黏贴上来
  listenDocumentPaste(ceData, editor)

  // 监听逻辑数据改变，去响应视图
  watch(() => ceData.images, (newImages) => {
    imgHelper.whenImagesChanged(covers, newImages)
  }, { deep: true })

  // editing-covers 传来用户拖动图片，调整了顺序
  // 开始对 "逻辑数据" 排序，这样视图数据 covers 就会在上方的 watch 响应
  const onCoversSorted = (newCovers: ImageShow[]) => {
    whenCoversSorted(newCovers, ceData)
  }

  const onImageChange = async (files: File[]) => {
    await handleFiles(ceData, files, editor)
  }

  const onClearCover = (index: number) => {
    const list = ceData.images
    if(!list) return
    const item = list[index]

    if(!item) return
    list.splice(index, 1)
  }

  // 接收 来自 more-area 用户选择/移除 文件的响应
  const onFileChange = (files: File[] | null) => {
    whenFileChange(ceData, files)
  }

  return { 
    onImageChange, 
    covers, 
    onClearCover,
    onCoversSorted,
    onFileChange,
  }
}

function whenFileChange(
  ceData: CeData,
  files: File[] | null
) {
  if(!files || files.length < 1) {
    if(ceData.files) delete ceData.files
    return
  }

  handleOtherFiles(ceData, files)
}

function whenCoversSorted(
  newCovers: ImageShow[],
  ceData: CeData,
) {
  const oldImages = ceData.images ?? []
  const newImages: ThusImageStore[] = []
  for(let i=0; i<newCovers.length; i++) {
    const id = newCovers[i].id
    const data = oldImages.find(v => v.id === id)
    if(data) newImages.push(data)
  }
  ceData.images = newImages
}

// 处理文件掉落
function listenFilesDrop(
  ceData: CeData,
  editor: Ref<Editor | undefined>,
) {
  const dropFiles = inject(mvFileKey)
  watch(() => dropFiles?.value, async (files) => {
    if(!files?.length) return
    await handleFiles(ceData, files, editor)
    if(!dropFiles?.value) return
    dropFiles.value = []
  })
}

// 全局监听 "黏贴事件"
function listenDocumentPaste(
  ceData: CeData,
  editor: Ref<Editor | undefined>,
) {
  const gs = useGlobalStateStore()
  const whenPaste = (e: ClipboardEvent) => {
    if(!gs.customEditorInputing) {
      return
    }
    const fileList = e.clipboardData?.files
    if(!fileList || fileList.length < 1) return
    const files = liuUtil.getArrayFromFileList(fileList)
    handleFiles(ceData, files, editor)
  }
  
  onLiuActivated(() => {
    document.addEventListener("paste", whenPaste)
  })

  onDeactivated(() => {
    document.removeEventListener("paste", whenPaste)
  })
}


async function handleFiles(
  ceData: CeData,
  files: File[],
  editor: Ref<Editor | undefined>,
) {
  const fileLength = files.length
  const imgFiles = liuUtil.getOnlyImageFiles(files)
  const imgLength = imgFiles.length
  if(imgFiles.length > 0) {
    await handleImages(ceData, imgFiles, editor)
    if(imgLength >= fileLength) return
  }

  const otherFiles = liuUtil.getNotImageFiles(files)
  if(otherFiles.length > 0) {
    handleOtherFiles(ceData, files)
  }
}

async function handleOtherFiles(
  ceData: CeData,
  files: File[],
) {
  const fileList: ThusFileStore[] = []
  const MB = 1024 * 1024

  for(let i=0; i<files.length; i++) {
    const v = files[i]
    const arrayBuffer = await v.arrayBuffer()
    const suffix = valTool.getSuffix(v.name)
    const obj: ThusFileStore = {
      id: ider.createFileId(),
      name: v.name,
      lastModified: v.lastModified,
      suffix,
      size: v.size,
      mimeType: v.type,
      arrayBuffer,
    }
    fileList.push(obj)
  }

  const firstFile = fileList[0]
  if(!firstFile) return
  const maxMB = limit.getLimit("file_capacity")
  const maxSize = maxMB * MB
  if(maxSize > 0 && firstFile.size > maxSize) {
    limit.handleLimited("file_capacity", maxMB)
    return
  }

  ceData.files = fileList
  ceData.more = true
}

async function handleImages(
  ceData: CeData,
  imgFiles: File[],
  editor: Ref<Editor | undefined>,
) {
  ceData.images = ceData.images ?? []
  const hasLength = ceData.images.length
  let max_pic_num = limit.getLimit("thread_img")
  if(!max_pic_num || max_pic_num <= 0 || isNaN(max_pic_num)) max_pic_num = 9
  const canPushNum = max_pic_num - hasLength
  if(canPushNum <= 0) {
    limit.handleLimited("thread_img", max_pic_num)
    return
  }

  // 1. Process Images (Exif, Compress, MetaData)
  const res0 = await imgHelper.extractExif(imgFiles)
  const res1 = await imgHelper.compress(imgFiles)
  const res2 = await imgHelper.getMetaDataFromFiles(res1, res0)

  // 2. Add images to ceData.images IMMEDIATELY (with arrayBuffer, without cloud_url)
  //    The sync pipeline's handleFiles() will upload them and set cloud_url later
  for(let i = 0; i < res2.length && i < canPushNum; i++) {
    const imgStore = res2[i]
    ceData.images.push(imgStore)
    
    // REMOVED: Automatic editor insertion to prevent duplicate display
    // Images are now only shown in the gallery (editing-covers.vue)
    // Users can manually insert images from the gallery if needed
  }

  // 3. Upload in background — update cloud_url on each image when done
  for(const imgStore of ceData.images.slice(-res2.length)) {
    uploadViaLocal([imgStore] as any, (fileId, res) => {
      if(res.code === "0000" && res.data?.cloud_url) {
        imgStore.cloud_url = res.data.cloud_url
      }
    })
  }
}