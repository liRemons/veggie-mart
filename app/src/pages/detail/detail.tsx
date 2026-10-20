import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { Button, Tag } from '@nutui/nutui-react-taro'
import { getDetailProduct } from '../../utils/detail'
import { formatPublishTime } from '../../utils/time'
import Icon from '../../components/icons/Icon'
import './detail.less'

export default function Detail() {
  const [item] = useState(() => getDetailProduct())
  const [favorited, setFavorited] = useState(false)
  const [popping, setPopping] = useState(false)

  const slides = item.imgs && item.imgs.length > 0 ? item.imgs : item.img ? [item.img] : []

  const handleComingSoon = (name: string) => {
    Taro.showToast({ title: `「${name}」功能开发中`, icon: 'none' })
  }

  const handleFavorite = () => {
    setFavorited((v) => !v)
    // 重触发弹跳动效：先移除再下一帧加回
    setPopping(false)
    setTimeout(() => setPopping(true), 0)
    setTimeout(() => setPopping(false), 320)
  }

  return (
    <View className='detail'>
      {slides.length > 0 && (
        <Swiper
          className='detail__swiper'
          circular
          autoplay
          interval={3000}
          indicatorDots
        >
          {slides.map((src) => (
            <SwiperItem key={src}>
              <Image className='detail__swiper-img' src={src} mode='aspectFill' />
            </SwiperItem>
          ))}
        </Swiper>
      )}

      <View className='detail__meta'>
        <View className='detail__price'>
          <Text>价格：¥ </Text>
          <Text className='detail__price-value'>{item.price}</Text>
          <Text className='detail__price-unit'>元/{item.unit}</Text>
        </View>
        <Text className='detail__date'>{formatPublishTime(item.publishTime)} 发布</Text>
      </View>

      <View className='detail__title'>{item.title}</View>

      <View className='detail__address'>
        <Icon name='address' size={28} className='detail__address-icon' />
        <Text>{item.address}</Text>
      </View>

      {item.tags && item.tags.length > 0 && (
        <View className='detail__tags'>
          {item.tags.map((tag) => (
            <Tag key={tag} className='detail__tag' background='#f2f3f5' color='#4e5969'>{tag}</Tag>
          ))}
        </View>
      )}

      {item.specs && item.specs.length > 0 && (
        <View className='detail__section'>
          <Text className='detail__section-label'>规格信息</Text>
          <View className='detail__section-chips'>
            {item.specs.map((spec) => (
              <Tag key={spec} plain className='detail__chip'>{spec}</Tag>
            ))}
          </View>
        </View>
      )}

      {item.qualities && item.qualities.length > 0 && (
        <View className='detail__section'>
          <Text className='detail__section-label'>品质/货龄</Text>
          <View className='detail__section-chips'>
            {item.qualities.map((quality) => (
              <Tag key={quality} plain className='detail__chip'>{quality}</Tag>
            ))}
          </View>
        </View>
      )}

      <View className='detail__bar'>
        <Button
          className={`detail__fav ${favorited ? 'detail__fav--active' : ''} ${popping ? 'detail__fav--pop' : ''}`}
          fill='none'
          shape='square'
          onClick={handleFavorite}
        >
          <Icon name={favorited ? 'favorited' : 'favorite'} size={44} />
        </Button>
        <Button
          className='detail__btn detail__btn--deal'
          color='#07BE61'
          shape='round'
          onClick={() => handleComingSoon('成交')}
        >
          成交
        </Button>
        <Button
          className='detail__btn'
          fill='outline'
          color='#1f2329'
          shape='round'
          icon={<Icon name='phone' size={36} />}
          onClick={() => handleComingSoon('联系 Ta')}
        >
          联系 Ta
        </Button>
      </View>
    </View>
  )
}