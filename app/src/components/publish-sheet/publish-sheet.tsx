import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { Popup } from '@nutui/nutui-react-taro'
import Icon from '../icons/Icon'
import './publish-sheet.less'

export type PublishType = 'veg' | 'job'

export interface PublishSheetProps {
  visible: boolean
  onChoose: (type: PublishType) => void
}

/**
 * 「选择发布的类型」底部面板（NutUI Popup）：挂在页面层渲染（Pop 的标准宿主），
 * 整页压暗由自绘遮罩 publish-sheet__bg（z 1100，整屏含底部栏区全覆盖）承担，
 * 显隐动画/关闭后卸载均由组件库自身管理，
 * 打开/关闭全部由宿主页 state 控制（页面侧 TabBarNav 的加号打开，页面侧
 * FabClose 关闭；点击遮罩不关闭）。
 */
export default function PublishSheet({ visible, onChoose }: PublishSheetProps) {
  // 面板选项交错弹入：NutPopup destroyOnClose 关闭后卸载，不能再靠常驻 class 切换，
  // 故面板挂载首帧保持隐藏态，下一帧补 --on 触发过渡（关闭时立即还原播放退出过渡）
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }
    const timer = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(timer)
  }, [visible])

  return (
    <>
      {/* 整屏 0.6 压暗遮罩自绘：NutUI Overlay 无法可靠覆盖页面层 Tabbar（底部发白），
          由页面层 fixed 自绘保证铺满；NutUI 自带 overlay 仅保留整屏点击不穿透（不关闭） */}
      <View className={`publish-sheet__bg${visible ? ' publish-sheet__bg--on' : ''}`} />
      <Popup
        position='bottom'
        visible={visible}
        className='publish-sheet__popup'
        overlayClassName='publish-sheet__mask'
        closeOnOverlayClick={false}
        destroyOnClose
        duration={350}
        round={false}
      >
        <View className={`publish-sheet__sheet${entered ? ' publish-sheet__sheet--on' : ''}`}>
          <Text className='publish-sheet__title'>选择发布的类型</Text>
          <View className='publish-sheet__options'>
            <View className='publish-sheet__option' onClick={() => onChoose('veg')}>
              <Icon size={56} name='colored-produce' className='publish-sheet__option-icon' />
              <Text>农产品</Text>
            </View>
            <View className='publish-sheet__option' onClick={() => onChoose('job')}>
              <Icon size={56} name='colored-recruit' className='publish-sheet__option-icon' />
              <Text>招聘零工</Text>
            </View>
          </View>
        </View>
      </Popup>
    </>
  )
}
