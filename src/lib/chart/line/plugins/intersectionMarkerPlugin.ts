import { Chart, Plugin, Point } from 'chart.js'

import { getDatasetMetaData } from '@/lib/chart/utils/chartUtils'

const checkIntersection = (p1: Point, p2: Point, q1: Point, q2: Point) => {
  if (
    p1.x === null ||
    p1.y === null ||
    p2.x === null ||
    p2.y === null ||
    q1.x === null ||
    q1.y === null ||
    q2.x === null ||
    q2.y === null
  ) {
    return null
  }

  const denom = (p2.x - p1.x) * (q2.y - q1.y) - (p2.y - p1.y) * (q2.x - q1.x)

  if (denom === 0) return null // 평행하면 교차 없음

  const ua = ((q2.x - q1.x) * (p1.y - q1.y) - (q2.y - q1.y) * (p1.x - q1.x)) / denom
  const ub = ((p2.x - p1.x) * (p1.y - q1.y) - (p2.y - p1.y) * (p1.x - q1.x)) / denom

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    }
  }

  return null
}

const drawIntersectionMarker = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillText('+', x, y)
}

const intersectionMarkerPlugin: Plugin<'line'> = {
  id: 'intersectionMarker',
  afterDatasetsDraw: (chart: Chart<'line'>, _args, options) => {
    const { ctx } = chart

    const metaData1 = getDatasetMetaData(chart, options.labels[0])
    const metaData2 = getDatasetMetaData(chart, options.labels[1])

    if (!metaData1 || !metaData2) return
    if (metaData1.hidden || metaData2.hidden) return

    ctx.save()
    ctx.fillStyle = 'blue'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < metaData1.data.length - 1; i++) {
      const p1 = metaData1.data[i]
      const p2 = metaData1.data[i + 1]
      const q1 = metaData2.data[i]
      const q2 = metaData2.data[i + 1]

      if (!p1 || !p2 || !q1 || !q2) continue

      const intersection = checkIntersection(p1, p2, q1, q2)

      if (intersection) {
        drawIntersectionMarker(ctx, intersection.x, intersection.y)
      }
    }

    ctx.restore()
  },
}

export default intersectionMarkerPlugin
