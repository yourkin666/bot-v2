const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const chatRoutes = require('./routes/chat');
const searchRoutes = require('./routes/search');
const voiceRoutes = require('./routes/voice');
const weatherRoutes = require('./routes/weather');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = config.server.port;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 路由
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
app.listen(PORT, () => {
  console.log(`🚀 AI小子后端服务启动成功！`);
  console.log(`🌐 展示页面: http://localhost:${PORT}/webpage`);
}); 