import promClient from 'prom-client';

/**
 * 性能监控服务
 */

// 创建Prometheus注册表
export const register = new promClient.Registry();

// 请求计数器
export const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 请求持续时间直方图
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// 数据库查询计数器
export const dbQueryCounter = new promClient.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'collection'],
  registers: [register],
});

// 数据库查询持续时间直方图
export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Redis操作计数器
export const redisOperationCounter = new promClient.Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation'],
  registers: [register],
});

// 活跃用户数
export const activeUsersGauge = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [register],
});

// API错误计数器
export const apiErrorCounter = new promClient.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['error_type', 'route'],
  registers: [register],
});

/**
 * 性能监控服务类
 */
export class MonitorService {
  /**
   * 记录HTTP请求
   */
  static recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    httpRequestCounter.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration / 1000);
  }

  /**
   * 记录数据库查询
   */
  static recordDbQuery(operation: string, collection: string, duration: number): void {
    dbQueryCounter.inc({ operation, collection });
    dbQueryDuration.observe({ operation, collection }, duration / 1000);
  }

  /**
   * 记录Redis操作
   */
  static recordRedisOperation(operation: string): void {
    redisOperationCounter.inc({ operation });
  }

  /**
   * 更新活跃用户数
   */
  static updateActiveUsers(count: number): void {
    activeUsersGauge.set(count);
  }

  /**
   * 记录API错误
   */
  static recordApiError(errorType: string, route: string): void {
    apiErrorCounter.inc({ error_type: errorType, route });
  }

  /**
   * 获取Prometheus指标
   */
  static async getMetrics(): Promise<string> {
    return await register.metrics();
  }
}

export const monitorService = MonitorService;
