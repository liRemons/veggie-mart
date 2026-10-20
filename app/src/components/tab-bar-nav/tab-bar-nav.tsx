import { View } from '@tarojs/components'
import { Tabbar } from '@nutui/nutui-react-taro'
import Icon from '../icons/Icon'
import { TABS, TabItem } from '../../utils/tabbar'
import './tab-bar-nav.less'

/** 中心「+」在 NutUI Tabbar children 中的固定槽位（TABS 本身无此项） */
const PLUS_INDEX = 2

export interface TabBarNavProps {
  /** 当前激活的 TABS key（'home' | 'publish'） */
  active: string
  /** 「选择发布的类型」面板打开态：中心加号隐藏（占位保留、栏高不变），遮挡/拦截由 NutUI Overlay 承担 */
  publishing: boolean
  onTab: (tab: TabItem) => void
  onPublish: () => void
}

/**
 * 页面层 Tab 栏（NutUI Tabbar）：4 个业务项 + 中心「+」（Tabbar.Item 自定义 icon 节点）。
 * 整页压暗/点击拦截由页面上 NutUI Popup 的内置 Overlay（z≥1100）覆盖本栏（z 100）完成，
 * 本组件不含任何自绘遮罩/拦截层；微信官方条只作 switchTab 路由，视觉被本栏完全覆盖。
 */
export default function TabBarNav({ active, publishing, onTab, onPublish }: TabBarNavProps) {
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.key === active))

  const handleSwitch = (index: number) => {
    if (index === PLUS_INDEX) {
      onPublish()
      return
    }
    onTab(TABS[index < PLUS_INDEX ? index : index - 1])
  }

  const tabItem = (tab: TabItem) => (
    <Tabbar.Item
      className='tab-bar-nav__item'
      title={tab.label}
      icon={tab.icon ? <Icon name={tab.icon} size={44} className='tab-bar-nav__icon' /> : undefined}
    />
  )

  return (
    <Tabbar
      className='tab-bar-nav'
      fixed
      value={activeIndex}
      activeColor='#1d2129'
      inactiveColor='#4e5969'
      onSwitch={handleSwitch}
    >
      {tabItem(TABS[0])}
      {tabItem(TABS[1])}
      <Tabbar.Item
        className='tab-bar-nav__item tab-bar-nav__plus-slot'
        title=''
        icon={
          <View className={`tab-bar-nav__plus${publishing ? ' tab-bar-nav__plus--hidden' : ''}`}>
            <Icon name='add' size={44} className='tab-bar-nav__plus-icon' />
          </View>
        }
      />
      {tabItem(TABS[2])}
      {tabItem(TABS[3])}
    </Tabbar>
  )
}

/**
 * 「选择发布的类型」面板关闭按钮：与加号同位（栏体上方居中），
 * z-index 9999 常驻其上——NutUI Popup 内置 Overlay 的行内 z 自 1100 起随开合递增，
 * 9999 保证面板打开期间 X 永不被压盖、始终可点
 */
export function FabClose({ onClick }: { onClick: () => void }) {
  return (
    <View className='fab-close' onClick={onClick}>
      <Icon name='close' size={44} className='fab-close__icon' />
    </View>
  )
}
