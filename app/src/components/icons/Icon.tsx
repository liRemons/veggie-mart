/**
 * 通用图标组件：内部自动区分彩色/单色。
 *
 * 用法：<Icon name='address' size={48} />
 *   - name：iconfont 项目去掉 icon- 前缀的 symbol id（彩色如 'colored-produce'，单色如 'address'）
 *   - size：显示尺寸，单位 rpx，默认 48（彩色 → Image 宽高，单色 → fontSize）
 *   - 彩色（icons.ts 中有）：渲染 base64 PNG（Image，固定色）
 *   - 单色（无）：透明降级 iconfont 字体方案（自动补 icon- 前缀命中字体类，可 color 换色）
 *
 * 更新 iconfont 步骤：
 *   1. 将 iconfont.cn 项目「Symbol (SVG)」复制的整段代码覆盖到 app/src/assets/icons/iconfont.symbol.js
 *   2. 在 app/ 目录下执行：npm run icons:gen
 */
import { Image, Text } from '@tarojs/components'
import { ICONS } from './icons';

interface IconProps {
  name: string
  size?: number
  className?: string
  onClick?: () => void;
}

export default function Icon ({ name, size = 48, className, onClick }: IconProps) {
  const src = ICONS[name]
  const cls = [className].filter(Boolean).join(' ')
  if (src) {
    return (
      <Image
        src={src}
        mode='aspectFit'
        className={cls}
        style={{ width: `${size}rpx`, height: `${size}rpx` }}
        onClick={onClick}
      />
    )
  }
  return <Text className={`iconfont icon-${name} ${cls}`.trim()} style={{ fontSize: `${size}rpx`, lineHeight: 1 }} onClick={onClick} />
}
