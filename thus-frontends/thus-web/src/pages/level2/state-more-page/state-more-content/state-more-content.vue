<script setup lang="ts">
import type { PropType } from 'vue';
import type { TrueOrFalse } from '~/types/types-basic';
import ThreadList from '~/components/level1/thread-list/thread-list.vue';

defineProps({
  stateId: String,
  showTxt: String as PropType<TrueOrFalse>,
})

</script>
<template>

  <div class="thus-mc-container">
    <div class="liu-tc-virtual"></div>
    <div class="thus-mc-box">
      <thread-list v-if="stateId" 
        view-type="STATE"
        :state-id="stateId"
        :show-txt="showTxt"
      ></thread-list>
    </div>
  </div>

</template>
<style lang="scss" scoped>



</style>