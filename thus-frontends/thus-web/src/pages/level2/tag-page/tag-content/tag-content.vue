<script setup lang="ts">
import type { PropType } from 'vue';
import type { TrueOrFalse } from '~/types/types-basic';
import ThreadList from '~/components/level1/thread-list/thread-list.vue';

defineProps({
  tagId: String,
  showTxt: String as PropType<TrueOrFalse>,
})

const onNodata = () => {
  // console.log("该标签下没有动态")
}

const onHasdata = () => {
  // console.log("该标签下有动态.......")
}

</script>
<template>

  <div class="thus-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="thus-mc-box">
      <thread-list v-if="tagId" 
        view-type="TAG"
        :tag-id="tagId"
        :show-txt="showTxt"
        @nodata="onNodata"
        @hasdata="onHasdata"
      ></thread-list>
    </div>
  </div>

</template>
<style scoped>

</style>