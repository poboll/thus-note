<template>
  <div class="config-section">
    <div class="section-header">
      <h3>AI 配置</h3>
      <p class="section-desc">管理 AI 服务提供商与功能开关</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else>
      <div class="config-form">
        <div class="toggle-group">
          <h4 class="group-title">功能开关</h4>
          <label class="toggle-row">
            <input type="checkbox" v-model="formData.enabled" class="form-checkbox" />
            <div class="toggle-info">
              <span class="toggle-label">AI 总开关</span>
              <span class="toggle-desc">启用或禁用所有 AI 功能</span>
            </div>
          </label>
          <label class="toggle-row">
            <input type="checkbox" v-model="formData.autoTag" :disabled="!formData.enabled" class="form-checkbox" />
            <div class="toggle-info">
              <span class="toggle-label">自动标签</span>
              <span class="toggle-desc">写笔记时自动生成标签</span>
            </div>
          </label>
          <label class="toggle-row">
            <input type="checkbox" v-model="formData.autoSummary" :disabled="!formData.enabled" class="form-checkbox" />
            <div class="toggle-info">
              <span class="toggle-label">自动摘要</span>
              <span class="toggle-desc">自动生成笔记摘要</span>
            </div>
          </label>
          <label class="toggle-row">
            <input type="checkbox" v-model="formData.similarRecommend" :disabled="!formData.enabled" class="form-checkbox" />
            <div class="toggle-info">
              <span class="toggle-label">相似推荐</span>
              <span class="toggle-desc">推荐内容相似的笔记</span>
            </div>
          </label>
        </div>

        <div class="provider-group">
          <h4 class="group-title">AI 提供商</h4>
          <div v-for="(provider, idx) in formData.providers" :key="idx" class="provider-card">
            <div class="provider-header">
              <label class="toggle-row compact">
                <input type="checkbox" v-model="provider.enabled" class="form-checkbox" />
                <span class="provider-name">{{ provider.name || `提供商 ${idx + 1}` }}</span>
              </label>
            </div>
            <div class="provider-fields">
              <div class="form-group">
                <label class="form-label">名称</label>
                <input type="text" v-model="provider.name" class="form-input" placeholder="OpenAI" />
              </div>
              <div class="form-group">
                <label class="form-label">API 地址</label>
                <input type="url" v-model="provider.baseUrl" class="form-input" placeholder="https://api.openai.com/v1" />
              </div>
              <div class="form-group">
                <label class="form-label">API Key</label>
                <input :type="showKeys[idx] ? 'text' : 'password'" v-model="provider.apiKey" class="form-input" placeholder="sk-..." />
                <button type="button" class="btn-toggle-key" @click="showKeys[idx] = !showKeys[idx]">
                  {{ showKeys[idx] ? '隐藏' : '显示' }}
                </button>
              </div>
              <div class="form-group">
                <label class="form-label">默认模型</label>
                <input type="text" v-model="provider.defaultModel" class="form-input" placeholder="gpt-4" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-primary" :disabled="saving" @click="handleSave">
            {{ saving ? '保存中...' : '保存配置' }}
          </button>
          <button type="button" class="btn-secondary" :disabled="batchTagging" @click="handleBatchRetag">
            {{ batchTagging ? `标签中 (${batchProgress})...` : '批量打标签（无标签笔记）' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import localCache from '~/utils/system/local-cache';

interface AIProvider {
  enabled: boolean;
  name: string;
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  models?: string[];
}

interface AIFormData {
  enabled: boolean;
  autoTag: boolean;
  autoSummary: boolean;
  similarRecommend: boolean;
  providers: AIProvider[];
}

const emit = defineEmits<{
  (e: 'message', type: 'success' | 'error', text: string): void;
}>();

const loading = ref(true);
const saving = ref(false);
const batchTagging = ref(false);
const batchProgress = ref('');
const showKeys = reactive<Record<number, boolean>>({});

const formData = ref<AIFormData>({
  enabled: false,
  autoTag: false,
  autoSummary: false,
  similarRecommend: false,
  providers: [],
});

const getApiUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const getToken = () => localCache.getPreference().token || '';

const fetchConfig = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${getApiUrl()}/api/admin/config/ai`, {
      headers: { 'x-liu-token': getToken() },
    });
    const json = await res.json();
    if (json.code === '0000' && json.data) {
      formData.value = {
        enabled: json.data.enabled ?? false,
        autoTag: json.data.autoTag ?? false,
        autoSummary: json.data.autoSummary ?? false,
        similarRecommend: json.data.similarRecommend ?? false,
        providers: json.data.providers || [],
      };
    }
  } catch {
    emit('message', 'error', '获取 AI 配置失败');
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const res = await fetch(`${getApiUrl()}/api/admin/config/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ ai: formData.value }),
    });
    const json = await res.json();
    if (json.code === '0000') {
      emit('message', 'success', 'AI 配置已保存');
    } else {
      throw new Error(json.errMsg || '保存失败');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '保存失败';
    emit('message', 'error', msg);
  } finally {
    saving.value = false;
  }
};

onMounted(fetchConfig);

const handleBatchRetag = async () => {
  batchTagging.value = true;
  batchProgress.value = '准备中';
  try {
    const res = await fetch(`${getApiUrl()}/api/ai/batch-retag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
    });
    const json = await res.json();
    if (json.code === '0000' && json.data) {
      const { tagged, total } = json.data;
      batchProgress.value = `${tagged}/${total}`;
      emit('message', 'success', `已为 ${tagged} 篇笔记打上标签（共 ${total} 篇无标签笔记）`);
    } else {
      throw new Error(json.errMsg || '批量打标签失败');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '批量打标签失败';
    emit('message', 'error', msg);
  } finally {
    batchTagging.value = false;
  }
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

.config-form {
  max-width: 700px;
}

.group-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.toggle-group {
  margin-bottom: 32px;
}

.toggle-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  cursor: pointer;
}

.toggle-row:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.toggle-row.compact {
  padding: 0;
  border: none;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-label {
  font-weight: 500;
  color: #333;
}

.toggle-desc {
  font-size: 0.85rem;
  color: #888;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-top: 2px;
  flex-shrink: 0;
}

.provider-group {
  margin-bottom: 32px;
}

.provider-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  margin-bottom: 16px;
  overflow: hidden;
}

.provider-header {
  padding: 14px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
}

.provider-name {
  font-weight: 600;
  color: #333;
}

.provider-fields {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
  position: relative;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
  font-size: 0.9rem;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-toggle-key {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 10px;
  font-size: 0.8rem;
  background: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
}

.btn-toggle-key:hover {
  background: #e0e0e0;
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
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

.btn-secondary {
  padding: 12px 32px;
  background: white;
  color: #667eea;
  border: 1px solid #667eea;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #f0f2ff;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
  color: #666;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e8e8e8;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
