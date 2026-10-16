import { View, Text, Image } from '@tarojs/components'
import { formatPublishTime } from '../../utils/time'
import Icon from '../icons/Icon'
import './product-card.less'

export interface CardAction {
  label: string
  type?: 'primary' | 'danger'
  onClick: () => void
}

export interface ProductCardProps {
  item: {
    title: string
    desc: string
    price: string
    unit: string
    tags: string[]
    address: string
    img: string
    publishTime: number
  }
  showContact?: boolean
  action?: CardAction
  onCardClick?: () => void
  onContact?: () => void
}

export default function ProductCard({ item, showContact, action, onCardClick, onContact }: ProductCardProps) {
  const { title, desc, price, unit, tags, address, img, publishTime } = item
  return (
    <View className='product-card' onClick={onCardClick}>
      <Image className='product-card__img' src={img} mode='aspectFill' />
      <View className='product-card__body'>
        <Text className='product-card__title'>{title}</Text>
        <View className='product-card__line'>
          <Text className='product-card__desc'>{desc}</Text>
          <Text className='product-card__price'>{price}元/</Text>
          <Text className='product-card__price-unit'>{unit}</Text>
        </View>
        <View className='product-card__tags'>
          {tags.map((tag) => (
            <Text key={tag} className='product-card__tag'>{tag}</Text>
          ))}
        </View>
        <View className='product-card__line'>
          <Icon name='address' size={28} className='product-card__address-icon' />
          <Text className='product-card__desc'>{address} {formatPublishTime(publishTime)}</Text>
          {showContact && !action ? (
            <View
              className='product-card__action product-card__action--contact'
              onClick={(e) => {
                e.stopPropagation()
                onContact?.()
              }}
            >
              <Icon name='send-message' size={28} className='product-card__action-icon' />
              <Text>联系 Ta</Text>
            </View>
          ) : action ? (
            <View
              className={`product-card__action ${action.type === 'danger' ? 'product-card__action--danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                action.onClick()
              }}
            >
              {action.type === 'danger' ? (
                <Icon name='delete' size={28} className='product-card__action-icon' />
              ) : null}
              <Text>{action.label}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}
