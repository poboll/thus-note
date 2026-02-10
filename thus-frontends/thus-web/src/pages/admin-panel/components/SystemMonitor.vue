<template>
  <div class="monitor-section">
    <div class="section-header">
      <h3>系统监控</h3>
      <p class="section-desc">实时监控系统健康状态与资源使用</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else>
      <div class="monitor-grid">
        <div class="monitor-card">
          <div class="monitor-card-header">健康状态</div>
          <div class="monitor-card-body">
            <div class="health-indicator" :class="healthData?.status === 'ok' ? 'healthy' : 'unhealthy'">
              <span class="health-dot"></span>
              <span class="health-text">{{ healthData?.status === 'ok' ? '运行正常' : '异常' }}</span>
            </div>
            <div class="conn-list">
              <div class="conn-item">
                <span class="conn-dot" :class="healthData?.connections?.mongodb === 'connected' ? 'green' : 'red'"></span>
                <span>MongoDB</span>
                <span class="conn-status">{{ healthData?.connections?.mongodb || '未知' }}</span>
              </div>
              <div class="conn-item">
                <span class="conn-dot" :class="healthData?.connections?.redis === 'connected' ? 'green' : 'red'"></span>
                <span>Redis</span>
                <span class="conn-status">{{ healthData?.connections?.redis || '未知' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="monitor-card">
          <div class="monitor-card-header">内存使用</div>
          <div class="monitor-card-body">
            <template v-if="overviewData">
              <div class="mem-item">
                <div class="mem-label">
                  <span>堆内存</span>
                  <span>{{ formatMB(overviewData.memoryUsage.heapUsed) }} / {{ formatMB(overviewData.memoryUsage.heapTotal) }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: heapPercent + '%' }" :class="heapPercent > 80 ? 'warn' : ''"></div>
                </div>
              </div>
              <div class="mem-item">
                <div class="mem-label">
                  <span>RSS 内存</span>
                  <span>{{ formatMB(overviewData.memoryUsage.rss) }}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill rss" :style="{ width: rssPercent + '%' }"></div>
                </div>
              </div>
            </template>
            <p v-else class="no-data">无数据</p>
          </div>
        </div>

        <div class="monitor-card">
          <div class="monitor-card-header">运行信息</div>
          <div class="monitor-card-body">
            <div class="info-row">
              <span class="info-label">服务运行时间</span>
              <span class="info-value">{{ formatUptime(healthData?.uptime || 0) }}</span>
            </div>
            <div class="info-row" v-if="overviewData">
              <span class="info-label">Node.js 版本</span>
              <span class="info-value">{{ overviewData.nodeVersion }}</span>
            </div>
            <div class="info-row" v-if="overviewData">
              <span class="info-label">总用户数</span>
              <span class="info-value">{{ overviewData.stats.users.total }}</span>
            </div>
            <div class="info-row" v-if="overviewData">
              <span class="info-label">总笔记数</span>
              <span class="info-value">{{ overviewData.stats.threads.total }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">服务器时间</span>
              <span class="info-value">{{ healthData ? new Date(healthData.timestamp).toLocaleString('zh-CN') : '-' }}</span>
            </div>
          </div>
        </div>

        <div class="monitor-card">
          <div class="monitor-card-header">端点检测</div>
          <div class="monitor-card-body">
            <div v-for="ep in endpoints" :key="ep.name" class="endpoint-row">
              <span class="conn-dot" :class="ep.ok ? 'green' : 'red'"></span>
              <span class="ep-name">{{ ep.name }}</span>
              <span class="ep-time" v-if="ep.ms !== null">{{ ep.ms }}ms</span>
              <span class="ep-time" v-else>-</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import localCache from '~/utils/system/local-cache';

interface HealthData {
  status: string;
  connections: { mongodb: string; redis: string };
  uptime: number;
  timestamp: string;
}

interface OverviewData {
  memoryUsage: { rss: number; heapTotal: number; heapUsed: number };
  nodeVersion: string;
  stats: {
    users: { total: number };
    threads: { total: number };
  };
}

interface EndpointCheck {
  name: string;
  ok: boolean;
  ms: number | null;
}

const loading = ref(true);
const healthData = ref<HealthData | null>(null);
const overviewData = ref<OverviewData | null>(null);
const endpoints = ref<EndpointCheck[]>([]);
let timer: ReturnType<typeof setInterval> | null = null;

const getApiUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const getToken = () => localCache.getPreference().token || '';

const heapPercent = computed(() => {
  if (!overviewData.value) return 0;
  const { heapUsed, heapTotal } = overviewData.value.memoryUsage;
  return Math.min(100, Math.round((heapUsed / heapTotal) * 100));
});

const rssPercent = computed(() => {
  if (!overviewData.value) return 0;
  const rss = overviewData.value.memoryUsage.rss;
  return Math.min(100, Math.round((rss / (512 * 1024 * 1024)) * 100));
});

const checkEndpoint = async (name: string, url: string, needAuth: boolean): Promise<EndpointCheck> => {
  const start = performance.now();
  try {
    const headers: Record<string, string> = {};
    if (needAuth) headers['x-liu-token'] = getToken();
    const res = await fetch(url, { headers });
    const ms = Math.round(performance.now() - start);
    return { name, ok: res.ok, ms };
  } catch {
    return { name, ok: false, ms: null };
  }
};

const fetchAll = async () => {
  try {
    const base = getApiUrl();

    const [healthRes, overviewRes, eps] = await Promise.all([
      fetch(`${base}/health`).then(r => r.json()).catch(() => null),
      fetch(`${base}/api/admin/overview`, {
        headers: { 'x-liu-token': getToken() },
      }).then(r => r.json()).catch(() => null),
      Promise.all([
        checkEndpoint('Health', `${base}/health`, false),
        checkEndpoint('DB Status', `${base}/health/db`, false),
        checkEndpoint('Admin API', `${base}/api/admin/config`, true),
        checkEndpoint('AI API', `${base}/api/admin/config/ai`, true),
      ]),
    ]);

    if (healthRes) healthData.value = healthRes;
    if (overviewRes?.code === '0000' && overviewRes.data) overviewData.value = overviewRes.data;
    endpoints.value = eps;
  } catch {
    // silent
  } finally {
    loading.value = false;
  }
};

const formatMB = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天 ${h}时 ${m}分`;
  if (h > 0) return `${h}时 ${m}分`;
  return `${m}分`;
};

onMounted(() => {
  fetchAll();
  timer = setInterval(fetchAll, 15000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.monitor-section {
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

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.monitor-card {
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
}

.monitor-card-header {
  padding: 14px 20px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #333;
  background: #f8f9fa;
  border-bottom: 1px solid #e8e8e8;
}

.monitor-card-body {
  padding: 16px 20px;
}

.health-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.health-indicator.healthy {
  background: #d1fae5;
}

.health-indicator.unhealthy {
  background: #fee2e2;
}

.health-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.healthy .health-dot { background: #10b981; }
.unhealthy .health-dot { background: #ef4444; }

.health-text {
  font-weight: 600;
  font-size: 1rem;
}

.healthy .health-text { color: #065f46; }
.unhealthy .health-text { color: #991b1b; }

.conn-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conn-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.conn-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.conn-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.conn-dot.green { background: #10b981; }
.conn-dot.red { background: #ef4444; }

.conn-status {
  margin-left: auto;
  font-size: 0.85rem;
  color: #666;
}

.mem-item {
  margin-bottom: 16px;
}

.mem-item:last-child {
  margin-bottom: 0;
}

.mem-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: #555;
}

.progress-bar {
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.progress-fill.warn {
  background: linear-gradient(90deg, #f59e0b, #ef4444);
}

.progress-fill.rss {
  background: linear-gradient(90deg, #10b981, #059669);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.info-label {
  color: #666;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.endpoint-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.endpoint-row:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.ep-name {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
}

.ep-time {
  font-size: 0.85rem;
  color: #666;
  font-variant-numeric: tabular-nums;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px 0;
  margin: 0;
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

@media (max-width: 768px) {
  .monitor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
