import winston from 'winston';
import path from 'path';

/**
 * 日志配置 - 低内存优化
 */

const logDir = path.join(process.cwd(), 'logs');
const isProduction = process.env.NODE_ENV === 'production';

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const transports: winston.transport[] = [
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    maxsize: isProduction ? 2097152 : 5242880, // 2MB prod / 5MB dev
    maxFiles: isProduction ? 2 : 5,
  }),
  // 所有日志文件
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    maxsize: isProduction ? 2097152 : 5242880,
    maxFiles: isProduction ? 2 : 5,
  }),
];

// 控制台输出 (只添加一次)
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'info'),
  format: logFormat,
  transports,
});
