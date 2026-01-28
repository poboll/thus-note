<template>
  <div class="config-section">
    <div class="section-header">
      <h3>基础配置</h3>
      <p class="section-desc">配置系统的基础 URL 和代理设置</p>
    </div>

    <form @submit.prevent="handleSave" class="config-form">
      <div class="form-group">
        <label class="form-label">API 基础 URL</label>
        <input 
          type="url" 
          v-model="formData.baseUrl" 
          class="form-input"
          placeholder="http://localhost:3000"
          required
        />
        <p class="form-hint">后端 API 服务的访问地址</p>
      </div>

      <div class="form-group">
        <label class="form-label">前端 URL</label>
        <input 
          type="url" 
          v-model="formData.frontendUrl" 
          class="form-input"
          placeholder="http://localhost:5175"
          required
        />
        <p class="form-hint">前端应用的访问地址，用于回调等场景</p>
      </div>

      <div class="form-group">
        <label class="form-label checkbox-label">
          <input 
            type="checkbox" 
            v-model="formData.proxy.enabled"
            class="form-checkbox"
          />
          <span>启用代理</span>
        </label>
      </div>

      <template v-if="formData.proxy.enabled">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">代理主机</label>
            <input 
              type="text" 
              v-model="formData.proxy.host" 
              class="form-input"
              placeholder="127.0.0.1"
            />
          </div>
          <div class="form-group">
            <label class="form-label">代理端口</label>
            <input 
              type="number" 
              v-model.number="formData.proxy.port" 
              class="form-input"
              placeholder="7890"
            />
          </div>
        </div>
      </template>

      <div class="form-actions">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  config: any;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', data: any): void;
}>();

const formData = ref({
  baseUrl: '',
  frontendUrl: '',
  proxy: {
    enabled: false,
    host: '',
    port: 0,
  },
});

watch(() => props.config, (newConfig) => {
  if (newConfig) {
    formData.value = {
      baseUrl: newConfig.baseUrl || '',
      frontendUrl: newConfig.frontendUrl || '',
      proxy: {
        enabled: newConfig.proxy?.enabled || false,
        host: newConfig.proxy?.host || '',
        port: newConfig.proxy?.port || 0,
      },
    };
  }
}, { immediate: true });

const handleSave = () => {
  emit('save', formData.value);
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
  max-width: 600px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-hint {
  font-size: 0.85rem;
  color: #888;
  margin: 6px 0 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #eee;
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
</style>
