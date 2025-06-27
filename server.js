const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const chatRoutes = require('./routes/chat');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = config.server.port;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 路由
app.use('/api/chat', chatRoutes);
app.use('/api/search', searchRoutes);

// 提供静态文件服务（前端页面）
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/webpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'webpage.html'));
});

// 搜索测试页面路由已移除

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI小子后端服务启动成功！`);
  console.log(`📱 聊天界面: http://localhost:${PORT}`);
  console.log(`🌐 展示页面: http://localhost:${PORT}/webpage`);
  console.log(`📡 API地址: http://localhost:${PORT}/api`);
}); 