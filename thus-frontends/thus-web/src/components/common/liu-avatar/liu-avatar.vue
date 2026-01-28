<script lang="ts" setup>
import { computed, ref, type PropType } from 'vue';
import type { MemberShow } from "~/types/types-content"

const props = defineProps({
  memberShow: {
    type: Object as PropType<MemberShow>,
  },
  borderRadius: {
    type: String,
    default: "50%",
  },
  fontSize: {
    type: String,
  },
  // 是否可编辑（显示悬停效果）
  editable: {
    type: Boolean,
    default: false,
  },
  // 编辑提示文字
  editText: {
    type: String,
    default: "更换头像",
  },
})

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'edit'): void
}>()

// 悬停状态
const isHovering = ref(false)
// 长按状态（移动端）
const isLongPressing = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null

// 头像里的文字
const char = computed(() => {
  const name = props.memberShow?.name
  if(!name) return ""
  const f = name[0]
  if(!f) return ""
  const F = f.toUpperCase()
  if(F >= "A" && F <= "Z") return F
  const lastOne = name[name.length - 1]
  if(lastOne) return lastOne
  return ""
})

const charSize = computed(() => {
  if(props.fontSize) return props.fontSize

  const c = char.value
  if(c >= "A" && c <= "Z") return "25px"
  return "22px"
})

const hasAvatar = computed(() => {
  const ava = props.memberShow?.avatar
  if(ava?.src) return true
  return false
})

// 鼠标进入
const onMouseEnter = () => {
  if (props.editable) {
    isHovering.value = true
  }
}

// 鼠标离开
const onMouseLeave = () => {
  isHovering.value = false
}

// 点击事件
const onAvatarClick = () => {
  emit('click')
  if (props.editable) {
    emit('edit')
  }
}

// 触摸开始（移动端长按）
const onTouchStart = () => {
  if (!props.editable) return
  
  longPressTimer = setTimeout(() => {
    isLongPressing.value = true
    isHovering.value = true
  }, 500) // 500ms 长按触发
}

// 触摸结束
const onTouchEnd = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  
  if (isLongPressing.value) {
    // 长按后触发编辑
    emit('edit')
    isLongPressing.value = false
    isHovering.value = false
  }
}

// 触摸取消
const onTouchCancel = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  isLongPressing.value = false
  isHovering.value = false
}
</script>

<template>
  <div 
    class="thus-no-user-select la-container"
    :class="{ 
      'la-editable': editable, 
      'la-hovering': isHovering 
    }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @click="onAvatarClick"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchCancel"
  >
    <!-- 头像背景 -->
    <div class="la-bg" v-if="!hasAvatar"></div>

    <!-- 头像图片 -->
    <liu-img 
      v-if="hasAvatar" 
      :src="(memberShow?.avatar?.src as string)"
      :border-radius="borderRadius"
      class="la-img"
    ></liu-img>

    <!-- 头像文字 -->
    <span class="la-span" v-else>{{ char }}</span>

    <!-- 悬停遮罩层 -->
    <transition name="fade">
      <div v-if="editable && isHovering" class="la-overlay">
        <svg class="la-edit-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 15.2c-1.8 0-3.2-1.4-3.2-3.2s1.4-3.2 3.2-3.2 3.2 1.4 3.2 3.2-1.4 3.2-3.2 3.2zm0-4.8c-.9 0-1.6.7-1.6 1.6s.7 1.6 1.6 1.6 1.6-.7 1.6-1.6-.7-1.6-1.6-1.6z"/>
          <path fill="currentColor" d="M20 4h-3.2l-1.4-1.4c-.4-.4-.9-.6-1.4-.6h-4c-.5 0-1 .2-1.4.6L7.2 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4l2-2h4l2 2h4v12z"/>
        </svg>
        <span class="la-edit-text">{{ editText }}</span>
      </div>
    </transition>

    <!-- 编辑图标徽章（非悬停时显示） -->
    <div v-if="editable && !isHovering" class="la-edit-badge">
      <svg class="la-badge-icon" viewBox="0 0 24 24" width="12" height="12">
        <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.la-container {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: v-bind("borderRadius");
  overflow: hidden;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  .la-bg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background-color: var(--avatar-bg);
    opacity: 1;
  }

  .la-img {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .la-span {
    font-size: v-bind("charSize");
    color: var(--avatar-color);
    position: relative;
    font-weight: 500;
  }

  // 可编辑状态
  &.la-editable {
    cursor: pointer;
  }

  // 悬停状态
  &.la-hovering {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  // 悬停遮罩层
  .la-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 10;
    border-radius: v-bind("borderRadius");
  }

  .la-edit-icon {
    margin-bottom: 2px;
  }

  .la-edit-text {
    font-size: 10px;
    white-space: nowrap;
    text-align: center;
    line-height: 1.2;
  }

  // 编辑徽章
  .la-edit-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 18px;
    height: 18px;
    background: var(--primary-color, #667eea);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    z-index: 5;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .la-badge-icon {
    color: white;
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
