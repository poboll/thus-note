/**
 * PM2 进程管理配置 - 低内存优化版
 * 
 * 使用方法:
 * - 启动: pm2 start ecosystem.config.js
 * - 重启: pm2 restart thus-server
 * - 停止: pm2 stop thus-server
 * - 查看日志: pm2 logs thus-server
 */

module.exports = {
  apps: [
    {
      name: 'thus-server',
      script: './dist/index.js',
      cwd: './',

      // 单实例 fork 模式，省内存
      instances: 1,
      exec_mode: 'fork',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=256',
      },

      // 不监听文件变化
      watch: false,

      // 内存超 300M 自动重启
      max_memory_restart: '300M',

      // 日志配置 - 最小化
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,

      // 日志文件大小限制 (需要 pm2-logrotate)
      // pm2 install pm2-logrotate
      // pm2 set pm2-logrotate:max_size 10M
      // pm2 set pm2-logrotate:retain 3

      // 自动重启
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,

      // 优雅关闭
      kill_timeout: 5000,
      listen_timeout: 3000,
    },
  ],
};
