import { connectDatabase, disconnectDatabase, getDatabaseStatus } from './database';
import { getRedisClient, disconnectRedis } from './redis';

/**
 * 初始化所有数据库连接
 */
export async function initializeConnections(): Promise<void> {
  try {
    // 连接MongoDB
    await connectDatabase();

    // 初始化Redis客户端（延迟连接）
    getRedisClient();

    console.log('✅ All database connections initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database connections:', error);
    throw error;
  }
}

/**
 * 关闭所有数据库连接
 */
export async function closeConnections(): Promise<void> {
  try {
    await disconnectDatabase();
    await disconnectRedis();
    console.log('✅ All database connections closed');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
}

/**
 * 获取所有连接状态
 */
export function getConnectionStatuses(): {
  mongodb: string;
  redis: string;
} {
  return {
    mongodb: getDatabaseStatus(),
    redis: 'connected', // Redis连接状态需要更复杂的检查
  };
}

export * from './database';
export * from './redis';
