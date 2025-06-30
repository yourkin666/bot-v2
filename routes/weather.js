const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');

// 获取天气信息
router.get('/:city?', async (req, res) => {
  try {
    const city = req.params.city || req.query.city || '北京';
    
    console.log('🌤️ 收到天气查询请求:', city);
    
    const weatherData = await weatherService.getWeatherByCity(city);
    
    res.json({
      success: true,
      data: weatherData
    });

  } catch (error) {
    console.error('获取天气失败:', error);
    res.status(500).json({
      success: false,
      error: '获取天气信息失败，请稍后重试'
    });
  }
});

// 获取多个城市的天气
router.post('/batch', async (req, res) => {
  try {
    const { cities } = req.body;
    
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供城市列表'
      });
    }

    console.log('🌤️ 收到批量天气查询请求:', cities);
    
    const weatherPromises = cities.map(city => weatherService.getWeatherByCity(city));
    const weatherResults = await Promise.all(weatherPromises);
    
    res.json({
      success: true,
      data: weatherResults
    });

  } catch (error) {
    console.error('批量获取天气失败:', error);
    res.status(500).json({
      success: false,
      error: '批量获取天气信息失败'
    });
  }
});

module.exports = router; 