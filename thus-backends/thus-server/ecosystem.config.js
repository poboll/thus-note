/**
 * PM2 进程管理配置
 * 用于生产环境部署 Thus-Note 后端服务
 *
 * 使用方法:
 * - 启动: pm2 start ecosystem.config.js
 * - 重启: pm2 restart thus-server
 * - 停止: pm2 stop thus-server
 * - 查看日志: pm2 logs thus-server
 * - 监控: pm2 monit
 */

module.exports = {
  apps: [
    {
      // 应用名称
      name: 'thus-server',

      // 启动文件 (构建后的入口)
      script: './dist/index.js',

      // 运行目录
      cwd: './',

      // 实例数量 (cluster 模式)
      // 设置为 'max' 则使用所有 CPU 核心
      // 生产环境建议设置为 2-4，避免资源浪费
      instances: 2,

      // 模式: cluster (集群) / fork (单进程)
      exec_mode: 'cluster',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // 监听文件变化自动重启 (生产环境建议关闭)
      watch: false,

      // 最大内存限制 (超过则自动重启)
      max_memory_restart: '500M',

      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // 合并日志
      merge_logs: true,

      // 自动重启配置
      autorestart: true,

      // 最大重启次数 (避免无限重启)
      max_restarts: 10,

      // 最小运行时间 (低于此值则认为启动失败)
      min_uptime: '10s',

      // 异常重启延迟
      restart_delay: 4000,

      // 优雅关闭超时时间
      kill_timeout: 5000,

      // 监听端口
      listen_timeout: 3000,

      // 进程 ID 文件
      pid_file: './pids/thus-server.pid',
    },
  ],
};
