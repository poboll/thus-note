<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import LiuImg from '~/components/common/liu-img/liu-img.vue'
import { computed } from 'vue'

const props = defineProps(nodeViewProps)

const src = computed(() => props.node.attrs.src)
const alt = computed(() => props.node.attrs.alt)
const title = computed(() => props.node.attrs.title)

</script>

<template>
  <NodeViewWrapper class="image-view">
    <div class="image-container">
        <LiuImg 
            :src="src" 
            :alt="alt" 
            :title="title"
            class="editor-image"
            :draggable="true" 
            data-drag-handle 
        />
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.image-view {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}
.image-container {
  max-width: 100%;
}
.editor-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
</style>