import type { ThusTimeout } from "~/utils/basic/type-tool"

export interface NbData {
  height1: number
  height2: number
  height3: number
  lastResizeTimeout: ThusTimeout
  visible: boolean
  alwaysArrowBack: boolean
}