import { getRedisClient } from '../config/redis';

/**
 * 缓存服务类
 * 用于管理Redis缓存
 */
export class CacheService {
  private static readonly DEFAULT_TTL = 3600; // 1小时

  /**
   * 设置缓存
   */
  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const client = getRedisClient();
      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('设置缓存失败:', error);
    }
  }

  /**
   * 获取缓存
   */
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  static async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(key);
    } catch (error) {
      console.error('删除缓存失败:', error);
    }
  }

  /**
   * 删除多个缓存
   */
  static async delMultiple(keys: string[]): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(...keys);
    } catch (error) {
      console.error('删除多个缓存失败:', error);
    }
  }

  /**
   * 检查缓存是否存在
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('检查缓存存在失败:', error);
      return false;
    }
  }

  /**
   * 设置过期时间
   */
  static async expire(key: string, ttl: number): Promise<void> {
    try {
      const client = getRedisClient();
      await client.expire(key, ttl);
    } catch (error) {
      console.error('设置缓存过期时间失败:', error);
    }
  }

  /**
   * 获取剩余过期时间
   */
  static async ttl(key: string): Promise<number> {
    try {
      const client = getRedisClient();
      return await client.ttl(key);
    } catch (error) {
      console.error('获取缓存过期时间失败:', error);
      return -1;
    }
  }

  /**
   * 增加计数器
   */
  static async incr(key: string): Promise<number> {
    try {
      const client = getRedisClient();
      return await client.incr(key);
    } catch (error) {
      console.error('增加计数器失败:', error);
      return 0;
    }
  }

  /**
   * 减少计数器
   */
  static async decr(key: string): Promise<number> {
    try {
      const client = getRedisClient();
      return await client.decr(key);
    } catch (error) {
      console.error('减少计数器失败:', error);
      return 0;
    }
  }

  /**
   * 清空所有缓存
   */
  static async flushAll(): Promise<void> {
    try {
      const client = getRedisClient();
      await client.flushdb();
    } catch (error) {
      console.error('清空所有缓存失败:', error);
    }
  }

  /**
   * 生成缓存键
   */
  static generateKey(prefix: string, ...parts: string[]): string {
    return [prefix, ...parts].join(':');
  }
}

export const cacheService = CacheService;
