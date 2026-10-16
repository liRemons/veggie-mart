import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import Icon from '../components/icons/Icon'
import Mask from '../components/mask/mask'
import { PUBLISH_URL, PUBLISH_TYPE_KEY, TABS, TABBAR_CHANGE_EVENT, TABBAR_MASK_EVENT, TabItem } from '../utils/tabbar'
import './index.less'

export default function CustomTabBar() {
  const [active, setActive] = useState<string>('home')
  const [sheetVisible, setSheetVisible] = useState(false)
  // 页面层弹层开/关状态：微信自定义 tabBar 渲染在页面之上的独立层，页面遮罩盖不住，
  // 由页面经事件通知，本层渲染等高的遮罩统一压暗 tabBar
  const [pageMaskVisible, setPageMaskVisible] = useState(false)

  useEffect(() => {
    const handleChange = (key: string) => {
      setActive(key)
    }
    const handlePageMask = (visible: boolean) => {
      setPageMaskVisible(visible)
    }
    Taro.eventCenter.on(TABBAR_CHANGE_EVENT, handleChange)
    Taro.eventCenter.on(TABBAR_MASK_EVENT, handlePageMask)
    return () => {
      Taro.eventCenter.off(TABBAR_CHANGE_EVENT, handleChange)
      Taro.eventCenter.off(TABBAR_MASK_EVENT, handlePageMask)
    }
  }, [])

  const handleChooseType = (type: 'veg' | 'job') => {
    setSheetVisible(false)
    Taro.setStorageSync(PUBLISH_TYPE_KEY, type)
    Taro.switchTab({ url: PUBLISH_URL })
  }

  const handleTab = (tab: TabItem) => {
    if (sheetVisible) return // 「选择发布的类型」面板打开时禁止切换 tab
    if (tab.key === active) return
    if (!tab.url) {
      Taro.showToast({ title: `「${tab.label}」功能开发中`, icon: 'none' })
      return
    }
    Taro.switchTab({ url: tab.url })
  }

  const renderItem = (tab: TabItem) => (
    <View
      key={tab.key}
      className={`tab-bar__item ${tab.key === active ? 'tab-bar__item--active' : ''}`}
      onClick={() => handleTab(tab)}
    >
      {tab.icon ? <Icon name={tab.icon} size={44} className='tab-bar__icon' /> : null}
      <Text className='tab-bar__label'>{tab.label}</Text>
    </View>
  )

  return (
    <>
      {/* 面板或页面弹层打开时 tabBar 整体压暗，与上方遮罩视觉统一 */}
      <View className={`tab-bar${(pageMaskVisible || sheetVisible) ? ' tab-bar--masked' : ''}`}>
        {TABS.slice(0, 2).map(renderItem)}
        <View className='tab-bar__center'>
          {/* 面板打开时加号卸载（关闭按钮见下方独立的蒙层级 __close）；页面弹层打开时保留占位并淡出，
              避免绿钮与压暗的栏体观感割裂；隐藏期间不可点击（pointer-events: none） */}
          {sheetVisible ? null : (
            <View
              className={`tab-bar__plus${pageMaskVisible ? ' tab-bar__plus--hidden' : ''}`}
              onClick={() => setSheetVisible(true)}
            >
              <Icon size={44} name='add' className='tab-bar__plus-icon' />
            </View>
          )}
        </View>
        {TABS.slice(2).map(renderItem)}
      </View>

      {/* 面板遮罩：与页面弹层共用通用 Mask；点击遮罩不关闭，
          关闭走下方蒙层级的 __close 按钮 */}
      <Mask visible={sheetVisible} placement='end' className='tab-bar__mask'>
        <View className='tab-bar__sheet'>
          <Text className='tab-bar__sheet-title'>选择发布的类型</Text>
          <View className='tab-bar__sheet-options'>
            <View className='tab-bar__sheet-option' onClick={() => handleChooseType('veg')}>
              <Icon size={56} name='colored-produce' className='tab-bar__sheet-option-icon' />
              <Text>农产品</Text>
            </View>
            <View className='tab-bar__sheet-option' onClick={() => handleChooseType('job')}>
              <Icon size={56} name='colored-recruit' className='tab-bar__sheet-option-icon' />
              <Text>招聘零工</Text>
            </View>
          </View>
        </View>
      </Mask>

      {/* 蒙层一级的关闭按钮：面板打开时 tabBar 整体压暗且 pointer-events: none，
          关闭按钮必须独立成层才能点击；仅面板打开时渲染 */}
      {sheetVisible && (
        <View className='tab-bar__close' onClick={() => setSheetVisible(false)}>
          <Icon size={44} name='close' className='tab-bar__plus-icon' />
        </View>
      )}

      {/* 页面弹层遮罩：渲染在 tabBar 层才能盖住页面层，把整条 tabBar 统一压暗并拦截点击 */}
      <View
        className={`tab-bar__page-mask ${pageMaskVisible ? 'tab-bar__page-mask--on' : ''}`}
      />
    </>
  )
}
