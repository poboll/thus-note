<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useWechatBind } from "./tools/useWechatBind";
import AgreeBox from "~/components/common/agree-box/agree-box.vue";

const { wbData, onTapBtn1, onTapBtn2 } = useWechatBind();

const { t } = useI18n();
</script>
<template>
  <div class="thus-simple-page">
    <div class="thus-mc-container">
      <PlaceholderView :p-state="wbData.pageState"></PlaceholderView>

      <div
        v-show="wbData.pageState < 0"
        class="thus-no-user-select thus-mc-box"
      >
        <div class="ap-backdrop"></div>

        <div class="ap-panel">
          <div class="ap-kicker">
            <span>{{ t("login.wechat_login") }}</span>
          </div>

          <div class="ap-icon-box">
            <svg-icon
              v-if="wbData.status === 'bound' || wbData.status === 'logged'"
              name="emojis-clapping_hands_color_default"
              class="ap-icon"
              :cover-fill-stroke="false"
            ></svg-icon>
            <div v-else class="ap-div-icon"></div>
          </div>

          <div class="ap-title">
            <span v-if="wbData.status === 'bound'">{{ t("login.bound") }}</span>
            <span v-else-if="wbData.status === 'logged'">{{
              t("login.logged")
            }}</span>
            <span
              v-else-if="
                wbData.status === 'logout' || wbData.status === 'wxmini-login'
              "
              >{{ t("login.wechat_login") }}</span
            >
            <span v-else>{{ t("login.bind_wechat") }}</span>
          </div>

          <div class="ap-desc">
            <span
              v-if="wbData.status === 'logout' || wbData.status === 'wxmini-login'"
            >{{ t("login.wechat_one_login") }}</span>
            <span v-else-if="wbData.status === 'waiting'">{{
              t("login.bind_instantly")
            }}</span>
            <span v-else>{{ t("login.bound") }}</span>
          </div>

          <div
            class="ap-mobile-agree"
            v-if="wbData.status === 'logout' || wbData.status === 'wxmini-login'"
          >
            <AgreeBox
              v-model="wbData.agreeRule"
              be-center
              :shaking-num="wbData.agreeShakingNum"
            ></AgreeBox>
          </div>

          <div class="ap-btn-container">
            <!-- Main Button -->
            <custom-btn class="ap-btn ap-ok-btn" @click="onTapBtn1">
              <span
                v-if="
                  wbData.status === 'logout' || wbData.status === 'wxmini-login'
                "
                >{{ t("login.wechat_one_login") }}</span
              >
              <span v-else-if="wbData.status === 'waiting'">{{
                t("login.bind_instantly")
              }}</span>
              <span
                v-else-if="
                  wbData.status === 'logged' && wbData.pageName === 'wechat-bind'
                "
                >{{ t("login.lets_chat") }}</span
              >
              <span v-else>{{ t("common.back") }}</span>
            </custom-btn>

            <!-- Secondary Button -->
            <custom-btn
              v-if="wbData.status === 'logout'"
              type="pure"
              class="ap-btn ap-secondary-btn"
              @click="onTapBtn2"
            >
              <span>{{ t("login.other_way") }}</span>
            </custom-btn>
          </div>

          <div
            v-if="wbData.status === 'logout' || wbData.status === 'wxmini-login'"
            class="ap-desktop-agree"
          >
            <AgreeBox
              v-model="wbData.agreeRule"
              be-center
              :shaking-num="wbData.agreeShakingNum"
            ></AgreeBox>
          </div>
        </div>
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
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 82%);
  opacity: 0.38;
}

.thus-mc-box::after {
  inset: auto auto 6% 50%;
  width: min(92vw, 760px);
  height: min(92vw, 760px);
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 68%);
  filter: blur(18px);
}

.ap-backdrop {
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

.ap-panel {
  position: relative;
  z-index: 1;
  width: min(100%, 720px);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(28px, 5vw, 52px);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0) 18%),
    linear-gradient(180deg, #111111 0%, #0b0b0b 100%);
  box-shadow:
    0 44px 120px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(255, 255, 255, 0.03);
}

.ap-panel::before,
.ap-panel::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ap-panel::before {
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.ap-panel::after {
  inset: -120px auto auto -120px;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0));
  filter: blur(8px);
}

.ap-kicker {
  margin-block-end: 18px;
  color: rgba(255, 255, 255, 0.64);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.ap-icon-box {
  width: clamp(88px, 18vw, 112px);
  height: clamp(88px, 18vw, 112px);
  position: relative;
  margin-block-end: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01)),
    linear-gradient(180deg, #181818 0%, #0d0d0d 100%);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);

  .ap-icon {
    width: 72%;
    height: 72%;
  }

  .ap-div-icon {
    width: 52%;
    height: 52%;
    background-image: url("/images/third-party/wechat.png");
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }
}

.ap-title {
  width: 100%;
  text-align: center;
  font-family: "SF Pro Display", "Segoe UI", sans-serif;
  font-size: clamp(30px, 6vw, 48px);
  line-height: 1.02;
  letter-spacing: -0.06em;
  color: #fafafa;
  font-weight: 700;
  margin-block-end: 14px;
}

.ap-desc {
  width: min(100%, 480px);
  margin-block-end: 28px;
  text-align: center;
  color: rgba(255, 255, 255, 0.68);
  font-size: clamp(14px, 3vw, 16px);
  line-height: 1.6;
}

.ap-btn-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.ap-mobile-agree {
  width: 100%;
  max-width: 460px;
  padding: 0 0 20px;
}

.ap-desktop-agree {
  display: none;
}

.ap-btn {
  width: 100%;
  max-width: 460px;
  min-height: 54px;
}

.ap-ok-btn {
  font-weight: 700;
}

.ap-secondary-btn {
  color: #f5f5f5;
}

:deep(.ap-ok-btn .liubai-btn),
:deep(.ap-ok-btn .liu-btn),
:deep(.ap-ok-btn button) {
  background: linear-gradient(180deg, #f5f5f5 0%, #d8d8d8 100%);
  color: #050505;
  border: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 18px 40px rgba(0, 0, 0, 0.28);
}

:deep(.ap-secondary-btn .liubai-btn),
:deep(.ap-secondary-btn .liu-btn),
:deep(.ap-secondary-btn button) {
  background: rgba(255, 255, 255, 0.03);
  color: #f5f5f5;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 18px 40px rgba(0, 0, 0, 0.22);
}

:deep(.ap-mobile-agree .agree-box),
:deep(.ap-desktop-agree .agree-box) {
  color: rgba(255, 255, 255, 0.72);
}

:deep(.ap-mobile-agree a),
:deep(.ap-desktop-agree a) {
  color: #fafafa;
}

/** for wide screen */
@media screen and (min-width: 590px) {
  .ap-mobile-agree {
    display: none;
  }

  .ap-btn-container {
    flex-direction: row-reverse;
    justify-content: center;
  }

  .ap-desktop-agree {
    display: block;
    width: 100%;
    max-width: 520px;
    padding: 24px 0 0;
    box-sizing: border-box;
  }

  .ap-btn {
    width: 220px;
    max-width: none;
  }
}

@media screen and (max-width: 489px) {
  .thus-mc-box {
    padding: 18px;
  }

  .ap-panel {
    border-radius: 26px;
    padding: 24px 18px;
  }

  .ap-icon-box {
    border-radius: 24px;
  }
}
</style>
