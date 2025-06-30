const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const voiceService = require('../services/voiceService');
const config = require('../config');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = config.voice.uploadPath;
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'voice-' + uniqueSuffix + extension);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const validation = voiceService.validateAudioFile(file);
  if (validation.valid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.voice.maxFileSize
  }
});

// 语音转文字并翻译接口
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎤 收到语音转换请求');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传音频文件'
      });
    }

    console.log('📁 上传的文件信息:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // 处理音频文件
    const result = await voiceService.processVoice(req.file.path);
    
    if (result.success) {
      console.log('✅ 语音处理成功');
      res.json({
        success: true,
        data: {
          originalText: result.originalText,
          translatedText: result.translatedText,
          isAlreadyChinese: result.isAlreadyChinese,
          language: result.language,
          timestamp: result.timestamp
        }
      });
    } else {
      console.log('❌ 语音处理失败:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('语音转换接口错误:', error);
    
    // 清理上传的文件（如果存在）
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('清理上传文件失败:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || '语音处理失败，请稍后重试'
    });
  }
});

// 仅语音识别接口（不翻译）
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎙️ 收到语音识别请求');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请上传音频文件'
      });
    }

    // 只进行语音识别，不翻译
    const result = await voiceService.speechToText(req.file.path);
    
    if (result.success) {
      console.log('✅ 语音识别成功');
      res.json({
        success: true,
        data: {
          text: result.text,
          language: result.language,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.log('❌ 语音识别失败:', result.error);
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('语音识别接口错误:', error);
    
    // 清理上传的文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('清理上传文件失败:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.message || '语音识别失败，请稍后重试'
    });
  }
});

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
        enabled: config.voice.enabled,
        maxFileSize: config.voice.maxFileSize,
        allowedFormats: config.voice.allowedFormats,
        hasApiKey: !!config.openai.apiKey,
        uploadPath: config.voice.uploadPath
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