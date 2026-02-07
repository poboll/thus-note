import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verify } from 'jsonwebtoken';
import { errorResponse } from '../types/api.types';
import { logger } from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * WebSocket服务类
 * 用于实时通知
 */
export class WebSocketService {
  private io: SocketIOServer | null = null;

  /**
   * 初始化WebSocket服务
   */
  init(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      },
    });

    // 身份验证中间件
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('未提供认证令牌'));
        }

        // 验证令牌
        try {
          const decoded: any = verify(token, JWT_SECRET);
          socket.data.userId = decoded.userId;
          logger.info(`用户 ${decoded.userId} JWT验证成功`);
          next();
        } catch (error) {
          logger.error('WebSocket JWT验证失败:', error);
          next(new Error('无效或过期的令牌'));
        }
      } catch (error) {
        next(error);
      }
    });

    // 连接处理
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      logger.info(`用户 ${userId} 连接WebSocket`);

      // 加入用户房间
      socket.join(`user:${userId}`);

      // 处理断开连接
      socket.on('disconnect', () => {
        logger.info(`用户 ${userId} 断开WebSocket`);
        socket.leave(`user:${userId}`);
      });
    });

    logger.info('✅ WebSocket服务已启动');
  }

  /**
   * 发送通知给特定用户
   */
  async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    if (!this.io) {
      return;
    }

    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * 发送通知给所有用户
   */
  async sendBroadcastNotification(notification: any): Promise<void> {
    if (!this.io) {
      return;
    }

    this.io.emit('notification', notification);
  }

  /**
   * 发送评论通知
   */
  async sendCommentNotification(userId: string, comment: any): Promise<void> {
    const notification = {
      type: 'comment',
      data: comment,
      timestamp: new Date().toISOString(),
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * 发送@提及通知
   */
  async sendMentionNotification(userId: string, mention: any): Promise<void> {
    const notification = {
      type: 'mention',
      data: mention,
      timestamp: new Date().toISOString(),
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * 发送任务提醒
   */
  async sendTaskReminder(userId: string, task: any): Promise<void> {
    const notification = {
      type: 'task_reminder',
      data: task,
      timestamp: new Date().toISOString(),
    };

    await this.sendNotificationToUser(userId, notification);
  }

  /**
   * 发送系统通知
   */
  async sendSystemNotification(message: string): Promise<void> {
    const notification = {
      type: 'system',
      data: { message },
      timestamp: new Date().toISOString(),
    };

    await this.sendBroadcastNotification(notification);
  }
}

export const websocketService = new WebSocketService();
