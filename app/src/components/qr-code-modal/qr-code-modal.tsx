import { View, Text, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'uqrcodejs'
import Modal from '../modal/modal'
import { TABBAR_MASK_EVENT } from '../../utils/tabbar'
import './qr-code-modal.less'

// 写死的用户名 / 联系方式 / 地址，不支持编辑（占位值，后续可接用户资料接口）
const USER_NAME = 'Remons'
const CONTACT = '138****8000'
const ADDRESS = '南山区农产品交易市场'
const PLATFORM_NAME = '鲜田直达'
// 平台 logo（底栏与平台名同排展示，仿微信收款码底部样式）
const LOGO_URL = 'https://remons.cn:3008/upload/doc/f9095db0-c3ba-11f1-a3d6-c16df404a115_veggieMart.png'
// 个人头像（二维码中心展示，仿微信收款码）；末尾 132 = 微信 qlogo 接口的尺寸档位（固定值，勿改）
const AVATAR_URL = 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTIB7icSOEYXA4ic8UDFbjiaKjVvPZDxyBWQyB9cUxmo4pqaiaEEs6gtgkq6nm9x3OAW4lp4FUEiaPibn9fg/132'
// 二维码编码内容：仅分享链接，不含用户名
const SHARE_URL = 'https://www.veggie-mart.com/'
const CANVAS_ID = 'qrCanvas'
// 海报逻辑网格：285 × 430（对应 CSS 285rpx × 430rpx）
// 本文件所有 u(n) 都是在这张 285×430 网格上的坐标/尺寸，物理像素 = n × 画布宽 / 285（见 drawPoster 内 u 函数）
const CANVAS_LOGICAL_W = 285
const CANVAS_LOGICAL_H = 430

interface QrCodeModalProps {
  visible: boolean
  onClose: () => void
}

interface CanvasNode {
  width: number
  height: number
  getContext: (type: '2d') => CanvasRenderingContext2D | null
}

// 离屏画布（微信 createOffscreenCanvas / H5 DOM canvas 统一类型）
interface OffscreenCanvas2D {
  width: number
  height: number
  getContext: (type: '2d') => CanvasRenderingContext2D | null
}

type UQRCodeContext = CanvasRenderingContext2D & {
  draw?: (reserve?: unknown) => void
  setFillStyle?: (style: string) => void
}

// uqrcodejs v4 的 drawCanvas 内部会调用旧 API（setFillStyle / draw），
// 标准 2d context 需要先补 no-op 垫片
function adaptContext(ctx: CanvasRenderingContext2D) {
  const u = ctx as UQRCodeContext
  if (typeof u.draw !== 'function') {
    u.draw = () => undefined
  }
  if (typeof u.setFillStyle !== 'function') {
    u.setFillStyle = (style: string) => {
      ctx.fillStyle = style
    }
  }
  return ctx
}

function getH5CanvasNode(): CanvasNode | null {
  if (typeof document === 'undefined') return null
  return document.getElementById(CANVAS_ID) as CanvasNode | null
}

// logo 图片对象的跨端统一最小类型（属性以 unknown 收敛，规避库类型差异）
type LogoImage = unknown

// ctx.roundRect 兼容：用 arcTo 手写圆角矩形路径（不依赖 ctx.roundRect）
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

// 文本截断：超出 maxWidth 时尾部补 '…'
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number
) {
  if (maxW <= 0) return text
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) {
    t = t.slice(0, -1)
  }
  return `${t}…`
}

// 跨端统一加载 logo：微信端用 Taro.createImage / canvas 节点 createImage，
// H5 端用 <img>（必须 crossOrigin='anonymous'，否则画布被污染导致 toBlob/toDataURL 导出失败）；
// 3000ms 超时，加载失败 / 超时均 resolve(null)，绘制时仅跳过 logo，绝不 reject 阻塞出图
function loadLogo(node: CanvasNode, isWeapp: boolean, url: string = LOGO_URL): Promise<LogoImage | null> {
  return new Promise((resolve) => {
    let finished = false
    const finish = (img: LogoImage | null) => {
      if (!finished) {
        finished = true
        resolve(img)
      }
    }
    let img: unknown = null
    if (isWeapp) {
      try {
        const t = Taro as unknown as { createImage?: () => unknown }
        img = typeof t.createImage === 'function' ? t.createImage() : null
      } catch {
        img = null
      }
      if (!img) {
        const n = node as unknown as { createImage?: () => unknown }
        img = typeof n.createImage === 'function' ? n.createImage() : null
      }
    } else if (typeof Image !== 'undefined') {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      img = el
    }
    const ref = img as
      | { src?: string; onload?: (() => void) | null; onerror?: (() => void) | null }
      | null
    if (!ref) {
      finish(null)
      return
    }
    const timer = setTimeout(() => finish(null), 3000) // 3000ms：加载超时即放弃该图
    ref.onload = () => {
      clearTimeout(timer)
      finish(img)
    }
    ref.onerror = () => {
      clearTimeout(timer)
      finish(null)
    }
    ref.src = url
  })
}

export default function QrCodeModal({ visible, onClose }: QrCodeModalProps) {
  const canvasRef = useRef<CanvasNode | null>(null)
  // 绘制链路完成态：保存前需 await，避免导出半绘制图
  const drawnRef = useRef<Promise<void> | null>(null)
  const [saving, setSaving] = useState(false)

  // 页面遮罩在页面层，盖不住微信自定义 tabBar（页面之上的独立层），
  // 弹层开/关时通知 tabBar 层渲染/隐藏同高遮罩（H5 不使用 custom-tab-bar 目录，无需通知）
  useEffect(() => {
    if (Taro.getEnv() !== Taro.ENV_TYPE.WEAPP) return
    Taro.eventCenter.trigger(TABBAR_MASK_EVENT, visible)
  }, [visible])

  const drawPoster = (node: CanvasNode, cssW: number, cssH: number) => {
    const ctx = node.getContext('2d')
    if (!ctx || !cssW || !cssH) return
    // dpr = 设备像素比（iPhone 常见 3）；pixelRatio 缺失时兜底 2，下限钳到 2 保证导出清晰度
    const dpr = Math.max(Taro.getSystemInfoSync().pixelRatio || 2, 2)
    // 全程按物理像素绘制，主/离屏 context 均不做 scale，
    // 避免 uqrcodejs 按 qr.size（物理像素）计算时与 dpr 变换叠加导致二维码偏小
    const W = Math.round(cssW * dpr)
    // 高度按逻辑比例 430/285 以 W 为准换算，CSS 高度略有偏差时也不至于拉伸
    const H = Math.round((W * CANVAS_LOGICAL_H) / CANVAS_LOGICAL_W)
    node.width = W
    node.height = H
    // 1 逻辑单位对应的物理像素
    const u = (v: number) => (v * W) / CANVAS_LOGICAL_W

    const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP
    // 创建与二维码正方形同尺寸的离屏画布：uqrcodejs 的 drawCanvas 内部会先清空
    // 画布、只画黑色模块（透明底），直接画主画布会抹掉背景，因此先在离屏画布
    // 生成二维码，再整体合成到绿底主画布上
    // 二维码边长 191 逻辑单位：285 - 191 = 94，左右各留 47（与下方 drawImage 的 u(47) 对应）
    const qrSize = Math.round(u(191))
    let off: OffscreenCanvas2D | null = null
    if (isWeapp) {
      try {
        off = Taro.createOffscreenCanvas({
          type: '2d',
          width: qrSize,
          height: qrSize
        }) as unknown as OffscreenCanvas2D
      } catch {
        off = null
      }
    } else if (typeof document !== 'undefined') {
      const c = document.createElement('canvas')
      c.width = qrSize
      c.height = qrSize
      off = c as unknown as OffscreenCanvas2D
    }
    const offCtx = off ? off.getContext('2d') : null

    // 第一层：静态背景（绿色纵向渐变 → 底部白色椭圆拱栏 → 中部白色圆角卡片）
    const drawBackground = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, H)
      grad.addColorStop(0, '#33d67a')
      grad.addColorStop(1, '#07c160')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)

      // 底部白色栏：顶边为整宽椭圆拱（微信收款码同款，等价 CSS 顶部 border-radius: 50% / 14px）
      // fy = 栏顶边在两端的 y；arch = 拱高（中间比两端高出 arch）
      // 若出图发现拱向与微信相反（中间应下凹），把 angleStart/angleEnd 换成 0 / Math.PI 即可
      const fy = u(372) // 底栏顶边 y：372 = 430 - 58，即底栏高 58 逻辑单位
      const arch = u(14) // 椭圆拱高 14 逻辑单位
      ctx.beginPath()
      ctx.moveTo(0, fy)
      ctx.ellipse(W / 2, fy, W / 2, arch, 0, Math.PI, Math.PI * 2) // 半椭圆：PI→2PI 从左上端经拱顶(高 arch)到右上端
      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      // 中部白卡片：位置 (25, 36)，尺寸 235×240，圆角 12（均逻辑单位）
      // 285 - 235 = 50 → 左右各留 25 边距；卡片底边 = 36 + 240 = 276（后续文字位置以此为参照）
      // 先加浅阴影制造层次感，fill 完重置阴影
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.10)' // 阴影：黑色 10% 透明度
      ctx.shadowBlur = u(6) // 阴影模糊半径 6 逻辑单位
      ctx.shadowOffsetY = u(2) // 阴影向下偏移 2 逻辑单位
      ctx.fillStyle = '#ffffff'
      roundedRectPath(ctx, u(25), u(36), u(235), u(240), u(12))
      ctx.fill()
      ctx.restore()
    }

    // 第二层：信息文字（用户名、联系方式/地址、底栏 logo + 平台名）
    const drawOverlays = (logo: LogoImage | null) => {
      // 用户名：白卡片内下方居中，粗体 17 逻辑单位字号（Math.max 的 8 = 最小字号兜底），基线 y = 256（卡片底边 276 上方）
      ctx.fillStyle = '#1f2329'
      ctx.font = `bold ${Math.max(8, Math.round(u(17)))}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(USER_NAME, W / 2, u(256))

      // 绿底白字：联系方式 / 地址，常规 14 逻辑单位字号（8 = 最小字号兜底），
      // 最大宽度 245（285 - 20，左右各留 10）超出自动截 '…'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)' // 白色 95% 透明度
      ctx.font = `${Math.max(8, Math.round(u(14)))}px sans-serif`
      ctx.fillText(fitText(ctx, `联系方式：${CONTACT}`, u(245)), W / 2, u(302)) // y=302：卡片底边(276)下方 26
      ctx.fillText(fitText(ctx, `地址：${ADDRESS}`, u(245)), W / 2, u(330)) // y=330：行距 28，距底栏顶(372)还有 42

      // 底栏：logo（28×28，圆角 6）+ 间距 8 + 平台名（粗体 16），均逻辑单位
      // 基线 y = 401 = 底栏垂直居中（372 + 58/2，栏高 = 430 - 372 = 58），整体水平居中
      const brandY = u(401)
      ctx.font = `bold ${Math.max(8, Math.round(u(16)))}px sans-serif` // 16 逻辑单位；8 = 最小字号兜底
      const logoSize = u(28)
      const gapX = u(8)
      const brandTextW = ctx.measureText(PLATFORM_NAME).width
      const totalW = (logo ? logoSize + gapX : 0) + brandTextW
      const startX = (W - totalW) / 2
      if (logo) {
        ctx.save()
        roundedRectPath(ctx, startX, brandY - logoSize / 2, logoSize, logoSize, u(6)) // logo 圆角 6 逻辑单位
        ctx.clip()
        ctx.drawImage(logo as unknown as CanvasImageSource, startX, brandY - logoSize / 2, logoSize, logoSize)
        ctx.restore()
      }
      ctx.fillStyle = '#1f2329'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(PLATFORM_NAME, startX + (logo ? logoSize + gapX : 0), brandY)
    }

    // 二维码中心头像（仿微信收款码：白色圆底 u(44) + 圆形裁剪头像 u(38)）；
    // avatar 为 null（加载失败/超时）时直接跳过，不阻塞出图
    const drawAvatar = (avatar: LogoImage | null, cx: number, cy: number) => {
      if (!avatar) return
      const ring = u(44)
      const img = u(38)
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, ring / 2, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      // roundedRectPath 半径取边长一半即圆形裁剪
      roundedRectPath(ctx, cx - img / 2, cy - img / 2, img, img, img / 2)
      ctx.clip()
      ctx.drawImage(avatar as unknown as CanvasImageSource, cx - img / 2, cy - img / 2, img, img)
      ctx.restore()
    }

    const qr = new QRCode()
    qr.data = SHARE_URL
    qr.size = qrSize
    qr.make()

    let task: Promise<void>
    if (off && offCtx) {
      const offC = off
      qr.canvasContext = adaptContext(offCtx)
      task = Promise.all([loadLogo(node, isWeapp), loadLogo(node, isWeapp, AVATAR_URL), qr.drawCanvas()]).then(([logo, avatar]) => {
        // 主画布顺序：绿底 → 底栏 → 白卡片 → 二维码 → 头像（居中二维码上方）→ 信息层
        drawBackground()
        // 二维码贴点：左上角 (47, 48)，尺寸 191×191（47×2 + 191 = 285，水平居中）
        ctx.drawImage(offC as unknown as CanvasImageSource, u(47), u(48), u(191), u(191))
        // 头像取二维码中心：(47 + 191/2, 48 + 191/2)
        drawAvatar(avatar, u(47) + u(191) / 2, u(48) + u(191) / 2)
        drawOverlays(logo)
      })
    } else {
      // 离屏画布不可用时的兜底：直接在主画布绘制（先背景，再二维码，再头像，再信息层）
      qr.canvasContext = adaptContext(ctx)
      drawBackground()
      task = Promise.all([loadLogo(node, isWeapp), loadLogo(node, isWeapp, AVATAR_URL), qr.drawCanvas()]).then(([logo, avatar]) => {
        drawAvatar(avatar, qrSize / 2, qrSize / 2)
        drawOverlays(logo)
      })
    }
    // 记录绘制链路完成态（含 logo 加载），供保存动作等待
    drawnRef.current = task.catch((e) => {
      Taro.showToast({ title: '图片生成失败', icon: 'none' })
      console.error('名片海报绘制失败:', e)
      throw e
    })
  }

  useEffect(() => {
    if (!visible) return
    let retry = 3 // 拿不到 canvas 节点时最多重试 3 次
    const tryDraw = () => {
      Taro.createSelectorQuery()
        .select(`#${CANVAS_ID}`)
        .fields({ node: true, size: true })
        .exec((res) => {
          const r = res?.[0] as
            | { node?: CanvasNode; width?: number; height?: number }
            | undefined
          const node =
            r?.node ??
            (Taro.getEnv() === Taro.ENV_TYPE.WEAPP ? null : getH5CanvasNode())
          if (node) {
            canvasRef.current = node
            // CSS 尺寸取 selectorQuery 的 size 结果（H5 回退取 getBoundingClientRect），
            // 不用 canvas 缓冲区属性 width/height（默认 300×150，与样式不符）
            const html = node as unknown as HTMLCanvasElement
            const rect = typeof html.getBoundingClientRect === 'function'
              ? html.getBoundingClientRect()
              : null
            const cssW = r?.width || rect?.width || node.width
            const cssH = r?.height || rect?.height || node.height
            drawPoster(node, cssW, cssH)
          } else if (retry > 0) {
            retry -= 1
            setTimeout(tryDraw, 50) // 50ms 后重试
          }
        })
    }
    const timer = setTimeout(tryDraw, 0) // 0ms：延迟到下一宏任务，等节点完成布局后再查询
    return () => {
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  const beforeClose = () => {
    canvasRef.current = null
    drawnRef.current = null;
    return true;
  }

  const handleSave = async () => {
    const node = canvasRef.current
    if (!node) {
      Taro.showToast({ title: '图片未就绪，请重试', icon: 'none' })
      return
    }
    if (saving) return
    // 等待绘制链路完成再截图/导出，避免保存出半绘制或不完整的图
    if (drawnRef.current) {
      try {
        await drawnRef.current
      } catch {
        // 生成失败时绘制链路已 toast 提示
        return
      }
    }
    setSaving(true)
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      // canvas 2d 节点与 Taro Option 中的 Canvas 类型不完全一致，按运行时真实对象透传
      Taro.canvasToTempFilePath({
        canvas: node,
        filePath: 'wxfile://temp/qr-poster.png',
        fileType: 'png',
        quality: 1 // png 忽略 quality，1 = 标称最高质量
      } as unknown as Taro.canvasToTempFilePath.Option)
        .then(({ tempFilePath }) => Taro.saveImageToPhotosAlbum({ filePath: tempFilePath }))
        .then(() => {
          Taro.showToast({ title: '已保存到相册', icon: 'success' })
        })
        .catch((e) => {
          const errMsg = ((e as { errMsg?: string }) || {}).errMsg || ''
          if (errMsg.includes('auth deny') || errMsg.includes('authorize') || errMsg.includes('scope')) {
            Taro.showModal({
              title: '提示',
              content: '需要您授权保存图片到相册',
              confirmText: '去设置',
              success: (r) => {
                if (r.confirm) Taro.openSetting()
              }
            })
          } else {
            Taro.showToast({ title: '保存失败', icon: 'none' })
          }
        })
        .finally(() => setSaving(false))
    } else {
      const htmlCanvas = node as unknown as HTMLCanvasElement
      const downloadName = `${USER_NAME}-鲜田直达名片.png`
      // <a> 挂到 body 再触发，降低部分内核忽略 download 属性的概率
      const triggerDownload = (href: string, revokeUrl: string | null) => {
        const a = document.createElement('a')
        a.href = href
        a.download = downloadName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        if (revokeUrl) setTimeout(() => URL.revokeObjectURL(revokeUrl), 1000) // 1s 后 blob 已可释放
        Taro.showToast({ title: '已开始下载', icon: 'none' })
      }
      try {
        if (typeof htmlCanvas.toBlob === 'function') {
          htmlCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              triggerDownload(url, url)
            } else {
              triggerDownload(htmlCanvas.toDataURL('image/png'), null)
            }
            setSaving(false)
          }, 'image/png')
        } else {
          triggerDownload(htmlCanvas.toDataURL('image/png'), null)
          setSaving(false)
        }
      } catch (e) {
        Taro.showToast({ title: '保存失败', icon: 'none' })
        setSaving(false)
      }
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} beforeClose={beforeClose} title='我的名片'>
      <View className='qr-code-modal__poster'>
        {/* weapp 的 canvas 2d 是 native 层组件：不跟随祖先的 opacity/transform 退出动画，
            自身挂 visibility/opacity 也不同步（实测无效），唯一可靠手段是销毁节点——
            关闭时（!visible）同一帧卸载，native 层立即消失，卡片继续播退出动画；
            打开时重新挂载，走现有"延迟查询 + 重试"的绘制链路重绘 */}
        {visible && (
          <Canvas
            type='2d'
            id={CANVAS_ID}
            canvasId={CANVAS_ID}
            className='qr-code-modal__canvas'
          />
        )}
        <Text className='qr-code-modal__hint'>保存图片分享给好友</Text>
      </View>
      <View
        className={`qr-code-modal__save-btn${saving ? ' qr-code-modal__save-btn--loading' : ''}`}
        onClick={saving ? undefined : handleSave}
      >
        {saving ? '保存中…' : '保存图片'}
      </View>
    </Modal>
  )
}