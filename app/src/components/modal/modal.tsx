import { View, Text } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react';
import Icon from '../icons/Icon';
import Mask from '../mask/mask'
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
  /** 卡片宽度（如 '620rpx'），默认走 css 的 620rpx */
  width?: string
  /** 附加到卡片的自定义 className */
  className?: string
  /** 关闭动画播放结束的回调 */
  onAfterClose?: () => void
  children: ReactNode
}

// 与 modal.less 中的 transition 时长保持一致
const ANIMATION_DURATION = 250
const SHOW_DELAY = 30

export default function Modal({
  visible,
  onClose,
  beforeClose,
  title,
  showClose = true,
  width,
  className,
  onAfterClose,
  children
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const mountedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

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

  useEffect(() => {
    clearTimer()
    if (visible) {
      // 打开：先以初始隐藏态挂载，下一 tick 补上 --active class 触发过渡
      // （weapp/H5 两次提交，确保首帧已是初始态，transition 才生效）
      setMounted(true)
      mountedRef.current = true
      setActive(false)
      timerRef.current = setTimeout(() => setActive(true), SHOW_DELAY)
    } else if (mountedRef.current) {
      // 关闭：播放退出动画，动画结束后才卸载
      setActive(false)
      timerRef.current = setTimeout(() => {
        setMounted(false)
        mountedRef.current = false
        timerRef.current = null
        onAfterClose?.()
      }, ANIMATION_DURATION)
    }
    return clearTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // 组件卸载时清理残留定时器
  useEffect(() => clearTimer, [])

  if (!mounted) return null

  const cardCls = `modal__card${active ? ' modal__card--active' : ''}${className ? ` ${className}` : ''}`

  return (
    <Mask visible={active} className='modal__mask'>
      <View
        className={cardCls}
        style={width ? { width } : undefined}
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
      </View>
    </Mask>
  )
}