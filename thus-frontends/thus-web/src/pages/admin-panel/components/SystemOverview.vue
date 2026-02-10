<template>
  <div class="overview-section">
    <div class="section-header">
      <h3>系统概览</h3>
      <p class="section-desc">查看系统运行状态与关键指标</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else-if="data">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">服务状态</div>
          <div class="stat-card-body">
            <div class="status-row">
              <span class="status-dot" :class="data.database.connected ? 'green' : 'red'"></span>
              <span>MongoDB</span>
              <span class="status-text">{{ data.database.connected ? '已连接' : '断开' }}</span>
            </div>
            <div class="status-row">
              <span class="status-dot" :class="data.redis.connected ? 'green' : 'red'"></span>
              <span>Redis</span>
              <span class="status-text">{{ data.redis.connected ? '已连接' : '断开' }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">用户统计</div>
          <div class="stat-card-body">
            <div class="stat-row">
              <span class="stat-label">总用户</span>
              <span class="stat-value">{{ data.stats.users.total }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">活跃</span>
              <span class="stat-value active">{{ data.stats.users.active }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">封禁</span>
              <span class="stat-value banned">{{ data.stats.users.banned }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">今日新增</span>
              <span class="stat-value highlight">{{ data.stats.users.today }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">笔记统计</div>
          <div class="stat-card-body">
            <div class="stat-row">
              <span class="stat-label">总笔记数</span>
              <span class="stat-value">{{ data.stats.threads.total }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">今日新增</span>
              <span class="stat-value highlight">{{ data.stats.threads.today }}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-header">系统信息</div>
          <div class="stat-card-body">
            <div class="stat-row">
              <span class="stat-label">运行时间</span>
              <span class="stat-value">{{ formatUptime(data.uptime) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Node 版本</span>
              <span class="stat-value">{{ data.nodeVersion }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">堆内存</span>
              <span class="stat-value">{{ formatBytes(data.memoryUsage.heapUsed) }} / {{ formatBytes(data.memoryUsage.heapTotal) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">RSS 内存</span>
              <span class="stat-value">{{ formatBytes(data.memoryUsage.rss) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">服务器时间</span>
              <span class="stat-value">{{ formatTime(data.serverTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="error-state">
      <p>加载失败</p>
      <button class="btn-retry" @click="fetchData">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import localCache from '~/utils/system/local-cache';

interface OverviewData {
  uptime: number;
  database: { connected: boolean; state: number };
  redis: { connected: boolean };
  stats: {
    users: { total: number; active: number; banned: number; today: number };
    threads: { total: number; today: number };
  };
  serverTime: string;
  nodeVersion: string;
  memoryUsage: { rss: number; heapTotal: number; heapUsed: number };
}

const data = ref<OverviewData | null>(null);
const loading = ref(true);
let timer: ReturnType<typeof setInterval> | null = null;

const getApiUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const getToken = () => localCache.getPreference().token || '';

const fetchData = async () => {
  try {
    const res = await fetch(`${getApiUrl()}/api/admin/overview`, {
      headers: { 'x-liu-token': getToken() },
    });
    const json = await res.json();
    if (json.code === '0000' && json.data) {
      data.value = json.data;
    }
  } catch {
    data.value = null;
  } finally {
    loading.value = false;
  }
};

const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天 ${h}时 ${m}分`;
  if (h > 0) return `${h}时 ${m}分`;
  return `${m}分`;
};

const formatBytes = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatTime = (iso: string): string => {
  return new Date(iso).toLocaleString('zh-CN');
};

onMounted(() => {
  fetchData();
  timer = setInterval(fetchData, 30000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.overview-section {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
}

.stat-card-header {
  padding: 14px 20px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
}

.stat-card-body {
  padding: 16px 20px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.status-row:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.green { background: #10b981; }
.status-dot.red { background: #ef4444; }

.status-text {
  margin-left: auto;
  font-size: 0.9rem;
  color: #666;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-row:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.stat-value.active { color: #10b981; }
.stat-value.banned { color: #ef4444; }
.stat-value.highlight { color: #667eea; }

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

.error-state {
  text-align: center;
  padding: 60px 0;
  color: #666;
}

.btn-retry {
  margin-top: 12px;
  padding: 8px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-retry:hover {
  background: #5a6fd6;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
