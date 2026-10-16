import Taro from '@tarojs/taro'

/** 详情页商品数据结构（在列表卡片基础上新增 imgs/specs/qualities） */
export interface DetailProduct {
  id?: number
  title: string
  desc?: string
  price: string
  unit: string
  tags?: string[]
  address: string
  img: string
  imgs?: string[]
  specs?: string[]
  qualities?: string[]
  publishTime: number
}

export const DETAIL_URL = '/pages/detail/detail'

/** 详情页通过 storage 传递完整 item（navigateTo 入参不便传对象） */
export const DETAIL_PRODUCT_KEY = 'detail:product'

const NOW = Date.now()
const H = 3600000

/** 直开详情页（无 storage 数据，如开发者工具直接预览）时的示例数据 */
export const SAMPLE_PRODUCT: DetailProduct = {
  id: 0,
  title: '出售大白菜 3吨',
  desc: '青帮白帮 产地直发',
  price: '10',
  unit: '筐（斤）',
  tags: ['产地直发', '量大', '新鲜'],
  address: '河北石家庄',
  img: 'https://picsum.photos/seed/detail1/750/600',
  imgs: [
    'https://picsum.photos/seed/detail1/750/600',
    'https://picsum.photos/seed/detail2/750/600',
    'https://picsum.photos/seed/detail3/750/600'
  ],
  specs: ['25斤/筐', '20斤/筐', '30斤/筐'],
  qualities: ['30天', '大颗'],
  publishTime: NOW - 3 * H
}

/** 写入详情数据并跳转详情页（navigateTo 保活列表页，返回状态不丢失） */
export function openDetail(item: DetailProduct): void {
  Taro.setStorageSync(DETAIL_PRODUCT_KEY, item)
  Taro.navigateTo({ url: DETAIL_URL })
}

/** 读取详情数据，无数据时兜底示例数据 */
export function getDetailProduct(): DetailProduct {
  const stored = Taro.getStorageSync(DETAIL_PRODUCT_KEY)
  if (stored && typeof stored === 'object') {
    return { ...SAMPLE_PRODUCT, ...stored }
  }
  return SAMPLE_PRODUCT
}