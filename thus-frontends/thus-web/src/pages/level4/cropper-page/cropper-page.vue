<script setup lang="ts">
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import CropperContent from "./cropper-content/cropper-content.vue";
import { ref } from "vue"

const confirmNum = ref(0)

</script>
<template>
  <div class="thus-simple-page">
    <scroll-view>
      <navi-virtual></navi-virtual>

      <div class="thus-mc-container">
        <div class="thus-mc-box">
          <CropperContent
            :confirm-num="confirmNum"
          ></CropperContent>
        </div>
      </div>

    </scroll-view>
    <navi-bar 
      title-key="common.crop"
      confirm-key="common.confirm"
      @tapconfirm="() => confirmNum++"
    ></navi-bar>
  </div>
</template>
<style scoped lang="scss">


</style>