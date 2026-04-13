import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { initializeConnections, closeConnections, getConnectionStatuses } from './config';
import testRouter from './routes/test';
import helloWorldRouter from './routes/hello-world';
import authRouter from './routes/auth';
import userLoginRouter from './routes/user-login';
import wechatScanCallbackRouter from './routes/wechat-scan-callback';
import userSettingsRouter from './routes/user-settings';
import threadsRouter from './routes/threads';
import contentsRouter from './routes/contents';
import commentsRouter from './routes/comments';
import syncRouter from './routes/sync';
import settingsRouter from './routes/settings';
import filesRouter from './routes/files';
import aiRouter from './routes/ai';
import tasksRouter from './routes/tasks';
import policiesRouter from './routes/policies';
import versionRouter from './routes/version';
import wechatRouter from './routes/wechat';
import openConnectRouter from './routes/openConnect';
import adminRouter from './routes/admin';
import subscribePlanRouter from './routes/subscribe-plan';
import paymentOrderRouter from './routes/payment-order';
import { securityHeaders, apiRateLimiter } from './middleware/security';
import { logger } from './config/logger';
import { MonitorService } from './services/monitorService';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
}));

// CORS中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// 压缩中间件
app.use(compression());

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    // 记录性能指标
    MonitorService.recordHttpRequest(req.method, req.path, res.statusCode, duration);
  });
  next();
});

// API限流中间件
app.use('/api/', apiRateLimiter);

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  const statuses = getConnectionStatuses();
  res.json({
    status: 'ok',
    message: 'Thus-Note Server is running',
    timestamp: new Date().toISOString(),
    connections: statuses,
    uptime: process.uptime(),
  });
});

// 数据库状态检查
app.get('/health/db', (req: Request, res: Response) => {
  const statuses = getConnectionStatuses();
  res.json({
    mongodb: statuses.mongodb,
    redis: statuses.redis,
    timestamp: new Date().toISOString(),
  });
});

// API路由
app.use('/api/test', testRouter);
app.use('/hello-world', helloWorldRouter); // 前端时间校准接口
app.use('/api/auth', authRouter);
app.use('/user-login', userLoginRouter); // 前端兼容路由
app.use('/user-settings', userSettingsRouter); // 前端用户设置路由
app.use('/api/wechat', wechatScanCallbackRouter);
app.use('/sync-set', syncRouter); // 前端兼容路由
app.use('/sync-get', syncRouter); // 前端兼容路由
app.use('/api/threads', threadsRouter);
app.use('/api/contents', contentsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/files', filesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/policies', policiesRouter);
app.use('/api/version', versionRouter);
app.use('/api/wechat', wechatRouter);
app.use('/api/open-connect', openConnectRouter);
app.use('/open-connect', openConnectRouter); // 前端兼容路由
app.use('/api/admin', adminRouter);
app.use('/subscribe-plan', subscribePlanRouter);
app.use('/payment-order', paymentOrderRouter);

// 静态文件服务（上传的文件）
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// 404处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 'E0002',
    errMsg: 'Not Found',
    path: req.path,
  });
});

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Error:', err);
  MonitorService.recordApiError(err.name || 'UnknownError', req.path);
  res.status(500).json({
    code: 'E0003',
    errMsg: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库连接
    await initializeConnections();

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✅ Thus-Note Server is running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📡 Database status: http://localhost:${PORT}/health/db`);
      console.log(`📡 API endpoint: http://localhost:${PORT}/api/*`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(50));
      console.log(`\n🎯 Server ready for development!`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeConnections();
  process.exit(0);
});

// 启动服务器
startServer();
