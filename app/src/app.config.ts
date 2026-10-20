export default defineAppConfig({
  pages: [
    'pages/role-select/role-select',
    'pages/index/index',
    'pages/publish/publish',
    'pages/detail/detail'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#C5F3D9',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    position: 'bottom',
    color: '#4e5969',
    selectedColor: '#07be61',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    // 系统条仅承担 switchTab 路由注册；视觉由页面层 NutUI Tabbar（components/tab-bar-nav）完整覆盖
    list: [
      { pagePath: 'pages/index/index', text: '商机' },
      { pagePath: 'pages/publish/publish', text: '我发布的' }
    ]
  }
})
