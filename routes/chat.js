const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const aiService = require('../services/aiService');
const { authenticateToken, getUserEmail } = require('../middleware/auth');

// 从用户消息中提取城市名称（天气查询）
function extractCityFromWeatherQuery(message) {
  // 严格的天气查询关键词
  const strictWeatherKeywords = [
    '天气', '气温', '温度', '下雨', '晴天', '阴天', '多云', '雪天', '风速',
    '湿度', '气候', '雷雨', '暴雨', '小雨', '中雨', '大雨', '阵雨'
  ];
  
  // 检查是否有严格的天气关键词
  const hasStrictWeatherKeyword = strictWeatherKeywords.some(keyword => message.includes(keyword));
  
  if (!hasStrictWeatherKeyword) {
    return null;
  }
  
  // 扩展的城市列表
  const cities = [
    '北京', '上海', '天津', '重庆', '广州', '深圳', '杭州', '南京', '武汉', '成都', 
    '西安', '长沙', '郑州', '沈阳', '哈尔滨', '长春', '青岛', '大连', '厦门', '宁波'
  ];

  // 精确匹配城市名称
  for (const city of cities) {
    if (message.includes(city)) {
      return city;
    }
  }

  // 如果消息很简单且明确包含天气关键词，使用默认城市
  if (message.length <= 10) {
    return '北京';
  }

  return null;
}

// 发送消息并获取AI回复
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message, chatId, useThinking = false, useSearch = false, useDeepThinking = false, attachedFiles = [] } = req.body;
    const userEmail = getUserEmail(req);

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '消息不能为空'
      });
    }

    console.log('📨 用户', userEmail, '发送消息:', { message, chatId, useThinking, useSearch, useDeepThinking, attachedFiles: attachedFiles.length });

    // 获取当前聊天
    let currentChatId = chatId;
    let chat;

    if (currentChatId) {
      chat = await storage.getChat(currentChatId, userEmail);
    }

    // 如果没有找到聊天或没有提供chatId，创建新聊天
    if (!chat) {
      chat = await storage.createChat('新对话...', userEmail);
      currentChatId = chat.id;
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: message.trim()
    };

    // 如果有附件，添加到用户消息中
    if (attachedFiles && attachedFiles.length > 0) {
      userMessage.attachments = attachedFiles.map(file => ({
        filename: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: `/api/upload/file/${file.filename}`
      }));
    }

    await storage.addMessage(currentChatId, userMessage, userEmail);

    // 获取完整的消息历史
    const updatedChat = await storage.getChat(currentChatId, userEmail);
    const messages = updatedChat.messages;

    // 生成AI回复
    // 如果启用深度思考，则将useThinking设为true以使用深度思考模型
    const aiReply = await aiService.generateReply(messages, { 
      useThinking: useDeepThinking || useThinking, 
      useSearch, 
      files: attachedFiles 
    });

    // 保存AI回复
    await storage.addMessage(currentChatId, aiReply, userEmail);

    // 智能生成标题
    const finalChat = await storage.getChat(currentChatId, userEmail);
    const shouldGenerateTitle = (
      // 新对话，有足够消息数量
      (finalChat.messages.length >= 2 && finalChat.title === '新对话...') ||
      // 或者是以...结尾的截取标题（表示需要智能生成）
      (finalChat.messages.length >= 2 && finalChat.title.endsWith('...') && finalChat.title.length <= 20) ||
      // 或者标题是"新对话"
      (finalChat.messages.length >= 2 && finalChat.title === '新对话')
    );

    if (shouldGenerateTitle) {
      try {
        const aiTitle = await aiService.generateChatTitle(finalChat.messages);
        await storage.updateChatTitle(currentChatId, aiTitle, userEmail);
        console.log('🏷️ 已为用户', userEmail, '的对话生成AI标题:', aiTitle);
      } catch (error) {
        console.error('生成AI标题失败:', error);
      }
    }

    // 返回结果
    res.json({
      success: true,
      data: {
        chatId: currentChatId,
        userMessage: {
          ...userMessage,
          timestamp: new Date().toISOString()
        },
        aiReply: aiReply
      }
    });

  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({
      success: false,
      error: '发送消息失败，请稍后重试'
    });
  }
});

// 获取聊天历史列表
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userEmail = getUserEmail(req);
    const history = await storage.getChatHistory(userEmail);

    console.log('📜 用户', userEmail, '获取聊天历史，共',
      Object.values(history).reduce((sum, group) => {
        if (Array.isArray(group)) return sum + group.length;
        return sum + Object.values(group).reduce((s, arr) => s + arr.length, 0);
      }, 0), '个对话');

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({
      success: false,
      error: '获取聊天历史失败'
    });
  }
});

// 获取特定聊天的完整内容
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userEmail = getUserEmail(req);
    const chat = await storage.getChat(chatId, userEmail);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: '聊天不存在或无权访问'
      });
    }

    res.json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('获取聊天失败:', error);
    res.status(500).json({
      success: false,
      error: '获取聊天失败'
    });
  }
});

// 创建新聊天
router.post('/new', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const userEmail = getUserEmail(req);
    const newChat = await storage.createChat(title, userEmail);

    res.json({
      success: true,
      data: newChat
    });

  } catch (error) {
    console.error('创建聊天失败:', error);
    res.status(500).json({
      success: false,
      error: '创建新聊天失败'
    });
  }
});

// 删除聊天
router.delete('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userEmail = getUserEmail(req);

    const result = await storage.deleteChat(chatId, userEmail);

    res.json({
      success: true,
      message: '聊天删除成功'
    });

  } catch (error) {
    console.error('删除聊天失败:', error);

    if (error.message === '聊天不存在') {
      res.status(404).json({
        success: false,
        error: '聊天不存在或无权访问'
      });
    } else {
      res.status(500).json({
        success: false,
        error: '删除聊天失败'
      });
    }
  }
});

// 批量删除聊天
router.post('/batch-delete', authenticateToken, async (req, res) => {
  try {
    const { chatIds } = req.body;
    const userEmail = getUserEmail(req);

    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要删除的聊天ID列表'
      });
    }

    const result = await storage.deleteMultipleChats(chatIds, userEmail);

    res.json({
      success: true,
      message: `批量删除完成，已删除 ${result.deletedCount} 个聊天`,
      data: result
    });

  } catch (error) {
    console.error('批量删除聊天失败:', error);
    res.status(500).json({
      success: false,
      error: '批量删除聊天失败'
    });
  }
});

// 搜索用户聊天记录
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    const userEmail = getUserEmail(req);

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '搜索关键词不能为空'
      });
    }

    const results = await storage.searchUserChats(userEmail, query, parseInt(limit));

    res.json({
      success: true,
      data: {
        query: query,
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('搜索聊天失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索失败，请重试'
    });
  }
});

// 获取用户聊天统计信息
router.get('/stats/user', authenticateToken, async (req, res) => {
  try {
    const userEmail = getUserEmail(req);
    const stats = await storage.getUserChatStats(userEmail);

    res.json({
      success: true,
      data: {
        user: {
          email: userEmail,
          ...req.user
        },
        chatStats: stats
      }
    });

  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计信息失败'
    });
  }
});

// 流式发送消息接口
router.post('/stream', authenticateToken, async (req, res) => {
  try {
    const { message, chatId, useThinking = false, useSearch = false, useDeepThinking = false, files = [] } = req.body;
    const userEmail = getUserEmail(req);

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: '消息不能为空'
      });
    }

    console.log('🔄 用户', userEmail, '开始流式对话:', { message, chatId, useThinking, useSearch, useDeepThinking, files: files?.length });

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });

    const sendChunk = async (data) => {
      try {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('发送数据块失败:', error);
      }
    };

    // 获取当前聊天
    let currentChatId = chatId;
    let chat;

    if (currentChatId) {
      chat = await storage.getChat(currentChatId, userEmail);
    }

    // 如果没有找到聊天或没有提供chatId，创建新聊天
    if (!chat) {
      chat = await storage.createChat('新对话...', userEmail);
      currentChatId = chat.id;

      // 发送新的chatId
      await sendChunk({ type: 'chatId', chatId: currentChatId });
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: message.trim()
    };

    // 如果有文件，处理文件信息
    if (files && files.length > 0) {
      userMessage.attachments = files.map(file => ({
        filename: file.originalname || file.filename,
        type: file.mimetype,
        size: file.size,
        url: `/api/upload/file/${file.filename}`
      }));
    }

    await storage.addMessage(currentChatId, userMessage, userEmail);

    // 获取完整的消息历史
    const updatedChat = await storage.getChat(currentChatId, userEmail);
    const messages = updatedChat.messages;

    // 在开始AI回复之前，先检查是否有天气查询并立即获取天气数据
    const lastMessage = messages[messages.length - 1];
    let weatherData = null;

    // 检测天气查询并立即获取数据
    const cityName = extractCityFromWeatherQuery(lastMessage.content);
    if (cityName) {
      console.log('🌤️ 流式回复 - 检测到天气查询，立即获取天气数据:', cityName);
      const weatherService = require('../services/weatherService');
      weatherData = await weatherService.getWeatherByCity(cityName);

      if (weatherData) {
        console.log('🌤️ 立即发送天气数据到前端');
        await sendChunk({ type: 'weather', weather: weatherData });
      }
    }

    // 使用流式生成AI回复
    let aiContent = '';
    const aiReply = await aiService.generateStreamReply(messages, async (content, isEnd, fullReply) => {
      if (!isEnd && content) {
        // 发送内容块
        aiContent += content;
        await sendChunk({ type: 'content', content: content });
      } else if (!isEnd && !content && fullReply) {
        // 处理中间发送的特殊数据（如思考过程）
        if (fullReply.type === 'thinking') {
          console.log('🧠 收到思考过程，立即发送到前端');
          await sendChunk({ type: 'thinking', thinking: fullReply.thinking });
        }
      } else if (isEnd) {
        // 流式输出结束，准备保存完整回复
        const completeReply = {
          role: 'assistant',
          content: aiContent,
          timestamp: new Date().toISOString()
        };

        // 如果有完整回复信息，合并额外数据
        if (fullReply) {
          if (fullReply.searchUsed) {
            completeReply.searchUsed = fullReply.searchUsed;
            completeReply.searchQuery = fullReply.searchQuery;
            completeReply.searchResultsCount = fullReply.searchResultsCount;
          }
          if (fullReply.weather) {
            completeReply.weather = fullReply.weather;
            // 天气数据已经在开始时发送过了，这里只保存到数据库
          }
          if (fullReply.thinking) {
            completeReply.thinking = fullReply.thinking;
            // 发送思考过程到前端
            console.log('🧠 发送思考过程到前端');
            await sendChunk({ type: 'thinking', thinking: fullReply.thinking });
          }
        }

        // 如果前面获取到了天气数据，也要保存到数据库
        if (weatherData && !completeReply.weather) {
          completeReply.weather = weatherData;
        }

        // 保存AI回复到存储
        await storage.addMessage(currentChatId, completeReply, userEmail);
      }
    }, {
      useThinking: useDeepThinking || useThinking,
      useSearch,
      files: files || []
    });

    // 智能生成标题
    const finalChat = await storage.getChat(currentChatId, userEmail);
    const shouldGenerateTitle = (
      (finalChat.messages.length >= 2 && finalChat.title === '新对话...') ||
      (finalChat.messages.length >= 2 && finalChat.title.endsWith('...') && finalChat.title.length <= 20) ||
      (finalChat.messages.length >= 2 && finalChat.title === '新对话')
    );

    if (shouldGenerateTitle) {
      try {
        const aiTitle = await aiService.generateChatTitle(finalChat.messages);
        await storage.updateChatTitle(currentChatId, aiTitle, userEmail);
        console.log('🏷️ 已为用户', userEmail, '的对话生成AI标题:', aiTitle);
      } catch (error) {
        console.error('生成AI标题失败:', error);
      }
    }

    // 发送结束信号
    await sendChunk({ type: 'end' });
    res.end();

  } catch (error) {
    console.error('流式发送消息错误:', error);

    try {
      res.write(`data: ${JSON.stringify({ type: 'error', error: '发送消息失败，请稍后重试' })}\n\n`);
      res.end();
    } catch (writeError) {
      console.error('发送错误响应失败:', writeError);
    }
  }
});

module.exports = router; 