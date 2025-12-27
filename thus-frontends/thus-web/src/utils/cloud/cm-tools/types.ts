import type { 
  SyncGetAtom, 
  ThusDownloadParcel,
} from "~/types/cloud/sync-get/types"
import type { DexieBulkUpdateAtom } from "~/types/other/types-dexie"
import type { 
  CollectionLocalTable, 
  ContentLocalTable,
  DraftLocalTable,
} from "~/types/types-table"
import type { ThusTimeout } from "~/utils/basic/type-tool"

export type CmResolver = (list?: ThusDownloadParcel[]) => void

export interface CmTask {
  data: SyncGetAtom
  resolver: CmResolver
  timeout: ThusTimeout
}

export interface CmOpt {
  delay?: number
  maxStackNum?: number
  waitMilli?: number
}

export type Bulk_Content = DexieBulkUpdateAtom<ContentLocalTable>
export type Bulk_Collection = DexieBulkUpdateAtom<CollectionLocalTable>
export type Bulk_Draft = DexieBulkUpdateAtom<DraftLocalTable>