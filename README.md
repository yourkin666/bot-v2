# 🤖 AI 小子 - 智能儿童聊天机器人

一个专为儿童设计的多模态 AI 聊天助手，支持文字、图片、音频、视频等多种形式的智能对话，集成深度思考功能。

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
- **🤔 深度思考**: 基于 DeepSeek R1 的高级推理能力

### 🎯 用户体验

- **📱 响应式设计**: 完美适配各种设备
- **⚡ 流式输出**: 实时打字机效果
- **📚 聊天历史**: 完整的对话记录管理
- **🎨 美观界面**: 现代化 UI 设计
- **🔧 错误处理**: 智能降级和用户友好提示
- **🔐 安全认证**: 多种登录方式和数据保护

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

### 3. 配置环境 🔧

#### 🚀 快速配置（推荐）

使用自动化脚本进行配置：

```bash
chmod +x scripts/setup-env.sh
./scripts/setup-env.sh
```

#### 🔧 手动配置

1. **复制环境变量模板**：

```bash
cp .env.example .env
```

2. **编辑 `.env` 文件，填入您的 API 密钥**：

```bash
# ===== 🤖 AI 服务配置 =====
OPENAI_API_KEY=your-openai-api-key              # 🤖 主要AI模型密钥
DEEPSEEK_API_KEY=your-deepseek-api-key          # 🧠 深度思考模型密钥

# ===== 🔍 搜索服务配置 =====
SEARCH_API_KEY=your-search-api-key              # 🔍 搜索功能密钥

# ===== 🔐 安全配置 =====
JWT_SECRET=your-strong-jwt-secret-key           # 🔐 用户认证密钥（建议32字符+）
SESSION_SECRET=your-strong-session-secret       # 🔐 会话密钥（建议32字符+）

# ===== 📧 邮件服务配置 =====
SMTP_HOST=smtp.qq.com                           # 📧 SMTP服务器
SMTP_PORT=587                                   # 📧 SMTP端口
SMTP_USER=your-email@qq.com                     # 📧 邮箱地址
SMTP_PASS=your-email-auth-code                  # 📧 邮箱授权码
EMAIL_FROM=your-email@qq.com                    # 📧 发件人邮箱

# ===== 🌐 OAuth 配置（可选）=====
GOOGLE_CLIENT_ID=your-google-client-id          # 🌐 Google OAuth客户端ID
GOOGLE_CLIENT_SECRET=your-google-client-secret  # 🌐 Google OAuth客户端密钥
GITHUB_CLIENT_ID=your-github-client-id          # 🌐 GitHub OAuth客户端ID
GITHUB_CLIENT_SECRET=your-github-client-secret  # 🌐 GitHub OAuth客户端密钥

# ===== ⚙️ 服务器配置 =====
PORT=3002                                       # ⚙️ 服务器端口
NODE_ENV=development                            # ⚙️ 运行环境

# ===== 🌤️ 天气服务配置（可选）=====
WEATHER_API_KEY=your-weather-api-key            # 🌤️ 天气API密钥
```

#### 📖 详细配置说明

- **完整配置指南**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **API 密钥获取**: 查看配置文档中的详细步骤
- **安全提醒**: ⚠️ 切勿将 `.env` 文件提交到代码仓库

#### 3.3 配置 Google OAuth（可选）

如果要启用 Google 登录功能，需要：

1. **创建 Google Cloud 项目**：

   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建新项目或选择现有项目

2. **启用 Google+ API**：

   - 在 API 库中搜索并启用 "Google+ API"

3. **创建 OAuth 2.0 凭据**：

   - 转到 "凭据" 页面
   - 创建 "OAuth 2.0 客户端 ID"
   - 应用类型选择 "Web 应用"
   - 添加授权重定向 URI：`http://localhost:3002/api/auth/google/callback`

4. **配置环境变量**：

   - 将获得的客户端 ID 和密钥添加到 `.env` 文件中

5. **配置 GitHub OAuth（可选）**：
   - 访问 [GitHub Developer Settings](https://github.com/settings/applications/new)
   - 创建新的 OAuth 应用
   - 设置 Authorization callback URL：`http://localhost:3002/api/auth/github/callback`

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 使用 PM2（推荐生产环境）
npm install -g pm2
pm2 start ecosystem.config.js
```

### 5. 访问应用

- **主界面**: http://localhost:3002
- **登录页面**: http://localhost:3002/login.html
- **展示页面**: http://localhost:3002/webpage

## 🧠 深度思考功能

### 功能特点

- **🚀 前沿模型**: 集成 DeepSeek R1 大模型，具备强大的推理能力
- **🎯 智能切换**: 一键开启/关闭深度思考模式
- **⚡ 无缝体验**: 与现有功能完美集成
- **🔄 混合模式**: 可同时使用深度思考和联网搜索

### 使用方法

1. **开启深度思考**：点击聊天界面的"🤔 深度思考"按钮
2. **发送消息**：正常输入你的问题或需求
3. **获得回复**：AI 会使用更强的推理能力来回答
4. **切换模式**：可随时开启/关闭深度思考功能

### 适用场景

- **🧮 复杂数学题**: 多步骤计算和逻辑推理
- **📚 学习辅导**: 深度解析知识点和概念
- **🔍 问题分析**: 复杂问题的多角度分析
- **💡 创意思考**: 需要深度思考的创意任务

## 🔐 用户认证和 OAuth 配置

### 快速配置 Google OAuth

```bash
# 方法1：自动配置（推荐）
chmod +x setup-oauth.sh
./setup-oauth.sh

# 方法2：测试当前配置
node test-oauth.js
```

### 详细配置指南

- **快速开始**: [QUICK_START.md](./QUICK_START.md) - 5 分钟快速配置
- **详细配置**: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - 完整的 OAuth 配置步骤

### 支持的登录方式

- ✅ **邮箱密码登录** - 基本认证方式
- ✅ **Google OAuth 登录** - 一键快速登录
- ✅ **GitHub OAuth 登录** - 开发者友好
- ✅ **邮箱验证码注册** - 安全的用户注册

## 📁 项目结构

```
bot-v2/
├── server.js                    # 主服务器入口
├── config.js                    # 配置文件
├── package.json                 # 项目依赖配置
├── .env                         # 环境变量（不提交到Git）
├── .env.example                 # 环境变量模板
├── ecosystem.config.js          # PM2 配置文件
├── routes/                      # 路由模块
│   ├── auth.js                  # 用户认证路由
│   ├── chat.js                  # 聊天功能路由
│   ├── upload.js                # 文件上传路由
│   ├── search.js                # 搜索功能路由
│   ├── voice.js                 # 语音功能路由
│   └── weather.js               # 天气功能路由
├── services/                    # 服务模块
│   ├── aiService.js             # AI核心服务（包含深度思考）
│   ├── searchService.js         # 搜索服务
│   ├── voiceService.js          # 语音服务
│   ├── emailService.js          # 邮件服务
│   ├── userService.js           # 用户服务
│   └── weatherService.js        # 天气服务
├── middleware/                  # 中间件
│   └── auth.js                  # 认证中间件
├── utils/                       # 工具模块
│   └── storage.js               # 数据存储工具
├── scripts/                     # 脚本文件
│   └── setup-env.sh             # 环境配置脚本
├── data/                        # 数据存储目录
│   ├── users.json               # 用户数据
│   ├── chats_backup.json        # 聊天记录备份
│   └── users/                   # 用户个人数据
├── uploads/                     # 文件上传目录
├── index.html                   # 主聊天界面
├── login.html                   # 登录页面
├── webpage.html                 # 项目展示页面
├── ENVIRONMENT_SETUP.md         # 环境配置指南
├── GOOGLE_OAUTH_SETUP.md        # OAuth配置指南
├── QUICK_START.md               # 快速开始指南
└── README.md                    # 项目文档
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
  "useDeepThinking": false,        // 🆕 深度思考功能
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
  "useDeepThinking": false,        // 🆕 深度思考功能
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

### 认证相关

#### 邮箱登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 邮箱注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "verificationCode": "123456"
}
```

#### OAuth 登录

```http
GET /api/auth/google
GET /api/auth/github
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
- **AI 服务**:
  - OpenAI API (主要模型)
  - DeepSeek R1 API (深度思考功能)
- **搜索服务**: Brave Search API
- **天气服务**: OpenWeatherMap API
- **认证服务**: Passport.js (OAuth)
- **邮件服务**: Nodemailer

### 前端技术

- **基础技术**: HTML5, CSS3, JavaScript (ES6+)
- **UI 框架**: Tailwind CSS
- **图标库**: Remix Icons
- **数学渲染**: MathJax
- **Markdown**: Marked.js
- **实时通信**: Server-Sent Events (SSE)

### 存储方案

- **聊天数据**: JSON 文件存储
- **文件存储**: 本地文件系统
- **配置管理**: 环境变量 + JavaScript 配置文件
- **安全存储**: 敏感信息使用环境变量

## 🎮 使用示例

### 基础对话

```
用户: 你好，AI小子！
AI小子: 你好呀！我是AI小子，很高兴认识你！😊 你想和我聊什么呢？
```

### 深度思考功能

```
用户: [开启深度思考] 一个圆形花园的半径是10米，如果要在花园周围修建一条宽度为2米的环形小径，小径的面积是多少？

AI小子: [使用 DeepSeek R1 深度思考]
🤔 让我深入分析这个几何问题...

这是一个环形面积计算问题。我需要：
1. 计算外圆面积（花园半径 + 小径宽度）
2. 计算内圆面积（花园本身）
3. 用外圆面积减内圆面积得到小径面积

内圆半径：10米
外圆半径：10 + 2 = 12米

小径面积 = π × 12² - π × 10²
         = π × (144 - 100)
         = 44π
         ≈ 138.23平方米

所以环形小径的面积约为138.23平方米。
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

### 混合模式

```
用户: [同时开启深度思考和搜索] 分析一下人工智能在教育领域的最新发展趋势

AI小子: [使用深度思考+联网搜索]
🤔 我来深入分析AI在教育领域的发展趋势...
🔍 同时搜索最新的相关信息...

[深度分析结合最新资讯的综合回答]
```

## 🔧 配置说明

### OpenAI 配置

```javascript
openai: {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini"           // 建议支持视觉的模型
}
```

### DeepSeek 配置

```javascript
deepseek: {
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
  model: "deepseek-ai/DeepSeek-R1"
}
```

### 服务器配置

```javascript
server: {
  port: process.env.PORT || 3002,
  cors: true
}
```

### AI 参数配置

```javascript
ai: {
  maxTokens: 2000,               // 最大输出长度
  temperature: 0.7,              // 创造性参数
  presencePenalty: 0,           // 重复惩罚
  frequencyPenalty: 0           // 频率惩罚
}
```

## 🚨 故障排除

### 常见问题

#### 1. 环境变量问题

```bash
# 检查环境变量是否正确加载
node -e "console.log(process.env.OPENAI_API_KEY)"

# 验证 .env 文件格式
cat .env | grep -v '^#' | grep -v '^$'
```

#### 2. API 相关问题

```bash
# 检查 OpenAI API 密钥
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models

# 检查 DeepSeek API 密钥
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.deepseek.com/v1/models
```

#### 3. 深度思考功能问题

- **模型调用失败**: 检查 DEEPSEEK_API_KEY 是否正确配置
- **按钮无响应**: 检查前端 JavaScript 是否正常加载
- **响应慢**: DeepSeek R1 模型推理时间较长，属于正常现象

#### 4. 文件上传问题

- **文件大小限制**: 默认 100MB，可在 upload.js 中修改
- **文件类型限制**: 检查 fileFilter 配置
- **存储权限**: 确保 uploads 目录有写入权限

#### 5. 端口占用问题

```bash
# 查看端口占用
lsof -i :3002

# 杀死占用进程
kill -9 <PID>

# 修改端口
PORT=3003 npm start
```

#### 6. 认证问题

- **JWT 密钥**: 确保 JWT_SECRET 配置且足够复杂
- **OAuth 回调**: 检查回调 URL 是否正确配置
- **邮件服务**: 验证 SMTP 配置和授权码

## 📈 性能优化建议

### 1. 生产环境部署

```bash
# 使用 PM2 进程管理
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2. Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 数据库升级

- 替换 JSON 存储为 MongoDB/PostgreSQL
- 实现数据备份和恢复
- 添加数据索引优化查询

### 4. 缓存优化

- Redis 缓存 AI 响应
- 文件上传 CDN 存储
- API 结果缓存

## 📚 更新日志

### v2.1.0 (2025-01-20) - 深度思考版本

- 🧠 **新增深度思考功能**: 集成 DeepSeek R1 大模型
- 🔐 **环境变量优化**: 敏感信息分离，提高安全性
- 📚 **文档完善**: 新增环境配置指南和脚本
- 🔧 **配置验证**: 启动时验证必需环境变量
- 🎨 **界面优化**: 深度思考按钮和状态显示
- ⚡ **性能提升**: 优化模型切换和响应速度

### v2.0.0 (2024-12-30) - 多模态版本

- ✨ **新增多模态分析**: 支持图片、音频、视频、文档分析
- 📤 **文件上传系统**: 完整的文件管理功能
- 🌤️ **天气查询**: 实时天气信息获取
- 🔍 **联网搜索**: Brave 搜索引擎集成
- 🎙️ **语音功能**: 录音和语音识别
- ⚡ **流式输出**: 优化用户体验
- 🎨 **界面升级**: 现代化 UI 设计
- 🔐 **用户认证**: OAuth 登录和邮箱验证

### v1.0.0 (2024-06) - 基础版本

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

- 使用 ES6+ 语法
- 遵循 Google JavaScript Style Guide
- 添加必要的注释和文档
- 保持代码简洁和可读性
- 敏感信息使用环境变量

### 测试指南

```bash
# 运行基本测试
npm test

# 测试 OAuth 配置
node test-oauth.js

# 测试环境变量
node -e "require('dotenv').config(); console.log('✅ 环境变量加载成功');"
```

## 🔒 安全注意事项

### 环境变量安全

- ✅ 使用强密码和复杂密钥
- ✅ 定期轮换 API 密钥
- ✅ 不要在代码中硬编码敏感信息
- ✅ 确保 `.env` 文件不被提交到版本控制

### 生产环境建议

- 🔒 启用 HTTPS
- 🔒 配置防火墙
- 🔒 定期更新依赖
- 🔒 监控和日志记录
- 🔒 备份重要数据

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 💡 致谢

- **OpenAI** - 提供强大的 AI 能力
- **DeepSeek** - 提供先进的推理模型
- **Tailwind CSS** - 优雅的 CSS 框架
- **Remix Icons** - 精美的图标库
- **所有贡献者** - 感谢每一位为项目做出贡献的开发者

## 🌟 特别鸣谢

感谢 **DeepSeek** 团队开发的 R1 模型，为本项目的深度思考功能提供了强大的技术支持。

---

**🌟 如果这个项目对你有帮助，请给它一个 Star！**

**🤔 有问题？查看 [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) 获取详细配置指南**
