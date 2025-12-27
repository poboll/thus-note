import type { 
  ThusAppType, 
  PageState,
} from "~/types/types-atom";

export interface ApData {
  pageState: PageState
  state: string
  credential: string
  appType?: ThusAppType
  serial?: string
  code?: string
}