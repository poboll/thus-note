import * as nodemailer from 'nodemailer';
import { logger } from '../config/logger';

/**
 * 邮件发送工具
 */

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * 发送邮件
 * @param to 收件人邮箱
 * @param subject 邮件主题
 * @param html 邮件内容（HTML格式）
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"如是(Thus-Note)" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    logger.info(`邮件发送成功: ${to}, Message ID: ${info.messageId}`);
  } catch (error) {
    logger.error('邮件发送失败:', error);
    throw new Error('邮件发送失败');
  }
}

/**
 * 发送验证码邮件
 * @param to 收件人邮箱
 * @param code 验证码
 */
export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>验证码 - 如是(Thus-Note)</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }
        .content {
          background: white;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          color: #007bff;
          text-align: center;
          margin: 20px 0;
          letter-spacing: 5px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">如是(Thus-Note)</div>
        </div>
        <div class="content">
          <h2>您的验证码</h2>
          <p>您好，</p>
          <p>您正在使用如是(Thus-Note)的验证码登录功能，您的验证码是：</p>
          <div class="code">${code}</div>
          <p>验证码有效期为 5 分钟，请尽快使用。</p>
          <p>如果这不是您的操作，请忽略此邮件。</p>
        </div>
        <div class="footer">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>© 2025 如是(Thus-Note). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, '如是(Thus-Note) - 验证码', html);
}

/**
 * 发送欢迎邮件
 * @param to 收件人邮箱
 * @param username 用户名
 */
export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>欢迎加入如是(Thus-Note)</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }
        .content {
          background: white;
          padding: 20px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #666;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">如是(Thus-Note)</div>
        </div>
        <div class="content">
          <h2>欢迎加入如是(Thus-Note)！</h2>
          <p>亲爱的 <strong>${username}</strong>，</p>
          <p>感谢您注册如是(Thus-Note)！我们很高兴您成为我们的一员。</p>
          <p>如是(Thus-Note) 是一款面向多平台的原子化笔记系统，帮助您高效管理信息、记录灵感、提升生产力。</p>
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}" class="button">开始使用</a>
          </p>
          <h3>主要功能：</h3>
          <ul>
            <li>✨ 原子化信息管理</li>
            <li>🌐 多平台无缝同步</li>
            <li>📴 离线优先架构</li>
            <li>🤖 AI 智能助手</li>
            <li>🔒 隐私安全保护</li>
          </ul>
          <p>如果您有任何问题或建议，欢迎随时联系我们。</p>
        </div>
        <div class="footer">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>© 2025 如是(Thus-Note). All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(to, '欢迎加入如是(Thus-Note)！', html);
}
