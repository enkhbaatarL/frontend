/* eslint-disable @typescript-eslint/no-explicit-any */
import Chart, { ChartType, Plugin } from 'chart.js/auto'
import dayjs from 'dayjs'

interface verticalLinePlugin extends Plugin<ChartType> {
  mousePosition: { x: number; y: number } | null
  tooltipContent: { label?: string; value?: number; category?: string; color?: string }[]
}

export interface PointerMoveEventContext {
  chart: Chart
  tooltip: { x: number; y: number; label: string; content: { label?: string; value?: number; category?: string; color?: string }[] } | null
}

// Create a custom plugin to draw the vertical line and background highlight
const verticalLinePlugin: verticalLinePlugin = {
  id: 'verticalLine',
  mousePosition: null,
  tooltipContent: [],

  afterInit(chart, _args, options) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const plugin = this

    if (!plugin) return

    chart.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      try {
        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        plugin.mousePosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }
      } catch (err) {
        plugin.mousePosition = null
        plugin.tooltipContent = []
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      try {
        plugin.mousePosition = null
        plugin.tooltipContent = []
        options.onPointerMove?.({
          chart,
          tooltip: null,
        })
      } catch (err) {
        console.log(err)
      }
    })
  },

  afterDraw(
    chart,
    _args,
    options: {
      verticalLinedIndex: number
      months: string[]
      maxIndex: number
      onPointerMove?: (context: PointerMoveEventContext) => void
      hoverImages: Record<string, HTMLImageElement>
    },
  ) {
    const { ctx } = chart

    const verticalLineIndex = options.verticalLinedIndex

    const months = chart.data.labels || []

    const hoverImages = options.hoverImages

    const topY = chart.scales.y.top
    const bottomY = chart.scales.y.bottom

    // Draw fixed vertical line at the latest actual data point
    if (chart.getDatasetMeta(0).data[verticalLineIndex]) {
      const x = chart.getDatasetMeta(0).data[verticalLineIndex].x

      ctx.save()

      if (hoverImages['marker']) {
        ctx.drawImage(hoverImages['marker'], x - 6, topY - 13, 13, 8)
      }

      ctx.beginPath()
      ctx.moveTo(x, topY)
      ctx.lineTo(x, bottomY)
      ctx.lineWidth = 1
      ctx.strokeStyle = '#868E96'
      ctx.stroke()

      ctx.restore()
    }

    // Draw hover vertical line and highlight
    if ((chart.tooltip as any)?._active?.length) {
      const activePoint = (chart.tooltip as any)._active[0]
      const { x } = activePoint.element
      const currentIndex = activePoint.index

      this.tooltipContent = []

      if (currentIndex >= 1 && currentIndex <= months.length && chart.data.datasets[0] !== null && chart.data.datasets[0] !== undefined) {
        const datasetMeta = chart.getDatasetMeta(0)

        if (!datasetMeta.hidden && datasetMeta.data[currentIndex] && chart.data.datasets[0].data[currentIndex] !== null) {
          const point = datasetMeta.data[currentIndex]
          const size = 21
          const xPos = point.x - size / 2
          const yPos = point.y - size / 2

          // Use the cached image for this color
          const img = hoverImages['value']

          ctx.drawImage(img, xPos, yPos, size, size)
        }
      }

      this.tooltipContent.push({
        label: 'Forecast',
        value: chart.data.datasets[0].data[currentIndex] as number,
        color: chart.data.datasets[0].borderColor as string,
      })

      if (this.mousePosition) {
        const chartArea = chart.chartArea

        if (
          this.mousePosition.x >= chartArea.left &&
          this.mousePosition.x <= chartArea.right &&
          this.mousePosition.y >= chartArea.top &&
          this.mousePosition.y <= chartArea.bottom
        ) {
          let label: string = ''

          if (months[currentIndex]) {
            label = dayjs(months[currentIndex] as string, 'YY-MM').format('MMMM YYYY')
          }

          options.onPointerMove?.({
            chart,
            tooltip: {
              x: this.mousePosition.x,
              y: this.mousePosition.y,
              label,
              content: this.tooltipContent,
            },
          })
        } else {
          options.onPointerMove?.({
            chart,

            tooltip: null,
          })
        }
      }

      // Draw hover vertical line
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, topY)
      ctx.lineTo(x, bottomY)
      ctx.lineWidth = 1
      ctx.strokeStyle = '#868E96'
      ctx.stroke()
      ctx.restore()
    }
  },
}

export default verticalLinePlugin
