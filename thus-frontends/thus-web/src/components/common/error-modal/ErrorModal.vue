<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ErrorType } from '~/types/types-error';

interface Props {
  visible: boolean;
  errorType: ErrorType;
  errorCode: string;
  errorMessage: string;
  details?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'retry'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

// 根据错误类型获取图标名称
const iconName = computed(() => {
  switch (props.errorType) {
    case 'network':
      return 'wifi-off';
    case 'auth':
      return 'lock';
    case 'validation':
      return 'alert-circle';
    case 'business':
      return 'info';
    default:
      return 'alert-triangle';
  }
});

// 根据错误类型获取颜色类
const colorClass = computed(() => {
  switch (props.errorType) {
    case 'network':
      return 'error-modal-network';
    case 'auth':
      return 'error-modal-auth';
    case 'validation':
      return 'error-modal-validation';
    case 'business':
      return 'error-modal-business';
    default:
      return 'error-modal-unknown';
  }
});

// 获取错误标题
const errorTitle = computed(() => {
  switch (props.errorType) {
    case 'network':
      return t('error.network_title', 'Network Error');
    case 'auth':
      return t('error.auth_title', 'Authentication Error');
    case 'validation':
      return t('error.validation_title', 'Validation Error');
    case 'business':
      return t('error.business_title', 'Error');
    default:
      return t('error.unknown_title', 'Unknown Error');
  }
});

// 是否显示重试按钮（仅网络错误显示）
const showRetry = computed(() => props.errorType === 'network');

const onClose = () => {
  emit('close');
};

const onRetry = () => {
  emit('retry');
};
</script>

<template>
  <div 
    v-if="visible" 
    class="thus-no-user-select error-modal-container"
    :class="{ 'error-modal-container_show': visible }"
  >
    <div class="error-modal-bg" @click="onClose"></div>
    <div class="error-modal-box" :class="colorClass">
      
      <!-- 错误图标 -->
      <div class="error-modal-icon-wrapper">
        <svg-icon 
          v-if="iconName" 
          :name="iconName"
          class="error-modal-icon"
        />
      </div>

      <!-- 错误标题 -->
      <h1>{{ errorTitle }}</h1>

      <!-- 错误消息 -->
      <p class="error-modal-message">{{ errorMessage }}</p>

      <!-- 错误代码 -->
      <p class="error-modal-code">{{ t('error.code', 'Error Code') }}: {{ errorCode }}</p>

      <!-- 错误详情（可选） -->
      <p v-if="details" class="error-modal-details">{{ details }}</p>

      <!-- 按钮组 -->
      <div class="error-modal-btns">
        <div 
          v-if="showRetry"
          class="error-modal-btn error-modal-retry"
          @click="onRetry"
        >
          <span>{{ t('error.retry', 'Retry') }}</span>
        </div>
        <div 
          class="error-modal-btn error-modal-close"
          @click="onClose"
        >
          <span>{{ t('common.close', 'Close') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-modal-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: fixed;
  z-index: 5200;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  pointer-events: none;

  &.error-modal-container_show {
    opacity: 1;
    pointer-events: auto;
  }

  .error-modal-bg {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: var(--popup-bg);
    z-index: 5205;
    cursor: pointer;
  }

  .error-modal-box {
    width: 92%;
    max-width: 420px;
    box-sizing: border-box;
    padding: 32px 6% 20px;
    border-radius: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 5210;
    position: relative;
    overflow: hidden;
    animation: slideIn 250ms cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
      background-color: var(--cui-modal);
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      -webkit-backdrop-filter: blur(2px);
      backdrop-filter: blur(2px);
    }

    .error-modal-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-block-end: 20px;
      z-index: 5212;
      transition: background-color 200ms;
    }

    .error-modal-icon {
      width: 36px;
      height: 36px;
      color: white;
    }

    h1 {
      font-size: var(--title-font);
      font-weight: 700;
      color: var(--main-text);
      line-height: 1.5;
      margin-block-start: 0;
      margin-block-end: 16px;
      z-index: 5212;
      text-wrap: pretty;
    }

    .error-modal-message {
      font-size: var(--desc-font);
      color: var(--main-text);
      line-height: 1.6;
      margin-block-start: 0;
      margin-block-end: 12px;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      z-index: 5212;
      text-wrap: pretty;
    }

    .error-modal-code {
      font-size: var(--mini-font);
      color: var(--main-code);
      line-height: 1.4;
      margin-block-start: 0;
      margin-block-end: 8px;
      font-family: 'Monaco', 'Courier New', monospace;
      z-index: 5212;
    }

    .error-modal-details {
      font-size: var(--mini-font);
      color: var(--main-note);
      line-height: 1.4;
      margin-block-start: 0;
      margin-block-end: 24px;
      max-height: 100px;
      overflow-y: auto;
      padding: 8px;
      background-color: var(--other-btn-bg);
      border-radius: 6px;
      font-family: 'Monaco', 'Courier New', monospace;
      z-index: 5212;
      width: 100%;
      box-sizing: border-box;
    }

    .error-modal-btns {
      width: 100%;
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-block-start: 16px;
      z-index: 5212;

      .error-modal-btn {
        padding: 11px 24px;
        border-radius: 24px;
        font-size: var(--btn-font);
        transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        min-width: 100px;
        text-align: center;
        font-weight: 500;

        &:active {
          transform: scale(0.96);
        }
      }

      .error-modal-retry {
        color: var(--on-primary);
        background-color: var(--primary-color);

        @media(hover: hover) {
          &:hover {
            background-color: var(--primary-hover);
          }
        }

        &:active {
          background-color: var(--primary-active);
        }
      }

      .error-modal-close {
        color: var(--other-btn-text);
        background-color: var(--cui-modal-other-btn-bg);

        @media(hover: hover) {
          &:hover {
            background-color: var(--cui-modal-other-btn-hover);
          }
        }

        &:active {
          background-color: var(--cui-modal-other-btn-hover);
        }
      }
    }
  }

  // 错误类型颜色
  .error-modal-network {
    .error-modal-icon-wrapper {
      background-color: #ef4444;
    }
  }

  .error-modal-auth {
    .error-modal-icon-wrapper {
      background-color: #f59e0b;
    }
  }

  .error-modal-validation {
    .error-modal-icon-wrapper {
      background-color: #f59e0b;
    }
  }

  .error-modal-business {
    .error-modal-icon-wrapper {
      background-color: #3b82f6;
    }
  }

  .error-modal-unknown {
    .error-modal-icon-wrapper {
      background-color: #6b7280;
    }
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
