# 🤖 AI 小子 - 智能儿童聊天机器人

一个专为儿童设计的多模态 AI 聊天助手，支持文字、图片、音频、视频等多种形式的智能对话。

## ✨ 核心特性

### 🎨 多模态交互

- **📸 图片分析**: 智能识别图片内容，支持 OCR 文字识别
- **🎵 音频处理**: 支持 30+种音频格式上传和分析
- **🎬 视频分析**: 支持多种视频格式的内容理解
- **📄 文档处理**: 支持 PDF、Word、Excel 等文档类型

### 💬 智能对话

- **🧠 儿童友好 AI**: 专门针对儿童优化的对话风格
- **🔍 联网搜索**: 实时获取最新信息
- **🌤️ 天气查询**: 智能天气信息获取
- **🎙️ 语音交互**: 录音功能和语音识别
- **💭 思考过程**: 可视化 AI 思考过程

### 🎯 用户体验

- **📱 响应式设计**: 完美适配各种设备
- **⚡ 流式输出**: 实时打字机效果
- **📚 聊天历史**: 完整的对话记录管理
- **🎨 美观界面**: 现代化 UI 设计
- **🔧 错误处理**: 智能降级和用户友好提示

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourkin666/bot-v2.git
cd bot-v2
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境

复制并编辑配置文件：

```bash
cp config.example.js config.js
```

编辑 `config.js` 并填入必要信息：

```javascript
module.exports = {
  openai: {
    apiKey: "your-openai-api-key",
    baseURL: "https://api.openai.com/v1", // 或其他兼容接口
    model: "gpt-3.5-turbo", // 或支持视觉的模型如 gpt-4o-mini
  },
  server: {
    port: 3002,
  },
  ai: {
    maxTokens: 1000,
    temperature: 0.7,
  },
};
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 5. 访问应用

- **主界面**: http://localhost:3002
- **展示页面**: http://localhost:3002/webpage

## 📁 项目结构

```
bot-v2/
├── server.js                 # 主服务器入口
├── config.js                 # 配置文件
├── package.json              # 项目依赖配置
├── routes/                   # 路由模块
│   ├── chat.js              # 聊天功能路由
│   ├── upload.js            # 文件上传路由
│   ├── search.js            # 搜索功能路由
│   ├── voice.js             # 语音功能路由
│   └── weather.js           # 天气功能路由
├── services/                 # 服务模块
│   ├── aiService.js         # AI核心服务
│   ├── searchService.js     # 搜索服务
│   ├── voiceService.js      # 语音服务
│   └── weatherService.js    # 天气服务
├── utils/                    # 工具模块
│   └── storage.js           # 数据存储工具
├── data/                     # 数据存储目录
│   └── chats.json           # 聊天记录
├── uploads/                  # 文件上传目录
├── index.html               # 主聊天界面
├── webpage.html             # 项目展示页面
└── README.md               # 项目文档
```

## 🔌 API 接口文档

### 聊天相关

#### 发送消息

```http
POST /api/chat/send
Content-Type: application/json

{
  "message": "你好，AI小子！",
  "chatId": "optional-chat-id",
  "useThinking": false,
  "useSearch": false,
  "attachedFiles": [
    {
      "filename": "image.jpg",
      "originalname": "我的图片.jpg",
      "mimetype": "image/jpeg",
      "size": 1024000,
      "url": "/api/upload/file/xxx.jpg"
    }
  ]
}
```

#### 流式聊天

```http
POST /api/chat/stream
Content-Type: application/json

{
  "message": "请分析这张图片",
  "chatId": "optional-chat-id",
  "useThinking": false,
  "useSearch": true,
  "attachedFiles": [...]
}
```

#### 获取聊天历史

```http
GET /api/chat/history
```

#### 获取特定聊天

```http
GET /api/chat/:chatId
```

### 文件上传相关

#### 上传文件

```http
POST /api/upload
Content-Type: multipart/form-data

files: [File, File, ...] // 支持多文件上传
```

#### 获取文件

```http
GET /api/upload/file/:filename
```

#### 获取文件列表

```http
GET /api/upload/list
```

#### 删除文件

```http
DELETE /api/upload/file/:filename
```

### 搜索相关

#### 网络搜索

```http
POST /api/search
Content-Type: application/json

{
  "query": "搜索关键词",
  "maxResults": 10
}
```

### 天气相关

#### 获取天气信息

```http
GET /api/weather?city=北京
```

### 语音相关

#### 语音识别

```http
POST /api/voice/recognize
Content-Type: multipart/form-data

audio: [AudioFile]
```

## 🎯 多模态功能详解

### 📸 图片分析

支持的图片格式：

- **常见格式**: JPEG, PNG, GIF, WebP
- **专业格式**: BMP, TIFF, SVG

功能特点：

- 🔍 **内容识别**: 描述图片中的物体、场景、人物
- 📝 **文字提取**: OCR 识别图片中的文字内容
- 🎓 **教育辅助**: 识别作业题目、学习材料
- 🎨 **创意描述**: 用儿童友好的语言描述图片

### 🎵 音频处理

支持的音频格式：

```
MP3, WAV, OGG, AAC, FLAC, M4A, WMA, 3GP, AMR,
AU, AIFF, CAF, MP4A, MKA, OPUS, RA, WV 等30+种格式
```

功能特点：

- 📊 **基础信息**: 文件格式、大小、时长分析
- 🎙️ **内容理解**: 音频内容的基础分析
- 🔮 **扩展能力**: 可集成语音转文字功能

### 🎬 视频分析

支持的视频格式：

```
MP4, AVI, MOV, WMV, WebM, OGG, 3GP, FLV, MKV,
M4V, MPEG, MPG, F4V, SWF, ASF, RM, RMVB 等
```

功能特点：

- 📹 **格式识别**: 自动识别视频格式和基础信息
- 🎞️ **内容分析**: 视频内容的基础理解
- 🔮 **扩展能力**: 可集成关键帧提取、内容识别

### 📄 文档处理

支持的文档格式：

- **文本类**: TXT, RTF, CSV
- **办公文档**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **其他格式**: Markdown, JSON, XML

功能特点：

- 📋 **文件信息**: 格式、大小、基础元数据
- 📖 **内容摘要**: 文档内容的基础分析
- 🔮 **扩展能力**: 可集成文档解析、OCR 功能

## 🛠 技术栈

### 后端技术

- **运行环境**: Node.js 18+
- **Web 框架**: Express.js
- **文件处理**: Multer (文件上传)
- **AI 服务**: OpenAI API / 兼容接口
- **搜索服务**: Brave Search API
- **天气服务**: OpenWeatherMap API

### 前端技术

- **基础技术**: HTML5, CSS3, JavaScript (ES6+)
- **UI 框架**: Tailwind CSS
- **图标库**: Remix Icons
- **数学渲染**: MathJax
- **Markdown**: Marked.js

### 存储方案

- **聊天数据**: JSON 文件存储
- **文件存储**: 本地文件系统
- **配置管理**: JavaScript 配置文件

## 🎮 使用示例

### 基础对话

```
用户: 你好，AI小子！
AI小子: 你好呀！我是AI小子，很高兴认识你！😊 你想和我聊什么呢？
```

### 图片分析

```
用户: [上传图片] 这是什么？
AI小子: 我看到了一张很棒的图片！这是一只可爱的小猫咪，它有着橙色的毛发，正坐在绿色的草地上。小猫的眼睛很亮，看起来很好奇的样子呢！你喜欢小猫吗？
```

### 天气查询

```
用户: 北京今天天气怎么样？
AI小子: 让我查一下北京今天的天气！☀️

[天气卡片显示]
北京今天是晴天，温度25°C，体感温度27°C，湿度60%，适合出门游玩哦！记得带上帽子防晒呢！
```

### 搜索功能

```
用户: [开启搜索] 最新的太空探索新闻
AI小子: 我来为你搜索最新的太空探索消息！🚀

根据搜索结果，最近NASA的阿尔忒弥斯计划有了新进展...
```

## 🔧 配置说明

### OpenAI 配置

```javascript
openai: {
  apiKey: "sk-...",              // API密钥
  baseURL: "https://api.openai.com/v1", // API基础URL
  model: "gpt-4o-mini"           // 模型名称(建议支持视觉的模型)
}
```

### 服务器配置

```javascript
server: {
  port: 3002,                    // 服务器端口
  cors: true                     // 是否启用CORS
}
```

### AI 参数配置

```javascript
ai: {
  maxTokens: 1000,               // 最大输出长度
  temperature: 0.7,              // 创造性参数
  presencePenalty: 0,           // 重复惩罚
  frequencyPenalty: 0           // 频率惩罚
}
```

## 🚨 故障排除

### 常见问题

#### 1. API 相关问题

```bash
# 检查API密钥
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models

# 检查余额
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/usage
```

#### 2. 文件上传问题

- **文件大小限制**: 默认 100MB，可在 upload.js 中修改
- **文件类型限制**: 检查 fileFilter 配置
- **存储权限**: 确保 uploads 目录有写入权限

#### 3. 端口占用问题

```bash
# 查看端口占用
lsof -i :3002

# 修改配置文件中的端口
# 或使用环境变量
PORT=3003 npm start
```

#### 4. 视觉功能问题

- 确保使用支持视觉的模型(如 gpt-4o-mini)
- 检查图片 URL 是否可访问
- 验证 API 密钥是否有足够权限

## 📈 性能优化建议

### 1. 生产环境部署

- 使用 PM2 进程管理
- 配置 Nginx 反向代理
- 启用 HTTPS
- 使用 CDN 加速静态资源

### 2. 数据库升级

- 替换 JSON 存储为 MongoDB/PostgreSQL
- 实现数据备份和恢复
- 添加数据索引优化查询

### 3. 缓存优化

- Redis 缓存 AI 响应
- 文件上传 CDN 存储
- API 结果缓存

## 📚 更新日志

### v2.0.0 (2025-06-30) - 多模态版本

- ✨ **新增多模态分析**: 支持图片、音频、视频、文档分析
- 📤 **文件上传系统**: 完整的文件管理功能
- 🌤️ **天气查询**: 实时天气信息获取
- 🔍 **联网搜索**: Brave 搜索引擎集成
- 🎙️ **语音功能**: 录音和语音识别
- ⚡ **流式输出**: 优化用户体验
- 🎨 **界面升级**: 现代化 UI 设计

### v1.0.0 (2024) - 基础版本

- 💬 基础聊天功能
- 📚 聊天历史记录
- 🧠 AI 思考过程
- 👶 儿童友好设计

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范

- 使用 ES6+语法
- 遵循 Google JavaScript Style Guide
- 添加必要的注释和文档
- 保持代码简洁和可读性

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 💡 致谢

- OpenAI - 提供强大的 AI 能力
- Tailwind CSS - 优雅的 CSS 框架
- Remix Icons - 精美的图标库
- 所有为开源社区做出贡献的开发者们

---

**🌟 如果这个项目对你有帮助，请给它一个 Star！**
