<template>
  <div class="terms-root">

    <!-- 顶部导航栏 -->
    <header class="terms-nav">
      <div class="terms-nav-inner">
        <RouterLink to="/" class="nav-brand thus-no-user-select">
          <img src="/favicon.svg" class="nav-logo" alt="如是" />
          <span class="nav-title">如是</span>
        </RouterLink>
        <RouterLink to="/" class="nav-back thus-no-user-select">
          <svg viewBox="0 -960 960 960" class="nav-back-icon">
            <path fill="currentColor" d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z"/>
          </svg>
          <span>返回</span>
        </RouterLink>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="terms-main">

      <!-- 加载中 -->
      <div v-if="loading" class="terms-card state-card">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 错误 -->
      <div v-else-if="error" class="terms-card state-card">
        <p class="error-text">{{ error }}</p>
        <button class="retry-btn" @click="fetchPolicy">重试</button>
      </div>

      <!-- 内容 -->
      <template v-else>
        <div class="terms-card doc-header">
          <h1 class="doc-title">服务协议</h1>
          <p class="doc-meta">
            <span>版本 {{ policyData.version }}</span>
            <span class="meta-dot">·</span>
            <span>最后更新：{{ formatDate(policyData.lastUpdated) }}</span>
          </p>
        </div>

        <div
          v-for="section in parsedSections"
          :key="section.id"
          :id="section.id"
          class="terms-card section-card"
        >
          <h2 class="section-title">{{ section.title }}</h2>
          <div class="section-body" v-html="section.html"></div>
        </div>
      </template>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';

interface PolicyData {
  content: string;
  version: string;
  lastUpdated: string;
}

interface ParsedSection {
  id: string;
  title: string;
  html: string;
}

const policyData = ref<PolicyData>({
  content: '',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
});
const loading = ref(true);
const error = ref('');

const parsedSections = computed<ParsedSection[]>(() => {
  const content = policyData.value.content;
  if (!content) return [];
  const parts = content.split(/(?=<h2)/i);
  return parts.reduce<ParsedSection[]>((acc, part) => {
    const m = part.match(/<h2[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h2>/i);
    if (!m) return acc;
    acc.push({
      id: m[1],
      title: m[2].trim(),
      html: part.replace(/<h2[^>]*>.*?<\/h2>/i, '').trim(),
    });
    return acc;
  }, []);
});

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const fetchPolicy = async () => {
  loading.value = true;
  error.value = '';
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/policies/terms`);
    const json = await res.json();
    if (json.code === '0000' && json.data) {
      policyData.value = {
        content: json.data.content,
        version: json.data.version,
        lastUpdated: json.data.lastUpdated,
      };
    } else {
      throw new Error(json.errMsg || '获取服务协议失败');
    }
  } catch (e: any) {
    error.value = e.message || '加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

onMounted(fetchPolicy);
</script>

<style scoped>
/* ── 根容器 ── */
.terms-root {
  min-height: 100vh;
  background-color: var(--bg-color, #eaecef);
}

/* ══════════════════════════════════════
   顶部导航栏
══════════════════════════════════════ */
.terms-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--sidebar-bg, #fff);
  border-bottom: 1.5px solid var(--line-default, #e2e3e4);
  height: 56px;
  display: flex;
  align-items: center;
}

.terms-nav-inner {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  text-decoration: none;
  color: var(--main-normal, #3f4549);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.5px;
  transition: opacity 0.2s;
}

.nav-brand:hover { opacity: 0.75; }

.nav-logo {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  flex-shrink: 0;
}

.nav-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--main-normal, #3f4549);
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 5px;
  text-decoration: none;
  color: var(--navi-normal, #4f5559);
  font-size: 14px;
  letter-spacing: 0.5px;
  padding: 7px 12px;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}

.nav-back:hover {
  background: rgba(42, 104, 133, 0.07);
  color: var(--main-normal, #3f4549);
}

.nav-back-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* ══════════════════════════════════════
   主内容区
══════════════════════════════════════ */
.terms-main {
  max-width: 820px;
  margin: 0 auto;
  padding: 28px 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── 卡片基础 ── */
.terms-card {
  background: var(--card-bg, #fff);
  border-radius: 16px;
  box-shadow: var(--card-shadow, 0 8px 20px -6px rgba(0, 0, 0, 0.08));
  padding: 28px 32px;
  box-sizing: border-box;
}

/* ── 文档标题卡片 ── */
.doc-header {
  padding: 32px 36px;
}

.doc-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--main-normal, #3f4549);
  margin: 0 0 10px;
  letter-spacing: 0.3px;
}

.doc-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--main-note, #ababab);
  margin: 0;
}

.meta-dot { opacity: 0.5; }

/* ── 章节卡片 ── */
.section-card {
  scroll-margin-top: 72px;
  transition: box-shadow 0.2s;
}

.section-card:hover {
  box-shadow: var(--card-shadow2-hover, 0 12px 24px -8px rgba(0, 0, 0, 0.12));
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--main-normal, #3f4549);
  margin: 0 0 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-default, #e2e3e4);
  letter-spacing: 0.3px;
}

.section-body {
  line-height: 1.85;
  color: var(--main-code, #686868);
  font-size: 14px;
}

.section-body :deep(p)  { margin: 9px 0; }
.section-body :deep(ul),
.section-body :deep(ol) { margin: 8px 0; padding-left: 22px; }
.section-body :deep(li) { margin: 6px 0; }

/* ── 状态卡片 ── */
.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 32px;
  color: var(--main-note, #ababab);
  font-size: 14px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--line-default, #e2e3e4);
  border-top-color: var(--primary-color, #2a6885);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-text { margin: 0; color: #c0392b; }

.retry-btn {
  padding: 8px 22px;
  background: var(--primary-color, #2a6885);
  color: var(--on-primary, #fafafa);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  letter-spacing: 0.5px;
  transition: opacity 0.2s;
}

.retry-btn:hover { opacity: 0.85; }

/* ══════════════════════════════════════
   响应式
══════════════════════════════════════ */
@media (max-width: 680px) {
  .terms-nav-inner { padding: 0 16px; }
  .nav-title        { display: none; }
  .terms-main       { padding: 16px 12px 48px; gap: 10px; }
  .terms-card       { padding: 20px; }
  .doc-header       { padding: 24px; }
  .doc-title        { font-size: 1.35rem; }
}
</style>
