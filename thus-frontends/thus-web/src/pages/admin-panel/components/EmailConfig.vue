<template>
  <div class="config-section">
    <div class="section-header">
      <h3>邮箱配置</h3>
      <p class="section-desc">配置 SMTP 邮件服务，用于发送验证码和通知</p>
    </div>

    <form @submit.prevent="handleSave" class="config-form">
      <div class="form-group">
        <label class="form-label checkbox-label">
          <input type="checkbox" v-model="formData.enabled" class="form-checkbox" />
          <span>启用邮件服务</span>
        </label>
      </div>

      <template v-if="formData.enabled">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">SMTP 主机</label>
            <input type="text" v-model="formData.host" class="form-input" placeholder="smtp.gmail.com" />
          </div>
          <div class="form-group">
            <label class="form-label">端口</label>
            <input type="number" v-model.number="formData.port" class="form-input" placeholder="587" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label checkbox-label">
            <input type="checkbox" v-model="formData.secure" class="form-checkbox" />
            <span>使用 SSL/TLS（端口 465 时启用）</span>
          </label>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input type="text" v-model="formData.user" class="form-input" placeholder="user@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label">密码 / 授权码</label>
            <input type="password" v-model="formData.pass" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">发件人地址</label>
          <input type="text" v-model="formData.from" class="form-input" placeholder="noreply@thus-note.com" />
          <p class="form-hint">格式：邮箱地址 或 "显示名" &lt;邮箱地址&gt;</p>
        </div>

        <div class="form-group">
          <label class="form-label">测试收件人</label>
          <input type="email" v-model="testAddress" class="form-input" placeholder="test@example.com" />
          <p class="form-hint">用于发送测试邮件</p>
        </div>
      </template>

      <div class="form-actions">
        <button
          v-if="formData.enabled"
          type="button"
          class="btn-secondary"
          @click="handleTest"
          :disabled="testing || !testAddress"
        >
          {{ testing ? '发送中...' : '发送测试邮件' }}
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
  (e: 'test', data: any, address: string): void;
}>();

const testAddress = ref('');

const formData = ref({
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  from: '',
});

watch(() => props.config, (newConfig) => {
  if (newConfig?.email) {
    formData.value = {
      enabled: newConfig.email.enabled || false,
      host: newConfig.email.host || '',
      port: newConfig.email.port || 587,
      secure: newConfig.email.secure || false,
      user: newConfig.email.user || '',
      pass: '',
      from: newConfig.email.from || '',
    };
  }
}, { immediate: true });

const handleSave = () => {
  emit('save', formData.value);
};

const handleTest = () => {
  emit('test', formData.value, testAddress.value);
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
