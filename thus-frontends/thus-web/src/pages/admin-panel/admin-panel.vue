<template>
  <div class="admin-panel">
    <!-- 加载中状态 -->
    <div v-if="checkingAuth" class="auth-loading">
      <div class="loading-spinner"></div>
      <p>正在验证权限...</p>
    </div>

    <!-- 无权限提示 -->
    <div v-else-if="!isAdmin" class="no-permission">
      <svg viewBox="0 0 24 24" width="64" height="64">
        <path fill="#ef4444" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <h2>无访问权限</h2>
      <p>您没有管理员权限，正在跳转...</p>
    </div>

    <!-- 管理面板主体 -->
    <template v-else>
      <!-- 侧边导航 -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">管理后台</h2>
        </div>
        <nav class="sidebar-nav">
          <a 
            v-for="item in menuItems" 
            :key="item.id"
            :class="['nav-item', { active: activeMenu === item.id }]"
            @click="activeMenu = item.id"
          >
            <span class="nav-icon" v-html="item.icon"></span>
            <span class="nav-text">{{ item.label }}</span>
          </a>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="admin-main">
        <header class="main-header">
          <h1 class="page-title">{{ currentMenuLabel }}</h1>
          <div class="header-actions">
            <button class="btn-refresh" @click="refreshConfig" :disabled="loading">
              <svg viewBox="0 0 24 24" width="18" height="18" :class="{ spinning: loading }">
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              刷新
            </button>
          </div>
        </header>

        <div class="main-content">
          <!-- 系统概览 -->
          <SystemOverview v-if="activeMenu === 'overview'" />

          <!-- 基础配置 -->
          <BaseConfig 
            v-else-if="activeMenu === 'base'" 
            :config="config"
            @save="saveBaseConfig"
            :saving="saving"
          />

          <!-- 存储配置 -->
          <StorageConfig 
            v-else-if="activeMenu === 'storage'" 
            :config="config"
            @save="saveStorageConfig"
            @test="testStorageConfig"
            :saving="saving"
            :testing="testing"
          />

          <!-- 短信配置 -->
          <SMSConfig 
            v-else-if="activeMenu === 'sms'" 
            :config="config"
            @save="saveSMSConfig"
            @test="testSMSConfig"
            :saving="saving"
            :testing="testing"
          />

          <!-- 邮箱配置 -->
          <EmailConfig 
            v-else-if="activeMenu === 'email'" 
            :config="config"
            @save="saveEmailConfig"
            @test="testEmailConfig"
            :saving="saving"
            :testing="testing"
          />

          <!-- 微信配置 -->
          <WeChatConfig 
            v-else-if="activeMenu === 'wechat'" 
            :config="config"
            @save="saveWeChatConfig"
            @test="testWeChatConfig"
            :saving="saving"
            :testing="testing"
          />

          <!-- 政策编辑 -->
          <PolicyEditor 
            v-else-if="activeMenu === 'policies'" 
            :config="config"
            @save="savePolicies"
            :saving="saving"
          />

          <!-- AI 配置 -->
          <AIConfig 
            v-else-if="activeMenu === 'ai'"
            @message="showMessage"
          />

          <!-- 用户管理 -->
          <UserManagement 
            v-else-if="activeMenu === 'users'"
            @message="showMessage"
          />

          <!-- 系统监控 -->
          <SystemMonitor v-else-if="activeMenu === 'monitor'" />
        </div>
      </main>
    </template>

    <!-- 消息提示 -->
    <div v-if="message" :class="['message-toast', message.type]">
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import localCache from '~/utils/system/local-cache';
import SystemOverview from './components/SystemOverview.vue';
import BaseConfig from './components/BaseConfig.vue';
import StorageConfig from './components/StorageConfig.vue';
import SMSConfig from './components/SMSConfig.vue';
import EmailConfig from './components/EmailConfig.vue';
import WeChatConfig from './components/WeChatConfig.vue';
import PolicyEditor from './components/PolicyEditor.vue';
import AIConfig from './components/AIConfig.vue';
import UserManagement from './components/UserManagement.vue';
import SystemMonitor from './components/SystemMonitor.vue';

const router = useRouter();

// 菜单项
const menuItems = [
  { 
    id: 'overview', 
    label: '系统概览',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>'
  },
  { 
    id: 'base', 
    label: '基础配置',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>'
  },
  { 
    id: 'storage', 
    label: '存储配置',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>'
  },
  { 
    id: 'sms', 
    label: '短信配置',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>'
  },
  { 
    id: 'email', 
    label: '邮箱配置',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>'
  },
  { 
    id: 'wechat', 
    label: '微信配置',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.89.31 1.87.5 2.5.5.17 0 .33-.01.5-.02C9.17 15.03 9 14.05 9 13c0-3.87 3.13-7 7-7 1.05 0 2.03.17 2.98.5C18.03 3.69 14.64 1 10.5 1 5.81 1 2 4.03 2 8c0 2.21 1.08 4.18 2.78 5.53L4 17l3-1.8c1.09.52 2.29.8 3.5.8.17 0 .33-.01.5-.02-.33-.94-.5-1.95-.5-3 0-4.42 3.58-8 8-8-.97-2.31-3.13-4-5.5-4z"/></svg>'
  },
  { 
    id: 'policies', 
    label: '政策编辑',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>'
  },
  { 
    id: 'ai', 
    label: 'AI 配置',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7 7 0 0 1 14 23h-4a7 7 0 0 1-6.93-6H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>'
  },
  { 
    id: 'users', 
    label: '用户管理',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>'
  },
  { 
    id: 'monitor', 
    label: '系统监控',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>'
  },
];

const activeMenu = ref('overview');
const config = ref<any>({});
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const message = ref<{ type: string; text: string } | null>(null);
const isAdmin = ref(false);
const checkingAuth = ref(true);

const currentMenuLabel = computed(() => {
  const item = menuItems.find(m => m.id === activeMenu.value);
  return item?.label || '';
});

// 显示消息
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text };
  setTimeout(() => {
    message.value = null;
  }, 3000);
};

// 获取 API 基础 URL
const getApiUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
};

// 获取认证 token
const getToken = () => {
  return localCache.getPreference().token || '';
};

// 验证管理员权限
const checkAdminAuth = async () => {
  checkingAuth.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config`, {
      headers: {
        'x-liu-token': getToken(),
      },
    });
    const result = await response.json();
    
    if (result.code === '0000') {
      isAdmin.value = true;
    } else if (result.code === 'ADMIN_UNAUTHORIZED' || result.code === 'ADMIN_FORBIDDEN' || result.code === 'E0003' || result.code === 'E0004') {
      // 未授权或无权限
      isAdmin.value = false;
      showMessage('error', '您没有管理员权限');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } else {
      throw new Error(result.errMsg || '验证失败');
    }
  } catch (err: any) {
    isAdmin.value = false;
    showMessage('error', err.message || '验证失败');
    setTimeout(() => {
      router.push('/');
    }, 1500);
  } finally {
    checkingAuth.value = false;
  }
};

// 刷新配置
const refreshConfig = async () => {
  if (!isAdmin.value) return;
  
  loading.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/full`, {
      headers: {
        'x-liu-token': getToken(),
      },
    });
    const result = await response.json();
    
    if (result.code === '0000' && result.data) {
      config.value = result.data;
    } else {
      throw new Error(result.errMsg || '获取配置失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '获取配置失败');
  } finally {
    loading.value = false;
  }
};

// 保存基础配置
const saveBaseConfig = async (data: any) => {
  saving.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/base`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.code === '0000') {
      showMessage('success', '基础配置已保存');
      await refreshConfig();
    } else {
      throw new Error(result.errMsg || '保存失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 保存存储配置
const saveStorageConfig = async (data: any) => {
  saving.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ storage: data }),
    });
    const result = await response.json();
    
    if (result.code === '0000') {
      showMessage('success', '存储配置已保存');
      await refreshConfig();
    } else {
      throw new Error(result.errMsg || '保存失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 测试存储配置
const testStorageConfig = async (data: any) => {
  testing.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/test/storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ storage: data }),
    });
    const result = await response.json();
    
    if (result.code === '0000' && result.data?.success) {
      showMessage('success', result.data.message || '测试成功');
    } else {
      throw new Error(result.data?.message || result.errMsg || '测试失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '测试失败');
  } finally {
    testing.value = false;
  }
};

// 保存短信配置
const saveSMSConfig = async (data: any) => {
  saving.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ sms: data }),
    });
    const result = await response.json();
    
    if (result.code === '0000') {
      showMessage('success', '短信配置已保存');
      await refreshConfig();
    } else {
      throw new Error(result.errMsg || '保存失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 测试短信配置
const testSMSConfig = async (data: any, testPhone: string) => {
  testing.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/test/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ sms: data, testPhone }),
    });
    const result = await response.json();
    
    if (result.code === '0000' && result.data?.success) {
      showMessage('success', result.data.message || '测试成功');
    } else {
      throw new Error(result.data?.message || result.errMsg || '测试失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '测试失败');
  } finally {
    testing.value = false;
  }
};

// 保存邮箱配置
const saveEmailConfig = async (data: any) => {
  saving.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ email: data }),
    });
    const result = await response.json();
    
    if (result.code === '0000') {
      showMessage('success', '邮箱配置已保存');
      await refreshConfig();
    } else {
      throw new Error(result.errMsg || '保存失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 测试邮箱配置
const testEmailConfig = async (data: any, testAddress: string) => {
  testing.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/test/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ email: data, testAddress }),
    });
    const result = await response.json();
    
    if (result.code === '0000' && result.data?.success) {
      showMessage('success', result.data.message || '测试成功');
    } else {
      throw new Error(result.data?.message || result.errMsg || '测试失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '测试失败');
  } finally {
    testing.value = false;
  }
};

// 保存微信配置
const saveWeChatConfig = async (data: any) => {
  saving.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/wechat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ wechat: data }),
    });
    const result = await response.json();
    
    if (result.code === '0000') {
      showMessage('success', '微信配置已保存');
      await refreshConfig();
    } else {
      throw new Error(result.errMsg || '保存失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

// 测试微信配置
const testWeChatConfig = async () => {
  testing.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/config/test/wechat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
    });
    const result = await response.json();
    
    if (result.code === '0000' && result.data?.success) {
      showMessage('success', result.data.message || '测试成功');
    } else {
      throw new Error(result.data?.message || result.errMsg || '测试失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '测试失败');
  } finally {
    testing.value = false;
  }
};

// 保存政策内容
const savePolicies = async (type: 'terms' | 'privacy', data: any) => {
  saving.value = true;
  try {
    const response = await fetch(`${getApiUrl()}/api/admin/policies/${type}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (result.code === '0000') {
      showMessage('success', type === 'terms' ? '服务协议已保存' : '隐私政策已保存');
      await refreshConfig();
    } else {
      throw new Error(result.errMsg || '保存失败');
    }
  } catch (err: any) {
    showMessage('error', err.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await checkAdminAuth();
  if (isAdmin.value) {
    await refreshConfig();
  }
});
</script>

<style scoped>
.admin-panel {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.auth-loading,
.no-permission {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  background: #f5f7fa;
}

.auth-loading p,
.no-permission p {
  margin-top: 16px;
  color: #666;
  font-size: 1rem;
}

.no-permission h2 {
  margin-top: 16px;
  color: #333;
  font-size: 1.5rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e8e8e8;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.admin-sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.sidebar-nav {
  padding: 16px 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-icon {
  margin-right: 12px;
  display: flex;
  align-items: center;
}

.nav-text {
  font-size: 0.95rem;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh svg.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.main-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.message-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.message-toast.success {
  background: #10b981;
}

.message-toast.error {
  background: #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .admin-panel {
    flex-direction: column;
  }
  
  .admin-sidebar {
    width: 100%;
  }
  
  .sidebar-nav {
    display: flex;
    overflow-x: auto;
    padding: 8px;
  }
  
  .nav-item {
    flex-shrink: 0;
    margin-bottom: 0;
    margin-right: 4px;
  }
  
  .main-content {
    padding: 16px;
  }
}
</style>
