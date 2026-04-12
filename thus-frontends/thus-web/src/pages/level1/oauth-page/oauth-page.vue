<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useOAuthPage } from './tools/useOAuthPage';
import PulsarLoader from '~/components/loaders/pulsar-loader/pulsar-loader.vue';

const { opData, onTapBack } = useOAuthPage()
const { t } = useI18n()

</script>
<template>
  <!-- 顶部: 返回导航栏 -->
  <div class="lp-navi-bar">
    <div class="lpn-box">
      <!-- 返回按钮 -->
      <div class="thus-no-user-select thus-hover lpn-back" @click.stop="onTapBack">
        <div class="lpn-back-icon">
          <svg-icon name="arrow-back700" class="lpn-back-svg" color="#f5f5f5"></svg-icon>
        </div>
        <span>{{ t('common.back') }}</span>
      </div>
    </div>
  </div>

  <!-- 主体 -->
  <div class="lp-body">
    <div class="lp-backdrop"></div>

    <!-- 顶部占位 -->
    <div class="lp-virtual"></div>

    <!-- 1. 登录中 -->
    <div v-if="opData.showLoading" class="lp-container">
      <div class="lp-panel">
        <div class="lp-kicker">
          <span>{{ t('login.logging') }}</span>
        </div>

        <div class="lpc-title">
          <span class="thus-selection">{{ t('login.logging') }}</span>
        </div>

        <div class="lpc-desc">
          <span class="thus-selection">{{ t('authorize.opening_tip_1', { app: 'Thus' }) }}</span>
        </div>

        <div class="lp-loader-shell">
          <PulsarLoader color="#f5f5f5"></PulsarLoader>
        </div>
      </div>
    </div>

    <!-- 底部占位，形成上下对称 -->
    <div class="lp-virtual"></div>
  </div>
</template>
<style scoped lang="scss">
.lp-navi-bar {
  width: 100%;
  height: 100px;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.lpn-box {
  height: 100%;
  width: 92%;
  max-width: 1500px;
  position: relative;
  display: flex;
  align-items: center;
}

.lpn-back {
  display: flex;
  align-items: center;
  width: fit-content;
  pointer-events: auto;
  font-size: 14px;
  color: #f5f5f5;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 10px 16px 10px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 15, 15, 0.72);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.lpn-back-icon {
  width: 34px;
  height: 34px;
  margin-inline-end: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  .lpn-back-svg {
    width: 24px;
    height: 24px;
  }
}

.lp-body {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  isolation: isolate;
  z-index: 50;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #141414 0%, #090909 48%, #040404 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.lp-body::before,
.lp-body::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.lp-body::before {
  background:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 82%);
  opacity: 0.38;
}

.lp-body::after {
  inset: auto auto 8% 50%;
  width: min(92vw, 760px);
  height: min(92vw, 760px);
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 68%);
  filter: blur(18px);
}

.lp-backdrop {
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

.lp-virtual {
  width: 100%;
  height: 100px;
}

.lp-container {
  position: relative;
  z-index: 1;
  width: 92%;
  max-width: 450px;
}

.lp-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: clamp(28px, 5vw, 44px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0) 18%),
    linear-gradient(180deg, #111111 0%, #0b0b0b 100%);
  box-shadow:
    0 44px 120px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03);
}

.lp-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.03);
  pointer-events: none;
}

.lp-kicker {
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.lpc-title {
  text-align: center;
  width: 100%;
  font-family: "SF Pro Display", "Segoe UI", sans-serif;
  font-size: clamp(30px, 6vw, 40px);
  line-height: 1.02;
  letter-spacing: -0.06em;
  font-weight: 700;
  color: #fafafa;
}

.lpc-desc {
  max-width: 300px;
  text-align: center;
  color: rgba(255, 255, 255, 0.68);
  font-size: 14px;
  line-height: 1.6;
}

.lp-loader-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01)),
    linear-gradient(180deg, #181818 0%, #0d0d0d 100%);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

@media screen and (max-width: 489px) {
  .lp-panel {
    padding: 24px 18px;
    border-radius: 24px;
  }

  .lp-navi-bar {
    height: 88px;
  }

  .lp-virtual {
    height: 88px;
  }
}
</style>
