const OpenAI = require('openai');
const config = require('../config');
const searchService = require('./searchService');
const weatherService = require('./weatherService');

class AIService {
  constructor() {
    // 初始化OpenAI客户端（默认模型）
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL
    });

    // 初始化深度思考模型客户端
    this.deepseekClient = new OpenAI({
      apiKey: config.deepseek.apiKey,
      baseURL: config.deepseek.baseURL
    });

    this.model = config.openai.model;
    this.deepseekModel = config.deepseek.model;
    this.maxTokens = config.ai.maxTokens;
    this.temperature = config.ai.temperature;

    // 天气查询防抖机制
    this.weatherQueryCache = new Map();
    this.weatherQueryCooldown = 2 * 60 * 1000; // 2分钟冷却时间

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

📐 数学公式格式要求：
当你需要在回复中包含数学公式时，请务必使用LaTeX格式：
- 行内公式使用 $公式$ 格式，例如：$E = mc^2$
- 块级公式使用 $$公式$$ 格式，例如：$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- 常用符号：平方用^2，分数用\\frac{分子}{分母}，根号用\\sqrt{}，积分用\\int
- 示例：爱因斯坦质能方程是 $E = mc^2$，二次方程求根公式是 $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$

记住：你在和孩子对话，要保持童真、积极向上，避免复杂或负面的内容。当涉及数学内容时，一定要使用LaTeX格式来确保公式能正确显示。`;
  }

  // 生成AI回复
  async generateReply(messages, options = {}) {
    try {
      const {
        useThinking = false,
        useSearch = false,
        temperature = 0.7,
        maxTokens = 1000,
        files = [] // 新增：文件列表
      } = options;

      const lastMessage = messages[messages.length - 1];
      let searchResults = null;
      let weatherData = null;
      let fileAnalysis = null;

      // 多模态文件分析
      if (files && files.length > 0) {
        console.log('🎨 检测到文件附件，开始多模态分析:', files.length, '个文件');
        fileAnalysis = await this.analyzeFiles(files);
      }

      // 检测是否是天气查询（加入防抖机制）
      const cityName = this.extractCityFromWeatherQuery(lastMessage.content);
      if (cityName) {
        // 检查是否在冷却期内
        const cacheKey = `weather_${cityName}_${lastMessage.content.slice(0, 20)}`;
        const lastQuery = this.weatherQueryCache.get(cacheKey);
        const now = Date.now();

        if (lastQuery && (now - lastQuery < this.weatherQueryCooldown)) {
          console.log('🌤️ 天气查询冷却中，跳过天气获取:', cityName);
          weatherData = null;
        } else {
          console.log('🌤️ 检测到天气查询，城市:', cityName);
          weatherData = await weatherService.getWeatherByCity(cityName);

          // 更新缓存时间
          this.weatherQueryCache.set(cacheKey, now);

          // 清理过期缓存
          this.cleanWeatherQueryCache();
        }
      }

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

      // 如果有文件分析结果，将其添加到消息中
      if (fileAnalysis && fileAnalysis.length > 0) {
        const analysisContent = `[文件分析结果]
用户上传了 ${fileAnalysis.length} 个文件，以下是分析结果：

${fileAnalysis.map((analysis, i) =>
          `文件 ${i + 1}: ${analysis.filename}
类型: ${analysis.type}
分析结果: ${analysis.analysis}
${analysis.details ? `详细信息: ${analysis.details}` : ''}`
        ).join('\n\n')}

请基于以上文件分析结果以及用户的消息来回答。记住要：
1. 结合文件内容和用户问题
2. 用简单易懂的语言解释
3. 保持AI小子的友善语调
4. 如果是图片，可以描述看到的内容
5. 如果是音频，可以转述听到的内容`;

        chatMessages.splice(-1, 0, {
          role: 'system',
          content: analysisContent
        });

        console.log('🎨 已将文件分析结果添加到对话中');
      }

      // 如果有搜索结果，将其添加到消息中
      if (searchResults && searchResults.success) {
        const searchContent = `[联网搜索结果]
搜索关键词: ${searchResults.query}
找到 ${searchResults.totalResults} 个相关结果

主要信息摘要:
${searchResults.summary}

详细结果:
${searchResults.results.map((r, i) =>
          `${i + 1}. ${r.title}\n   来源: ${r.siteName}\n   摘要: ${r.snippet}\n   链接: ${r.url}`
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

      let response;
      let aiReply;

      // 根据useThinking参数选择使用的模型和客户端
      if (useThinking) {
        console.log('🤔 启用深度思考模式，使用DeepSeek R1模型');
        
        // 为深度思考模式添加特殊的系统提示
        const deepThinkingPrompt = `${this.systemPrompt}

🧠 深度思考模式已启用：
请进行更深入的分析和思考，提供更详细、更有洞察力的回答。你可以：
1. 分析问题的多个角度
2. 提供更深层次的解释
3. 考虑潜在的关联和影响
4. 给出更全面的建议

记住仍要保持AI小子的友善特质，用孩子能理解的语言表达深刻的思考。`;

        const deepThinkingMessages = [
          { role: 'system', content: deepThinkingPrompt },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ];

        // 如果有搜索结果或文件分析，也要添加到深度思考的消息中
        if (fileAnalysis && fileAnalysis.length > 0) {
          deepThinkingMessages.splice(-1, 0, {
            role: 'system',
            content: `[文件分析结果]
用户上传了 ${fileAnalysis.length} 个文件，以下是分析结果：

${fileAnalysis.map((analysis, i) =>
              `文件 ${i + 1}: ${analysis.filename}
类型: ${analysis.type}
分析结果: ${analysis.analysis}
${analysis.details ? `详细信息: ${analysis.details}` : ''}`
            ).join('\n\n')}`
          });
        }

        if (searchResults && searchResults.success) {
          deepThinkingMessages.splice(-1, 0, {
            role: 'system',
            content: `[联网搜索结果]
搜索关键词: ${searchResults.query}
找到 ${searchResults.totalResults} 个相关结果

主要信息摘要:
${searchResults.summary}

详细结果:
${searchResults.results.map((r, i) =>
              `${i + 1}. ${r.title}\n   来源: ${r.siteName}\n   摘要: ${r.snippet}\n   链接: ${r.url}`
            ).join('\n\n')}`
          });
        }

        response = await this.deepseekClient.chat.completions.create({
          model: this.deepseekModel,
          messages: deepThinkingMessages,
          temperature: temperature || this.temperature,
          max_tokens: maxTokens || this.maxTokens,
          stream: false
        });
        
        // 简化调试信息
        console.log('🔍 DeepSeek R1 API响应 - 是否有reasoning_content:', !!response.choices[0].message.reasoning_content);
      } else {
        console.log('💭 使用标准模式，使用默认模型');
        response = await this.openai.chat.completions.create({
          model: this.model,
          messages: chatMessages,
          temperature: temperature || this.temperature,
          max_tokens: maxTokens || this.maxTokens,
          stream: false
        });
      }

      const message = response.choices[0].message;
      aiReply = message.content;
      console.log('📥 AI回复:', aiReply.substring(0, 100) + '...');

      // 构建回复对象
      let reply = {
        role: 'assistant',
        content: aiReply,
        timestamp: new Date().toISOString()
      };

      // 如果使用深度思考模式(R1模型)，直接获取reasoning_content字段
      if (useThinking && message.reasoning_content) {
        console.log('🧠 直接获取R1模型的reasoning_content思考过程');
        reply.thinking = {
          content: message.reasoning_content,
          isDeepThinking: true,
          model: 'DeepSeek-R1',
          timestamp: new Date().toISOString()
        };
        console.log('🧠 已获取R1模型的思考过程，长度:', message.reasoning_content.length);
      }

      // 添加搜索信息到回复中
      if (searchResults && searchResults.success) {
        reply.searchUsed = true;
        reply.searchQuery = searchResults.query;
        reply.searchResultsCount = searchResults.results.length;
      }

      // 添加天气信息到回复中
      if (weatherData) {
        reply.weather = weatherData;
        console.log('🌤️ 已添加天气信息到回复中');
      }

      // 添加文件分析信息到回复中
      if (fileAnalysis && fileAnalysis.length > 0) {
        reply.fileAnalysis = fileAnalysis;
        console.log('🎨 已添加文件分析信息到回复中');
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
        model: this.model,
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

      // 直接调用OpenAI API生成标题，避免循环调用
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: '你是一个专门为儿童对话生成简洁标题的助手。' },
          { role: 'user', content: titlePrompt }
        ],
        temperature: 0.3,
        max_tokens: 30
      });

      // 提取标题（去除多余内容）
      let title = response.choices[0].message.content.trim();

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
      console.error('错误详情:', error.message);
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
      const { useSearch = false, useThinking = false, files = [] } = options;

      const lastMessage = messages[messages.length - 1];
      let searchResults = null;
      let weatherData = null;
      let fileAnalysis = null;

      // 多模态文件分析
      if (files && files.length > 0) {
        console.log('🎨 流式输出 - 检测到文件附件，开始多模态分析:', files.length, '个文件');
        fileAnalysis = await this.analyzeFiles(files);
      }

      // 检测是否是天气查询（加入防抖机制）
      const cityName = this.extractCityFromWeatherQuery(lastMessage.content);
      if (cityName) {
        // 检查是否在冷却期内
        const cacheKey = `weather_${cityName}_${lastMessage.content.slice(0, 20)}`;
        const lastQuery = this.weatherQueryCache.get(cacheKey);
        const now = Date.now();

        if (lastQuery && (now - lastQuery < this.weatherQueryCooldown)) {
          console.log('🌤️ 天气查询冷却中，跳过天气获取:', cityName);
          weatherData = null;
        } else {
          console.log('🌤️ 流式输出 - 检测到天气查询，城市:', cityName);
          weatherData = await weatherService.getWeatherByCity(cityName);

          // 更新缓存时间
          this.weatherQueryCache.set(cacheKey, now);

          // 清理过期缓存
          this.cleanWeatherQueryCache();
        }
      }

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

      // 如果有文件分析结果，将其添加到消息中
      if (fileAnalysis && fileAnalysis.length > 0) {
        const analysisContent = `[文件分析结果]
用户上传了 ${fileAnalysis.length} 个文件，以下是分析结果：

${fileAnalysis.map((analysis, i) =>
          `文件 ${i + 1}: ${analysis.filename}
类型: ${analysis.type}
分析结果: ${analysis.analysis}
${analysis.details ? `详细信息: ${analysis.details}` : ''}`
        ).join('\n\n')}

请基于以上文件分析结果以及用户的消息来回答。记住要：
1. 结合文件内容和用户问题
2. 用简单易懂的语言解释
3. 保持AI小子的友善语调
4. 如果是图片，可以描述看到的内容
5. 如果是音频，可以转述听到的内容`;

        chatMessages.splice(-1, 0, {
          role: 'system',
          content: analysisContent
        });

        console.log('🎨 流式输出 - 已将文件分析结果添加到对话中');
      }

      // 如果有搜索结果，将其添加到消息中
      if (searchResults && searchResults.success) {
        const searchContent = `[联网搜索结果]
搜索关键词: ${searchResults.query}
找到 ${searchResults.totalResults} 个相关结果

主要信息摘要:
${searchResults.summary}

详细结果:
${searchResults.results.map((r, i) =>
          `${i + 1}. ${r.title}\n   来源: ${r.siteName}\n   摘要: ${r.snippet}\n   链接: ${r.url}`
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

      let stream;
      let selectedClient;
      let selectedModel;

      // 根据useThinking参数选择使用的模型和客户端
      if (useThinking) {
        console.log('🤔 流式输出 - 启用深度思考模式，使用DeepSeek R1模型');
        console.log('🔧 深度思考模式配置: 客户端类型=', this.deepseekClient.constructor.name, '模型=', this.deepseekModel);
        
        // 为深度思考模式添加特殊的系统提示
        const deepThinkingPrompt = `${this.systemPrompt}

🧠 深度思考模式已启用：
请进行更深入的分析和思考，提供更详细、更有洞察力的回答。你可以：
1. 分析问题的多个角度
2. 提供更深层次的解释
3. 考虑潜在的关联和影响
4. 给出更全面的建议

记住仍要保持AI小子的友善特质，用孩子能理解的语言表达深刻的思考。`;

        chatMessages[0].content = deepThinkingPrompt;
        selectedClient = this.deepseekClient;
        selectedModel = this.deepseekModel;
      } else {
        console.log('💭 流式输出 - 使用标准模式，使用默认模型');
        console.log('🔧 标准模式配置: 客户端类型=', this.openai.constructor.name, '模型=', this.model);
        selectedClient = this.openai;
        selectedModel = this.model;
      }

      console.log('📤 准备调用API - 客户端:', selectedClient.constructor.name, '模型:', selectedModel);
      
      stream = await selectedClient.chat.completions.create({
        model: selectedModel,
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      });

      console.log('✅ API调用成功 - 开始接收流式响应');
      console.log('🔧 API调用参数:', {
        model: selectedModel,
        client: selectedClient.constructor.name,
        useThinking: useThinking
      });

      let fullReply = '';
      let fullReasoningContent = '';

      // 流式接收内容
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const reasoningContent = chunk.choices[0]?.delta?.reasoning_content || '';
        
        if (content) {
          fullReply += content;
          // 发送答案内容给前端
          callback(content, false);
        }
        
        if (reasoningContent) {
          fullReasoningContent += reasoningContent;
          // 实时发送思考过程增量内容给前端
          callback('', false, { 
            type: 'thinking_delta', 
            content: reasoningContent 
          });
        }
      }

      // 处理流式收集的思考过程
      let thinkingProcess = null;
      
      if (useThinking && fullReasoningContent) {
        console.log('🧠 成功从流式API收集到reasoning_content');
        thinkingProcess = {
          content: fullReasoningContent,
          isDeepThinking: true,
          model: 'DeepSeek-R1',
          timestamp: new Date().toISOString()
        };
        console.log('🧠 流式思考过程长度:', fullReasoningContent.length);
      } else if (useThinking) {
        console.log('🤔 流式过程中未收集到reasoning_content');
      }

      // 构建完整回复对象
      const completeReply = {
        role: 'assistant',
        content: fullReply,
        timestamp: new Date().toISOString()
      };

      // 添加思考过程到回复中
      if (thinkingProcess) {
        completeReply.thinking = thinkingProcess;
      }

      // 添加搜索信息到回复中
      if (searchResults && searchResults.success) {
        completeReply.searchUsed = true;
        completeReply.searchQuery = searchResults.query;
        completeReply.searchResultsCount = searchResults.results.length;
      }

      // 添加天气信息到回复中
      if (weatherData) {
        completeReply.weather = weatherData;
        console.log('🌤️ 流式输出 - 已添加天气信息到回复中');
      }

      // 添加文件分析信息到回复中
      if (fileAnalysis && fileAnalysis.length > 0) {
        completeReply.fileAnalysis = fileAnalysis;
        console.log('🎨 流式输出 - 已添加文件分析信息到回复中');
      }

      // 深度思考模式下，思考过程已经在generateReply中由DeepSeek模型完成
      // 这里不需要额外生成思考内容，避免重复调用和错误
      // if (useThinking) {
      //   completeReply.thinking = await this.generateThinkingProcess(messages, searchResults);
      // }

      // 发送结束信号，并传递完整回复对象
      callback('', true, completeReply); // true表示结束，第三个参数是完整回复对象
      return fullReply;

    } catch (error) {
      console.error('流式回复错误:', error);
      const fallbackReply = {
        role: 'assistant',
        content: '哎呀，我刚才开小差了！😅 能再说一遍吗？',
        timestamp: new Date().toISOString(),
        error: true
      };
      callback('哎呀，我刚才开小差了！😅 能再说一遍吗？', true, fallbackReply);
      return '';
    }
  }

  // 从用户消息中提取城市名称（严格模式）
  extractCityFromWeatherQuery(message) {
    // 严格的天气查询关键词（避免误触发）
    const strictWeatherKeywords = [
      '天气', '气温', '温度', '下雨', '晴天', '阴天', '多云', '雪天', '风速',
      '湿度', '气候', '雷雨', '暴雨', '小雨', '中雨', '大雨', '阵雨',
      '雾霾', '沙尘', '台风', '冰雹', '霜冻', '露水'
    ];

    // 时间+天气的组合（更精确）
    const timeWeatherPatterns = [
      /今天.*?天气/, /明天.*?天气/, /后天.*?天气/,
      /今天.*?气温/, /明天.*?气温/, /后天.*?气温/,
      /今天.*?温度/, /明天.*?温度/, /后天.*?温度/,
      /今天.*?下雨/, /明天.*?下雨/, /后天.*?下雨/,
      /天气.*?今天/, /天气.*?明天/, /天气.*?后天/,
      /气温.*?今天/, /气温.*?明天/, /气温.*?后天/
    ];

    // 单独的"今天"、"明天"、"晴"、"阴"等词汇排除，避免误触发
    const excludeOnlyKeywords = ['今天', '明天', '后天', '晴', '阴'];

    // 检查是否有严格的天气关键词
    const hasStrictWeatherKeyword = strictWeatherKeywords.some(keyword => message.includes(keyword));

    // 检查是否有时间+天气的组合模式
    const hasTimeWeatherPattern = timeWeatherPatterns.some(pattern => pattern.test(message));

    // 如果只包含容易误触发的单词，且消息较长，则不识别为天气查询
    if (!hasStrictWeatherKeyword && !hasTimeWeatherPattern) {
      const onlyHasExcludeKeywords = excludeOnlyKeywords.some(keyword => message.includes(keyword));
      if (onlyHasExcludeKeywords && message.length > 15) {
        console.log('🌤️ 排除疑似非天气查询:', message.slice(0, 30));
        return null;
      }
    }

    // 必须至少满足一个条件才进行天气查询
    if (!hasStrictWeatherKeyword && !hasTimeWeatherPattern) {
      return null;
    }

    console.log('🌤️ 检测到可能的天气查询:', message);

    // 扩展的城市列表（按热度排序）
    const cities = [
      // 直辖市
      '北京', '上海', '天津', '重庆',
      // 省会城市
      '广州', '深圳', '杭州', '南京', '武汉', '成都', '西安', '长沙',
      '郑州', '沈阳', '哈尔滨', '长春', '石家庄', '太原', '呼和浩特',
      '济南', '南昌', '合肥', '福州', '昆明', '贵阳', '海口', '南宁',
      '拉萨', '银川', '西宁', '乌鲁木齐',
      // 其他重要城市
      '青岛', '大连', '厦门', '宁波', '苏州', '无锡', '佛山', '东莞',
      '珠海', '中山', '江门', '湛江', '汕头', '惠州', '温州', '嘉兴',
      '绍兴', '台州', '金华', '衢州', '丽水', '湖州', '舟山'
    ];

    // 精确匹配城市名称
    for (const city of cities) {
      if (message.includes(city)) {
        console.log(`🌤️ 精确匹配到城市: ${city}`);
        return city;
      }
    }

    // 使用正则表达式匹配更复杂的表达（优化版）
    const patterns = [
      // 城市+天气模式
      /([北上广深杭南武成重天西长郑沈青大厦福昌合太石济呼银宁乌拉昆贵海三]\w{0,3})[的在]?(?:天气|气温|温度|下雨|晴天)/,
      // 地名+市/县/区+天气
      /(\w{1,4}[市县区])[的在]?(?:天气|气温|温度)/,
      // 今天/明天+地名+天气
      /(?:今天|明天)(\w{1,4})[的在]?(?:天气|气温|温度)/,
      // 天气+地名模式
      /(?:天气|气温|温度)[如怎].*?(\w{1,4}[市县区]?)/
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        let cityName = match[1].replace(/[市县区]$/, ''); // 移除后缀
        console.log(`🌤️ 正则匹配到城市: ${cityName}`);
        return cityName;
      }
    }

    // 智能推断：如果消息很简单且明确包含天气关键词，可能是直接问天气
    if (message.length <= 10 && strictWeatherKeywords.some(k => message.includes(k))) {
      console.log('🌤️ 简单天气查询，使用默认城市: 北京');
      return '北京';
    }

    console.log('🌤️ 未检测到明确的城市信息');
    return null; // 没有检测到明确的城市信息
  }

  // 优化的错误重试机制
  async generateReplyWithRetry(messages, options = {}, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 AI回复生成尝试 ${attempt}/${maxRetries}`);
        const result = await this.generateReply(messages, options);
        console.log(`✅ AI回复生成成功 (尝试 ${attempt})`);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`❌ AI回复生成失败 (尝试 ${attempt}):`, error.message);

        // 最后一次尝试失败时，不再重试
        if (attempt === maxRetries) {
          break;
        }

        // 根据错误类型决定重试延迟
        const delay = this.getRetryDelay(error, attempt);
        console.log(`⏳ ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // 所有重试都失败，返回友好的错误回复
    return this.getFallbackReply(lastError);
  }

  // 根据错误类型获取重试延迟
  getRetryDelay(error, attempt) {
    // 网络错误：较短延迟
    if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      return 1000 * attempt; // 1s, 2s, 3s
    }

    // API限流：较长延迟
    if (error.status === 429) {
      return 5000 * attempt; // 5s, 10s, 15s
    }

    // 其他错误：中等延迟
    return 2000 * attempt; // 2s, 4s, 6s
  }

  // 获取降级回复
  getFallbackReply(error) {
    const fallbackMessages = [
      '哎呀，我刚才走神了！😅 能再说一遍吗？',
      '抱歉，我的大脑短路了一下！🤖 请重新告诉我你的问题。',
      '呜呜，我遇到了一个小问题！🔧 请稍后再试，或者换个说法问我。',
      '我的思路打结了！🧠 给我一点时间理清思路，然后再问我吧。',
      '系统有点忙碌，让我休息一下再回来！⏰ 请稍后重试。'
    ];

    const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

    return {
      role: 'assistant',
      content: randomMessage,
      timestamp: new Date().toISOString(),
      error: true,
      errorType: error.name || 'UnknownError',
      fallback: true
    };
  }

  // 优化的流式回复生成
  async generateStreamReplyOptimized(messages, callback, options = {}) {
    try {
      // 先快速生成回复
      const aiReply = await this.generateReplyWithRetry(messages, options, 2);

      if (aiReply.error) {
        callback(aiReply.content, true);
        return aiReply.content;
      }

      // 模拟打字效果
      const content = aiReply.content;
      let currentPos = 0;
      const chunkSize = Math.max(1, Math.floor(content.length / 50)); // 动态调整chunk大小

      const sendNextChunk = () => {
        if (currentPos < content.length) {
          const chunk = content.slice(currentPos, currentPos + chunkSize);
          currentPos += chunkSize;

          callback(chunk, false);

          // 动态调整延迟：内容越长，速度越快
          const delay = Math.max(20, 100 - Math.floor(content.length / 20));
          setTimeout(sendNextChunk, delay);
        } else {
          // 发送结束信号和完整回复信息
          callback('', true, aiReply);
        }
      };

      sendNextChunk();
      return content;

    } catch (error) {
      console.error('优化流式回复生成失败:', error);
      const fallback = this.getFallbackReply(error);
      callback(fallback.content, true);
      return fallback.content;
    }
  }

  // 多模态文件分析
  async analyzeFiles(files) {
    const analysisResults = [];

    for (const file of files) {
      try {
        let analysis = null;

        if (file.mimetype.startsWith('image/')) {
          // 图片分析
          analysis = await this.analyzeImage(file);
        } else if (file.mimetype.startsWith('audio/')) {
          // 音频分析
          analysis = await this.analyzeAudio(file);
        } else if (file.mimetype.startsWith('video/')) {
          // 视频分析
          analysis = await this.analyzeVideo(file);
        } else {
          // 其他文件类型
          analysis = {
            type: '文档',
            analysis: `这是一个${this.getFileTypeDescription(file.mimetype)}文件`,
            details: `文件名: ${file.originalname}, 大小: ${this.formatFileSize(file.size)}`
          };
        }

        if (analysis) {
          analysisResults.push({
            filename: file.originalname,
            ...analysis
          });
        }

      } catch (error) {
        console.error(`文件分析失败 (${file.originalname}):`, error);
        analysisResults.push({
          filename: file.originalname,
          type: '文件',
          analysis: '文件分析暂时不可用',
          error: true
        });
      }
    }

    return analysisResults;
  }

  // 图片分析
  async analyzeImage(file) {
    try {
      console.log('🖼️ 开始分析图片:', file.originalname);

      // 检查是否支持视觉模型
      const supportsVision = this.checkVisionSupport();

      if (!supportsVision) {
        console.log('🖼️ 当前模型不支持视觉分析，使用基础图片信息');
        return {
          type: '图片',
          analysis: `我看到了一张名为"${file.originalname}"的图片。虽然我现在还不能看到图片的具体内容，但我能告诉你这是一个${this.getImageTypeDescription(file.mimetype)}格式的图片文件。如果你能描述一下图片的内容，我会很乐意和你聊聊！`,
          details: `文件大小: ${this.formatFileSize(file.size)}`
        };
      }

      // 构建图片URL
      const imageUrl = `http://localhost:${process.env.PORT || 3002}/api/upload/file/${file.filename}`;

      // 使用支持视觉的模型分析图片
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini", // 使用支持视觉的模型
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请详细描述这张图片的内容。请用简单易懂的语言，适合儿童理解。如果图片中有文字，请帮忙识别出来。如果是学习相关的内容（比如作业、题目），请重点说明。"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const analysisText = response.choices[0].message.content;
      console.log('🖼️ 图片分析完成:', analysisText);

      return {
        type: '图片',
        analysis: analysisText,
        details: `图片尺寸信息和文件详情`
      };

    } catch (error) {
      console.error('图片分析错误:', error);

      // 如果API不支持视觉功能，返回基础分析
      return {
        type: '图片',
        analysis: `我看到了一张名为"${file.originalname}"的图片。虽然我现在还不能看到图片的具体内容，但我能告诉你这是一个${this.getImageTypeDescription(file.mimetype)}格式的图片文件。如果你能描述一下图片的内容，我会很乐意和你聊聊！`,
        details: `文件大小: ${this.formatFileSize(file.size)}`
      };
    }
  }

  // 音频分析
  async analyzeAudio(file) {
    try {
      console.log('🎵 开始分析音频:', file.originalname);

      // 暂时返回基础信息，后续可以集成语音转文字API
      return {
        type: '音频',
        analysis: `这是一个音频文件，格式为${file.mimetype}。我听到了用户分享的音频内容。`,
        details: `文件时长和大小: ${this.formatFileSize(file.size)}`
      };

    } catch (error) {
      console.error('音频分析错误:', error);
      return {
        type: '音频',
        analysis: '音频分析暂时不可用',
        error: true
      };
    }
  }

  // 视频分析
  async analyzeVideo(file) {
    try {
      console.log('🎬 开始分析视频:', file.originalname);

      // 暂时返回基础信息，后续可以集成视频分析API
      return {
        type: '视频',
        analysis: `这是一个视频文件，格式为${file.mimetype}。我看到了用户分享的视频内容。`,
        details: `文件大小: ${this.formatFileSize(file.size)}`
      };

    } catch (error) {
      console.error('视频分析错误:', error);
      return {
        type: '视频',
        analysis: '视频分析暂时不可用',
        error: true
      };
    }
  }

  // 获取文件类型描述
  getFileTypeDescription(mimetype) {
    if (mimetype.includes('pdf')) return 'PDF文档';
    if (mimetype.includes('word')) return 'Word文档';
    if (mimetype.includes('excel')) return 'Excel表格';
    if (mimetype.includes('text')) return '文本';
    return '文档';
  }

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // 检查是否支持视觉分析
  checkVisionSupport() {
    // 检查当前使用的模型是否支持视觉功能
    const visionModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-vision-preview'];
    return visionModels.includes(this.model);
  }

  // 获取图片类型描述
  getImageTypeDescription(mimetype) {
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') return 'JPEG';
    if (mimetype === 'image/png') return 'PNG';
    if (mimetype === 'image/gif') return 'GIF动画';
    if (mimetype === 'image/webp') return 'WebP';
    if (mimetype === 'image/bmp') return 'BMP位图';
    if (mimetype === 'image/tiff') return 'TIFF';
    if (mimetype === 'image/svg+xml') return 'SVG矢量图';
    return '图片';
  }

  // 清理过期的天气查询缓存
  cleanWeatherQueryCache() {
    const now = Date.now();
    for (const [key, timestamp] of this.weatherQueryCache.entries()) {
      if (now - timestamp > this.weatherQueryCooldown) {
        this.weatherQueryCache.delete(key);
      }
    }
  }

  // 注意：现在直接使用API返回的reasoning_content字段，不再需要复杂的文本解析
}

module.exports = new AIService(); 