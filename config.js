// 配置文件
module.exports = {
  // AI 对话服务配置（使用硅基流动）
  openai: {
    apiKey: 'sk-icupqsqwcgsfnqbwpcgfertxbdlkksapxtacxlupjzanguyv',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-7B-Instruct' // 硅基流动推荐的模型
  },
  
  // 联网搜索服务配置
  search: {
    apiKey: 'sk-38eaefcfac2d4c39a50c3cd686022e2d',
    enabled: true
  },
  
  // 服务器配置
  server: {
    port: process.env.PORT || 3002,
    host: '0.0.0.0' // 监听所有网络接口，允许外部访问
  },
  
  // AI 小子配置
  ai: {
    maxTokens: 1000,
    temperature: 0.7,
    maxHistoryMessages: 20
  },

  // 用户认证配置
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: '7d',
    sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
    verificationCodeExpiry: 10 * 60 * 1000 // 10分钟
  },

  // 邮件服务配置
  email: {
    // 使用QQ邮箱或其他SMTP服务
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        // ⚠️ 请在下面填入您的邮箱和授权码
        user: process.env.SMTP_USER || '2518016656@qq.com', // 您的QQ邮箱
        pass: process.env.SMTP_PASS || 'zybjsohgnvardjbh'  // 您的QQ邮箱授权码
      }
    },
    from: process.env.EMAIL_FROM || '2518016656@qq.com', // 发件人邮箱
    // 验证码模板
    templates: {
      verification: {
        subject: 'AI小子 - 邮箱验证码',
        getHtml: (code) => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; text-align: center;">AI小子邮箱验证</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p style="font-size: 16px; margin-bottom: 10px;">您的验证码是：</p>
              <div style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                ${code}
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                验证码有效期为10分钟，请及时使用。如果您没有请求此验证码，请忽略此邮件。
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
              <p>此邮件由AI小子系统自动发送，请勿回复。</p>
            </div>
          </div>
        `
      }
    }
  }
}; 