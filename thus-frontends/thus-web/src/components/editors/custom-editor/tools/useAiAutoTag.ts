
import { type Ref, type ShallowRef } from "vue"
import type { TipTapEditor } from "~/types/types-editor"
import type { TagShow } from "~/types/types-content"
import type { CeData } from "./types"
import aiReq from "~/requests/ai-req"
import cui from "~/components/custom-ui"
import { searchLocal } from "~/utils/system/tag-related/search"

let _cachedAutoTagMode: 'manual' | 'silent' | undefined

async function _loadAutoTagMode(): Promise<'manual' | 'silent'> {
  if(_cachedAutoTagMode) return _cachedAutoTagMode
  const res = await aiReq.getAiSettings()
  if(res.ok && res.data) {
    _cachedAutoTagMode = res.data.aiAutoTagMode
    return _cachedAutoTagMode
  }
  return 'manual'
}

export function useAiAutoTag(
  ceData: CeData,
  editorRef: ShallowRef<TipTapEditor | undefined>,
  onNewHashTags: (tags: TagShow[]) => void,
  tagShows: Ref<TagShow[]>,
) {

  const _mergeTags = (newTagNames: string[], silent: boolean) => {
    const mergedTags: TagShow[] = [...tagShows.value]

    for(const tagName of newTagNames) {
      const alreadyExists = mergedTags.some(
        t => t.text.toLowerCase() === tagName.toLowerCase(),
      )
      if(alreadyExists) continue

      const foundList = searchLocal(tagName)
      if(foundList.length > 0) {
        mergedTags.push(foundList[0])
      }
      else {
        mergedTags.push({ tagId: "", text: tagName })
      }
    }

    if(mergedTags.length > tagShows.value.length) {
      onNewHashTags(mergedTags)
      if(!silent) {
        cui.showSnackBar({ text: `已添加 ${mergedTags.length - tagShows.value.length} 个标签` })
      }
    }
    else if(!silent) {
      cui.showSnackBar({ text: "没有新的标签建议" })
    }
  }

  const onAiAutoTag = async () => {
    const editor = editorRef.value
    if(!editor) return

    const json = editor.getJSON()
    const list = json?.content ?? []
    if(list.length < 1) {
      cui.showSnackBar({ text: "请先输入一些内容" })
      return
    }

    const plainText = editor.getText()
    if(!plainText || plainText.trim().length < 5) {
      cui.showSnackBar({ text: "内容太短，无法生成标签" })
      return
    }

    const existingTags = tagShows.value.map(t => t.text)
    cui.showLoading({ title: "AI 生成标签中..." })
    const res = await aiReq.autoTag(plainText, existingTags)
    cui.hideLoading()

    if(!res.ok || !res.data?.tags?.length) {
      cui.showSnackBar({ text: res.error ?? "AI 标签生成失败" })
      return
    }
    _mergeTags(res.data.tags, false)
  }

  const onSilentAutoTag = async () => {
    const mode = await _loadAutoTagMode()
    if(mode !== 'silent') return

    const editor = editorRef.value
    if(!editor) return

    const plainText = editor.getText()
    if(!plainText || plainText.trim().length < 10) return

    const existingTags = tagShows.value.map(t => t.text)
    const res = await aiReq.autoTag(plainText, existingTags)
    if(res.ok && res.data?.tags?.length) {
      _mergeTags(res.data.tags, true)
    }
  }

  return { onAiAutoTag, onSilentAutoTag }
}
