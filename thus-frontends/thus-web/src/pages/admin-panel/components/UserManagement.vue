<template>
  <div class="config-section">
    <div class="section-header">
      <h3>用户管理</h3>
      <p class="section-desc">查看和管理系统用户</p>
    </div>

    <div class="toolbar">
      <input
        type="text"
        v-model="search"
        class="search-input"
        placeholder="搜索用户名、邮箱或手机号..."
        @input="debouncedFetch"
      />
      <select v-model="filterStatus" class="filter-select" @change="onFilterChange">
        <option value="">全部状态</option>
        <option value="active">活跃</option>
        <option value="inactive">未激活</option>
        <option value="banned">已封禁</option>
      </select>
      <select v-model="filterRole" class="filter-select" @change="onFilterChange">
        <option value="">全部角色</option>
        <option value="admin">管理员</option>
        <option value="user">普通用户</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <template v-else>
      <div class="table-wrapper">
        <table class="user-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱/手机</th>
              <th>状态</th>
              <th>角色</th>
              <th>注册时间</th>
              <th>最后登录</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user._id">
              <td class="username-cell">
                <span class="avatar-placeholder">{{ (user.username || '?')[0].toUpperCase() }}</span>
                {{ user.username }}
              </td>
              <td>{{ user.email || user.phone || '-' }}</td>
              <td>
                <span class="badge" :class="statusClass(user.status)">{{ statusLabel(user.status) }}</span>
              </td>
              <td>
                <span class="badge" :class="user.role === 'admin' ? 'badge-purple' : 'badge-gray'">
                  {{ user.role === 'admin' ? '管理员' : '用户' }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : '-' }}</td>
              <td class="actions-cell">
                <select
                  class="action-select"
                  :value="user.role"
                  @change="changeRole(user._id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="user">用户</option>
                  <option value="admin">管理员</option>
                </select>
                <select
                  class="action-select"
                  :value="user.status"
                  @change="changeStatus(user._id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="active">活跃</option>
                  <option value="banned">封禁</option>
                </select>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="7" class="empty-row">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination.pages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="pagination.page <= 1"
          @click="goPage(pagination.page - 1)"
        >上一页</button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.pages }} (共 {{ pagination.total }} 条)</span>
        <button
          class="page-btn"
          :disabled="pagination.page >= pagination.pages"
          @click="goPage(pagination.page + 1)"
        >下一页</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import localCache from '~/utils/system/local-cache';

interface UserItem {
  _id: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const emit = defineEmits<{
  (e: 'message', type: 'success' | 'error', text: string): void;
}>();

const users = ref<UserItem[]>([]);
const loading = ref(true);
const search = ref('');
const filterStatus = ref('');
const filterRole = ref('');
const pagination = ref<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const getApiUrl = () => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const getToken = () => localCache.getPreference().token || '';

const fetchUsers = async (page = 1) => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
    });
    if (search.value) params.set('search', search.value);
    if (filterStatus.value) params.set('status', filterStatus.value);
    if (filterRole.value) params.set('role', filterRole.value);

    const res = await fetch(`${getApiUrl()}/api/admin/users?${params}`, {
      headers: { 'x-liu-token': getToken() },
    });
    const json = await res.json();
    if (json.code === '0000' && json.data) {
      users.value = json.data.users;
      pagination.value = json.data.pagination;
    }
  } catch {
    emit('message', 'error', '获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const debouncedFetch = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchUsers(1), 400);
};

const onFilterChange = (_event: Event) => {
  void fetchUsers(1);
};

const goPage = (page: number) => fetchUsers(page);

const changeRole = async (userId: string, role: string) => {
  try {
    const res = await fetch(`${getApiUrl()}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (json.code === '0000') {
      emit('message', 'success', '角色已更新');
      await fetchUsers(pagination.value.page);
    } else {
      throw new Error(json.errMsg || '操作失败');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '操作失败';
    emit('message', 'error', msg);
  }
};

const changeStatus = async (userId: string, status: string) => {
  try {
    const res = await fetch(`${getApiUrl()}/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-liu-token': getToken(),
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.code === '0000') {
      emit('message', 'success', '状态已更新');
      await fetchUsers(pagination.value.page);
    } else {
      throw new Error(json.errMsg || '操作失败');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '操作失败';
    emit('message', 'error', msg);
  }
};

const statusClass = (s: string) => {
  if (s === 'active') return 'badge-green';
  if (s === 'banned') return 'badge-red';
  if (s === 'inactive') return 'badge-yellow';
  return 'badge-gray';
};

const statusLabel = (s: string) => {
  if (s === 'active') return '活跃';
  if (s === 'banned') return '已封禁';
  if (s === 'inactive') return '未激活';
  if (s === 'deleted') return '已删除';
  return s;
};

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('zh-CN');
};

onMounted(() => fetchUsers());
</script>

<style scoped>
.config-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  margin-bottom: 20px;
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.filter-select {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.table-wrapper {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.user-table th {
  text-align: left;
  padding: 12px 14px;
  background: #f8f9fa;
  color: #555;
  font-weight: 600;
  border-bottom: 2px solid #e8e8e8;
  white-space: nowrap;
}

.user-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.user-table tr:hover td {
  background: #fafafa;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  flex-shrink: 0;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-green { background: #d1fae5; color: #065f46; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-purple { background: #ede9fe; color: #5b21b6; }
.badge-gray { background: #f3f4f6; color: #4b5563; }

.actions-cell {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.action-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  background: white;
  cursor: pointer;
}

.empty-row {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.page-btn {
  padding: 8px 18px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #5a6fd6;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
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
  .toolbar {
    flex-direction: column;
  }

  .actions-cell {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
