import { Chart, Plugin, Point, ChartTypeRegistry } from 'chart.js'

import { getDatasetBorderColor, getDatasetMetaData } from '@/lib/chart/utils/chartUtils'

interface ChartMeta {
  data: Point[]
}

interface Options {
  labels: string[]
  fillColor?: string
}

const drawFillBetweenLines = (ctx: CanvasRenderingContext2D, metaData1: ChartMeta, metaData2: ChartMeta, fillColor: string) => {
  ctx.save()
  ctx.fillStyle = fillColor
  ctx.beginPath()

  // 첫 번째 라인: 유효한 첫 포인트로 이동 후 이어 그리기
  const valid1 = metaData1.data.filter((p) => p.x !== null && p.y !== null)
  if (valid1.length === 0) {
    ctx.restore()
    return
  }
  ctx.moveTo(valid1[0].x ?? 0, valid1[0].y ?? 0)
  for (let i = 1; i < valid1.length; i++) {
    ctx.lineTo(valid1[i].x ?? 0, valid1[i].y ?? 0)
  }

  // 두 번째 라인: 역순으로 연결
  const valid2 = metaData2.data.filter((p) => p.x !== null && p.y !== null)
  for (let i = valid2.length - 1; i >= 0; i--) {
    ctx.lineTo(valid2[i].x ?? 0, valid2[i].y ?? 0)
  }

  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const fillBetweenPlugin: Plugin<keyof ChartTypeRegistry, Options> = {
  id: 'fillBetween',
  beforeDraw: (chart: Chart<keyof ChartTypeRegistry>, _args: unknown, options: Options) => {
    const { ctx } = chart

    if (!options?.labels || options.labels.length < 2) return

    const metaData1 = getDatasetMetaData(chart, options.labels[0])
    const metaData2 = getDatasetMetaData(chart, options.labels[1])

    if (!metaData1 || !metaData2) return
    if ([getDatasetBorderColor(chart, options.labels[0]), getDatasetBorderColor(chart, options.labels[1])].includes('transparent')) return

    const fillColor = options.fillColor ?? 'rgba(0, 0, 255, 0.3)'

    ctx.save()
    const { left, top, right, bottom } = chart.chartArea
    ctx.beginPath()
    ctx.rect(left, top, right - left, bottom - top)
    ctx.clip()
    drawFillBetweenLines(ctx, metaData1, metaData2, fillColor)
    ctx.restore()
  },
}

export default fillBetweenPlugin
