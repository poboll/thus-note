<template>
  <div class="config-section">
    <div class="section-header">
      <h3>存储配置</h3>
      <p class="section-desc">配置文件存储方式，支持本地存储和 S3 兼容存储</p>
    </div>

    <form @submit.prevent="handleSave" class="config-form">
      <div class="form-group">
        <label class="form-label">存储类型</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" v-model="formData.type" value="local" />
            <span>本地存储</span>
          </label>
          <label class="radio-label">
            <input type="radio" v-model="formData.type" value="s3" />
            <span>S3 兼容存储</span>
          </label>
        </div>
      </div>

      <!-- 本地存储配置 -->
      <template v-if="formData.type === 'local'">
        <div class="form-group">
          <label class="form-label">上传目录</label>
          <input 
            type="text" 
            v-model="formData.local.uploadDir" 
            class="form-input"
            placeholder="uploads"
          />
          <p class="form-hint">文件保存的本地目录路径</p>
        </div>
      </template>

      <!-- S3 存储配置 -->
      <template v-if="formData.type === 's3'">
        <div class="form-group">
          <label class="form-label">服务商</label>
          <select v-model="formData.s3.provider" class="form-select">
            <option value="aws">AWS S3</option>
            <option value="aliyun">阿里云 OSS</option>
            <option value="tencent">腾讯云 COS</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Endpoint</label>
          <input 
            type="text" 
            v-model="formData.s3.endpoint" 
            class="form-input"
            :placeholder="getEndpointPlaceholder()"
          />
          <p class="form-hint">S3 服务端点地址</p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Access Key ID</label>
            <input 
              type="text" 
              v-model="formData.s3.accessKeyId" 
              class="form-input"
              placeholder="AKIAIOSFODNN7EXAMPLE"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Secret Access Key</label>
            <input 
              type="password" 
              v-model="formData.s3.secretAccessKey" 
              class="form-input"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Bucket 名称</label>
            <input 
              type="text" 
              v-model="formData.s3.bucket" 
              class="form-input"
              placeholder="my-bucket"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Region</label>
            <input 
              type="text" 
              v-model="formData.s3.region" 
              class="form-input"
              :placeholder="getRegionPlaceholder()"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">公开访问 URL（可选）</label>
          <input 
            type="url" 
            v-model="formData.s3.publicUrl" 
            class="form-input"
            placeholder="https://cdn.example.com"
          />
          <p class="form-hint">如果使用 CDN，填写 CDN 域名</p>
        </div>
      </template>

      <div class="form-actions">
        <button 
          type="button" 
          class="btn-secondary" 
          @click="handleTest"
          :disabled="testing"
        >
          {{ testing ? '测试中...' : '测试连接' }}
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
  (e: 'test', data: any): void;
}>();

const formData = ref({
  type: 'local',
  local: {
    uploadDir: 'uploads',
  },
  s3: {
    provider: 'aws',
    endpoint: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucket: '',
    region: '',
    publicUrl: '',
  },
});

watch(() => props.config, (newConfig) => {
  if (newConfig?.storage) {
    formData.value = {
      type: newConfig.storage.type || 'local',
      local: {
        uploadDir: newConfig.storage.local?.uploadDir || 'uploads',
      },
      s3: {
        provider: newConfig.storage.s3?.provider || 'aws',
        endpoint: newConfig.storage.s3?.endpoint || '',
        accessKeyId: newConfig.storage.s3?.accessKeyId === '******' ? '' : (newConfig.storage.s3?.accessKeyId || ''),
        secretAccessKey: '',
        bucket: newConfig.storage.s3?.bucket || '',
        region: newConfig.storage.s3?.region || '',
        publicUrl: newConfig.storage.s3?.publicUrl || '',
      },
    };
  }
}, { immediate: true });

const getEndpointPlaceholder = () => {
  switch (formData.value.s3.provider) {
    case 'aliyun':
      return 'https://oss-cn-hangzhou.aliyuncs.com';
    case 'tencent':
      return 'https://cos.ap-guangzhou.myqcloud.com';
    default:
      return 'https://s3.amazonaws.com';
  }
};

const getRegionPlaceholder = () => {
  switch (formData.value.s3.provider) {
    case 'aliyun':
      return 'oss-cn-hangzhou';
    case 'tencent':
      return 'ap-guangzhou';
    default:
      return 'us-east-1';
  }
};

const handleSave = () => {
  emit('save', formData.value);
};

const handleTest = () => {
  emit('test', formData.value);
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

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-label input {
  width: 18px;
  height: 18px;
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
