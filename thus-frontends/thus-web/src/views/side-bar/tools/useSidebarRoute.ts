import { computed } from "vue";
import { useRouteAndThusRouter } from "~/routes/liu-router";

// 展开状态，为空表示展示默认侧边栏
type ExpandState = "tags" | ""

export function useSidebarRoute() {
  const { route, router } = useRouteAndThusRouter()

  const expandState = computed<ExpandState>(() => {
    const tags = route.query.tags
    if(tags === "01") return "tags"
    return ""
  })

  return { expandState }
}