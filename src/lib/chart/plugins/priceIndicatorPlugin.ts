import { Chart, ChartType, InteractionItem, Plugin, Point } from 'chart.js'
import { FinancialDataPoint } from 'chart.js/auto'
import dayjs from 'dayjs'

import { formatPrice } from '@/utils/number'

interface PriceIndicatorPlugin extends Plugin {
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
  lastPoints: Array<{
    label?: string
    backgroundColor?: string
    x: number
    y: number | null
    yAxisID: string
    isComparison: boolean
  }>
  updateLastPoints(chart: Chart<ChartType>): void
  afterDraw(chart: Chart<ChartType>, args: Record<string, never>, options: unknown): void
}

const FONT = '500 14px Pretendard'

const priceIndicatorPlugin: PriceIndicatorPlugin = {
  id: 'priceIndicatorPlugin',
  mousePosition: null,
  focusedPoints: [],
  lastPoints: [],
  afterInit(chart, _arg) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const plugin = this

    plugin.updateLastPoints(chart)

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

          // comparisonCharts(yAxisID가 'y'가 아닌 데이터)와 특정 라벨은 마우스 이벤트에서 제외
          plugin.focusedPoints = focusedPoints.filter((item) => {
            const isMainChart = item.yAxisID === 'y' || !item.yAxisID
            const isNotSpecialLabel = !['MA5', 'MA20', 'MA60', 'MA120'].includes(item.label ?? '')

            return isMainChart && isNotSpecialLabel
          })
        }
        if (chart.ctx) {
          chart.draw()
        }
      } catch (err) {
        console.error(err)
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      try {
        plugin.mousePosition = null
        if (chart.ctx) {
          chart.draw()
        }
      } catch (err) {
        console.error(err)
      }
    })
  },
  beforeUpdate(chart) {
    this.updateLastPoints(chart)
  },
  updateLastPoints(chart: Chart<ChartType>) {
    try {
      this.lastPoints = []

      chart.data.datasets.forEach((dataset) => {
        if (!dataset.data || dataset.data.length === 0) return

        // comparisonCharts 여부 확인 (yAxisID가 'y'가 아닌 경우 비교 차트로 간주)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isComparison = (dataset as any).yAxisID !== 'y'

        if (isComparison || !['MA5', 'MA20', 'MA60', 'MA120', 'Upper BB', 'Lower BB'].includes(dataset.label ?? '')) {
          const lastIndex = dataset.data.length - 1
          const lastData = dataset.data[lastIndex]

          this.lastPoints.push({
            label: dataset.label,
            backgroundColor: dataset.borderColor as string,
            x: (lastData as Point).x,
            y: (lastData as FinancialDataPoint).c || (lastData as Point).y,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            yAxisID: (dataset as any).yAxisID ?? 'y',
            isComparison,
          })
        }
      })
    } catch (err) {
      console.error('Error updating last points:', err)
    }
  },
  afterDraw(chart) {
    const ctx = chart.ctx
    const chartArea = chart.chartArea

    const drawnBoxPositions: Record<string, { top: number; bottom: number }[]> = {}

    this.lastPoints.forEach((p) => {
      if (p.isComparison && p.y !== null) {
        ctx.save()

        const VALUE_BOX_WIDTH = 55
        const VALUE_BOX_HEIGHT = 21
        const VALUE_MARGIN = 6

        const yAxisId = p.yAxisID || 'y'
        const value = p.y

        if (value) {
          ctx.beginPath()
          let yPixel = chart.scales[yAxisId].getPixelForValue(value)
          const scale = chart.scales[yAxisId]

          if (!drawnBoxPositions[yAxisId]) {
            drawnBoxPositions[yAxisId] = []
          }

          const boxTop = yPixel - VALUE_BOX_HEIGHT / 2
          const boxBottom = yPixel + VALUE_BOX_HEIGHT / 2

          if (boxTop < chartArea.top) {
            yPixel = chartArea.top + VALUE_BOX_HEIGHT / 2
          } else if (boxBottom > chartArea.bottom) {
            yPixel = chartArea.bottom - VALUE_BOX_HEIGHT / 2
          }

          for (const prevBox of drawnBoxPositions[yAxisId]) {
            if (boxTop <= prevBox.bottom && boxBottom >= prevBox.top) {
              yPixel = prevBox.bottom + VALUE_BOX_HEIGHT / 2 + 2
              if (yPixel + VALUE_BOX_HEIGHT / 2 > chartArea.bottom) {
                yPixel = chartArea.bottom - VALUE_BOX_HEIGHT / 2
              }
              break
            }
          }

          ctx.fillStyle = p.backgroundColor ?? '#2E3F5E'

          if (yAxisId === 'y') {
            ctx.roundRect(scale.right - VALUE_BOX_WIDTH - VALUE_MARGIN, yPixel - VALUE_BOX_HEIGHT / 2, VALUE_BOX_WIDTH, VALUE_BOX_HEIGHT, 2)
          } else {
            ctx.roundRect(scale.left + VALUE_MARGIN, yPixel - VALUE_BOX_HEIGHT / 2, VALUE_BOX_WIDTH, VALUE_BOX_HEIGHT, 2)
          }
          ctx.fill()

          ctx.font = FONT
          ctx.fillStyle = 'white'
          const valueText = formatPrice(value)
          const textMetrics = ctx.measureText(valueText)

          if (yAxisId === 'y') {
            ctx.fillText(valueText, scale.right - VALUE_BOX_WIDTH + (VALUE_BOX_WIDTH - textMetrics.width) / 2 - VALUE_MARGIN, yPixel + 4)
          } else {
            ctx.fillText(valueText, scale.left + VALUE_MARGIN + (VALUE_BOX_WIDTH - textMetrics.width) / 2, yPixel + 4)
          }

          drawnBoxPositions[yAxisId].push({
            top: yPixel - VALUE_BOX_HEIGHT / 2,
            bottom: yPixel + VALUE_BOX_HEIGHT / 2,
          })
        }

        ctx.restore()
      }
    })

    const focusedBoxPositions: Record<string, { top: number; bottom: number }[]> = {}

    if (this.mousePosition) {
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
            let yPixel = chart.scales[yAxisId].getPixelForValue(value)
            const scale = chart.scales[yAxisId]

            if (!focusedBoxPositions[yAxisId]) {
              focusedBoxPositions[yAxisId] = []
            }

            const boxTop = yPixel - VALUE_BOX_HEIGHT / 2
            const boxBottom = yPixel + VALUE_BOX_HEIGHT / 2

            if (boxTop < chartArea.top) {
              yPixel = chartArea.top + VALUE_BOX_HEIGHT / 2
            } else if (boxBottom > chartArea.bottom) {
              yPixel = chartArea.bottom - VALUE_BOX_HEIGHT / 2
            }

            for (const prevBox of focusedBoxPositions[yAxisId]) {
              if (boxTop <= prevBox.bottom && boxBottom >= prevBox.top) {
                yPixel = prevBox.bottom + VALUE_BOX_HEIGHT / 2 + 2
                if (yPixel + VALUE_BOX_HEIGHT / 2 > chartArea.bottom) {
                  yPixel = chartArea.bottom - VALUE_BOX_HEIGHT / 2
                }
                break
              }
            }

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
              ctx.fillText(dateText, scale.right - VALUE_BOX_WIDTH + (VALUE_BOX_WIDTH - textMetrics.width) / 2 - VALUE_MARGIN, yPixel + 4)
            } else {
              ctx.fillText(dateText, scale.left + VALUE_MARGIN + (VALUE_BOX_WIDTH - textMetrics.width) / 2, yPixel + 4)
            }

            focusedBoxPositions[yAxisId].push({
              top: yPixel - VALUE_BOX_HEIGHT / 2,
              bottom: yPixel + VALUE_BOX_HEIGHT / 2,
            })
          }
        })

        // Draw background box
        if (this.focusedPoints.length > 0) {
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
        }

        ctx.restore()
      }
    }
  },
}

export default priceIndicatorPlugin
