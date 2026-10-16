import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

import Icon from '../../components/icons/Icon'

import './role-select.less'

const ROLE_KEY = 'role'
const HOME_URL = '/pages/index/index'

const ROLES = [
  { key: 'farmer', label: '农户', desc: '卖农产品 · 招工用工', icon: 'colored-farmer-man' },
  { key: 'broker', label: '中介/代办', desc: '连接供需 · 集采采购', icon: 'colored-broker' },
  { key: 'worker', label: '找零工', desc: '找活赚钱 · 一键报名', icon: 'colored-temp' },
  { key: 'recruit', label: '找工人', desc: '缺人招工 · 快速用工', icon: 'colored-recruit' }
]

export default function RoleSelect() {
  useLoad(() => {
    // 已选过身份的用户，直接进入首页，跳过选择
    const role = Taro.getStorageSync(ROLE_KEY)
    if (role) {
      Taro.reLaunch({ url: HOME_URL })
    }
  })

  const handleSelect = (key: string) => {
    Taro.setStorageSync(ROLE_KEY, key)
    Taro.reLaunch({ url: HOME_URL })
  }

  return (
    <View className='role-select'>
      <View className='role-select__card'>
        <Text className='role-select__title'>选择身份</Text>
        <View className='role-select__items'>
          {ROLES.map((item) => (
            <View
              key={item.key}
              className='role-select__item'
              onClick={() => handleSelect(item.key)}
            >
              <Icon name={item.icon} size={96} className='role-select__icon' />
              <Text>{item.label}</Text>
              <Text className='role-select__desc'>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}