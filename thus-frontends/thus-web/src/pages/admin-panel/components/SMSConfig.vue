<template>
  <div class="config-section">
    <div class="section-header">
      <h3>短信配置</h3>
      <p class="section-desc">配置短信服务商，用于发送验证码</p>
    </div>

    <form @submit.prevent="handleSave" class="config-form">
      <div class="form-group">
        <label class="form-label checkbox-label">
          <input type="checkbox" v-model="formData.enabled" class="form-checkbox" />
          <span>启用短信服务</span>
        </label>
      </div>

      <template v-if="formData.enabled">
        <div class="form-group">
          <label class="form-label">服务商</label>
          <select v-model="formData.provider" class="form-select">
            <option value="tencent">腾讯云</option>
            <option value="aliyun">阿里云</option>
            <option value="yunpian">云片</option>
          </select>
        </div>

        <!-- 腾讯云配置 -->
        <template v-if="formData.provider === 'tencent'">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Secret ID</label>
              <input type="text" v-model="formData.tencent.secretId" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Secret Key</label>
              <input type="password" v-model="formData.tencent.secretKey" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">App ID</label>
              <input type="text" v-model="formData.tencent.appId" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Region</label>
              <input type="text" v-model="formData.tencent.region" class="form-input" placeholder="ap-guangzhou" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">签名</label>
              <input type="text" v-model="formData.tencent.signName" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">模板 ID</label>
              <input type="text" v-model="formData.tencent.templateId" class="form-input" />
            </div>
          </div>
        </template>

        <!-- 阿里云配置 -->
        <template v-if="formData.provider === 'aliyun'">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Access Key ID</label>
              <input type="text" v-model="formData.aliyun.accessKeyId" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Access Key Secret</label>
              <input type="password" v-model="formData.aliyun.accessKeySecret" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">签名</label>
              <input type="text" v-model="formData.aliyun.signName" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">模板代码</label>
              <input type="text" v-model="formData.aliyun.templateCode" class="form-input" />
            </div>
          </div>
        </template>

        <!-- 云片配置 -->
        <template v-if="formData.provider === 'yunpian'">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input type="password" v-model="formData.yunpian.apiKey" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">模板 ID</label>
              <input type="text" v-model="formData.yunpian.templateId" class="form-input" />
            </div>
          </div>
        </template>

        <!-- 测试手机号 -->
        <div class="form-group">
          <label class="form-label">测试手机号</label>
          <input type="tel" v-model="testPhone" class="form-input" placeholder="13800138000" />
          <p class="form-hint">用于测试短信发送功能</p>
        </div>
      </template>

      <div class="form-actions">
        <button 
          v-if="formData.enabled"
          type="button" 
          class="btn-secondary" 
          @click="handleTest"
          :disabled="testing || !testPhone"
        >
          {{ testing ? '测试中...' : '发送测试短信' }}
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
  (e: 'test', data: any, phone: string): void;
}>();

const testPhone = ref('');

const formData = ref({
  enabled: false,
  provider: 'tencent',
  tencent: {
    secretId: '',
    secretKey: '',
    appId: '',
    signName: '',
    templateId: '',
    region: 'ap-guangzhou',
  },
  aliyun: {
    accessKeyId: '',
    accessKeySecret: '',
    signName: '',
    templateCode: '',
  },
  yunpian: {
    apiKey: '',
    templateId: '',
  },
});

watch(() => props.config, (newConfig) => {
  if (newConfig?.sms) {
    formData.value = {
      enabled: newConfig.sms.enabled || false,
      provider: newConfig.sms.provider || 'tencent',
      tencent: {
        secretId: newConfig.sms.tencent?.secretId || '',
        secretKey: '',
        appId: newConfig.sms.tencent?.appId || '',
        signName: newConfig.sms.tencent?.signName || '',
        templateId: newConfig.sms.tencent?.templateId || '',
        region: newConfig.sms.tencent?.region || 'ap-guangzhou',
      },
      aliyun: {
        accessKeyId: newConfig.sms.aliyun?.accessKeyId || '',
        accessKeySecret: '',
        signName: newConfig.sms.aliyun?.signName || '',
        templateCode: newConfig.sms.aliyun?.templateCode || '',
      },
      yunpian: {
        apiKey: '',
        templateId: newConfig.sms.yunpian?.templateId || '',
      },
    };
  }
}, { immediate: true });

const handleSave = () => {
  emit('save', formData.value);
};

const handleTest = () => {
  emit('test', formData.value, testPhone.value);
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

.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
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
