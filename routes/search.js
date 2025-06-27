const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');

// 测试搜索功能
router.post('/test', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '搜索关键词不能为空' 
      });
    }

    console.log('🔍 测试搜索:', query);

    // 执行搜索
    const searchResults = await searchService.webSearch(query.trim());

    if (!searchResults) {
      return res.json({
        success: false,
        error: '搜索服务暂时不可用'
      });
    }

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('搜索测试失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索测试失败，请稍后重试'
    });
  }
});

// 检查搜索服务状态
router.get('/status', async (req, res) => {
  try {
    const config = require('../config');
    
    res.json({
      success: true,
      data: {
        enabled: config.search.enabled,
        hasApiKey: !!config.search.apiKey,
        apiKeyLength: config.search.apiKey ? config.search.apiKey.length : 0
      }
    });

  } catch (error) {
    console.error('获取搜索状态失败:', error);
    res.status(500).json({
      success: false,
      error: '获取搜索状态失败'
    });
  }
});

module.exports = router; 