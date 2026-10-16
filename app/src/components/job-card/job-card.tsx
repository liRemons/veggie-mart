import { View, Text } from '@tarojs/components'
import { formatPublishTime } from '../../utils/time'
import Icon from '../icons/Icon'
import './job-card.less'

export interface JobItem {
  title: string
  desc: string
  price: string
  unit: string
  workHours: string
  remaining: number
  address: string
  publishTime: number
}

export interface JobCardAction {
  label: string
  type?: 'primary' | 'danger'
  onClick: () => void
}

export interface JobCardProps {
  item: JobItem
  showContact?: boolean
  action?: JobCardAction
  onCardClick?: () => void
  onContact?: () => void
}

export default function JobCard({ item, showContact, action, onCardClick, onContact }: JobCardProps) {
  const { title, desc, price, unit, workHours, remaining, address, publishTime } = item
  return (
    <View className='job-card' onClick={onCardClick}>
      <Text className='job-card__title'>{title}</Text>
      <View className='job-card__line'>
        <Text className='job-card__desc'>{desc}</Text>
        <Text className='job-card__price'>{price}元/</Text>
        <Text className='job-card__price-unit'>{unit}</Text>
      </View>
      <View className='job-card__line'>
        <Text className='job-card__desc'>工作时间 {workHours}（招{remaining}人）</Text>
      </View>
      <View className='job-card__line'>
        <Icon name='address' size={28} className='job-card__address-icon' />
        <Text className='job-card__desc'>{address} {formatPublishTime(publishTime)}</Text>
        {showContact && !action ? (
          <View
            className='job-card__action job-card__action--contact'
            onClick={(e) => {
              e.stopPropagation()
              onContact?.()
            }}
          >
            <Icon name='send-message' size={28} className='job-card__action-icon' />
            <Text>联系 Ta</Text>
          </View>
        ) : action ? (
          <View
            className={`job-card__action ${action.type === 'danger' ? 'job-card__action--danger' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              action.onClick()
            }}
          >
            {action.type === 'danger' ? (
              <Icon name='delete' size={28} className='job-card__action-icon' />
            ) : null}
            <Text>{action.label}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}