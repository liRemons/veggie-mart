// 构建期图标生成：iconfont Symbol (SVG) → base64 PNG → src/components/icons/icons.ts
// 用法：cd app && npm run icons:gen
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ICONS_DIR = join(APP_DIR, 'src', 'assets', 'icons')
const OUT_FILE = join(APP_DIR, 'src', 'components', 'icons', 'icons.ts')

function findInput () {
  const jsFile = join(ICONS_DIR, 'iconfont.symbol.js')
  if (existsSync(jsFile)) return readFileSync(jsFile, 'utf8')
  if (existsSync(ICONS_DIR)) {
    const svgs = readdirSync(ICONS_DIR).filter((f) => f.toLowerCase().endsWith('.svg'))
    if (svgs.length > 0) return readFileSync(join(ICONS_DIR, svgs[0]), 'utf8')
  }
  console.error('未找到 symbol 文件，请把 iconfont.cn Symbol 代码放到 app/src/assets/icons/iconfont.symbol.js')
  process.exit(1)
}

// iconfont.cn 的 symbol js 会把双引号转义为 &quot;，匹配前先归一化
function normalize (src) {
  return src.replace(/&quot;/g, '"')
}

function parseSymbols (src) {
  const symbols = []
  const re = /<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/g
  let m
  while ((m = re.exec(src)) !== null) {
    const attrs = m[1]
    const inner = m[2]
    const idMatch = attrs.match(/\bid\s*=\s*"([^"]+)"/)
    if (!idMatch) continue
    const viewBoxMatch = attrs.match(/\bviewBox\s*=\s*"([^"]+)"/)
    symbols.push({
      id: idMatch[1],
      viewBox: viewBoxMatch ? viewBoxMatch[1] : '0 0 1024 1024',
      inner
    })
  }
  return symbols
}

// 自动多色检测：含渐变视为多色；否则 fill/stroke/stop-color 去重后色值数 ≥ 2 视为多色
function isColored (inner) {
  if (/<(linear|radial)Gradient[\s>]/.test(inner)) return true
  if (/url\(/.test(inner)) return true
  const colors = new Set()
  const attrRe = /(?:fill|stroke|stop-color)\s*=\s*["']([^"']*)["']/g
  const declRe = /(?:fill|stroke|stop-color)\s*:\s*([^;\s}]+)/g
  for (const re of [attrRe, declRe]) {
    let m
    while ((m = re.exec(inner)) !== null) {
      const value = m[1].trim()
      if (!value) continue
      if (/^(currentColor|inherit|none|transparent)/i.test(value)) continue
      colors.add(value.toLowerCase())
    }
  }
  return colors.size >= 2
}

function writeIcons (entries) {
  const lines = Object.entries(entries)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => `  '${k.replace(/^icon-/, '')}': '${v}',`) // key 去 icon- 前缀，与 Icon 组件约定一致
  const content = `// 本文件由 scripts/gen-icons.mjs 自动生成，请勿手动修改。\n// 重新生成：在 app/ 目录下运行 npm run icons:gen\nexport const ICONS: Record<string, string> = {\n${lines.join('\n')}\n}\n`
  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, content)
}

const source = normalize(findInput())
const symbols = parseSymbols(source)
if (symbols.length === 0) {
  console.error('未从输入文件中解析到任何 <symbol> 图标，请确认文件是否为 iconfont.cn 的 Symbol (SVG) 代码')
  process.exit(1)
}

const { Resvg } = await import('@resvg/resvg-js')

const entries = {}
const rendered = []
for (const { id, viewBox, inner } of symbols) {
  if (!isColored(inner)) {
    console.log(`跳过单色图标：${id}`)
    continue
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`
  try {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 96 }, background: 'rgba(0, 0, 0, 0)' }).render().asPng()
    entries[id] = `data:image/png;base64,${Buffer.from(png).toString('base64')}`
    rendered.push(id)
  } catch (err) {
    console.error(`渲染 ${id} 失败：${err.message}`)
  }
}

if (rendered.length === 0) {
  console.error('所有 symbol 均渲染失败，未生成 icons.ts')
  process.exit(1)
}

writeIcons(entries)
console.log(`已生成 ${rendered.length} 个图标 → ${relative(APP_DIR, OUT_FILE)}：${rendered.join(', ')}`)
