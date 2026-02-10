<script setup lang="ts">
import { ref, watch, computed, type PropType } from 'vue'
import type { ThreadShow } from '~/types/types-content'
import aiReq, { type AiSimilarItem } from '~/requests/ai-req'
import { useRouteAndThusRouter } from '~/routes/liu-router'

const props = defineProps({
  threadShow: {
    type: Object as PropType<ThreadShow>,
  },
})

const rr = useRouteAndThusRouter()

const summary = ref("")
const summaryLoading = ref(false)
const summaryError = ref("")
const summaryTooShort = ref(false)

const similarNotes = ref<AiSimilarItem[]>([])
const similarLoading = ref(false)
const similarError = ref("")
const similarTooShort = ref(false)
const similarEmpty = ref(false)

const hasAnyContent = computed(() => {
  return summaryLoading.value || summary.value || summaryError.value
    || summaryTooShort.value
    || similarLoading.value || similarNotes.value.length > 0 || similarError.value
    || similarTooShort.value || similarEmpty.value
})

watch(() => props.threadShow?._id, async (newId) => {
  if(!newId || !props.threadShow) return
  summary.value = ""
  summaryError.value = ""
  summaryTooShort.value = false
  similarNotes.value = []
  similarError.value = ""
  similarTooShort.value = false
  similarEmpty.value = false
  loadSummary()
  loadSimilar()
}, { immediate: true })

async function loadSummary() {
  const thread = props.threadShow
  if(!thread) return

  const text = getThreadText(thread)
  if(!text || text.length < 20) {
    summaryTooShort.value = true
    return
  }

  summaryLoading.value = true
  try {
    const res = await aiReq.summarize(text, 200)
    if(res.ok && res.data?.summary) {
      summary.value = res.data.summary
    }
    else {
      summaryError.value = res.error ?? "摘要生成失败"
    }
  }
  catch {
    summaryError.value = "摘要生成失败"
  }
  finally {
    summaryLoading.value = false
  }
}

async function loadSimilar() {
  const thread = props.threadShow
  if(!thread) return

  const text = getThreadText(thread)
  if(!text || text.length < 10) {
    similarTooShort.value = true
    return
  }

  similarLoading.value = true
  try {
    const res = await aiReq.similar(text, thread._id, 5)
    if(res.ok && res.data?.similar) {
      similarNotes.value = res.data.similar
      if(res.data.similar.length === 0) {
        similarEmpty.value = true
      }
    }
    else {
      similarError.value = res.error ?? "相似推荐失败"
    }
  }
  catch {
    similarError.value = "相似推荐失败"
  }
  finally {
    similarLoading.value = false
  }
}

function getThreadText(thread: ThreadShow): string {
  const parts: string[] = []
  if(thread.title) parts.push(thread.title)
  if(thread.content) {
    const doc = thread.content
    if(doc.content) {
      for(const node of doc.content) {
        if(node.type === "paragraph" && node.content) {
          for(const inline of node.content) {
            if(inline.type === "text" && inline.text) {
              parts.push(inline.text)
            }
          }
        }
      }
    }
  }
  return parts.join("\n")
}

function onTapSimilar(item: AiSimilarItem) {
  if(!item._id) return
  rr.router.push({ path: `/detail/${item._id}` })
}

</script>
<template>

  <div v-if="hasAnyContent" class="td-ai-panel">

    <!-- AI Summary -->
    <div v-if="summaryLoading || summary || summaryError || summaryTooShort" class="tdai-section">
      <div class="tdai-title">
        <svg-icon name="star" class="tdai-icon" color="var(--primary-color)" />
        <span>AI 摘要</span>
      </div>
      <div v-if="summaryLoading" class="tdai-loading">
        <span>正在生成摘要...</span>
      </div>
      <div v-else-if="summary" class="tdai-summary">
        <span>{{ summary }}</span>
      </div>
      <div v-else-if="summaryTooShort" class="tdai-note">
        <span>内容较短，暂不生成摘要</span>
      </div>
      <div v-else-if="summaryError" class="tdai-error">
        <span>{{ summaryError }}</span>
      </div>
    </div>

    <!-- Similar Notes -->
    <div v-if="similarLoading || similarNotes.length > 0 || similarError || similarTooShort || similarEmpty" class="tdai-section">
      <div class="tdai-title">
        <svg-icon name="star" class="tdai-icon" color="var(--primary-color)" />
        <span>相似笔记</span>
      </div>
      <div v-if="similarLoading" class="tdai-loading">
        <span>正在查找相似笔记...</span>
      </div>
      <div v-else-if="similarNotes.length > 0" class="tdai-similar-list">
        <div
          v-for="item in similarNotes" :key="item._id"
          class="thus-hover tdai-similar-item"
          @click.stop="onTapSimilar(item)"
        >
          <div class="tdai-similar-text">
            <span v-if="item.title" class="tdai-similar-title">{{ item.title }}</span>
            <span v-else-if="item.firstText" class="tdai-similar-title">{{ item.firstText }}</span>
          </div>
          <div v-if="item.tags?.length" class="tdai-similar-tags">
            <span v-for="tag in item.tags.slice(0, 3)" :key="tag" class="tdai-tag-chip">{{ tag }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="similarEmpty" class="tdai-note">
        <span>暂无相似笔记</span>
      </div>
      <div v-else-if="similarTooShort" class="tdai-note">
        <span>内容较短，暂不推荐</span>
      </div>
      <div v-else-if="similarError" class="tdai-error">
        <span>{{ similarError }}</span>
      </div>
    </div>

  </div>

</template>
<style scoped lang="scss">

.td-ai-panel {
  width: 100%;
  padding: 0 0 16px 0;
}

.tdai-section {
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 16px 20px;
  margin-block-end: 12px;
  box-shadow: var(--card-shadow-2);
}

.tdai-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--btn-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-block-end: 12px;
}

.tdai-icon {
  width: 18px;
  height: 18px;
}

.tdai-loading {
  font-size: var(--mini-font);
  color: var(--main-note);
  animation: tdai-pulse 1.5s ease-in-out infinite;
}

@keyframes tdai-pulse {
  0%, 100% { opacity: .5; }
  50% { opacity: 1; }
}

.tdai-summary {
  font-size: var(--desc-font);
  color: var(--main-text);
  line-height: 1.6;
}

.tdai-error {
  font-size: var(--mini-font);
  color: var(--main-note);
  font-style: italic;
}

.tdai-note {
  font-size: var(--mini-font);
  color: var(--main-note);
}

.tdai-similar-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tdai-similar-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.tdai-similar-text {
  font-size: var(--btn-font);
  color: var(--main-normal);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tdai-similar-title {
  font-weight: 500;
}

.tdai-similar-tags {
  display: flex;
  gap: 6px;
  margin-block-start: 6px;
  flex-wrap: wrap;
}

.tdai-tag-chip {
  font-size: var(--mini-font);
  color: var(--thus-quote);
  background-color: var(--tag-bg);
  padding: 2px 8px;
  border-radius: 4px;
}

</style>
