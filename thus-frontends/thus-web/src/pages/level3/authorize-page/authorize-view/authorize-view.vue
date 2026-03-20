<script setup lang="ts">
import type { ThusAppType } from '~/types/types-atom';
import type { PropType } from 'vue';
import { appMap } from '../tools/app-map';
import { useI18n } from 'vue-i18n';
import { useSystemStore } from '~/hooks/stores/useSystemStore';
import { storeToRefs } from 'pinia';
import { useAuthorizeView } from './tools/useAuthorizeView';
import type { AuthorizeViewEmit } from "./tools/types";
import AvatarName from "./avatar-name/avatar-name.vue"

const props = defineProps({
  appType: {
    type: String as PropType<ThusAppType>,
    required: true,
  },
  code: {
    type: String,
  }
})
const emit = defineEmits<AuthorizeViewEmit>()

const { t } = useI18n()

const systemStore = useSystemStore()
const { supported_theme: theme } = storeToRefs(systemStore)

const { 
  avData,
  myProfile,
  onTapAgree,
  onTapCancel,
} = useAuthorizeView(props, emit)

</script>
<template>

  <div class="thus-mc-box" :class="{ 'thus-mc-box_success': code }">

    <div class="av-backdrop"></div>

    <div class="av-panel">

      <div class="av-kicker thus-no-user-select">
        <span>{{ code ? t('authorize.opening_title', { app: appMap[appType] }) : t('authorize.title_1', { app: appMap[appType] }) }}</span>
      </div>

      <!-- logos and check (or arrow) -->
      <div class="av-logos">
        <div class="av-logo-box av-logo-box_our">
          <div class="av-our-logo-bg"></div>
        </div>

        <div class="av-connector">
          <div class="av-dash" :class="{ 'av-dash_moving': !code }"></div>

          <div class="av-check-circle" :class="{ 'av-check-circle_success': code }">
            <svg-icon v-if="code" class="av-arrow-svg" 
              name="arrow-back"
              color="var(--bg-color)"
            ></svg-icon>
            <svg-icon v-else class="av-check-svg" 
              name="check"
              color="var(--bg-color)"
            ></svg-icon>
          </div>
        </div>

        <div class="av-logo-box"
          :class="{ 'av-logo-box_windsurf': appType === 'windsurf' }"
        >
          <svg-icon v-if="appType === 'cnb.cool'" 
            class="av-cnb-svg"
            name="logos-cnb-cool"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'cursor'"  class="av-cursor-svg"
            :name="theme === 'dark' ? 'logos-cursor_dark' : 'logos-cursor'"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'github.dev'" class="av-logo-svg"
            name="logos-github"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'gitpod.io'" class="av-gitpod-svg"
            name="logos-gitpod"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'project-idx'" class="av-project-idx-svg"
            name="logos-project-idx"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'stackblitz.com'" class="av-stackblitz-svg"
            name="logos-stackblitz"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'tencent-cloud-studio'" 
            class="av-tencent-cloud-studio-svg"
            name="logos-tencent-cloud-studio"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'trae'" 
            class="av-trae-svg"
            name="logos-trae"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'windsurf'"  class="av-windsurf-svg"
            name="logos-windsurf"
            color="#58E5BB"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'vscodium'"  class="av-vscodium-svg"
            name="logos-vscodium"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else-if="appType === 'vscode-insiders'"  class="av-vscode-svg"
            name="logos-vscode-insiders"
            :coverFillStroke="false"
          ></svg-icon>
          <svg-icon v-else  class="av-vscode-svg"
            name="logos-vscode"
            :coverFillStroke="false"
          ></svg-icon>
        </div>

      </div>

      <!-- title -->
      <div v-if="code" class="thus-no-user-select av-title">
        <span>{{ t('authorize.opening_title', { app: appMap[appType] }) }}</span>
      </div>
      <div v-else class="thus-no-user-select av-title">
        <span>{{ t('authorize.title_1', { app: appMap[appType] }) }}</span>
      </div>

      <!-- description -->
      <div v-if="code" class="av-desc av-desc_success">
        <span v-if="avData.showCode" class="thus-selection av-code-pill">{{ t('authorize.opening_tip_2', { app: appMap[appType], code }) }}</span>
        <span v-else class="thus-selection">{{ t('authorize.opening_tip_1', { app: appMap[appType] }) }}</span>
      </div>
      <div v-else class="av-desc">
        <span class="thus-selection">{{ t('authorize.desc_1', { app: appMap[appType] }) }}</span>
      </div>

      <!-- buttons -->
      <div v-if="!code" class="av-btn-container">

        <!-- avatar + nickname for mobile -->
        <div v-if="myProfile" class="av-mobile-profile av-profile-card">
          <AvatarName :profile="myProfile"></AvatarName>
        </div>

        <!-- authorize -->
        <custom-btn class="av-btn av-ok-btn" @click="onTapAgree"
          :is-loading="avData.fetchingAgree"
          :disabled="avData.fetchingAgree"
        >
          <span>{{ t('authorize.authorize') }}</span>
        </custom-btn>

        <!-- cancel -->
        <custom-btn class="av-btn av-cancel-btn" @click="onTapCancel" type="pure">
          <span>{{ t('common.cancel') }}</span>
        </custom-btn>

      </div>

      <!-- avatar + nickname for desktop -->
      <div v-if="myProfile && !code" class="av-desktop-profile av-profile-card">
        <AvatarName :profile="myProfile"></AvatarName>
      </div>

    </div>

  </div>


</template>
<style scoped lang="scss">

.thus-mc-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #141414 0%, #090909 48%, #040404 100%);
}

.thus-mc-box_success {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.1), transparent 30%),
    linear-gradient(180deg, #171717 0%, #090909 52%, #030303 100%);
}

.thus-mc-box::before,
.thus-mc-box::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.thus-mc-box::before {
  background:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 80%);
  opacity: 0.38;
}

.thus-mc-box::after {
  inset: auto auto 8% 50%;
  width: min(92vw, 760px);
  height: min(92vw, 760px);
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 68%);
  filter: blur(18px);
}

.av-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.08), transparent 26%),
    radial-gradient(circle at 82% 14%, rgba(255, 255, 255, 0.06), transparent 22%),
    radial-gradient(circle at 50% 78%, rgba(255, 255, 255, 0.05), transparent 34%);
  filter: blur(32px);
  pointer-events: none;
}

.av-panel {
  position: relative;
  z-index: 1;
  overflow: hidden;
  width: min(100%, 880px);
  padding: clamp(28px, 5vw, 56px);
  border-radius: 34px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0) 18%),
    linear-gradient(180deg, #111111 0%, #0b0b0b 100%);
  box-shadow:
    0 44px 120px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03);
}

.av-panel::before,
.av-panel::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.av-panel::before {
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.02), transparent 40%);
}

.av-panel::after {
  inset: 14px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.av-kicker {
  position: relative;
  z-index: 1;
  margin-block-end: 18px;
  text-align: center;
  font-size: 12px;
  line-height: 1.2;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.av-logos {
  position: relative;
  z-index: 1;
  height: 108px;
  margin-block-end: clamp(28px, 7vw, 56px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.av-logo-box {
  overflow: hidden;
  width: 108px;
  height: 108px;
  border-radius: 30px;
  position: relative;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0) 28%),
    #0f0f10;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    0 18px 36px rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.av-logo-box_our {
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 42%),
    #111111;
}

.av-our-logo-bg {
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  width: 72%;
  height: 72%;
  background-image: url('/logos/logo_256x256_v3.png');
}

.av-connector {
  position: relative;
  width: clamp(120px, 18vw, 180px);
  display: flex;
  align-items: center;
}

@keyframes moveRight {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 220px 0;
  }
}

.av-dash {
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background-image: linear-gradient(90deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.12));
  background-size: 220px 100%;
  background-repeat: no-repeat;
  box-shadow: 0 0 22px rgba(255, 255, 255, 0.08);
}

.av-dash_moving {
  animation: moveRight 1.8s linear infinite;
}

.av-check-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: #f3f3f3;
  color: #090909;
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.av-check-circle_success {
  background: #ffffff;
}

.av-check-svg {
  width: 18px;
  height: 18px;
}

.av-arrow-svg {
  width: 18px;
  height: 18px;
  transform: rotate(180deg);
}

.av-logo-box_windsurf {
  background-color: #141515;
}

.av-logo-svg {
  width: 80%;
  height: 80%;
}

.av-cnb-svg,
.av-cursor-svg, 
.av-vscodium-svg {
  width: 70%;
  height: 70%;
}

.av-gitpod-svg, 
.av-stackblitz-svg, 
.av-tencent-cloud-studio-svg,
.av-project-idx-svg {
  width: 66%;
  height: 66%;
}

.av-tencent-cloud-studio-svg {
  margin-inline-start: 4px;
}

.av-windsurf-svg, .av-vscode-svg {
  width: 60%;
  height: 60%;
}

.av-trae-svg {
  width: 50%;
  height: 50%;
}

.av-title {
  position: relative;
  z-index: 1;
  margin-block-end: 14px;
  text-align: center;
  text-wrap: pretty;
  font-family: "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 0.98;
  letter-spacing: -0.06em;
  color: #fafafa;
  font-weight: 700;
  max-width: 680px;
  margin-inline: auto;
}

.av-desc {
  position: relative;
  z-index: 1;
  margin: 0 auto min(10vw, 72px);
  text-align: center;
  text-wrap: pretty;
  font-size: clamp(15px, 2vw, 18px);
  line-height: 1.74;
  color: rgba(255, 255, 255, 0.62);
  max-width: 620px;
}

.av-desc_success {
  max-width: 560px;
}

.av-code-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 16px 30px rgba(0, 0, 0, 0.22);
  font-family: "SFMono-Regular", Menlo, Monaco, Consolas, monospace;
  font-size: 0.94em;
  letter-spacing: -0.01em;
}

.av-mobile-profile {
  display: block;
  position: relative;
  width: 100%;
  margin-block-end: 18px;
}

.av-desktop-profile {
  display: none;
  position: relative;
}

.av-profile-card {
  width: 100%;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0) 42%),
    rgba(255, 255, 255, 0.035);
}

.av-btn-container {
  position: relative;
  z-index: 1;
  width: 100%;
  margin-block-end: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.av-btn {
  width: 100%;
  max-width: 320px;
  min-height: 54px;
  border-radius: 18px;
}

.av-ok-btn {
  font-weight: 700;
  color: #050505;
  background: #f5f5f5;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 20px 36px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.64);
}

.av-cancel-btn {
  color: rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media screen and (max-width: 390px) {
  .thus-mc-box {
    padding: 16px;
  }

  .av-panel {
    border-radius: 26px;
    padding: 24px 18px;
  }

  .av-title {
    font-size: 28px;
  }

  .av-desc {
    font-size: 14px;
  }
}

/** for mobile */
@media screen and (max-width: 490px) {
  .av-logo-box {
    width: 84px;
    height: 84px;
    border-radius: 24px;
  }

  .av-connector {
    width: 86px;
  }

  .av-check-circle {
    width: 34px;
    height: 34px;
  }
}

/** for desktop */
@media screen and (min-width: 590px) {

  .av-mobile-profile {
    display: none;
  }

  .av-desktop-profile {
    display: block;
    width: 100%;
    margin-block-end: 8px;
  }

  .av-btn-container {
    flex-direction: row-reverse;
    justify-content: center;
  }

  .av-btn {
    width: calc(50% - 6px);
    max-width: 220px;
  }
}


</style>
