import type { ShallowRef } from "vue";
import type { RouteAndThusRouter } from "~/routes/liu-router";
import type { ComposingData, PageState } from "~/types/types-atom";

export interface CcData {
  pageState: PageState
  chatId?: string
}

export interface CcContext {
  ccData: CcData
  rr: RouteAndThusRouter
  composingDataRef: ShallowRef<ComposingData | undefined>
}