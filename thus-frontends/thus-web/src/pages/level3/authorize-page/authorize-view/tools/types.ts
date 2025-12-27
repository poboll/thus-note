import type { ThusAppType } from "~/types/types-atom";


export interface AuthorizeViewProps {
  appType: ThusAppType
  code?: string
}

export interface AuthorizeViewEmit {
  (evt: "agree"): void
}

export interface AuthorizeViewData {
  showCode: boolean
  fetchingAgree: boolean
}