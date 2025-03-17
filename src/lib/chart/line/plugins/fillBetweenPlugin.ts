import { Chart, Plugin, Point } from 'chart.js'

import { getDatasetMetaData } from '@/lib/chart/utils/chartUtils'

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

  metaData1.data.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })

  metaData2.data
    .slice()
    .reverse()
    .forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })

  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const fillBetweenPlugin: Plugin<'line'> = {
  id: 'fillBetween',
  beforeDraw: (chart: Chart<'line'>, _args: unknown, options: Options) => {
    const { ctx } = chart

    const metaData1 = getDatasetMetaData(chart, options.labels[0])
    const metaData2 = getDatasetMetaData(chart, options.labels[1])

    if (!metaData1 || !metaData2) return
    if (metaData1.hidden || metaData2.hidden) return

    const fillColor = options.fillColor ?? 'rgba(0, 0, 255, 0.3)'

    drawFillBetweenLines(ctx, metaData1, metaData2, fillColor)
  },
}

export default fillBetweenPlugin
