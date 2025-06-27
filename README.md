# AI 小子 - 儿童聊天机器人

一个专为儿童设计的 AI 聊天助手，提供温暖友善的对话体验。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

复制 `config.example.js` 为 `config.js`，并填入你的 OpenAI API 密钥：

```javascript
module.exports = {
  openai: {
    apiKey: "your-actual-openai-api-key-here",
    baseURL: "https://api.openai.com/v1",
    model: "gpt-3.5-turbo",
  },
  // ... 其他配置
};
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 4. 访问应用

- 聊天界面: http://localhost:3000
- 展示页面: http://localhost:3000/webpage

## 📁 项目结构

```
bot-v2/
├── server.js              # 主服务器文件
├── package.json           # 项目配置
├── config.example.js      # 配置示例
├── routes/
│   └── chat.js           # 聊天相关路由
├── services/
│   └── aiService.js      # AI服务模块
├── utils/
│   └── storage.js        # 数据存储模块
├── data/                 # 数据存储目录（自动创建）
│   └── chats.json       # 聊天数据
├── index.html           # 聊天界面
├── webpage.html         # 展示页面
└── README.md           # 项目说明
```

## 🔧 API 接口

### 发送消息

```
POST /api/chat/send
Content-Type: application/json

{
  "message": "你好，AI小子！",
  "chatId": "optional-chat-id",
  "useThinking": false
}
```

### 获取聊天历史

```
GET /api/chat/history
```

### 获取特定聊天

```
GET /api/chat/:chatId
```

### 创建新聊天

```
POST /api/chat/new
Content-Type: application/json

{
  "title": "新对话标题"
}
```

## 🎯 功能特性

- ✅ 实时 AI 对话
- ✅ 聊天历史记录
- ✅ 思考过程展示
- ✅ 儿童友好的 AI 人设
- ✅ 响应式界面设计
- ✅ 简单的 JSON 文件存储

## 🛠 技术栈

- **后端**: Node.js + Express
- **AI 模型**: OpenAI GPT-3.5-turbo
- **前端**: HTML + CSS + JavaScript (原生)
- **存储**: JSON 文件
- **样式**: Tailwind CSS

## 🔒 注意事项

1. 请确保你有有效的 OpenAI API 密钥
2. API 调用会产生费用，请注意使用量
3. 聊天数据存储在本地 JSON 文件中
4. 本项目为演示用途，生产环境建议使用数据库

## 🚨 故障排除

### 常见问题

1. **API 密钥错误**

   - 检查配置文件中的 API 密钥是否正确
   - 确认 API 密钥有足够的配额

2. **网络连接问题**

   - 检查网络连接
   - 确认可以访问 OpenAI API

3. **端口占用**
   - 修改配置文件中的端口号
   - 或者关闭占用 3000 端口的其他程序

## 📝 更新日志

- v1.0.0: 基础聊天功能完成
- 支持实时对话和历史记录
- 儿童友好的 AI 人设设计
