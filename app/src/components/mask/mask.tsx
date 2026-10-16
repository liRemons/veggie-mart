import { View } from '@tarojs/components'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './mask.less'

interface MaskProps {
  /** 是否打开：驱动压淡/回显过渡；打开期间（含关闭退出动画）节点挂载，关闭完成后卸载 */
  visible: boolean
  /** 内容对齐：center 垂直居中（居中卡片）/ end 贴底（底部面板） */
  placement?: 'center' | 'end'
  /** 场景 className：供使用方覆写 z-index、背景色、安全区等场景样式 */
  className?: string
  children?: ReactNode
}

// 与 mask.less 中的 transition 时长保持一致
const ANIMATION_DURATION = 250
const SHOW_DELAY = 30

/**
 * 通用遮罩：统一负责全屏压暗、开/关过渡与内容容器。
 * 挂载按弹窗蒙层方案自管理：打开时先以关闭态落地、短暂延迟后附加 --on 触发进入过渡；
 * 关闭时播放退出动画，结束后整体卸载节点，无常驻隐藏层
 * （规避 weapp tabBar 层 fixed 全屏节点常驻导致的压暗泄漏）。
 * 点击遮罩不关闭弹层（统一置为 false），关闭由各场景的显式按钮承担
 */
export default function Mask({ visible, placement = 'center', className, children }: MaskProps) {
  // mounted：遮罩节点是否在树中（关闭后保留退出动画时长再卸载）
  const [mounted, setMounted] = useState(visible)
  // shown：是否处于打开态（驱动 mask--on 过渡）
  const [shown, setShown] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 清理上一个定时器：快速开/关切换时不允许残留过期状态
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (visible) {
      setMounted(true)
      // 新挂载先以关闭态落地一次，再翻转打开态，保证进入过渡可播放
      timerRef.current = setTimeout(() => setShown(true), SHOW_DELAY)
    } else {
      setShown(false)
      timerRef.current = setTimeout(() => setMounted(false), ANIMATION_DURATION)
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // 组件卸载时清理残留定时器
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  if (!mounted) return null

  return (
    <View
      catchMove
      className={`mask mask--${placement}${shown ? ' mask--on' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </View>
  )
}