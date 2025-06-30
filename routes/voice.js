const express = require('express');
const router = express.Router();
const voiceService = require('../services/voiceService');

// 文本翻译接口
router.post('/translate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '请提供要翻译的文本'
      });
    }

    console.log('🌍 收到翻译请求:', text);
    
    const result = await voiceService.translateToChinese(text.trim());
    
    if (result.success) {
      console.log('✅ 翻译成功');
      res.json({
        success: true,
        data: {
          originalText: result.originalText,
          translatedText: result.translatedText,
          isAlreadyChinese: result.isAlreadyChinese,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.log('❌ 翻译失败:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('翻译接口错误:', error);
    res.status(500).json({
      success: false,
      error: '翻译失败，请稍后重试'
    });
  }
});

// 语音功能状态检查
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        enabled: true,
        translationAvailable: true,
        speechRecognition: 'Web Speech API (Browser)',
        hasApiKey: !!require('../config').openai.apiKey
      }
    });
  } catch (error) {
    console.error('获取语音状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取语音状态失败'
    });
  }
});

module.exports = router; 