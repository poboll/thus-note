import { watch } from "vue";
import { useRouteAndThusRouter } from "~/routes/liu-router";
import { useLayoutStore } from "~/views/useLayoutStore";


export function initLayout() {
  const layoutStore = useLayoutStore()
  const rr = useRouteAndThusRouter()

  watch(rr.route, (newV) => {
    if(!newV) return
    const { matched } = newV
    const firstMatched = matched[0]
    if(!firstMatched) return
    const { components } = firstMatched
    const hasBottomNaviBar = Boolean(components?.BottomNaviBar)
    layoutStore.$patch({ routeHasBottomNaviBar: hasBottomNaviBar })
  }, { immediate: true })
}