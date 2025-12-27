import type { ThreadShow } from "~/types/types-content"
import type { RouteAndThusRouter } from "~/routes/liu-router"

export interface PreCtx {
  thread: ThreadShow
  rr: RouteAndThusRouter
}