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
    custom: true,
    list: [
      { pagePath: 'pages/index/index', text: '商机' },
      { pagePath: 'pages/publish/publish', text: '我发布的' }
    ]
  }
})
