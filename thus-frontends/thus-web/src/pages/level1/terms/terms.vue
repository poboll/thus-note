<template>
  <div class="policy-page">
    <!-- 页面头部 -->
    <header class="policy-header">
      <div class="header-content">
        <h1 class="policy-title">服务协议</h1>
        <p class="policy-meta">
          <span class="version">版本 {{ policyData.version }}</span>
          <span class="divider">|</span>
          <span class="update-date">最后更新：{{ formatDate(policyData.lastUpdated) }}</span>
        </p>
      </div>
    </header>

    <div class="policy-container">
      <!-- 目录导航 -->
      <nav class="policy-toc" v-if="sections.length > 0">
        <h3 class="toc-title">目录</h3>
        <ul class="toc-list">
          <li v-for="section in sections" :key="section.id" class="toc-item">
            <a 
              :href="`#${section.id}`" 
              @click.prevent="scrollToSection(section.id)"
              :class="{ active: activeSection === section.id }"
            >
              {{ section.title }}
            </a>
          </li>
        </ul>
      </nav>

      <!-- 政策内容 -->
      <main class="policy-content">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="fetchPolicy" class="retry-btn">重试</button>
        </div>
        <div v-else class="content-body" v-html="policyData.content"></div>
      </main>
    </div>

    <!-- 返回顶部按钮 -->
    <button 
      v-show="showBackToTop" 
      class="back-to-top"
      @click="scrollToTop"
      aria-label="返回顶部"
    >
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

interface PolicyData {
  content: string;
  version: string;
  lastUpdated: string;
}

interface Section {
  id: string;
  title: string;
}

const policyData = ref<PolicyData>({
  content: '',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
});

const loading = ref(true);
const error = ref('');
const showBackToTop = ref(false);
const activeSection = ref('');

// 解析内容中的章节
const sections = computed<Section[]>(() => {
  const content = policyData.value.content;
  const regex = /<h2[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h2>/gi;
  const result: Section[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    result.push({
      id: match[1],
      title: match[2].trim(),
    });
  }
  
  return result;
});

// 格式化日期
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// 获取政策内容
const fetchPolicy = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/policies/terms`);
    const result = await response.json();
    
    if (result.code === '0000' && result.data) {
      policyData.value = {
        content: result.data.content,
        version: result.data.version,
        lastUpdated: result.data.lastUpdated,
      };
    } else {
      throw new Error(result.errMsg || '获取服务协议失败');
    }
  } catch (err: any) {
    error.value = err.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

// 滚动到指定章节
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeSection.value = sectionId;
  }
};

// 返回顶部
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 监听滚动
const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300;
  
  // 更新当前活动章节
  const scrollPosition = window.scrollY + 100;
  for (const section of sections.value) {
    const element = document.getElementById(section.id);
    if (element) {
      const { offsetTop, offsetHeight } = element;
      if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
        activeSection.value = section.id;
        break;
      }
    }
  }
};

onMounted(() => {
  fetchPolicy();
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: var(--thus-bg, #f5f7fa);
}

.policy-header {
  background: var(--card-bg, #fff);
  color: var(--main-normal, #333);
  padding: 60px 20px 40px;
  text-align: center;
  box-shadow: var(--card-shadow-2, 0 4px 20px rgba(0,0,0,0.06));
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.policy-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 16px;
  color: var(--main-normal, #333);
}

.policy-meta {
  font-size: 0.95rem;
  color: var(--main-note, #999);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.divider {
  opacity: 0.5;
}

.policy-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 40px;
}

@media (max-width: 768px) {
  .policy-container {
    grid-template-columns: 1fr;
  }
  
  .policy-toc {
    position: static !important;
    margin-bottom: 20px;
  }
}

.policy-toc {
  position: sticky;
  top: 20px;
  height: fit-content;
  background: var(--card-bg, #fff);
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--card-shadow-2, 0 4px 20px rgba(0,0,0,0.06));
}

.toc-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--main-normal, #333);
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--main-normal, #333);
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  margin-bottom: 8px;
}

.toc-item a {
  display: block;
  padding: 8px 12px;
  color: var(--main-note, #999);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.toc-item a:hover {
  background: var(--hover-bg, rgba(0,0,0,0.04));
  color: var(--main-normal, #333);
}

.toc-item a.active {
  background: var(--main-normal, #333);
  color: var(--card-bg, #fff);
}

.policy-content {
  background: var(--card-bg, #fff);
  border-radius: 24px;
  padding: 40px;
  box-shadow: var(--card-shadow-2, 0 4px 20px rgba(0,0,0,0.06));
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--main-note, #999);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--hover-bg, rgba(0,0,0,0.06));
  border-top-color: var(--main-normal, #333);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 16px;
  padding: 10px 24px;
  background: var(--main-normal, #333);
  color: var(--card-bg, #fff);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: opacity 0.2s;
}

.retry-btn:hover {
  opacity: 0.85;
}

.content-body {
  line-height: 1.8;
  color: var(--main-normal, #333);
}

.content-body :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--main-normal, #333);
  margin: 32px 0 16px;
  padding-top: 16px;
  border-top: 1px solid var(--hover-bg, rgba(0,0,0,0.08));
}

.content-body :deep(h2:first-child) {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.content-body :deep(p) {
  margin: 12px 0;
  color: var(--main-note, #666);
}

.content-body :deep(ul) {
  margin: 12px 0;
  padding-left: 24px;
}

.content-body :deep(li) {
  margin: 8px 0;
  color: var(--main-note, #666);
}

.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: var(--main-normal, #333);
  color: var(--card-bg, #fff);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--card-shadow-2, 0 4px 12px rgba(0,0,0,0.15));
  transition: all 0.3s ease;
  z-index: 100;
}

.back-to-top:hover {
  opacity: 0.85;
  transform: translateY(-3px);
}

@media (max-width: 768px) {
  .policy-title {
    font-size: 1.8rem;
  }
  
  .policy-content {
    padding: 24px;
  }
  
  .back-to-top {
    bottom: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
  }
}
</style>
