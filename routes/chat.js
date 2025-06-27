const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const aiService = require('../services/aiService');

// 发送消息并获取AI回复
router.post('/send', async (req, res) => {
  try {
    const { message, chatId, useThinking = false, useSearch = false } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '消息不能为空' 
      });
    }

    console.log('📨 收到消息:', { message, chatId, useThinking, useSearch });

    // 获取当前聊天
    let currentChatId = chatId;
    let chat;

    if (currentChatId) {
      chat = await storage.getChat(currentChatId);
    }

    // 如果没有找到聊天或没有提供chatId，创建新聊天
    if (!chat) {
      chat = await storage.createChat(message.substring(0, 20) + '...');
      currentChatId = chat.id;
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: message.trim()
    };

    await storage.addMessage(currentChatId, userMessage);

    // 获取完整的消息历史
    const updatedChat = await storage.getChat(currentChatId);
    const messages = updatedChat.messages;

    // 生成AI回复
    const aiReply = await aiService.generateReply(messages, { useThinking, useSearch });

    // 保存AI回复
    await storage.addMessage(currentChatId, aiReply);

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

// 流式聊天接口（可选）
router.post('/stream', async (req, res) => {
  try {
    const { message, chatId, useThinking = false, useSearch = false } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: '消息不能为空' 
      });
    }

    console.log('📨 收到流式消息:', { message, chatId, useThinking, useSearch });

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
      chat = await storage.createChat(message.substring(0, 20) + '...');
      currentChatId = chat.id;
    }

    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: message.trim()
    };

    await storage.addMessage(currentChatId, userMessage);

    // 获取消息历史
    const updatedChat = await storage.getChat(currentChatId);
    const messages = updatedChat.messages;

    // 发送聊天ID
    res.write(`data: ${JSON.stringify({ type: 'chatId', chatId: currentChatId })}\n\n`);

    // 流式生成回复
    let fullReply = '';
    await aiService.generateStreamReply(messages, (content, isEnd) => {
      if (!isEnd) {
        fullReply += content;
        res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
      } else {
        // 保存完整回复
        const aiReply = {
          role: 'assistant',
          content: fullReply,
          timestamp: new Date().toISOString()
        };
        storage.addMessage(currentChatId, aiReply);
        
        res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
        res.end();
      }
    }, { useSearch, useThinking });

  } catch (error) {
    console.error('流式聊天错误:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: '聊天失败' })}\n\n`);
    res.end();
  }
});

module.exports = router; 