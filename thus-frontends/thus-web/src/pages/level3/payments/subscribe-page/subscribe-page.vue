<script setup lang="ts">
import MainView from "~/views/main-view/main-view.vue";
import ScrollView from "~/components/common/scroll-view/scroll-view.vue";
import SubscribeContent from "./subscribe-content/subscribe-content.vue";
import CreditsSection from "./credits-section/credits-section.vue";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import type { PageState } from "~/types/types-atom";

const { t } = useI18n()

const showTitle = ref(true)
const whenStateChanged = (state: PageState) => {
  showTitle.value = state >= 0
}


</script>
<template>

  <main-view>
    <scroll-view>
      <navi-virtual></navi-virtual>
      <SubscribeContent @statechanged="whenStateChanged"></SubscribeContent>
      
      <!-- 点数购买区域 -->
      <div class="credits-divider"></div>
      <CreditsSection></CreditsSection>
    </scroll-view>
    <navi-bar :title="showTitle ? t('payment.member_subscribe') : ''"></navi-bar>
  </main-view>

</template>
<style scoped lang="scss">
.credits-divider {
  width: 100%;
  height: 1px;
  background: var(--border-color);
  margin: 40px 0;
  opacity: 0.3;
}
</style>