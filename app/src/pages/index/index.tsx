import { View, Text, Input, Swiper, SwiperItem } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { PUBLISH_TYPE_KEY, PUBLISH_URL, TabItem } from '../../utils/tabbar'
import { openDetail } from '../../utils/detail'
import ProductCard from '../../components/product-card/product-card'
import QrCodeModal from '../../components/qr-code-modal/qr-code-modal'
import PublishSheet, { PublishType } from '../../components/publish-sheet/publish-sheet'
import TabBarNav, { FabClose } from '../../components/tab-bar-nav/tab-bar-nav'
import Icon from '../../components/icons/Icon'
import './index.less'

const NOW = Date.now()
const H = 3600000
const D = 86400000

const PUBLISHED = [
  { id: 1, title: '出售大白菜 3吨', desc: '青帮白帮 产地直发', price: '0.6', unit: '斤', tags: ['产地直发'], address: '河北石家庄', img: 'https://picsum.photos/seed/veg1/340/340', publishTime: NOW - 2 * H },
  { id: 2, title: '收购西红柿 8吨', desc: '硬粉果 接受产地价', price: '0.8', unit: '斤', tags: ['急收', '长期'], address: '山东寿光', img: 'https://picsum.photos/seed/veg2/340/340', publishTime: NOW - D - 3 * H },
  { id: 3, title: '出售土豆 5吨', desc: '新土豆 当日发货', price: '0.45', unit: '斤', tags: ['量大'], address: '山西大同', img: 'https://picsum.photos/seed/veg3/340/340', publishTime: NOW - 2 * D }
]

const PURCHASES = [
  { id: 1, title: '急收大白菜 5吨', desc: '要求无烂叶 产地直发', price: '0.55', unit: '斤', tags: ['急收', '长期', '量大'], address: '河北保定', img: 'https://picsum.photos/seed/buy1/340/340', publishTime: NOW - 3 * D },
  { id: 2, title: '采购黄瓜 3吨', desc: '需镜面果 当日发货', price: '1.2', unit: '斤', tags: ['长期'], address: '天津武清', img: 'https://picsum.photos/seed/buy2/340/340', publishTime: NOW - 6 * D },
  { id: 3, title: '西红柿 10吨', desc: '硬粉果 接受产地价', price: '0.8', unit: '斤', tags: ['急收', '量大'], address: '山东寿光', img: 'https://picsum.photos/seed/buy3/340/340', publishTime: new Date(2025, 7, 20).getTime() }
]

export default function Index() {
  const [qrVisible, setQrVisible] = useState(false)
  // 「选择发布的类型」底部面板：本页 NutUI Popup（弹层标准宿主），栏内加号经 onPublish 直接控制本源
  const [pubSheetVisible, setPubSheetVisible] = useState(false)

  useDidShow(() => {
    Taro.hideTabBar({ animation: false })
  })

  const handleChoosePublishType = (type: PublishType) => {
    setPubSheetVisible(false)
    // storage 由发布页 useDidShow 消费，跨页送达选中类型
    Taro.setStorageSync(PUBLISH_TYPE_KEY, type)
    Taro.switchTab({ url: PUBLISH_URL })
  }

  const handleTab = (tab: TabItem) => {
    if (tab.key === 'home') return
    if (!tab.url) {
      Taro.showToast({ title: `「${tab.label}」功能开发中`, icon: 'none' })
      return
    }
    Taro.switchTab({ url: tab.url })
  }

  const handleComingSoon = (name: string) => {
    Taro.showToast({ title: `「${name}」功能开发中`, icon: 'none' })
  }

  return (
    <View className='index'>
      <View className='index__search'>
        <Input
          className='index__search-input'
          placeholder='搜索农产品/产地'
          placeholderClass='index__search-placeholder'
          onConfirm={(e) => handleComingSoon(`搜索「${e.detail.value}」`)}
        />
        <View
          className='index__search-btn index__search-btn--icon'
          onClick={() => setQrVisible(true)}
        >
          <Icon name='qrcode' size={40} className='index__search-icon' />
        </View>
        <View
          className='index__search-btn index__search-btn--icon'
          onClick={() => handleComingSoon('扫码')}
        >
          <Icon name='scan' size={40} className='index__search-icon' />
        </View>
      </View>

      <View className='index__row'>
        <View className='index__action' onClick={() => handleComingSoon('待办')}>
          <Icon name='todo' size={36} className='index__action-icon' />
          <Text>待办</Text>
        </View>
        <View className='index__action index__action-history' onClick={() => handleComingSoon('成交历史')}>
          <Text className='index__action-icon iconfont icon-history' />
          <Text>成交历史</Text>
        </View>
      </View>
      <Swiper
        className='index__swiper'
        circular
        autoplay
        interval={3000}
        indicatorDots
      >
        {PUBLISHED.map((item) => (
          <SwiperItem key={item.id}>
            <ProductCard
              item={item}
              action={{ label: '查看详情', onClick: () => openDetail(item) }}
              onCardClick={() => handleComingSoon('我发布的')}
            />
          </SwiperItem>
        ))}
      </Swiper>

      <View className='index__section-head'>
        <Text className='index__section-title'>商机</Text>
        <View className='index__section-more' onClick={() => handleComingSoon('更多商机')}>
          <Text>更多</Text>
          <Text className='index__section-more-icon iconfont icon-to-right' />
        </View>
      </View>

      <View className='index__list'>
        {PURCHASES.map((item) => (
          <View className='index__list-item' key={item.id}>
            <ProductCard
              item={item}
              showContact
              onCardClick={() => openDetail(item)}
              onContact={() => handleComingSoon('联系')}
            />
          </View>
        ))}
      </View>

      <QrCodeModal visible={qrVisible} onClose={() => setQrVisible(false)} />
      <PublishSheet visible={pubSheetVisible} onChoose={handleChoosePublishType} />
      {/* 面板关闭按钮：位于 NutUI Overlay 之上（z 9999），与加号同位 */}
      {pubSheetVisible ? <FabClose onClick={() => setPubSheetVisible(false)} /> : null}
      <TabBarNav
        active='home'
        publishing={pubSheetVisible}
        onTab={handleTab}
        onPublish={() => setPubSheetVisible(true)}
      />
    </View>
  )
}
