import type { RouteAndThusRouter } from "~/routes/liu-router"
import valTool from "~/utils/basic/val-tool"

let errNum = 0
export async function handleCustomUiQueryErr(
  rr: RouteAndThusRouter | undefined,
  queryKey: string,
) {
  if(!rr) return
  if(errNum > 2) return
  await valTool.waitMilli(200)
  errNum++
  rr.router.naviBackUntilNoSpecificQuery(rr.route, queryKey)
}

export function openIt(
  rr: RouteAndThusRouter | undefined,
  queryKey: string,
) {
  if(!rr) return
  const newQ = {
    [queryKey]: "01"
  }
  rr.router.addNewQueryWithOldQuery(rr.route, newQ)
}

export function closeIt(
  rr: RouteAndThusRouter | undefined,
  queryKey: string,
) {
  if(!rr) return
  rr.router.naviBackUntilNoSpecificQuery(rr.route, queryKey)
}