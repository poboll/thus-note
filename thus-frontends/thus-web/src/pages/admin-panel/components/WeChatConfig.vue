<template>
  <div class="config-section">
    <div class="section-header">
      <h3>微信配置</h3>
      <p class="section-desc">配置微信公众号和小程序，用于微信登录和绑定</p>
    </div>

    <form @submit.prevent="handleSave" class="config-form">
      <div class="form-group">
        <label class="form-label checkbox-label">
          <input type="checkbox" v-model="formData.enabled" class="form-checkbox" />
          <span>启用微信功能</span>
        </label>
      </div>

      <template v-if="formData.enabled">
        <div class="config-block">
          <h4 class="block-title">公众号配置</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">AppID</label>
              <input type="text" v-model="formData.gzhAppId" class="form-input" placeholder="wx1234567890abcdef" />
            </div>
            <div class="form-group">
              <label class="form-label">AppSecret</label>
              <input type="password" v-model="formData.gzhAppSecret" class="form-input" placeholder="••••••••" />
            </div>
          </div>
        </div>

        <div class="config-block">
          <h4 class="block-title">小程序配置（可选）</h4>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">AppID</label>
              <input type="text" v-model="formData.miniAppId" class="form-input" placeholder="wx1234567890abcdef" />
            </div>
            <div class="form-group">
              <label class="form-label">AppSecret</label>
              <input type="password" v-model="formData.miniAppSecret" class="form-input" placeholder="••••••••" />
            </div>
          </div>
        </div>
      </template>

      <div class="form-actions">
        <button 
          v-if="formData.enabled"
          type="button" 
          class="btn-secondary" 
          @click="handleTest"
          :disabled="testing"
        >
          {{ testing ? '测试中...' : '测试配置' }}
        </button>
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
  testing: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', data: any): void;
  (e: 'test'): void;
}>();

const formData = ref({
  enabled: false,
  gzhAppId: '',
  gzhAppSecret: '',
  miniAppId: '',
  miniAppSecret: '',
});

watch(() => props.config, (newConfig) => {
  if (newConfig?.wechat) {
    formData.value = {
      enabled: newConfig.wechat.enabled || false,
      gzhAppId: newConfig.wechat.gzhAppId || '',
      gzhAppSecret: newConfig.wechat.gzhAppSecret === '******' ? '' : (newConfig.wechat.gzhAppSecret || ''),
      miniAppId: newConfig.wechat.miniAppId || '',
      miniAppSecret: newConfig.wechat.miniAppSecret === '******' ? '' : (newConfig.wechat.miniAppSecret || ''),
    };
  }
}, { immediate: true });

const handleSave = () => {
  emit('save', formData.value);
};

const handleTest = () => {
  emit('test');
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

.config-block {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.block-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 16px;
  color: #333;
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
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
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
  display: flex;
  gap: 12px;
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
  padding: 12px 24px;
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
  background: #f0f4ff;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
