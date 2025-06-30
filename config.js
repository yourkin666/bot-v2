// 配置文件
module.exports = {
  // AI 对话服务配置（使用硅基流动）
  openai: {
    apiKey: 'sk-icupqsqwcgsfnqbwpcgfertxbdlkksapxtacxlupjzanguyv',
    baseURL: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-7B-Instruct' // 硅基流动推荐的模型
  },
  
  // 语音识别专用配置（使用OpenAI官方API，因为硅基流动不支持Whisper）
  whisper: {
    apiKey: 'sk-icupqsqwcgsfnqbwpcgfertxbdlkksapxtacxlupjzanguyv', // 请替换为您的OpenAI官方API Key
    baseURL: 'https://api.openai.com/v1',  // OpenAI官方API地址
    model: 'whisper-1'
  },
  
  // 联网搜索服务配置
  search: {
    apiKey: 'sk-38eaefcfac2d4c39a50c3cd686022e2d',
    enabled: true
  },
  
  // 服务器配置
  server: {
    port: process.env.PORT || 3002,
    host: 'localhost'
  },
  
  // AI 小子配置
  ai: {
    maxTokens: 1000,
    temperature: 0.7,
    maxHistoryMessages: 20
  },
  
  // 语音功能配置
  voice: {
    enabled: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['audio/wav', 'audio/mp3', 'audio/m4a', 'audio/webm'],
    uploadPath: './uploads'
  }
}; 