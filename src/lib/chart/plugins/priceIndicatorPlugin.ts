import { Chart, ChartType, InteractionItem, Plugin, Point } from 'chart.js'
import { FinancialDataPoint } from 'chart.js/auto'
import dayjs from 'dayjs'

import { formatPrice } from '@/utils/number'

interface PriceIndicatorPlugin extends Plugin<ChartType> {
  id: string
  mousePosition: { x: number; y: number } | null
  focusedPoints: Array<{
    label?: string
    backgroundColor?: string
    x: number
    y: number | null
    yAxisID: string
    interactionPoint: InteractionItem
  }>
  afterDraw(chart: Chart<ChartType>, args: Record<string, never>, options: unknown): void
}

const FONT = '500 14px Pretendard'

const priceIndicatorPlugin: PriceIndicatorPlugin = {
  id: 'priceIndicatorPlugin',
  mousePosition: null,
  focusedPoints: [],
  afterInit(chart, _arg) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const plugin = this

    chart.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      try {
        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        plugin.mousePosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }

        const sameIndexPoints = chart.getElementsAtEventForMode(event, 'index', { axis: 'x', intersect: false }, false)

        if (sameIndexPoints.length) {
          const focusedPoints = sameIndexPoints.map((p) => {
            const data = chart.data.datasets[p.datasetIndex].data[p.index]

            return {
              label: chart.data.datasets[p.datasetIndex].label,
              backgroundColor: chart.data.datasets[p.datasetIndex].borderColor as string,
              x: (data as Point).x,
              y: (data as FinancialDataPoint).c || (data as Point).y,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              yAxisID: (chart.data.datasets[p.datasetIndex] as any).yAxisID,
              interactionPoint: p,
            }
          })

          plugin.focusedPoints = focusedPoints.filter((item) => !['MA5', 'MA20', 'MA60', 'MA120'].includes(item.label ?? ''))
        }
        chart.draw()
      } catch (err) {
        console.log(err)
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      try {
        plugin.mousePosition = null
        chart.draw()
      } catch (err) {
        console.log(err)
      }
    })
  },
  afterDraw(chart) {
    if (this.mousePosition) {
      const ctx = chart.ctx
      const chartArea = chart.chartArea

      if (
        this.mousePosition.x >= chartArea.left &&
        this.mousePosition.x <= chartArea.right &&
        this.mousePosition.y >= chartArea.top &&
        this.mousePosition.y <= chartArea.bottom
      ) {
        ctx.save()

        const VALUE_BOX_WIDTH = 55
        const VALUE_BOX_HEIGHT = 21
        const VALUE_MARGIN = 6

        this.focusedPoints.forEach((p) => {
          if (['Upper BB', 'Lower BB'].includes(p.label ?? '')) return

          const yAxisId = p.yAxisID || 'y'
          const value = p.y

          if (value) {
            ctx.beginPath()
            const yPixel = chart.scales[yAxisId].getPixelForValue(value)
            const scale = chart.scales[yAxisId]

            ctx.fillStyle = p.backgroundColor ?? '#2E3F5E'

            if (yAxisId === 'y') {
              ctx.roundRect(
                scale.right - VALUE_BOX_WIDTH - VALUE_MARGIN,
                yPixel - VALUE_BOX_HEIGHT / 2,
                VALUE_BOX_WIDTH,
                VALUE_BOX_HEIGHT,
                2,
              )
            } else {
              ctx.roundRect(scale.left + VALUE_MARGIN, yPixel - VALUE_BOX_HEIGHT / 2, VALUE_BOX_WIDTH, VALUE_BOX_HEIGHT, 2)
            }
            ctx.fill()

            ctx.font = FONT
            ctx.fillStyle = 'white'
            const dateText = formatPrice(value)
            const textMetrics = ctx.measureText(dateText)

            if (yAxisId === 'y') {
              ctx.fillText(dateText, scale.right - VALUE_BOX_WIDTH, yPixel + 4)
            } else {
              ctx.fillText(dateText, scale.left + VALUE_MARGIN + (VALUE_BOX_WIDTH - textMetrics.width) / 2, yPixel + 4)
            }
          }
        })

        // Draw background box
        ctx.beginPath()
        const DATE_BOX_WIDTH = 113
        const DATE_BOX_HEIGHT = 21

        ctx.fillStyle = '#2E3F5E'
        ctx.roundRect(
          this.focusedPoints[0].interactionPoint.element.x - DATE_BOX_WIDTH / 2,
          chartArea.bottom - DATE_BOX_HEIGHT,
          DATE_BOX_WIDTH,
          DATE_BOX_HEIGHT,
          2,
        )
        ctx.fill()

        ctx.font = FONT
        ctx.fillStyle = 'white'
        const dateText = dayjs(this.focusedPoints[0].x).format('YYYY-MM-DD')
        const textMetrics = ctx.measureText(dateText)

        ctx.fillText(dateText, this.focusedPoints[0].interactionPoint.element.x - textMetrics.width / 2, chartArea.bottom - 4)
        ctx.restore()
      }
    }
  },
}

export default priceIndicatorPlugin
