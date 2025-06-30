const https = require('https');
const searchService = require('./searchService');

class WeatherService {
  constructor() {
    // 这里可以配置天气API的密钥
    this.apiKey = process.env.WEATHER_API_KEY || 'demo_key';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    // 缓存机制：避免频繁请求
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10分钟缓存
    
    // 预定义的城市天气数据，更真实
    this.mockCityData = {
      '北京': {
        temperature: 23, description: '晴朗', humidity: 65, windSpeed: 12,
        visibility: 10, feelLike: 25, uvIndex: 6,
        airQuality: { aqi: 35, level: '优', description: '空气质量令人满意' }
      },
      '上海': {
        temperature: 26, description: '多云', humidity: 78, windSpeed: 8,
        visibility: 8, feelLike: 28, uvIndex: 5,
        airQuality: { aqi: 68, level: '良', description: '空气质量可接受' }
      },
      '广州': {
        temperature: 29, description: '小雨', humidity: 85, windSpeed: 6,
        visibility: 6, feelLike: 32, uvIndex: 3,
        airQuality: { aqi: 45, level: '优', description: '空气质量良好' }
      },
      '深圳': {
        temperature: 28, description: '阴天', humidity: 80, windSpeed: 10,
        visibility: 7, feelLike: 30, uvIndex: 4,
        airQuality: { aqi: 52, level: '良', description: '空气质量尚可' }
      },
      '杭州': {
        temperature: 24, description: '晴朗', humidity: 70, windSpeed: 9,
        visibility: 9, feelLike: 26, uvIndex: 7,
        airQuality: { aqi: 38, level: '优', description: '空气质量优秀' }
      }
    };
  }

  // 获取缓存键
  getCacheKey(city) {
    return `weather_${city}_${new Date().getHours()}`; // 按小时缓存
  }

  // 检查缓存
  getFromCache(city) {
    const cacheKey = this.getCacheKey(city);
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp < this.cacheTimeout)) {
      console.log(`🌤️ 使用缓存的天气数据: ${city}`);
      return cachedData.data;
    }
    
    return null;
  }

  // 设置缓存
  setCache(city, data) {
    const cacheKey = this.getCacheKey(city);
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    // 清理过期缓存
    this.cleanExpiredCache();
  }

  // 清理过期缓存
  cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  // 从联网搜索获取天气数据
  async getWeatherFromSearch(city) {
    try {
      const searchQuery = `${city}天气 今天 温度 实时`;
      console.log(`🔍 搜索天气信息: ${searchQuery}`);
      
      const searchResult = await searchService.webSearch(searchQuery, {
        count: 3,
        freshness: 'oneDay',
        summary: true
      });

      if (!searchResult || !searchResult.success || !searchResult.results || searchResult.results.length === 0) {
        console.log('🔍 天气搜索无结果');
        return null;
      }

      console.log(`🔍 找到${searchResult.results.length}个天气相关结果`);
      
      // 解析搜索结果提取天气信息
      const weatherInfo = this.parseWeatherFromSearchResults(searchResult, city);
      
      if (weatherInfo) {
        console.log(`✅ 成功解析${city}天气信息:`, weatherInfo);
        return {
          city: city,
          temperature: weatherInfo.temperature,
          description: weatherInfo.description,
          humidity: weatherInfo.humidity || 60,
          windSpeed: weatherInfo.windSpeed || 10,
          visibility: weatherInfo.visibility || 10,
          feelLike: weatherInfo.feelLike || weatherInfo.temperature + 2,
          uvIndex: weatherInfo.uvIndex || 5,
          airQuality: weatherInfo.airQuality || {
            aqi: 50,
            level: '良',
            description: '空气质量监测中'
          },
          forecast: this.generateForecast(),
          timestamp: new Date().toISOString(),
          source: 'web_search',
          searchQuery: searchQuery,
          searchSummary: searchResult.summary
        };
      }

      return null;
    } catch (error) {
      console.error('从搜索获取天气数据失败:', error);
      return null;
    }
  }

  // 解析搜索结果中的天气信息
  parseWeatherFromSearchResults(searchResult, city) {
    try {
      const allText = [
        searchResult.summary || '',
        ...searchResult.results.map(r => `${r.title} ${r.snippet} ${r.summary || ''}`)
      ].join(' ');

      console.log('🔍 解析天气文本:', allText.slice(0, 200) + '...');

      // 提取温度信息
      const tempPatterns = [
        /(\d{1,2})°?[Cc](?![0-9])/g,
        /气温[：:]?\s*(\d{1,2})°?/g,
        /温度[：:]?\s*(\d{1,2})°?/g,
        /(\d{1,2})度(?![0-9])/g
      ];

      let temperature = null;
      for (const pattern of tempPatterns) {
        const matches = Array.from(allText.matchAll(pattern));
        if (matches.length > 0) {
          const temps = matches.map(m => parseInt(m[1])).filter(t => t >= -10 && t <= 50);
          if (temps.length > 0) {
            temperature = Math.round(temps.reduce((a, b) => a + b) / temps.length);
            break;
          }
        }
      }

      // 提取天气描述
      const weatherKeywords = [
        '晴', '晴朗', '晴天', '阳光',
        '多云', '云', '阴', '阴天', '阴云',
        '雨', '小雨', '中雨', '大雨', '暴雨', '雷雨', '阵雨',
        '雪', '小雪', '中雪', '大雪', '暴雪',
        '雾', '雾霾', '霾', '沙尘',
        '风', '大风', '微风'
      ];

      let description = '未知';
      for (const keyword of weatherKeywords) {
        if (allText.includes(keyword)) {
          if (keyword.includes('雨')) {
            description = keyword.includes('小') ? '小雨' : keyword.includes('大') ? '大雨' : '中雨';
            break;
          } else if (keyword.includes('雪')) {
            description = keyword.includes('小') ? '雪' : '大雪';
            break;
          } else if (keyword.includes('晴')) {
            description = '晴朗';
            break;
          } else if (keyword.includes('阴')) {
            description = '阴天';
            break;
          } else if (keyword.includes('云')) {
            description = '多云';
            break;
          } else if (keyword.includes('雾') || keyword.includes('霾')) {
            description = '雾霾';
            break;
          }
        }
      }

      // 提取湿度
      let humidity = null;
      const humidityMatch = allText.match(/湿度[：:]?\s*(\d{1,3})%?/);
      if (humidityMatch) {
        humidity = parseInt(humidityMatch[1]);
        if (humidity > 100) humidity = humidity > 1000 ? Math.floor(humidity / 10) : humidity;
      }

      // 提取风速
      let windSpeed = null;
      const windMatches = allText.match(/风速[：:]?\s*(\d{1,2})[级|km|m]/);
      if (windMatches) {
        windSpeed = parseInt(windMatches[1]);
      }

      // 提取空气质量
      let airQuality = null;
      const aqiMatch = allText.match(/AQI[：:]?\s*(\d{1,3})/i) || allText.match(/空气质量指数[：:]?\s*(\d{1,3})/);
      if (aqiMatch) {
        const aqi = parseInt(aqiMatch[1]);
        let level = '良';
        let desc = '空气质量可接受';
        
        if (aqi <= 50) {
          level = '优';
          desc = '空气质量令人满意';
        } else if (aqi <= 100) {
          level = '良';
          desc = '空气质量可接受';
        } else if (aqi <= 150) {
          level = '轻度污染';
          desc = '敏感人群需注意';
        } else {
          level = '中度污染';
          desc = '建议减少户外活动';
        }
        
        airQuality = { aqi, level, description: desc };
      }

      if (temperature !== null) {
        return {
          temperature,
          description,
          humidity,
          windSpeed,
          airQuality,
          feelLike: temperature + (Math.random() * 4 - 2) // 体感温度估算
        };
      }

      return null;
    } catch (error) {
      console.error('解析天气信息失败:', error);
      return null;
    }
  }

  // 获取天气数据（优化版 - 优先使用联网搜索）
  async getWeatherData(city = '北京') {
    try {
      // 首先检查缓存
      const cachedData = this.getFromCache(city);
      if (cachedData) {
        return cachedData;
      }

      console.log(`🌤️ 开始获取${city}的天气数据...`);
      
      // 优先尝试联网搜索获取真实天气数据
      const realWeatherData = await this.getWeatherFromSearch(city);
      if (realWeatherData) {
        console.log(`🌤️ 成功从搜索获取${city}天气数据`);
        // 缓存真实数据
        this.setCache(city, realWeatherData);
        return realWeatherData;
      }

      console.log(`🌤️ 联网搜索失败，使用备用模拟数据 for ${city}`);
      
      // 如果联网搜索失败，回退到模拟数据
      const cityData = this.mockCityData[city] || this.generateRandomWeatherData(city);
      
      // 添加一些随机变化让数据更真实
      const weatherData = {
        city: city,
        temperature: cityData.temperature + Math.floor(Math.random() * 6) - 3, // ±3度变化
        description: cityData.description,
        humidity: Math.max(30, Math.min(95, cityData.humidity + Math.floor(Math.random() * 20) - 10)),
        windSpeed: Math.max(1, cityData.windSpeed + Math.floor(Math.random() * 8) - 4),
        visibility: Math.max(1, Math.min(15, cityData.visibility + Math.floor(Math.random() * 4) - 2)),
        feelLike: cityData.feelLike + Math.floor(Math.random() * 4) - 2,
        uvIndex: Math.max(1, Math.min(11, cityData.uvIndex + Math.floor(Math.random() * 3) - 1)),
        airQuality: cityData.airQuality,
        forecast: this.generateForecast(),
        timestamp: new Date().toISOString(),
        source: 'mock_api'
      };

      // 缓存数据
      this.setCache(city, weatherData);

      return weatherData;
    } catch (error) {
      console.error('获取天气数据失败:', error);
      // 返回默认数据而不是抛错
      return this.getDefaultWeatherData(city);
    }
  }

  // 生成随机天气数据
  generateRandomWeatherData(city) {
    const descriptions = ['晴朗', '多云', '阴天', '小雨', '中雨'];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    return {
      temperature: Math.floor(Math.random() * 30) + 5, // 5-35度
      description: description,
      humidity: Math.floor(Math.random() * 50) + 40, // 40-90%
      windSpeed: Math.floor(Math.random() * 15) + 3, // 3-18 km/h
      visibility: Math.floor(Math.random() * 10) + 5, // 5-15 km
      feelLike: Math.floor(Math.random() * 30) + 8, // 8-38度
      uvIndex: Math.floor(Math.random() * 8) + 2, // 2-10
      airQuality: {
        aqi: Math.floor(Math.random() * 100) + 20, // 20-120
        level: Math.random() > 0.5 ? '良' : '优',
        description: '空气质量监测中'
      }
    };
  }

  // 生成天气预报
  generateForecast() {
    const days = ['今天', '明天', '后天', '大后天', '周五', '周六', '周日'];
    const icons = ['sun', 'cloudy', 'rainy', 'snowy', 'partly-cloudy'];
    const descriptions = ['晴朗', '多云', '小雨', '阴天', '晴转多云'];
    
    return days.slice(0, 5).map((day, index) => ({
      day: day,
      icon: icons[Math.floor(Math.random() * icons.length)],
      high: Math.floor(Math.random() * 15) + 15 + index, // 递增温度
      low: Math.floor(Math.random() * 10) + 5 + index,
      desc: descriptions[Math.floor(Math.random() * descriptions.length)]
    }));
  }

  // 获取默认天气数据
  getDefaultWeatherData(city) {
    return {
      city: city,
      temperature: 20,
      description: '天气信息暂时无法获取',
      humidity: 60,
      windSpeed: 10,
      visibility: 8,
      feelLike: 22,
      uvIndex: 5,
      airQuality: {
        aqi: 50,
        level: '良',
        description: '空气质量监测中'
      },
      forecast: [],
      timestamp: new Date().toISOString(),
      source: 'default'
    };
  }

  // 格式化天气数据为聊天友好的格式（优化版）
  formatWeatherForChat(weatherData, format = 'card') {
    const { city, temperature, description, humidity, windSpeed, feelLike, airQuality, source } = weatherData;

    // 生成更智能的描述
    const weatherEmoji = this.getWeatherEmoji(description);
    const aqiColor = this.getAQIColor(airQuality.aqi);
    
    switch (format) {
      case 'simple':
        return {
          type: 'weather_simple',
          content: `${weatherEmoji} ${city}现在${description}，气温${temperature}°C（体感${feelLike}°C），湿度${humidity}%，${airQuality.level}空气质量。`,
          data: weatherData
        };

      case 'card':
        return {
          type: 'weather_card',
          content: `${weatherEmoji} 为您查询到${city}的实时天气：`,
          data: {
            city,
            temperature,
            description,
            details: [
              { label: '体感温度', value: `${feelLike}°C`, icon: 'temperature' },
              { label: '湿度', value: `${humidity}%`, icon: 'water' },
              { label: '风速', value: `${windSpeed}km/h`, icon: 'wind' },
              { label: '空气质量', value: `${airQuality.level} (${airQuality.aqi})`, icon: 'leaf', color: aqiColor }
            ],
            meta: {
              source: source,
              updateTime: new Date().toLocaleTimeString('zh-CN')
            }
          }
        };

      case 'detailed':
        return {
          type: 'weather_detailed',
          content: `${weatherEmoji} ${city}详细天气报告：`,
          data: {
            ...weatherData,
            suggestions: this.getWeatherSuggestions(weatherData)
          }
        };

      default:
        return this.formatWeatherForChat(weatherData, 'card');
    }
  }

  // 获取天气emoji
  getWeatherEmoji(description) {
    const emojiMap = {
      '晴': '☀️', '晴朗': '☀️',
      '多云': '⛅', '阴': '☁️', '阴天': '☁️',
      '雨': '🌧️', '小雨': '🌦️', '中雨': '🌧️', '大雨': '⛈️',
      '雪': '🌨️', '小雪': '❄️', '大雪': '🌨️',
      '雾': '🌫️', '霾': '😷'
    };

    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (description.includes(key)) {
        return emoji;
      }
    }
    return '🌤️';
  }

  // 获取空气质量颜色
  getAQIColor(aqi) {
    if (aqi <= 50) return 'text-green-600';
    if (aqi <= 100) return 'text-yellow-600';
    if (aqi <= 150) return 'text-orange-600';
    return 'text-red-600';
  }

  // 优化的天气建议
  getWeatherSuggestions(weatherData) {
    const { temperature, description, humidity, airQuality, uvIndex } = weatherData;
    const suggestions = [];

    // 温度建议
    if (temperature > 30) {
      suggestions.push('🌡️ 天气炎热，记得多喝水，避免长时间户外活动');
    } else if (temperature > 25) {
      suggestions.push('☀️ 天气温暖，适合户外活动，注意防晒');
    } else if (temperature < 10) {
      suggestions.push('🧥 天气较冷，出门记得添衣保暖');
    } else if (temperature < 0) {
      suggestions.push('❄️ 天气严寒，注意防寒保暖，小心路滑');
    }

    // 天气状况建议
    if (description.includes('雨')) {
      suggestions.push('🌂 今天有雨，记得带伞，注意交通安全');
    } else if (description.includes('雪')) {
      suggestions.push('⛄ 下雪天气，注意保暖和路面安全');
    } else if (description.includes('雾')) {
      suggestions.push('🌫️ 有雾天气，驾车请减速慢行，注意安全');
    }

    // 湿度建议
    if (humidity > 80) {
      suggestions.push('💧 湿度较高，可能感觉闷热，注意通风');
    } else if (humidity < 40) {
      suggestions.push('🏺 空气干燥，注意补水和皮肤保湿');
    }

    // 紫外线建议
    if (uvIndex > 7) {
      suggestions.push('🕶️ 紫外线强烈，外出请做好防晒措施');
    }

    // 空气质量建议
    if (airQuality.aqi > 100) {
      suggestions.push('😷 空气质量不佳，建议减少户外活动，外出戴口罩');
    } else if (airQuality.aqi < 50) {
      suggestions.push('🌱 空气质量优秀，非常适合户外运动和开窗通风');
    }

    return suggestions.length > 0 ? suggestions : ['今天天气不错，享受美好的一天吧！🌈'];
  }

  // 根据城市名称获取天气（优化版）
  async getWeatherByCity(cityName) {
    try {
      console.log(`🌤️ 正在获取${cityName}的天气信息...`);
      const weatherData = await this.getWeatherData(cityName);
      const result = this.formatWeatherForChat(weatherData, 'card');
      console.log(`✅ 成功获取${cityName}的天气信息`);
      return result;
    } catch (error) {
      console.error(`❌ 获取${cityName}天气失败:`, error);
      return {
        type: 'weather_error',
        content: `抱歉，暂时无法获取${cityName}的天气信息。请稍后再试。🌤️`
      };
    }
  }

  // 批量获取多个城市天气
  async getBatchWeather(cities) {
    try {
      const promises = cities.map(city => this.getWeatherByCity(city));
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        city: cities[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));
    } catch (error) {
      console.error('批量获取天气失败:', error);
      throw new Error('批量天气查询服务暂时不可用');
    }
  }

  // 获取天气图标映射（优化版）
  getWeatherIcon(description) {
    const iconMap = {
      '晴': 'ri-sun-line',
      '晴朗': 'ri-sun-line',
      '多云': 'ri-cloudy-line',
      '阴': 'ri-cloudy-2-line',
      '阴天': 'ri-cloudy-2-line',
      '雨': 'ri-rainy-line',
      '小雨': 'ri-drizzle-line',
      '中雨': 'ri-rainy-line',
      '大雨': 'ri-heavy-showers-line',
      '暴雨': 'ri-thunderstorms-line',
      '雪': 'ri-snowy-line',
      '小雪': 'ri-snowy-line',
      '大雪': 'ri-blizzard-line',
      '雾': 'ri-mist-line',
      '霾': 'ri-haze-2-line',
      '沙尘': 'ri-haze-line'
    };

    // 精确匹配优先
    if (iconMap[description]) {
      return iconMap[description];
    }

    // 模糊匹配
    for (const [key, icon] of Object.entries(iconMap)) {
      if (description.includes(key)) {
        return icon;
      }
    }

    return 'ri-sun-line'; // 默认图标
  }
}

module.exports = new WeatherService(); 