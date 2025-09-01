import { Chart as ChartJS, ChartDataset } from 'chart.js'
interface TreemapChild {
  sector: string
  level: number
  change: number
  category?: string
  instrument?: string
}
interface TreemapDataItem {
  _data: {
    children: TreemapChild[]
  }
}

const ELLIPSIS = '…'
const FONT_FAMILY = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial'

function drawOneLineEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: string,
  fillStyle: string,
) {
  if (!text) return
  ctx.font = font
  ctx.fillStyle = fillStyle

  const fullWidth = ctx.measureText(text).width
  if (fullWidth <= maxWidth) {
    ctx.fillText(text, x, y)
    return
  }

  if (ctx.measureText(ELLIPSIS).width > maxWidth) return

  let t = text
  while (t.length && ctx.measureText(t + ELLIPSIS).width > maxWidth) {
    t = t.slice(0, -1)
  }
  if (t.length) ctx.fillText(t + ELLIPSIS, x, y)
}

function drawMultiLineWithEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  maxLines: number,
  font: string,
  lineHeightPx: number,
  fillStyle: string,
): number {
  if (!text || maxLines <= 0) return 0
  ctx.font = font
  ctx.fillStyle = fillStyle

  const words: string[] = []
  text.split(/\s+/).forEach((w) => {
    if (!w) return
    if (ctx.measureText(w).width <= maxWidth) {
      words.push(w)
    } else {
      let chunk = ''
      for (const ch of w) {
        const test = chunk + ch
        if (ctx.measureText(test).width > maxWidth) {
          if (chunk) words.push(chunk)
          chunk = ch
        } else {
          chunk = test
        }
      }
      if (chunk) words.push(chunk)
    }
  })

  const lines: string[] = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const test = (line ? line + ' ' : '') + words[i]
    if (ctx.measureText(test).width > maxWidth) {
      if (line) {
        lines.push(line)
        line = words[i]
      } else {
        lines.push(words[i])
        line = ''
      }
    } else {
      line = test
    }
  }
  if (line) lines.push(line)

  const clipped = lines.slice(0, maxLines)
  if (clipped.length < lines.length) {
    let last = clipped[clipped.length - 1]
    while (last && ctx.measureText(last + ELLIPSIS).width > maxWidth) {
      last = last.slice(0, -1)
    }
    clipped[clipped.length - 1] = last ? last + ELLIPSIS : ELLIPSIS
  }

  clipped.forEach((ln, idx) => ctx.fillText(ln, x, y + idx * lineHeightPx))
  return clipped.length
}

const customLabelPlugin = {
  id: 'customLabelPlugin',
  afterDatasetsDraw: (chart: ChartJS) => {
    const ctx = chart.ctx
    const dataset = chart.data.datasets[0] as ChartDataset<'treemap', TreemapDataItem[]>
    if (!dataset?.data) return

    const meta = chart.getDatasetMeta(0)

    dataset.data.forEach((item: TreemapDataItem, i: number) => {
      const rect = meta.data[i] as unknown as { x: number; y: number; width: number; height: number } | undefined
      if (!rect) return

      const raw = item?._data?.children?.[0] as TreemapChild | undefined
      if (!raw) return

      const category = (raw.category ?? '').trim()
      const instrument = (raw.instrument ?? raw.sector ?? '').trim()
      const changeText = (typeof raw.change === 'number' ? raw.change : 0).toFixed(2).replace('-', '- ')

      const { x, y, width: w, height: h } = rect
      if (w <= 0 || h <= 0) return

      const level = raw.level ?? 1
      const isSmallBox = w < 64 || h < 48
      const padX = isSmallBox ? 6 : 14
      const padY = isSmallBox ? 6 : 12
      const usableW = Math.max(4, w - padX * 2)
      const usableH = Math.max(4, h - padY * 2)
      const MIN_FONT = 14

      const catSize = Math.max(MIN_FONT, Math.round(10 + (level - 1) * 0.4))
      const instSize = Math.max(MIN_FONT, Math.round(10 + (level - 1) * 0.4))
      const valSize = Math.round(16 + (level - 1) * 0.4)
      const catFont = `600 ${catSize}px ${FONT_FAMILY}`
      const instFont = `500 ${instSize}px ${FONT_FAMILY}`
      const valFont = `600 ${valSize}px ${FONT_FAMILY}`
      const catLH = Math.round(catSize * 1.35)
      const instLH = Math.round(instSize * 1.35)
      const valLH = Math.round(valSize * 1.2)

      const titleColor = 'rgba(255,255,255,0.95)'
      const valueColor = 'rgba(255,255,255,1)'
      const gapTitle = 2
      const gapToValue = 6

      ctx.save()
      ctx.textAlign = 'start'
      ctx.textBaseline = 'top'

      if (isSmallBox) {
        ctx.font = valFont
        ctx.fillStyle = valueColor
        const tw = ctx.measureText(changeText).width
        if (tw <= usableW && valLH <= usableH) {
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(changeText, x + w / 2, y + h / 2 - 1)
        }
        ctx.restore()
        return
      }

      const reservedForValue = gapToValue + valLH
      let remainForTitle = usableH - reservedForValue
      if (remainForTitle <= 0) {
        ctx.font = valFont
        ctx.fillStyle = valueColor
        ctx.fillText(changeText, x + padX, y + padY)
        ctx.restore()
        return
      }

      let curY = y + padY
      if (category) {
        if (remainForTitle >= catLH) {
          drawOneLineEllipsis(ctx, category, x + padX, curY, usableW, catFont, titleColor)
          curY += catLH + gapTitle
          remainForTitle -= catLH + gapTitle
        } else {
          ctx.font = valFont
          ctx.fillStyle = valueColor
          ctx.fillText(changeText, x + padX, y + padY)
          ctx.restore()
          return
        }
      }

      const maxInstLines = Math.floor(remainForTitle / instLH)
      let usedInstLines = 0
      if (maxInstLines >= 1) {
        usedInstLines = drawMultiLineWithEllipsis(ctx, instrument, x + padX, curY, usableW, maxInstLines, instFont, instLH, titleColor)
        curY += usedInstLines * instLH
        remainForTitle -= usedInstLines * instLH
      }

      ctx.font = valFont
      ctx.fillStyle = valueColor
      const valueY = Math.min(curY + gapToValue, y + h - padY - valLH)
      ctx.fillText(changeText, x + padX, valueY)

      ctx.restore()
    })
  },
}

export default customLabelPlugin
