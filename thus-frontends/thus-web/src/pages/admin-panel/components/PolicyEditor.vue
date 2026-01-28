<template>
  <div class="config-section">
    <div class="section-header">
      <h3>政策编辑</h3>
      <p class="section-desc">编辑服务协议和隐私政策内容</p>
    </div>

    <!-- 标签切换 -->
    <div class="tab-nav">
      <button 
        :class="['tab-btn', { active: activeTab === 'terms' }]"
        @click="activeTab = 'terms'"
      >
        服务协议
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'privacy' }]"
        @click="activeTab = 'privacy'"
      >
        隐私政策
      </button>
    </div>

    <!-- 服务协议编辑 -->
    <div v-show="activeTab === 'terms'" class="editor-container">
      <div class="editor-header">
        <div class="form-group inline">
          <label class="form-label">版本号</label>
          <input type="text" v-model="termsData.version" class="form-input small" placeholder="1.0.0" />
        </div>
        <div class="meta-info">
          最后更新：{{ formatDate(termsData.lastUpdated) }}
        </div>
      </div>
      <div class="editor-body">
        <textarea 
          v-model="termsData.content" 
          class="content-editor"
          placeholder="输入服务协议内容（支持 HTML）..."
        ></textarea>
      </div>
      <div class="editor-footer">
        <button class="btn-preview" @click="previewTerms = !previewTerms">
          {{ previewTerms ? '关闭预览' : '预览' }}
        </button>
        <button class="btn-primary" @click="saveTerms" :disabled="saving">
          {{ saving ? '保存中...' : '保存服务协议' }}
        </button>
      </div>
      <div v-if="previewTerms" class="preview-container">
        <h4>预览</h4>
        <div class="preview-content" v-html="termsData.content"></div>
      </div>
    </div>

    <!-- 隐私政策编辑 -->
    <div v-show="activeTab === 'privacy'" class="editor-container">
      <div class="editor-header">
        <div class="form-group inline">
          <label class="form-label">版本号</label>
          <input type="text" v-model="privacyData.version" class="form-input small" placeholder="1.0.0" />
        </div>
        <div class="meta-info">
          最后更新：{{ formatDate(privacyData.lastUpdated) }}
        </div>
      </div>
      <div class="editor-body">
        <textarea 
          v-model="privacyData.content" 
          class="content-editor"
          placeholder="输入隐私政策内容（支持 HTML）..."
        ></textarea>
      </div>
      <div class="editor-footer">
        <button class="btn-preview" @click="previewPrivacy = !previewPrivacy">
          {{ previewPrivacy ? '关闭预览' : '预览' }}
        </button>
        <button class="btn-primary" @click="savePrivacy" :disabled="saving">
          {{ saving ? '保存中...' : '保存隐私政策' }}
        </button>
      </div>
      <div v-if="previewPrivacy" class="preview-container">
        <h4>预览</h4>
        <div class="preview-content" v-html="privacyData.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  config: any;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', type: 'terms' | 'privacy', data: any): void;
}>();

const activeTab = ref<'terms' | 'privacy'>('terms');
const previewTerms = ref(false);
const previewPrivacy = ref(false);

const termsData = ref({
  content: '',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
});

const privacyData = ref({
  content: '',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
});

watch(() => props.config, (newConfig) => {
  if (newConfig?.policies) {
    if (newConfig.policies.terms) {
      termsData.value = {
        content: newConfig.policies.terms.content || '',
        version: newConfig.policies.terms.version || '1.0.0',
        lastUpdated: newConfig.policies.terms.lastUpdated || new Date().toISOString(),
      };
    }
    if (newConfig.policies.privacy) {
      privacyData.value = {
        content: newConfig.policies.privacy.content || '',
        version: newConfig.policies.privacy.version || '1.0.0',
        lastUpdated: newConfig.policies.privacy.lastUpdated || new Date().toISOString(),
      };
    }
  }
}, { immediate: true });

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const saveTerms = () => {
  emit('save', 'terms', {
    content: termsData.value.content,
    version: termsData.value.version,
  });
};

const savePrivacy = () => {
  emit('save', 'privacy', {
    content: privacyData.value.content,
    version: privacyData.value.version,
  });
};
</script>

<style scoped>
.config-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 8px;
  color: #333;
}

.section-desc {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 16px;
}

.tab-btn {
  padding: 10px 24px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.tab-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.editor-container {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #eee;
}

.form-group.inline {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.form-label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.form-input.small {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.meta-info {
  font-size: 0.85rem;
  color: #888;
}

.editor-body {
  padding: 0;
}

.content-editor {
  width: 100%;
  min-height: 400px;
  padding: 20px;
  border: none;
  font-size: 0.95rem;
  line-height: 1.6;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', monospace;
}

.content-editor:focus {
  outline: none;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background: #f9fafb;
  border-top: 1px solid #eee;
}

.btn-preview {
  padding: 10px 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview:hover {
  border-color: #667eea;
  color: #667eea;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.preview-container {
  padding: 20px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.preview-container h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px;
  color: #333;
}

.preview-content {
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #eee;
  line-height: 1.8;
}

.preview-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 24px 0 12px;
  color: #333;
}

.preview-content :deep(h2:first-child) {
  margin-top: 0;
}

.preview-content :deep(p) {
  margin: 12px 0;
  color: #555;
}

.preview-content :deep(ul) {
  margin: 12px 0;
  padding-left: 24px;
}

.preview-content :deep(li) {
  margin: 8px 0;
  color: #555;
}
</style>
