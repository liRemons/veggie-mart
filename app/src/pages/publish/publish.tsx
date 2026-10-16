import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { PUBLISH_TYPE_KEY, TABBAR_CHANGE_EVENT } from '../../utils/tabbar'
import { openDetail } from '../../utils/detail'
import ProductCard from '../../components/product-card/product-card'
import JobCard, { JobItem } from '../../components/job-card/job-card'
import './publish.less'

interface PublishItem {
  id: number
  title: string
  desc: string
  price: string
  unit: string
  tags: string[]
  address: string
  img: string
  publishTime: number
}

const NOW = Date.now()
const H = 3600000
const D = 86400000

const CATEGORIES = [
  { key: 'veg', label: '农产品' },
  { key: 'job', label: '零工' }
]

const VEG: PublishItem[] = [
  { id: 1, title: '出售大白菜 3吨', desc: '青帮白帮 产地直发', price: '0.6', unit: '斤', tags: ['产地直发'], address: '河北石家庄', img: 'https://picsum.photos/seed/pub1/340/340', publishTime: NOW - 30 * 60000 },
  { id: 2, title: '出售土豆 5吨', desc: '新土豆 当日发货', price: '0.45', unit: '斤', tags: ['量大'], address: '山西大同', img: 'https://picsum.photos/seed/pub2/340/340', publishTime: NOW - 4 * H },
  { id: 3, title: '出售西红柿 8吨', desc: '硬粉果 产地直发', price: '0.8', unit: '斤', tags: ['产地直发'], address: '山东寿光', img: 'https://picsum.photos/seed/pub3/340/340', publishTime: NOW - D - 2 * H },
  { id: 4, title: '出售黄瓜 3吨', desc: '镜面果 当日发货', price: '1.2', unit: '斤', tags: ['品相好'], address: '天津武清', img: 'https://picsum.photos/seed/pub4/340/340', publishTime: NOW - 2 * D }
]

const JOB: (JobItem & { id: number })[] = [
  { id: 1, title: '招田间采摘工', desc: '西红柿采摘 日结', price: '80', unit: '天', workHours: '8:00-17:00', remaining: 10, address: '山东寿光', publishTime: NOW - 2 * D - 6 * H },
  { id: 2, title: '招包装车间工', desc: '蔬菜分拣包装 8小时/天', price: '120', unit: '天', workHours: '9:00-18:00', remaining: 5, address: '北京大兴', publishTime: NOW - 6 * D }
]

export default function Publish() {
  const [category, setCategory] = useState('veg')
  const [vegList, setVegList] = useState<PublishItem[]>(VEG)
  const [jobList, setJobList] = useState<(JobItem & { id: number })[]>(JOB)

  useDidShow(() => {
    const pending = Taro.getStorageSync(PUBLISH_TYPE_KEY)
    if (pending === 'veg' || pending === 'job') setCategory(pending)
    Taro.removeStorageSync(PUBLISH_TYPE_KEY)
    Taro.eventCenter.trigger(TABBAR_CHANGE_EVENT, 'publish')
  })

  const handleComingSoon = (name: string) => {
    Taro.showToast({ title: `「${name}」功能开发中`, icon: 'none' })
  }

  const handleDelete = (key: 'veg' | 'job', id: number, title: string) => {
    Taro.showModal({
      title: '删除',
      content: `确定删除「${title}」吗？删除后不可恢复`,
      confirmText: '删除',
      confirmColor: '#fd3b3b',
      success: (res) => {
        if (!res.confirm) return
        if (key === 'veg') {
          setVegList((list) => list.filter((item) => item.id !== id))
        } else {
          setJobList((list) => list.filter((item) => item.id !== id))
        }
        Taro.showToast({ title: '已删除', icon: 'none' })
      }
    })
  }

  return (
    <View className='publish'>
      <View className='publish__tabs'>
        {CATEGORIES.map((c) => (
          <View
            key={c.key}
            className={`publish__tab ${c.key === category ? 'publish__tab--active' : ''}`}
            onClick={() => setCategory(c.key)}
          >
            <Text>{c.label}</Text>
          </View>
        ))}
      </View>

      <View className='publish__list'>
        {category === 'veg'
          ? vegList.map((item) => (
              <View className='publish__list-item' key={item.id}>
                <ProductCard
                  item={item}
                  action={{ label: '删除', type: 'danger', onClick: () => handleDelete('veg', item.id, item.title) }}
                  onCardClick={() => openDetail(item)}
                />
              </View>
            ))
          : jobList.map((item) => (
              <View className='publish__list-item' key={item.id}>
                <JobCard
                  item={item}
                  action={{ label: '删除', type: 'danger', onClick: () => handleDelete('job', item.id, item.title) }}
                  onCardClick={() => handleComingSoon('零工详情')}
                />
              </View>
            ))}
      </View>
    </View>
  )
}