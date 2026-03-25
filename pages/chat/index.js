Page({
  data: {
    chatMode: 'bot',
    showBotAvatar: false,
    agentConfig: {
      botId: 'agent-miniprogram-4euy2a485cb73d',
      allowUploadFile: true,
      allowWebSearch: true,
      allowPullRefresh: true,
      allowUploadImage: true,
      allowMultiConversation: true,
      allowVoice: true,
      showToolCallDetail: true,
      showBotName: true,
      tools: [],
    },
    modelConfig: {
      modelProvider: 'deepseek',
      quickResponseModel: 'deepseek-v3',
      logo: '',
      welcomeMsg: '你好，我是 DeepSeek 智能助手，有什么可以帮你？',
    },
  },
  onLoad() {
    // 可以在这里根据需要动态修改配置
  },
});