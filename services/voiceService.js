const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const config = require('../config');

class VoiceService {
  constructor() {
    // 初始化Whisper客户端（专门用于语音识别）
    this.whisperClient = new OpenAI({
      apiKey: config.whisper.apiKey,
      baseURL: config.whisper.baseURL
    });
    
    // 初始化对话客户端（用于翻译，使用硅基流动）
    this.chatClient = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL
    });
    
    // 确保上传目录存在
    this.uploadPath = config.voice.uploadPath;
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  // 语音转文字
  async speechToText(audioFilePath) {
    try {
      console.log('🎙️ 开始语音识别，文件路径:', audioFilePath);
      
      // 检查文件是否存在
      if (!fs.existsSync(audioFilePath)) {
        throw new Error('音频文件不存在');
      }

      // 使用OpenAI的Whisper API进行语音识别
      const transcription = await this.whisperClient.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: "whisper-1",
        language: "zh", // 指定中文，但也可以自动识别其他语言
      });

      console.log('🎙️ 语音识别结果:', transcription.text);
      
      // 清理临时文件
      this.cleanupTempFile(audioFilePath);
      
      return {
        success: true,
        text: transcription.text,
        language: '自动识别'
      };

    } catch (error) {
      console.error('语音识别失败:', error);
      
      // 清理临时文件（即使出错也要清理）
      this.cleanupTempFile(audioFilePath);
      
      return {
        success: false,
        error: '语音识别失败，请稍后重试'
      };
    }
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

  // 完整的语音处理流程：录音 -> 识别 -> 翻译
  async processVoice(audioFilePath) {
    try {
      console.log('🎤 开始处理语音文件:', audioFilePath);
      
      // 第一步：语音转文字
      const speechResult = await this.speechToText(audioFilePath);
      if (!speechResult.success) {
        return speechResult;
      }

      // 第二步：翻译为中文
      const translateResult = await this.translateToChinese(speechResult.text);
      if (!translateResult.success) {
        return {
          success: false,
          error: translateResult.error,
          recognizedText: speechResult.text
        };
      }

      // 返回完整结果
      return {
        success: true,
        originalText: speechResult.text,
        translatedText: translateResult.translatedText,
        isAlreadyChinese: translateResult.isAlreadyChinese,
        language: speechResult.language,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('语音处理失败:', error);
      return {
        success: false,
        error: '语音处理失败，请稍后重试'
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

  // 清理临时文件
  cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🧹 已清理临时文件:', filePath);
      }
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }

  // 验证音频文件格式
  validateAudioFile(file) {
    const allowedFormats = config.voice.allowedFormats;
    const maxSize = config.voice.maxFileSize;
    
    if (!allowedFormats.includes(file.mimetype)) {
      return {
        valid: false,
        error: `不支持的音频格式。支持的格式：${allowedFormats.join(', ')}`
      };
    }
    
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `文件过大。最大支持 ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }
    
    return { valid: true };
  }
}

module.exports = new VoiceService(); 