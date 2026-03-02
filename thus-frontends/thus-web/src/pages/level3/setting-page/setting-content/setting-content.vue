<script setup lang="ts">
import AppLink from '~/components/common/app-link/app-link.vue';
import ThusAvatar from '~/components/common/liu-avatar/liu-avatar.vue';
import { useI18n } from "vue-i18n";
import { useSettingContent } from "./tools/useSettingContent";
import { useWindowSize } from '~/hooks/useVueUse';
import cfg from '~/config';
import { computed, ref } from 'vue';
import { chooseAvatar } from '~/hooks/shared/chooseAvatar';

const { t } = useI18n()
const { width: windowWidth } = useWindowSize()

// Local storage settings
const useCloudStorage = ref(false)

// 判断屏幕尺寸，决定当前机型的图标
// 若小于等于 650px，显示成手机，否则显示成浏览器窗口
const deviceIcon = computed(() => {
  const w = windowWidth.value
  if(w <= cfg.breakpoint_max_size.mobile) return "devices-smartphone"
  return "devices-app-window"
})


const {
  myProfile,
  data,
  onTapTheme,
  onTapLanguage,
  onTapFontSize,
  onTapLogout,
  onTapDebug,
  onToggleMobileDebug,
  onTapClearCache,
  onTapNickname,
  onTapVersionUpdate,
  onTapA2HS,
  onTapContact,
  onTapWxGzh,
  onTapFooter,
  onToggleAi,
  onAiTagCountChange,
  onAiTagStyleChange,
  onAiFavoriteTagsChange,
  onAiAutoTagModeChange,
  onBatchRetag,
  version,
  appName,
  hasNewVersion,
} = useSettingContent()
const { onTapAvatar } = chooseAvatar()

const favoriteTagsInput = ref(data.aiFavoriteTags?.join('、') ?? '')
const onFavoriteTagsBlur = () => {
  const tags = favoriteTagsInput.value
    .split(/[,，、\n]/)
    .map(t => t.trim())
    .filter(t => t.length > 0)
  onAiFavoriteTagsChange(tags)
}

// 主题字段 i18n 的 key
const themeTextKey = computed(() => {
  const theme = data.theme
  if(theme === "auto") return "setting.day_and_night"
  return `setting.${theme}`
})

const fsTextKey = computed(() => {
  const fontSize = data.fontSize
  if(fontSize === "L") return "setting.font_large"
  return "setting.font_medium"
})

const iconColor = "var(--main-normal)"

</script>
<template>

  <div class="thus-mc-container">
    <div class="thus-mc-box">
      <div class="liu-mc-spacing"></div>
      
      <!-- profile + membership + accounts -->
      <div class="sc-box" v-if="data.hasBackend">

        <!-- avatar + nickname -->
        <div class="sc-avatar-nickname" v-if="myProfile">
          <div class="thus-hover sc-avatar-box" @click.stop="onTapAvatar">
            <ThusAvatar 
              :member-show="myProfile" 
              class="sc-avatar"
            ></ThusAvatar>
          </div>
          <div class="thus-no-user-select thus-hover sc-nickname-box"
            @click.stop="onTapNickname"
          >
            <div class="sc-nickname">
              <span v-if="myProfile.name">{{ myProfile.name }}</span>
              <span v-else>{{ t('common.unknown') }}</span>
            </div>
            <div class="scb-footer-icon sc-nickname-arrow">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- membership -->
        <AppLink to="/subscription">
          <div class="thus-no-user-select thus-hover sc-bar">
            <div class="scb-hd">
              <span>{{ t('setting.membership') }}</span>
            </div>
            <div class="scb-footer">
              <div class="scb-footer-icon">
                <svg-icon class="scbf-back"
                  name="arrow-right2"
                  :color="iconColor"
                ></svg-icon>
              </div>
            </div>
          </div>
        </AppLink>

        <!-- accounts -->
        <AppLink to="/accounts">
          <div class="thus-no-user-select thus-hover sc-bar">
            <div class="scb-hd">
              <span>{{ t('setting.accounts') }}</span>
            </div>
            <div class="scb-footer">
              <div class="scb-footer-icon">
                <svg-icon class="scbf-back"
                  name="arrow-right2"
                  :color="iconColor"
                ></svg-icon>
              </div>
            </div>
          </div>
        </AppLink>

      </div>

      <!-- preference -->
      <div class="thus-no-user-select sc-title">
        <span>{{ t('setting.preference') }}</span>
      </div>
      <div class="sc-box">
        <!-- theme -->
        <div class="thus-no-user-select thus-hover sc-bar" 
          @click.stop="onTapTheme"
        >
          <div class="scb-hd">
            <span>{{ t('setting.theme') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-text">
              <span>{{ t(themeTextKey) }}</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon v-if="data.theme === 'light'"
                class="scbf-svg-icon" 
                name="theme-light_mode"
                :color="iconColor"
              ></svg-icon>
              <svg-icon v-else-if="data.theme === 'dark'"
                class="scbf-svg-icon" 
                name="theme-dark_mode"
                :color="iconColor"
              ></svg-icon>
              <svg-icon v-else-if="data.theme === 'auto'"
                class="scbf-svg-icon" 
                name="devices-auto-toggle"
                :color="iconColor"
              ></svg-icon>
              <!-- 最后情况: 跟随系统 -->
              <svg-icon v-else
                class="scbf-svg-icon" 
                :name="deviceIcon"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- language -->
        <div class="thus-no-user-select thus-hover sc-bar" 
          @click.stop="onTapLanguage"
        >
          <div class="scb-hd">
            <span>{{ t('setting.language') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-text">
              <span v-if="data.language === 'system'">{{ t('setting.system') }}</span>
              <span v-else>{{ data.language_txt }}</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon class="scbf-svg-icon"
                name="translate"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- font size -->
        <div class="thus-no-user-select thus-hover sc-bar" 
          @click.stop="onTapFontSize"
        >
          <div class="scb-hd">
            <span>{{ t('setting.font_size') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-text">
              <span>{{ t(fsTextKey) }}</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon v-if="data.fontSize === 'M'"
                class="scbf-svg-icon" 
                name="cup_medium"
                :color="iconColor"
              ></svg-icon>
              <svg-icon v-else
                class="scbf-svg-icon" 
                name="cup_large"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>


      </div>

      <!-- AI 功能 -->
      <div v-if="data.hasBackend" class="thus-no-user-select sc-title">
        <span>AI 功能</span>
      </div>
      <div v-if="data.hasBackend" class="sc-box sc-ai-box">
        
        <!-- AI 智能辅助开关 -->
        <div class="thus-no-user-select thus-hover sc-bar"
          @click.stop="onToggleAi(!data.aiEnabled)"
        >
          <div class="scb-hd">
            <div class="scb-hd-title">AI 智能辅助</div>
            <div class="scb-hd-desc">自动为笔记生成标签和摘要</div>
          </div>
          <div class="scb-footer">
            <liu-switch :checked="data.aiEnabled" 
              @change="onToggleAi($event.checked)"
            ></liu-switch>
          </div>
        </div>

        <div v-if="data.aiEnabled" class="sc-ai-config">
          
          <!-- 配置项网格 -->
          <div class="sc-ai-grid">
            
            <!-- 标签数量 -->
            <div class="sc-ai-item">
              <div class="sc-ai-item-label">
                <span>标签数量</span>
              </div>
              <select class="sc-ai-select" 
                :value="data.aiTagCount"
                @change="onAiTagCountChange(Number(($event.target as HTMLSelectElement).value))"
              >
                <option v-for="n in 8" :key="n + 2" :value="n + 2">{{ n + 2 }} 个</option>
              </select>
            </div>

            <!-- 标签风格 -->
            <div class="sc-ai-item">
              <div class="sc-ai-item-label">
                <span>标签风格</span>
              </div>
              <div class="sc-ai-btns">
                <button class="sc-ai-btn"
                  :class="{ 'sc-ai-btn_active': data.aiTagStyle === 'concise' }"
                  @click.stop="onAiTagStyleChange('concise')"
                >精简</button>
                <button class="sc-ai-btn"
                  :class="{ 'sc-ai-btn_active': data.aiTagStyle === 'detailed' }"
                  @click.stop="onAiTagStyleChange('detailed')"
                >详细</button>
              </div>
            </div>

            <!-- 打标模式 -->
            <div class="sc-ai-item">
              <div class="sc-ai-item-label">
                <span>打标模式</span>
              </div>
              <select class="sc-ai-select"
                :value="data.aiAutoTagMode"
                @change="onAiAutoTagModeChange(($event.target as HTMLSelectElement).value as 'manual' | 'silent')"
              >
                <option value="manual">手动一键打标</option>
                <option value="silent">保存时静默打标</option>
              </select>
            </div>

          </div>

          <!-- 偏好标签（全宽）-->
          <div class="sc-ai-tags">
            <div class="sc-ai-tags-label">
              <span>偏好标签</span>
            </div>
            <input class="sc-ai-tags-input"
              v-model="favoriteTagsInput"
              placeholder="用顿号分隔，如：技术、生活、读书"
              @blur="onFavoriteTagsBlur"
            />
          </div>

          <!-- 批量标签操作 -->
          <div class="sc-ai-retag-group">
            <div class="thus-no-user-select thus-hover sc-ai-action"
              @click.stop="onBatchRetag(false)"
            >
              <div class="sc-ai-action-text">
                <span>仅未标记笔记打标签</span>
              </div>
              <div class="sc-ai-action-icon">
                <svg-icon name="arrow-right2" :color="iconColor"></svg-icon>
              </div>
            </div>
            <div class="thus-no-user-select thus-hover sc-ai-action"
              @click.stop="onBatchRetag(true)"
            >
              <div class="sc-ai-action-text">
                <span>所有笔记重新打标签</span>
              </div>
              <div class="sc-ai-action-icon">
                <svg-icon name="arrow-right2" :color="iconColor"></svg-icon>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Storage Management (Hidden for normal users) -->
      <div v-if="data.openDebug" class="thus-no-user-select sc-title">
        <span>Storage</span>
      </div>
      <div v-if="data.openDebug" class="sc-box">
        <!-- Storage Location -->
        <div class="thus-no-user-select thus-hover sc-bar">
          <div class="scb-hd">
            <span>Location</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-text">
              <span>Local Server (uploads/)</span>
            </div>
            <div class="scb-footer-icon">
              <svg-icon class="scbf-svg-icon"
                name="cloud"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- Cloud Sync Toggle -->
        <div class="thus-no-user-select thus-hover sc-bar"
          @click.stop="useCloudStorage = !useCloudStorage"
        >
          <div class="scb-hd">
            <span>Cloud Sync</span>
          </div>
          <div class="scb-footer">
            <liu-switch :checked="useCloudStorage" 
              @change="useCloudStorage = $event.checked"
            ></liu-switch>
          </div>
        </div>
      </div>

      <!-- Community -->
      <div class="thus-no-user-select sc-title">
        <span>{{ t('setting.community') }}</span>
      </div>
      <div class="sc-box">
        <!-- RED -->
        <a class="thus-no-user-select thus-hover sc-bar" 
          :href="data.redLink" target="_blank"
        >
          <div class="scb-hd">
            <span>{{ t('setting.xhs') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-svg-icon"
                name="logos-xhs"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </a>

        <!-- wechat gzh -->
        <div class="thus-no-user-select thus-hover sc-bar"
          @click.stop="onTapWxGzh"
        >
          <div class="scb-hd">
            <span>{{ t('setting.wx_gzh') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-svg-icon"
                name="logos-wechat-half-fill"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- help center -->
        <a v-if="data.documentationLink"
          class="thus-no-user-select thus-hover sc-bar" 
          :href="data.documentationLink" target="_blank"
        >
          <div class="scb-hd">
            <span>{{ t('setting.documentation') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-svg-icon"
                name="document_center"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </a>

        <!-- GitHub -->
        <a class="thus-no-user-select thus-hover sc-bar" 
          :href="data.openSourceLink" target="_blank"
        >
          <div class="scb-hd">
            <span>GitHub</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-svg-icon"
                name="logos-github"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </a>

      </div>

      <!-- 其他 -->
      <div class="sc-box">

        <!-- 开发调试 -->
        <div v-if="data.debugBtn" 
          class="thus-no-user-select thus-hover sc-bar" 
          @click.stop="onTapDebug"
        >
          <div class="scb-hd">
            <span>{{ t('setting.dev_debug') }}</span>
          </div>
          <div class="scb-footer">

            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                :class="{ 'scbfb_rotated': data.openDebug }"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- 调试们 -->
        <div v-if="data.debugBtn" class="sc-pad" :class="{ 'sc-pad_opened': data.openDebug }">
          <div class="sc-pad-box" :class="{ 'sc-pad-box_opened': data.openDebug }">

            <!-- 移动端调试 -->
            <div class="thus-no-user-select thus-hover sc-pad-item" 
              @click.stop="onToggleMobileDebug(!data.mobileDebug)"
            >
              <div class="sc-pad-title">
                <span>{{ t('setting.mobile_debug') }}</span>
              </div>
              <div class="sc-pad-footer">
                <liu-switch :checked="data.mobileDebug" 
                  @change="onToggleMobileDebug($event.checked)"
                ></liu-switch>
              </div>
            </div>

            <!-- 清除缓存 -->
            <div class="thus-no-user-select thus-hover sc-pad-item" 
              @click.stop="onTapClearCache"
            >
              <div class="sc-pad-title">
                <span>{{ t('setting.clear_cache') }}</span>
              </div>
              <div class="sc-pad-icon">
                <svg-icon class="scti-back"
                  name="arrow-right2"
                ></svg-icon>
              </div>
            </div>

          </div>
        </div>

        <!-- Add to Home Screen -->
        <div class="thus-no-user-select thus-hover sc-bar"
          v-if="data.showA2HS"
          @click.stop="onTapA2HS"
        >
          <div class="scb-hd">
            <span>{{ t('a2hs.title') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

        <!-- Version Update -->
        <div class="thus-no-user-select thus-hover sc-bar"
          v-if="hasNewVersion || !data.showA2HS"
          @click.stop="onTapVersionUpdate"
        >
          <div class="scb-hd">
            <span>{{ t('setting.detect_version') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>
        
        <!-- Contact -->
        <div v-if="data.contactLink" class="thus-no-user-select thus-hover sc-bar"
          @click.stop="onTapContact"
        >
          <div class="scb-hd">
            <span>{{ t('setting.contact_dev') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>
        <a v-else-if="data.emailLink" class="thus-no-user-select thus-hover sc-bar" 
          :href="data.emailLink"
        >
          <div class="scb-hd">
            <span>{{ t('setting.contact_dev') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </a>

        <!-- membership -->
        <AppLink to="/settings/more">
          <div class="thus-no-user-select thus-hover sc-bar">
            <div class="scb-hd">
              <span>{{ t('common.more') }}</span>
            </div>
            <div class="scb-footer">
              <div class="scb-footer-icon">
                <svg-icon class="scbf-back"
                  name="arrow-right2"
                  :color="iconColor"
                ></svg-icon>
              </div>
            </div>
          </div>
        </AppLink>

        <!-- Logout -->
        <div class="thus-no-user-select thus-hover sc-bar" 
          @click.stop="onTapLogout"
        >
          <div class="scb-hd">
            <span>{{ t('setting.logout') }}</span>
          </div>
          <div class="scb-footer">
            <div class="scb-footer-icon">
              <svg-icon class="scbf-back"
                name="arrow-right2"
                :color="iconColor"
              ></svg-icon>
            </div>
          </div>
        </div>

      </div>

    </div>

    <div class="thus-no-user-select sc-footer" @click.stop="onTapFooter">
      <span translate="no">Powered by {{appName}} @ {{ version }}</span>
    </div>

  </div>

</template>
<style scoped lang="scss">

.thus-mc-box {
  min-height: calc(100vh - 60px);
  min-height: calc(100dvh - 60px);
}

.sc-footer {
  width: 100%;
  padding-block-start: 10px;
  height: 50px;
  display: flex;
  justify-content: center;
  font-size: var(--mini-font);
  font-weight: 200;
  color: var(--main-note);
}


.sc-title {
  font-size: var(--inline-code-font);
  font-weight: 700;
  color: var(--main-normal);
  margin-inline-start: 10px;
  margin-block-end: 8px;
}

.sc-box {
  background-color: var(--card-bg);
  border-radius: 24px;
  position: relative;
  padding: 16px 10px 12px 10px;
  width: 100%;
  box-sizing: border-box;
  box-shadow: var(--card-shadow-2);
  margin-block-end: 32px;
  container-type: inline-size;
  container-name: sc-box;
}

.sc-avatar-nickname {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-block-end: 6px;
}

.sc-avatar-box {
  flex: 1;
  margin-inline-end: 6px;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 10px 10px;
}

.sc-avatar {
  width: 48px;
  height: 48px;
}

.sc-nickname-box {
  flex: 3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 10px 10px;
}

.sc-nickname {
  font-size: var(--btn-font);
  color: var(--main-note);
  letter-spacing: 1px;
}


.sc-bar {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
  padding: 10px 10px;

  &::before {
    border-radius: 8px;
  }
}

.scb-hd {
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
}

.scb-footer {
  flex: 1 0 100px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.scb-footer-text {
  font-size: var(--btn-font);
  color: var(--main-note);
  letter-spacing: 1px;
}

.scb-footer-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.scbf-svg-icon {
  width: 22px;
  height: 22px;
}

.scbf-back {
  width: 18px;
  height: 18px;
  transition: .3s;
}

.scbfb_rotated {
  transform: rotate(90deg);
}

.sc-pad {
  width: 100%;
  position: relative;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: .3s;
}

.sc-pad_opened {
  max-height: 200px;
  opacity: 1;
}

.sc-pad-box {
  position: relative;
  width: 100%;
  padding-block-end: 6px;
  transform: translateY(-50%);
  transition: .3s;
}

.sc-pad-box_opened {
  transform: translateY(0);
}

.sc-pad-item {
  width: 100%;
  border-radius: 8px;
  position: relative;
  display: flex;
  box-sizing: border-box;
  margin-block-end: 4px;
  overflow: hidden;
  padding: 7px 10px;
}

.sc-pad-title {
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 700;
  flex: 2;
}

.sc-pad-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .scti-back {
    width: 16px;
    height: 16px;
  }
}

.sc-pad-footer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

@media screen and (max-width: 550px) {
  .sc-avatar-nickname {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }

  .sc-avatar-box {
    flex: initial;
    margin-inline-end: 0;
    margin-block-end: 6px;
    padding: 5px;
  }

  .sc-nickname-box {
    flex: initial;
    padding: 4px 6px 4px 10px;
    justify-content: flex-start;
    margin-block-end: 0px;
  }

  .sc-nickname {
    font-weight: 700;
    color: var(--main-text);
  }

  .sc-nickname-arrow {
    width: 20px;
    height: 20px;

    .scbf-back {
      width: 16px;
      height: 16px;
    }
  }
}

@container sc-box (max-width: 550px) {
  .sc-avatar-nickname {
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
  }

  .sc-avatar-box {
    flex: initial;
    margin-inline-end: 0;
    margin-block-end: 6px;
    padding: 5px;
  }

  .sc-nickname-box {
    flex: initial;
    padding: 4px 6px 4px 10px;
    justify-content: flex-start;
    margin-block-end: 0px;
  }

  .sc-nickname {
    font-weight: 700;
    color: var(--main-text);
  }

  .sc-nickname-arrow {
    width: 20px;
    height: 20px;

    .scbf-back {
      width: 16px;
      height: 16px;
    }
  }
}

.sc-bar-config {
  padding: 8px 10px;
}

.sc-bar-tags {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.sc-select {
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--card-bg);
  border: 1px solid var(--main-note);
  border-radius: 8px;
  padding: 6px 28px 6px 10px;
  font-size: var(--btn-font);
  color: var(--main-normal);
  cursor: pointer;
  outline: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23999' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  transition: border-color .2s;

  &:focus {
    border-color: var(--main-normal);
  }
}

.sc-footer-btns {
  gap: 6px;
}

.sc-style-btn {
  padding: 5px 14px;
  border: 1px solid var(--main-note);
  border-radius: 8px;
  background: transparent;
  font-size: var(--btn-font);
  color: var(--main-note);
  cursor: pointer;
  transition: all .2s;

  &:hover {
    border-color: var(--main-normal);
    color: var(--main-normal);
  }
}

.sc-style-btn_active {
  background: var(--main-normal);
  border-color: var(--main-normal);
  color: var(--card-bg);
  font-weight: 700;

  &:hover {
    background: var(--main-normal);
    color: var(--card-bg);
  }
}

.sc-footer-input {
  width: 100%;
}

.sc-tag-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--main-note);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: var(--btn-font);
  color: var(--main-normal);
  background: transparent;
  outline: none;
  transition: border-color .2s;

  &::placeholder {
    color: var(--main-note);
    opacity: 0.7;
  }

  &:focus {
    border-color: var(--main-normal);
  }
}

/* AI 功能区域样式 */
.sc-ai-box {
  overflow: visible;
}

.scb-hd-title {
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 700;
  margin-block-end: 4px;
}

.scb-hd-desc {
  font-size: var(--mini-font);
  color: var(--main-note);
  line-height: 1.4;
}

.sc-ai-config {
  margin-block-start: 16px;
  padding-block-start: 16px;
  padding-inline-start: 10px;
  border-top: 1px solid var(--line-default);
}

.sc-ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-block-end: 16px;
}

.sc-ai-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sc-ai-item-label {
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 600;
}


.sc-ai-select {
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--card-bg);
  border: 1.5px solid var(--line-default);
  border-radius: 10px;
  padding: 10px 32px 10px 12px;
  font-size: var(--btn-font);
  color: var(--main-normal);
  cursor: pointer;
  outline: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23999' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  transition: all .2s;

  &:hover {
    border-color: var(--main-note);
  }

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(42, 104, 133, 0.1);
  }
}

.sc-ai-btns {
  display: flex;
  gap: 8px;
}

.sc-ai-btn {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid var(--line-default);
  border-radius: 10px;
  background: transparent;
  font-size: var(--btn-font);
  color: var(--main-note);
  cursor: pointer;
  transition: all .2s;
  font-weight: 500;

  &:hover {
    border-color: var(--main-normal);
    color: var(--main-normal);
    background: rgba(42, 104, 133, 0.05);
  }
}

.sc-ai-btn_active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #ffffff;
  font-weight: 600;

  &:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #ffffff;
    opacity: 0.9;
  }
}

.sc-ai-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-block-end: 16px;
}

.sc-ai-tags-label {
  font-size: var(--btn-font);
  color: var(--main-normal);
  font-weight: 600;
}

.sc-ai-tags-input {
  width: 100%;
  box-sizing: border-box;
  border: 1.5px solid var(--line-default);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: var(--btn-font);
  color: var(--main-normal);
  background: transparent;
  outline: none;
  transition: all .2s;
  line-height: 1.5;

  &::placeholder {
    color: var(--main-note);
    opacity: 0.6;
  }

  &:hover {
    border-color: var(--main-note);
  }

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(42, 104, 133, 0.1);
  }
}

.sc-ai-retag-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-inline-start: 10px;
}

.sc-ai-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 12px 0;
  border-radius: 10px;
  border: 1.5px solid var(--line-default);
  cursor: pointer;
  transition: all .2s;

  &:hover {
    border-color: var(--primary-color);
    background: rgba(42, 104, 133, 0.05);
  }
}

.sc-ai-action-text {
  font-size: var(--desc-font);
  color: var(--main-normal);
  font-weight: 600;
}

.sc-ai-action-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform .2s;

  svg {
    width: 18px;
    height: 18px;
  }
}

.sc-ai-action:hover .sc-ai-action-icon {
  transform: translateX(3px);
}
@media screen and (max-width: 550px) {
  .sc-ai-grid {
    grid-template-columns: 1fr;
  }
}

</style>
<style>

.thus-switching-theme::view-transition-old(root),
.thus-switching-theme::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

.thus-switching-theme::view-transition-old(root) {
  z-index: 9999;
}

.thus-switching-theme::view-transition-new(root) {
  z-index: 1;
}

.thus-switching-theme.thus-dark::view-transition-old(root) {
  z-index: 1;
}

.thus-switching-theme.thus-dark::view-transition-new(root) {
  z-index: 9999;
}

</style>