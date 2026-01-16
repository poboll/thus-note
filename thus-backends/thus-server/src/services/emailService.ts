import * as nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';

/**
 * 邮件服务类
 */
export class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });
  }

  /**
   * 发送验证码邮件
   */
  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: '如是笔记 - 验证码',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">验证码</h2>
            <p>您好，</p>
            <p>您的验证码是：<strong style="font-size: 24px; color: #007bff;">${code}</strong></p>
            <p>验证码有效期为10分钟，请尽快使用。</p>
            <p>如果这不是您本人的操作，请忽略此邮件。</p>
            <p style="color: #666; font-size: 12px;">如是笔记团队</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('发送验证码邮件失败:', error);
      return false;
    }
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: '欢迎加入如是笔记',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">欢迎加入如是笔记</h2>
            <p>亲爱的 ${username}，</p>
            <p>欢迎您加入如是笔记！</p>
            <p>如是笔记是一款面向多平台的原子化笔记系统，致力于为您提供"如是记录，真实自我"的使用体验。</p>
            <p>您现在可以开始创建笔记、管理任务、使用AI助手等功能。</p>
            <p>如有任何问题，请随时联系我们。</p>
            <p style="color: #666; font-size: 12px;">如是笔记团队</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('发送欢迎邮件失败:', error);
      return false;
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5175'}/reset-password?token=${resetToken}`;

      await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: '如是笔记 - 密码重置',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">密码重置</h2>
            <p>您好，</p>
            <p>我们收到了您的密码重置请求。</p>
            <p>请点击以下链接重置您的密码：</p>
            <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">重置密码</a></p>
            <p>该链接有效期为1小时。</p>
            <p>如果这不是您本人的操作，请忽略此邮件。</p>
            <p style="color: #666; font-size: 12px;">如是笔记团队</p>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('发送密码重置邮件失败:', error);
      return false;
    }
  }
}

// 导出单例
export const emailService = new EmailService();
