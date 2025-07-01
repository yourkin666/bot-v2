const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const config = require('./config');
const chatRoutes = require('./routes/chat');
const searchRoutes = require('./routes/search');
const voiceRoutes = require('./routes/voice');
const weatherRoutes = require('./routes/weather');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = config.server.port;

// 中间件
app.use(cors({
  origin: true, // 允许所有来源（生产环境应该指定具体域名）
  credentials: true, // 允许携带认证信息
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 会话管理
app.use(session({
  secret: config.auth.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 开发环境设为false，生产环境设为true（HTTPS）
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24小时
  }
}));

app.use(express.static(path.join(__dirname)));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/upload', uploadRoutes);

// 提供静态文件服务（前端页面）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/webpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'webpage.html'));
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 AI小子后端服务启动成功！`);
  console.log(`🌐 展示页面: http://localhost:${PORT}/webpage`);
  console.log(`🌐 主页面: http://localhost:${PORT}/`);
  console.log(`📧 认证API: http://localhost:${PORT}/api/auth`);
  console.log(`💬 聊天API: http://localhost:${PORT}/api/chat`);
  
  // 显示邮件服务状态
  const emailService = require('./services/emailService');
  const emailStatus = emailService.getServiceStatus();
  
  if (emailStatus.configured && emailStatus.initialized) {
    console.log(`✅ 邮件服务已配置: ${emailStatus.host}`);
  } else if (emailStatus.configured) {
    console.log(`⚠️  邮件服务已配置但初始化失败`);
  } else {
    console.log(`❌ 邮件服务未配置，请在配置文件中设置SMTP信息`);
    console.log(`   需要设置: SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM`);
  }
  
  // 显示认证配置状态
  if (config.auth.jwtSecret.includes('change-in-production')) {
    console.log(`⚠️  JWT密钥使用默认值，生产环境请修改`);
  }
  
  // 启动定时清理任务
  const userService = require('./services/userService');
  
  // 每小时清理一次过期验证码
  setInterval(async () => {
    try {
      await userService.cleanupExpiredCodes();
    } catch (error) {
      console.error('定时清理过期验证码失败:', error);
    }
  }, 60 * 60 * 1000); // 1小时
  
  // 立即执行一次清理
  setTimeout(async () => {
    try {
      await userService.cleanupExpiredCodes();
    } catch (error) {
      console.error('初始清理过期验证码失败:', error);
    }
  }, 5000); // 5秒后执行
  
  console.log(`⏰ 定时清理任务已启动（每小时清理过期验证码）`);
  console.log(`🎉 所有服务已就绪！`);
}); 