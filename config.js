// 加载环境变量
require('dotenv').config();

// 验证必需的环境变量
function validateEnvironment() {
  const required = [
    'OPENAI_API_KEY',
    'DEEPSEEK_API_KEY', 
    'SEARCH_API_KEY',
    'JWT_SECRET',
    'SESSION_SECRET',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必需的环境变量:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('📝 请检查 .env 文件或参考 .env.example 模板');
    process.exit(1);
  } else {
    console.log('✅ 所有环境变量配置完成');
  }
}

// 验证环境变量
validateEnvironment();

// 配置文件
module.exports = {
  // AI 对话服务配置（使用硅基流动）
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1',
    model: process.env.OPENAI_MODEL || 'Qwen/Qwen2.5-7B-Instruct'
  },
  
  // 深度思考模型配置（硅基流动 deepseek R1）
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.siliconflow.cn/v1',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-ai/DeepSeek-R1'
  },
  
  // 联网搜索服务配置
  search: {
    apiKey: process.env.SEARCH_API_KEY,
    enabled: process.env.SEARCH_ENABLED === 'true'
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
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM,
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