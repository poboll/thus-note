<script setup lang="ts">
import WhoAreYou from "./components/level1/who-are-you/who-are-you.vue"
import TrustDetection from "./components/level1/trust-detection/trust-detection.vue"
import GlobalLoading from "./components/loaders/global-loading/global-loading.vue"
import ErrorModal from "./components/common/error-modal/ErrorModal.vue"
import { useApp } from "./hooks/useApp";
import { useErrorHandler } from "./hooks/useErrorHandler";
import { initThusRouter } from "./routes/liu-router"
import { defineAsyncComponent } from "vue"
import time from "~/utils/basic/time"

time.whenAppSetup()

const CustomUi = defineAsyncComponent(() => {
  return import("./components/custom-ui/custom-ui.vue")
})

const { cha } = useApp()
const { route } = initThusRouter()
const ios_ipad = Boolean(cha.isIOS || cha.isIPadOS)

// 错误处理
const { errorState, clearError } = useErrorHandler()

const onErrorClose = () => {
  clearError()
}

const onErrorRetry = () => {
  clearError()
  // 可以在这里添加重试逻辑
  window.location.reload()
}

</script>

<template>
  
  <div 
    class="app-container"
    :class="{ 
      'liu-ios-device': ios_ipad,
      'liu-android-device': cha.isAndroid,
    }"
  >
    <!-- Global Background Image -->
    <div class="app-bg-image"></div>

    <!-- 侧边栏视图 -->
    <router-view name="LeftSidebar" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    
    <!-- 默认视图 -->
    <router-view v-if="route.meta.keepAlive !== false" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    <router-view v-else></router-view>

    <!-- router-view for bottom navigation bar -->
    <router-view name="BottomNaviBar" v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
    
    <custom-ui />
    <who-are-you />
    <TrustDetection></TrustDetection>
    <GlobalLoading></GlobalLoading>
    
    <!-- 全局错误弹窗 -->
    <ErrorModal
      v-if="errorState"
      :visible="!!errorState"
      :errorType="errorState.type"
      :errorCode="errorState.code"
      :errorMessage="errorState.message"
      :details="errorState.details"
      @close="onErrorClose"
      @retry="onErrorRetry"
    />
  </div>
</template>

<style scoped>

.app-container {
  height: max-content;
  min-height: 100%;
  min-width: 250px;
  position: relative;
}

.app-bg-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  background-image: url('https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  filter: brightness(0.9);
}

</style>
