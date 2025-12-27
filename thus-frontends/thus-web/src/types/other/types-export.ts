
import type { 
  SpaceType, 
  VisScope, 
  StorageState,
} from "../types-basic"
import type { 
  LiuContent, 
  ThusRemindMe,
  ContentInfoType,
} from "../types-atom"
import type { EmojiData } from "../types-content"
import type { 
  ContentConfig, 
} from "./types-custom"
import type { BaseLocalTable } from "../types-table"
import type { ThusFileStore, ThusImageStore } from "../index"

export type LiuFileExport = Omit<ThusFileStore, "arrayBuffer" | "cloud_url">
export type LiuImageExport = Omit<ThusImageStore, "arrayBuffer" | "cloud_url">

// 导出格式为 json 时的结构: 
export interface ThusExportContentJSON extends BaseLocalTable {
  first_id: string
  infoType: ContentInfoType
  user: string
  member?: string
  spaceId: string
  spaceType: SpaceType
  visScope: VisScope
  storageState: StorageState
  title?: string
  thusDesc?: LiuContent[]
  images?: LiuImageExport[]
  files?: LiuFileExport[]
  calendarStamp?: number
  remindStamp?: number
  whenStamp?: number
  remindMe?: ThusRemindMe
  emojiData: EmojiData
  parentThread?: string
  parentComment?: string
  replyToComment?: string
  pinStamp?: number         // 被置顶时的时间戳
  createdStamp: number      // 动态被创建的时间戳
  editedStamp: number       // 动态被编辑的时间戳
  tagIds?: string[]         // 用于显示的 tagId
  tagSearched?: string[]      // 用于搜索的 tagId 要把 tagIds 的 parent id 都涵盖进来
  stateId?: string
  config?: ContentConfig
  levelOne?: number         // 一级评论数
  levelOneAndTwo?: number   // 一级 + 二级评论数
}