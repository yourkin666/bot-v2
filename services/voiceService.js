const OpenAI = require('openai');
const config = require('../config');

class VoiceService {
  constructor() {
    // 初始化对话客户端（用于翻译，使用硅基流动）
    this.chatClient = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL
    });
  }

  // 翻译文本为中文
  async translateToChinese(text) {
    try {
      console.log('🌍 开始翻译文本:', text);
      
      // 先检查是否已经是中文
      if (this.isChinese(text)) {
        console.log('🌍 文本已经是中文，无需翻译');
        return {
          success: true,
          originalText: text,
          translatedText: text,
          isAlreadyChinese: true
        };
      }

      // 使用AI进行翻译
      const response = await this.chatClient.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的翻译助手。请将用户输入的任何语言的文本翻译成简体中文。只返回翻译结果，不要添加额外的解释。'
          },
          {
            role: 'user',
            content: `请将以下文本翻译成中文：${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const translatedText = response.choices[0].message.content;
      console.log('🌍 翻译结果:', translatedText);

      return {
        success: true,
        originalText: text,
        translatedText: translatedText,
        isAlreadyChinese: false
      };

    } catch (error) {
      console.error('翻译失败:', error);
      return {
        success: false,
        error: '翻译失败，请稍后重试',
        originalText: text
      };
    }
  }

  // 检查文本是否包含中文
  isChinese(text) {
    const chineseRegex = /[\u4e00-\u9fff]/;
    const chineseChars = text.match(/[\u4e00-\u9fff]/g);
    const totalChars = text.replace(/\s/g, '').length;
    
    // 如果中文字符占比超过30%，认为是中文
    return chineseChars && (chineseChars.length / totalChars) > 0.3;
  }
}

module.exports = new VoiceService(); 