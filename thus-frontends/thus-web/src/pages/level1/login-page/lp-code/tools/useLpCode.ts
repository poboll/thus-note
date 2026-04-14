import { reactive, ref, toRef, watch, type Ref } from "vue"
import type { LpcProps, LpcEmits, LpcData } from "./types"

interface LpcCtx {
  lpCodeInput: Ref<HTMLInputElement| undefined>
  lpcData: LpcData
  emit: LpcEmits
}

export function useLpCode(
  props: LpcProps,
  emit: LpcEmits,
) {
  const lpCodeInput = ref<HTMLInputElement>()
  const lpcData = reactive<LpcData>({
    code: "",
    canSubmit: false,
  })

  const ctx: LpcCtx = {
    lpCodeInput,
    lpcData,
    emit,
  }

  watch(() => lpcData.code, (newV, oldV) => {
    whenCodeChange(newV, oldV, ctx)
  })

  const clearCodeNum = toRef(props, "clearCodeNum")
  watch(clearCodeNum, (newV) => {
    if(!newV) return
    lpcData.code = ""
  })
  
  const onEnterCode = () => {
    if(!lpcData.canSubmit) return
    toSubmitCode(ctx)
  }

  return {
    lpCodeInput,
    lpcData,
    onEnterCode,
  }
}

function toSubmitCode(
  ctx: LpcCtx,
) {
  ctx.emit("submitcode", ctx.lpcData.code)

  const el = ctx.lpCodeInput.value
  if(!el) return
  el.blur()
}

function whenCodeChange(
  newV: string,
  oldV: string,
  ctx: LpcCtx,
) {
  const { lpcData } = ctx
  const code = newV.trim().replace(/\D/g, "")

  const len0 = code.length
  const len2 = oldV.trim().replace(/\D/g, "").length

  if(lpcData.code !== code) {
    lpcData.code = code
    return
  }

  const canSubmit = len0 >= 6
  if(lpcData.canSubmit !== canSubmit) {
    lpcData.canSubmit = canSubmit
  }

  if(canSubmit && len2 < 2) {
    toSubmitCode(ctx)
  }
}