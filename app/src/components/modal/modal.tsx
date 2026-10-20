import { View, Text } from '@tarojs/components'
import type { ReactNode } from 'react'
import { Popup } from '@nutui/nutui-react-taro'
import Icon from '../icons/Icon';
import './modal.less'

interface ModalProps {
  visible: boolean
  onClose: () => void
  /** 关闭前回调，返回 false（或 Promise 解析为 false）时取消关闭 */
  beforeClose?: () => boolean | Promise<boolean>
  /** 头部标题，不传且 showClose 为 false 时不渲染 head */
  title?: string
  /** 是否显示右上角关闭按钮，默认 true */
  showClose?: boolean
  children: ReactNode
}

// 与 modal.less 中的动画时长保持一致，传给 NutPopup 的 duration
const ANIMATION_DURATION = 250

export default function Modal({
  visible,
  onClose,
  beforeClose,
  title,
  showClose = true,
  children
}: ModalProps) {
  // 统一关闭入口：beforeClose 返回（或异步解析为）false 时取消关闭
  const handleClose = () => {
    if (!beforeClose) {
      onClose()
      return
    }
    Promise.resolve(beforeClose()).then(result => {
      if (result !== false) onClose()
    })
  }

  // 实现层改为 NutUI NutPopup（position=center）：
  // 进出场动画、遮罩、关闭后卸载（destroyOnClose）与关闭结束回调（afterClose）
  // 均由 NutPopup 承担；对外 props 与关闭语义保持不变
  return (
    <Popup
      position='center'
      visible={visible}
      className='modal__card'
      destroyOnClose
      duration={ANIMATION_DURATION}
      closeOnOverlayClick={false}
    >
      {(title || showClose) && (
        <View className='modal__head'>
          {title ? (
            <Text className='modal__title'>{title}</Text>
          ) : (
            <View />
          )}
          {showClose && (
            <Icon name='close' className='modal__close' onClick={handleClose} />
          )}
        </View>
      )}
      {children}
    </Popup>
  )
}