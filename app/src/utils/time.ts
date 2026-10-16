const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

/**
 * 发布时间展示规则：
 * - HH:mm（精确到分钟）
 * - 昨天 HH:mm
 * - 前天
 * - 今年：MM-DD
 * - 非今年：YYYY-MM-DD
 */
export function formatPublishTime(timestamp: number): string {
  const now = new Date()
  const d = new Date(timestamp)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.round((startOfToday - startOfD) / 86400000)

  if (dayDiff === 0) return `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (dayDiff === 1) return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (dayDiff === 2) return `前天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (d.getFullYear() === now.getFullYear()) return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
