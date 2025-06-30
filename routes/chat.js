const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const aiService = require('../services/aiService');

// 发送消息并获取AI回复
router.post('/send', async (req, res) => {
  try {
    const { message, chatId, useThinking = false, useSearch = false, attachedFiles = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '消息不能为空' 
      });
    }

    console.log('📨 收到消息:', { message, chatId, useThinking, useSearch, attachedFiles: attachedFiles.length });

    // 获取当前聊天
    let currentChatId = chatId;
    let chat;

    if (currentChatId) {
      chat = await storage.getChat(currentChatId);
    }

    // 如果没有找到聊天或没有提供chatId，创建新聊天
    if (!chat) {
      chat = await storage.createChat('新对话...');
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

    await storage.addMessage(currentChatId, userMessage);

    // 获取完整的消息历史
    const updatedChat = await storage.getChat(currentChatId);
    const messages = updatedChat.messages;

    // 生成AI回复
    const aiReply = await aiService.generateReply(messages, { useThinking, useSearch, files: attachedFiles });

    // 保存AI回复
    await storage.addMessage(currentChatId, aiReply);

    // 智能生成标题
    const finalChat = await storage.getChat(currentChatId);
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
        await storage.updateChatTitle(currentChatId, aiTitle);
        console.log('🏷️ 已为对话生成AI标题:', aiTitle);
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
router.get('/history', async (req, res) => {
  try {
    const history = await storage.getChatHistory();
    
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
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await storage.getChat(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: '聊天不存在'
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
router.post('/new', async (req, res) => {
  try {
    const { title } = req.body;
    const newChat = await storage.createChat(title);

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
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const result = await storage.deleteChat(chatId);
    
    res.json({
      success: true,
      message: '聊天删除成功'
    });

  } catch (error) {
    console.error('删除聊天失败:', error);
    
    if (error.message === '聊天不存在') {
      res.status(404).json({
        success: false,
        error: '聊天不存在'
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
router.delete('/batch/delete', async (req, res) => {
  try {
    const { chatIds } = req.body;
    
    if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供要删除的聊天ID列表'
      });
    }

    const deletedCount = await storage.deleteMultipleChats(chatIds);
    
    res.json({
      success: true,
      message: `成功删除 ${deletedCount} 个聊天`,
      deletedCount
    });

  } catch (error) {
    console.error('批量删除聊天失败:', error);
    res.status(500).json({
      success: false,
      error: '批量删除聊天失败'
    });
  }
});

// 流式聊天接口（可选）
router.post('/stream', async (req, res) => {
  try {
    const { message, chatId, useThinking = false, useSearch = false, attachedFiles = [] } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '消息不能为空' 
      });
    }

    console.log('📨 收到流式消息:', { message, chatId, useThinking, useSearch, attachedFiles: attachedFiles.length });

    // 设置流式响应头
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    let currentChatId = chatId;
    let chat;

    if (currentChatId) {
      chat = await storage.getChat(currentChatId);
    }

    if (!chat) {
      chat = await storage.createChat('新对话...');
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

    await storage.addMessage(currentChatId, userMessage);

    // 获取消息历史
    const updatedChat = await storage.getChat(currentChatId);
    const messages = updatedChat.messages;

    // 发送聊天ID
    res.write(`data: ${JSON.stringify({ type: 'chatId', chatId: currentChatId })}\n\n`);

    // 首先生成AI回复以检查是否包含天气信息
    const aiReply = await aiService.generateReply(messages, { useThinking, useSearch, files: attachedFiles });
    
    // 如果包含天气信息，先发送天气数据
    if (aiReply.weather) {
      res.write(`data: ${JSON.stringify({ type: 'weather', weather: aiReply.weather })}\n\n`);
    }

    // 流式发送内容
    let currentPos = 0;
    const contentToSend = aiReply.content;
    
    const sendChunk = async () => {
      if (currentPos < contentToSend.length) {
        const chunkSize = Math.min(10, contentToSend.length - currentPos);
        const chunk = contentToSend.slice(currentPos, currentPos + chunkSize);
        currentPos += chunkSize;
        
        res.write(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`);
        
        // 继续发送下一个chunk
        setTimeout(sendChunk, 30);
      } else {
        // 发送完毕
        // 保存完整回复
        const savedReply = {
          role: 'assistant',
          content: aiReply.content,
          timestamp: new Date().toISOString(),
          weather: aiReply.weather,
          searchUsed: aiReply.searchUsed,
          searchQuery: aiReply.searchQuery,
          searchResultsCount: aiReply.searchResultsCount,
          fileAnalysis: aiReply.fileAnalysis
        };
        await storage.addMessage(currentChatId, savedReply);
        
        // 智能生成标题
        const finalChat = await storage.getChat(currentChatId);
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
            await storage.updateChatTitle(currentChatId, aiTitle);
            console.log('🏷️ 已为流式对话生成AI标题:', aiTitle);
          } catch (error) {
            console.error('生成流式AI标题失败:', error);
          }
        }
        
        res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
        res.end();
      }
    };
    
    // 开始发送chunks
    sendChunk();

  } catch (error) {
    console.error('流式聊天错误:', error);
    
    // 根据错误类型返回不同的错误信息
    let errorMessage = '聊天失败，请重试';
    let errorCode = 'CHAT_ERROR';
    
    if (error.code === 'ECONNRESET') {
      errorMessage = 'AI服务连接中断，请重试';
      errorCode = 'CONNECTION_RESET';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = '无法连接到AI服务，请检查网络';
      errorCode = 'SERVICE_UNAVAILABLE';
    } else if (error.status === 429) {
      errorMessage = '请求过于频繁，请稍后再试';
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (error.status === 401) {
      errorMessage = 'AI服务认证失败，请联系管理员';
      errorCode = 'AUTH_FAILED';
    } else if (error.name === 'AbortError') {
      errorMessage = '请求被取消';
      errorCode = 'REQUEST_ABORTED';
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时，请重试';
      errorCode = 'TIMEOUT';
    } else if (error.message.includes('无效的API密钥')) {
      errorMessage = 'AI服务配置错误，请联系管理员';
      errorCode = 'CONFIG_ERROR';
    }
    
    const errorResponse = {
      type: 'error',
      error: errorMessage,
      code: errorCode,
      retryable: ['CONNECTION_RESET', 'SERVICE_UNAVAILABLE', 'TIMEOUT'].includes(errorCode),
      timestamp: new Date().toISOString()
    };
    
    res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
    res.end();
  }
});

module.exports = router; 