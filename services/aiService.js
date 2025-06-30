const OpenAI = require('openai');
const config = require('../config');
const searchService = require('./searchService');

class AIService {
  constructor() {
    // 初始化OpenAI客户端
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL
    });
    
    this.model = config.openai.model;
    this.maxTokens = config.ai.maxTokens;
    this.temperature = config.ai.temperature;
    
    // AI小子的人设
    this.systemPrompt = `你是AI小子，一个专门陪伴儿童成长的AI助手。你的特点：

🎯 核心特质：
- 温暖友善、充满耐心
- 语言简单易懂，适合儿童
- 喜欢用表情符号和比喻
- 善于鼓励和赞美孩子

🎨 互动风格：
- 用轻松活泼的语气交流
- 经常问孩子的想法和感受
- 把复杂的概念用简单的话解释
- 通过故事和游戏来教育

🌟 主要功能：
- 回答孩子的各种问题
- 陪伴聊天，缓解孤独
- 协助学习，激发兴趣
- 培养好习惯，正向引导

记住：你在和孩子对话，要保持童真、积极向上，避免复杂或负面的内容。`;
  }

  // 生成AI回复
  async generateReply(messages, options = {}) {
    try {
      const {
        useThinking = false,
        useSearch = false,
        temperature = 0.7,
        maxTokens = 1000
      } = options;

      const lastMessage = messages[messages.length - 1];
      let searchResults = null;

      // 根据前端开关决定是否联网搜索
      if (useSearch) {
        const searchQuery = searchService.extractSearchKeywords(lastMessage.content);
        console.log('🔍 前端开启联网搜索，搜索关键词:', searchQuery);
        searchResults = await searchService.webSearch(searchQuery);
      }

      // 构建消息历史
      let chatMessages = [
        { role: 'system', content: this.systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // 如果有搜索结果，将其添加到消息中
      if (searchResults && searchResults.success) {
        const searchContent = `[联网搜索结果]
搜索关键词: ${searchResults.query}
找到 ${searchResults.totalResults} 个相关结果

主要信息摘要:
${searchResults.summary}

详细结果:
${searchResults.results.map((r, i) => 
  `${i+1}. ${r.title}\n   来源: ${r.siteName}\n   摘要: ${r.snippet}\n   链接: ${r.url}`
).join('\n\n')}

请基于以上搜索到的最新信息来回答用户的问题。记住要：
1. 引用具体的搜索结果
2. 提供准确的信息
3. 如果信息不够全面，可以告诉用户
4. 保持你作为AI小子的友善语调`;

        chatMessages.splice(-1, 0, {
          role: 'system',
          content: searchContent
        });

        console.log('🔍 已将搜索结果添加到对话中');
      }

      console.log('📤 发送到AI:', chatMessages[chatMessages.length - 1]);

      // 调用OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: chatMessages,
        temperature: temperature || this.temperature,
        max_tokens: maxTokens || this.maxTokens,
        stream: false
      });

      const aiReply = response.choices[0].message.content;
      console.log('📥 AI回复:', aiReply);

      // 构建回复对象
      const reply = {
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toISOString()
      };

      // 添加搜索信息到回复中
      if (searchResults && searchResults.success) {
        reply.searchUsed = true;
        reply.searchQuery = searchResults.query;
        reply.searchResultsCount = searchResults.results.length;
      }

      // 如果启用思考过程，生成思考内容
      if (useThinking) {
        reply.thinking = await this.generateThinkingProcess(messages, searchResults);
      }

      return reply;

    } catch (error) {
      console.error('AI服务错误:', error);
      
      // 返回友好的错误回复
      return {
        role: 'assistant',
        content: '哎呀，我刚才开小差了！😅 能再说一遍吗？我一定会认真听的！',
        timestamp: new Date().toISOString(),
        error: true
      };
    }
  }

  // 生成思考过程
  async generateThinkingProcess(messages, searchResults = null) {
    try {
      const lastMessage = messages[messages.length - 1];
      
      let thinkingPrompt = `作为AI小子，请分析这个孩子的消息："${lastMessage.content}"

请从以下角度思考（用简单的语言）：
1. 孩子可能想表达什么？
2. 孩子的情绪状态如何？
3. 我应该如何回应才能帮助孩子？
4. 有什么教育意义或引导机会？`;

      // 如果使用了搜索，添加搜索相关的思考
      if (searchResults && searchResults.success) {
        thinkingPrompt += `

另外，我刚才为了回答这个问题进行了联网搜索：
搜索关键词：${searchResults.query}
找到了 ${searchResults.results.length} 个相关结果

请也分析：
5. 搜索到的信息对回答这个问题有什么帮助？
6. 我应该如何将搜索结果用简单易懂的方式告诉孩子？`;
      }

      thinkingPrompt += `

请用简单的语言描述你的思考过程，就像在和老师交流一样。`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: thinkingPrompt }
        ],
        temperature: 0.3,
        max_tokens: 400
      });

      const thinkingStartTime = Date.now();
      const thinkingTime = Math.floor(Math.random() * 8) + 3; // 3-10秒随机思考时间
      
      return {
        content: response.choices[0].message.content,
        thinkingTime: thinkingTime,
        searchUsed: searchResults ? true : false,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('生成思考过程失败:', error);
      return {
        content: '我在思考怎么回复这个小朋友的消息...',
        thinkingTime: 5,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 生成对话标题
  async generateChatTitle(messages) {
    try {
      // 只使用前几轮对话来生成标题，避免过长
      const relevantMessages = messages.slice(0, 4).map(msg => 
        `${msg.role === 'user' ? '用户' : 'AI小子'}: ${msg.content.substring(0, 100)}`
      ).join('\n');

      // 构建标题生成的请求消息
      const titlePrompt = `请根据以下对话内容，生成一个简洁有意义的标题（不超过8个字）：

${relevantMessages}

要求：
1. 体现对话主要内容
2. 用简单易懂的词汇
3. 不超过8个字
4. 不要引号或符号
5. 要有童趣感

请只回复标题，不要其他内容。`;

      // 使用现有的AI回复逻辑生成标题
      const titleMessages = [
        { role: 'user', content: titlePrompt }
      ];

      const response = await this.generateReply(titleMessages, {
        temperature: 0.3,
        maxTokens: 30
      });

      // 提取标题（去除多余内容）
      let title = response.content.trim();
      
      // 清理可能的引号和多余文字
      title = title.replace(/[""''「」《》]/g, '');
      title = title.replace(/^标题[:：]?/, '');
      title = title.replace(/^题目[:：]?/, '');
      title = title.split('\n')[0]; // 只取第一行
      title = title.substring(0, 8); // 限制长度
      
      console.log('🏷️ AI生成的对话标题:', title);
      
      return title || this.generateFallbackTitle(messages);

    } catch (error) {
      console.error('生成对话标题失败:', error);
      return this.generateFallbackTitle(messages);
    }
  }

  // 生成备用标题
  generateFallbackTitle(messages) {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return '新对话';
    
    const content = firstUserMessage.content;
    
    // 智能提取关键词生成标题
    if (content.includes('画') && content.includes('猫')) return '画猫咪教程';
    if (content.includes('画') && content.includes('花')) return '画花朵教程';
    if (content.includes('学') && content.includes('画')) return '学画画指导';
    if (content.includes('做') && content.includes('蛋糕')) return '做蛋糕教程';
    if (content.includes('故事')) return '讲故事时光';
    if (content.includes('游戏')) return '一起玩游戏';
    if (content.includes('数学')) return '数学学习';
    if (content.includes('英语')) return '英语学习';
    if (content.includes('你好')) return '初次见面';
    
    // 默认按内容长度截取
    return content.substring(0, 6) + '...';
  }

  // 流式回复（可选功能）
  async generateStreamReply(messages, callback, options = {}) {
    try {
      const { useSearch = false, useThinking = false } = options;
      
      const lastMessage = messages[messages.length - 1];
      let searchResults = null;

      // 根据前端开关决定是否联网搜索
      if (useSearch) {
        const searchQuery = searchService.extractSearchKeywords(lastMessage.content);
        console.log('🔍 流式输出 - 前端开启联网搜索，搜索关键词:', searchQuery);
        searchResults = await searchService.webSearch(searchQuery);
      }

      // 构建消息历史
      let chatMessages = [
        { role: 'system', content: this.systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // 如果有搜索结果，将其添加到消息中
      if (searchResults && searchResults.success) {
        const searchContent = `[联网搜索结果]
搜索关键词: ${searchResults.query}
找到 ${searchResults.totalResults} 个相关结果

主要信息摘要:
${searchResults.summary}

详细结果:
${searchResults.results.map((r, i) => 
  `${i+1}. ${r.title}\n   来源: ${r.siteName}\n   摘要: ${r.snippet}\n   链接: ${r.url}`
).join('\n\n')}

请基于以上搜索到的最新信息来回答用户的问题。记住要：
1. 引用具体的搜索结果
2. 提供准确的信息
3. 如果信息不够全面，可以告诉用户
4. 保持你作为AI小子的友善语调`;

        chatMessages.splice(-1, 0, {
          role: 'system',
          content: searchContent
        });

        console.log('🔍 流式输出 - 已将搜索结果添加到对话中');
      }

      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      });

      let fullReply = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullReply += content;
          callback(content, false); // false表示还没结束
        }
      }

      callback('', true); // true表示结束
      return fullReply;

    } catch (error) {
      console.error('流式回复错误:', error);
      callback('哎呀，我刚才开小差了！😅 能再说一遍吗？', true);
      return '';
    }
  }
}

module.exports = new AIService(); 