import { watch, ref, provide } from "vue";
import { useRouteAndThusRouter } from "~/routes/liu-router";
import { showA2hsFaqKey } from "~/utils/provide-keys";


export function useA2hsPage() {
  const { route } = useRouteAndThusRouter()
  const showA2hsFAQ = ref(true)

  provide(showA2hsFaqKey, showA2hsFAQ)

  watch(() => route, (newV) => {
    const fr = newV.query.fr
    if(fr === "login") {
      showA2hsFAQ.value = false
    }
  }, { immediate: true })

  return {
    showA2hsFAQ,
  }
}