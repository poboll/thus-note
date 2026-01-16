import Redis from 'ioredis';

/**
 * Redis连接配置
 */
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);

/**
 * Redis客户端实例
 */
let redisClient: Redis | null = null;
let redisConnected = false;
let redisErrorLogged = false;

/**
 * 创建Redis连接
 */
export function createRedisClient(): Redis {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: REDIS_PASSWORD,
    db: REDIS_DB,
    retryStrategy: (times) => {
      // 只重试3次，然后停止重试
      if (times > 3) {
        if (!redisErrorLogged) {
          console.warn('⚠️  Redis connection failed after 3 retries, running without Redis caching');
          redisErrorLogged = true;
        }
        return null; // 停止重试
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 1, // 减少重试次数
    enableOfflineQueue: false, // 禁用离线队列
    enableReadyCheck: false, // 禁用ready检查
  });

  // 监听连接事件
  client.on('connect', () => {
    console.log('✅ Redis connected');
    redisConnected = true;
  });

  client.on('error', (error) => {
    // 只在第一次连接失败时打印错误
    if (!redisErrorLogged) {
      console.error('❌ Redis connection error:', error.message);
      console.warn('⚠️  Application will run without Redis caching');
      redisErrorLogged = true;
    }
  });

  client.on('close', () => {
    if (redisConnected) {
      console.warn('⚠️  Redis connection closed');
      redisConnected = false;
    }
  });

  client.on('reconnecting', () => {
    if (!redisConnected && !redisErrorLogged) {
      console.log('🔄 Redis reconnecting...');
    }
  });

  return client;
}

/**
 * 获取Redis客户端
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

/**
 * 断开Redis连接
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis disconnected');
  }
}

/**
 * Redis工具函数
 */
export const redisUtils = {
  /**
   * 设置键值对
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedisClient();
    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  },

  /**
   * 获取值
   */
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.get(key);
  },

  /**
   * 删除键
   */
  async del(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.del(key);
  },

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },

  /**
   * 设置过期时间
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.expire(key, seconds);
    return result === 1;
  },

  /**
   * 递增计数器
   */
  async incr(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.incr(key);
  },

  /**
   * 带过期时间的递增计数器
   */
  async incrWithExpiry(key: string, ttl: number): Promise<number> {
    const client = getRedisClient();
    const value = await client.incr(key);
    if (value === 1) {
      await client.expire(key, ttl);
    }
    return value;
  },

  /**
   * 获取所有匹配的键
   */
  async keys(pattern: string): Promise<string[]> {
    const client = getRedisClient();
    return await client.keys(pattern);
  },

  /**
   * 删除所有匹配的键
   */
  async delPattern(pattern: string): Promise<number> {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return await client.del(...keys);
  },
};

/**
 * 限流工具
 */
export const rateLimitUtils = {
  /**
   * 检查是否超过限流
   * @param key 限流键
   * @param limit 限流次数
   * @param window 时间窗口（秒）
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  async checkRateLimit(
    key: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const client = getRedisClient();
    const now = Date.now();
    const windowStart = now - window * 1000;

    // 使用有序集合存储请求时间戳
    await client.zremrangebyscore(key, '-inf', windowStart);
    const count = await client.zcard(key);

    if (count >= limit) {
      // 获取最早的请求时间戳作为重置时间
      const oldest = await client.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldest.length > 0 ? parseInt(oldest[1], 10) + window * 1000 : now + window * 1000;
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // 添加当前请求时间戳
    await client.zadd(key, now, `${now}-${Math.random()}`);
    await client.expire(key, window);

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetTime: now + window * 1000,
    };
  },

  /**
   * 简单限流（使用计数器）
   * @param key 限流键
   * @param limit 限流次数
   * @param ttl 时间窗口（秒）
   * @returns 是否允许请求
   */
  async checkSimpleRateLimit(
    key: string,
    limit: number,
    ttl: number
  ): Promise<boolean> {
    const client = getRedisClient();
    const count = await redisUtils.incrWithExpiry(key, ttl);
    return count <= limit;
  },
};

/**
 * IP封禁工具
 */
export const ipBlockUtils = {
  /**
   * 封禁IP
   */
  async blockIP(ip: string, reason?: string, ttl?: number): Promise<void> {
    const client = getRedisClient();
    const key = `blocked:ips:${ip}`;
    const data = JSON.stringify({
      blockedAt: Date.now(),
      reason: reason || 'Blocked by system',
    });
    await redisUtils.set(key, data, ttl);
  },

  /**
   * 检查IP是否被封禁
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    return await redisUtils.exists(`blocked:ips:${ip}`);
  },

  /**
   * 解封IP
   */
  async unblockIP(ip: string): Promise<void> {
    await redisUtils.del(`blocked:ips:${ip}`);
  },

  /**
   * 获取封禁信息
   */
  async getBlockInfo(ip: string): Promise<any | null> {
    const data = await redisUtils.get(`blocked:ips:${ip}`);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  },
};
