export const HOME_URL = '/pages/index/index'
export const PUBLISH_URL = '/pages/publish/publish'

/** 自定义 tabBar 选中态同步事件名 */
export const TABBAR_CHANGE_EVENT = 'tabbar:change'

/** 页面弹层开/关事件名，通知自定义 tabBar 渲染/隐藏遮罩 */
export const TABBAR_MASK_EVENT = 'tabbar:mask'

/** + 按钮跳转发布页时传递选中类型的一次性 storage key */
export const PUBLISH_TYPE_KEY = 'publish:type'

export interface TabItem {
  key: string
  label: string
  icon?: string
  url?: string
}

export const TABS: TabItem[] = [
  { key: 'home', label: '商机', icon: 'opportunity', url: HOME_URL },
  { key: 'publish', label: '我发布的', icon: 'publish', url: PUBLISH_URL },
  { key: 'history', label: '历史', icon: 'history' },
  { key: 'mine', label: '我的', icon: 'my' }
]
