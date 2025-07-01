const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    try {
      // 检查邮件配置
      if (!config.email.smtp.auth.user || !config.email.smtp.auth.pass) {
        console.warn('⚠️ 邮件服务未配置，请在配置文件中设置SMTP信息');
        return;
      }

      // 创建邮件传输器
      this.transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass
        }
      });

      // 验证邮件服务连接
      await this.verifyConnection();
      console.log('📧 邮件服务初始化成功');
    } catch (error) {
      console.error('邮件服务初始化失败:', error);
    }
  }

  // 验证邮件服务连接
  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('邮件传输器未初始化');
    }

    try {
      await this.transporter.verify();
      console.log('✅ 邮件服务连接验证成功');
      return true;
    } catch (error) {
      console.error('❌ 邮件服务连接验证失败:', error);
      throw error;
    }
  }

  // 发送验证码邮件
  async sendVerificationCode(email, code) {
    if (!this.transporter) {
      console.error('邮件服务未初始化，无法发送邮件');
      return { success: false, message: '邮件服务未配置' };
    }

    try {
      const template = config.email.templates.verification;
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: template.subject,
        html: template.getHtml(code)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 验证码邮件发送成功: ${email} -> ${info.messageId}`);
      
      return {
        success: true,
        message: '验证码已发送到您的邮箱',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('发送验证码邮件失败:', error);
      
      // 根据错误类型返回不同的错误消息
      let errorMessage = '邮件发送失败，请稍后重试';
      
      if (error.code === 'EAUTH') {
        errorMessage = '邮件服务认证失败，请联系管理员';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = '邮件服务器连接失败';
      } else if (error.code === 'ECONNECTION') {
        errorMessage = '网络连接失败，请检查网络';
      } else if (error.responseCode === 550) {
        errorMessage = '邮箱地址无效或不存在';
      } else if (error.responseCode === 554) {
        errorMessage = '邮件被拒绝，请检查邮箱地址';
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  // 发送欢迎邮件
  async sendWelcomeEmail(email, userName = '') {
    if (!this.transporter) {
      console.error('邮件服务未初始化');
      return { success: false, message: '邮件服务未配置' };
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: '欢迎使用AI小子！',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center;">🎉 欢迎加入AI小子大家庭！</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 16px;">
                ${userName ? `亲爱的 ${userName}，` : '您好！'}
              </p>
              <p style="font-size: 16px;">
                感谢您注册AI小子！现在您可以：
              </p>
              <ul style="font-size: 14px; line-height: 1.6;">
                <li>🤖 与AI小子进行智能对话</li>
                <li>🔍 使用联网搜索功能获取最新信息</li>
                <li>📁 上传文件进行分析和讨论</li>
                <li>🌤️ 查询天气信息</li>
                <li>🎵 享受语音交互功能</li>
              </ul>
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
                开始您的AI之旅吧！如果您有任何问题，请随时联系我们。
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}" 
                 style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                开始使用AI小子
              </a>
            </div>
            <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
              <p>此邮件由AI小子系统自动发送，请勿回复。</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 欢迎邮件发送成功: ${email} -> ${info.messageId}`);
      
      return {
        success: true,
        message: '欢迎邮件发送成功',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('发送欢迎邮件失败:', error);
      return {
        success: false,
        message: '欢迎邮件发送失败',
        error: error.message
      };
    }
  }

  // 发送密码重置邮件（预留功能）
  async sendPasswordResetEmail(email, resetToken) {
    if (!this.transporter) {
      return { success: false, message: '邮件服务未配置' };
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'AI小子 - 密码重置',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center;">🔒 密码重置请求</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 16px;">
                您请求重置AI小子账户的密码。点击下面的按钮来重置您的密码：
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
                  重置密码
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                如果您没有请求密码重置，请忽略此邮件。此链接将在24小时后失效。
              </p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                如果上面的按钮无法点击，请复制以下链接到浏览器：<br/>
                ${resetUrl}
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
              <p>此邮件由AI小子系统自动发送，请勿回复。</p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 密码重置邮件发送成功: ${email} -> ${info.messageId}`);
      
      return {
        success: true,
        message: '密码重置邮件发送成功',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('发送密码重置邮件失败:', error);
      return {
        success: false,
        message: '密码重置邮件发送失败',
        error: error.message
      };
    }
  }

  // 检查邮件服务状态
  getServiceStatus() {
    return {
      initialized: !!this.transporter,
      configured: !!(config.email.smtp.auth.user && config.email.smtp.auth.pass),
      host: config.email.smtp.host,
      from: config.email.from
    };
  }
}

module.exports = new EmailService(); 