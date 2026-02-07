import { onMounted, ref, type Ref } from "vue"
import type EditorCore from "../../editor-core/editor-core.vue"
import type { Editor } from "@tiptap/vue-3"
import time from "~/utils/basic/time"
import type { ThusTimeout } from "~/utils/basic/type-tool"

export function useCustomEditor() {
  const editorCoreRef = ref<typeof EditorCore | null>(null)
  const editor = ref<Editor>()
  const showMask = ref(false)

  onMounted(() => {
    if(!editorCoreRef.value) return
    editor.value = editorCoreRef.value.editor as Editor
  })

  const onEditorScrolling = () => handleEditorScrolling(showMask)

  return {
    editorCoreRef, 
    editor,
    onEditorScrolling,
    showMask,
  }
}

let lastScoll = 0
let hideMaskTimeout: ThusTimeout
function handleEditorScrolling(
  showMask: Ref<boolean>,
) {
  if(time.isWithinMillis(lastScoll, 300)) return
  lastScoll = time.getTime()
  showMask.value = true
  if(hideMaskTimeout) clearTimeout(hideMaskTimeout)
  hideMaskTimeout = setTimeout(() => {
    hideMaskTimeout = undefined
    showMask.value = false
  }, 1500)
}
