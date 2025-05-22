import { ChartType, Plugin, Chart, Point, FinancialDataPoint } from 'chart.js/auto'
import dayjs from 'dayjs'
// EmptyObject type matches what Chart.js actually passes
type EmptyObject = Record<string, never>

interface CrosshairLinePlugin extends Plugin {
  id: string
  mousePosition: { x: number; y: number } | null
  tooltipContent: Record<string, { label?: string; value?: number; color?: string; date: string }>
  afterDraw(chart: Chart<ChartType>, args: EmptyObject, options: unknown): void
}

const crosshairLinePlugin: CrosshairLinePlugin = {
  id: 'crosshairLinePlugin',
  mousePosition: null,
  tooltipContent: {},
  afterInit(
    chart,
    _arg,
    options: {
      onPointerMove: (context: { chart: Chart; tooltip: { x: number; y: number; content: Record<string, number | null> } | null }) => void
    },
  ) {
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

        const mainDataPoint = sameIndexPoints[0]
        const comparisonDataPoints = sameIndexPoints.slice(1)

        plugin.tooltipContent = {}

        if (comparisonDataPoints.length) {
          comparisonDataPoints.forEach((point) => {
            const ds = chart.data.datasets[point.datasetIndex]

            if (ds?.label && !['Upper BB', 'Middle BB', 'Lower BB'].includes(ds.label)) {
              const key = `${ds.label}_${point.datasetIndex}`
              plugin.tooltipContent[key] = {
                label: ds.label,
                color: ds.borderColor as string,
                value: (ds?.data[point.index || 0] as Point).y || (ds?.data[point.index || 0] as FinancialDataPoint).c,
                date: dayjs((ds?.data[point.index || 0] as Point).x).format('YYYY-MM-DD'),
              }
            }
          })
        }

        if (mainDataPoint) {
          plugin.tooltipContent.mainData = {
            label: chart.data.datasets[mainDataPoint.datasetIndex].label,
            color: chart.data.datasets[mainDataPoint.datasetIndex].borderColor as string,
            value:
              (chart.data.datasets[mainDataPoint.datasetIndex]?.data[mainDataPoint.index || 0] as Point).y ||
              (chart.data.datasets[mainDataPoint.datasetIndex]?.data[mainDataPoint.index || 0] as FinancialDataPoint).c,
            date: dayjs((chart.data.datasets[mainDataPoint.datasetIndex]?.data[mainDataPoint.index || 0] as Point).x).format('YYYY-MM-DD'),
          }
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
        plugin.tooltipContent = {}
        options.onPointerMove({
          chart,
          tooltip: null,
        })
        if (chart.ctx) {
          chart.draw()
        }
      } catch (err) {
        console.error(err)
      }
    })
  },
  afterDraw(
    chart: Chart,
    _arg,
    options: {
      onPointerMove: (context: {
        chart: Chart
        tooltip: { x: number; y: number; content: Record<string, { label?: string; value?: number; color?: string; date: string }> } | null
      }) => void
    },
  ) {
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
        ctx.strokeStyle = '#2E3F5E'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 3])
        // Vertical line
        ctx.beginPath()
        ctx.moveTo(this.mousePosition.x, chart.chartArea.top)
        ctx.lineTo(this.mousePosition.x, chart.chartArea.bottom)
        ctx.stroke()
        // Horizontal line
        ctx.beginPath()
        ctx.moveTo(chart.chartArea.left, this.mousePosition.y)
        ctx.lineTo(chart.chartArea.right, this.mousePosition.y)
        ctx.stroke()

        // Draw outer shadow circle (similar to the opacity 0.15 circle in SVG)
        ctx.beginPath()
        ctx.arc(this.mousePosition.x, this.mousePosition.y, 6.2, 0, Math.PI * 2)
        ctx.fillStyle = '#2E3F5E' // #2E3F5E with opacity
        ctx.fill()

        // Draw inner circle with white fill and dark border
        ctx.beginPath()
        ctx.arc(this.mousePosition.x, this.mousePosition.y, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = 'white'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = '#2E3F5E'
        ctx.stroke()

        ctx.setLineDash([])
        ctx.restore()

        options.onPointerMove({
          chart,
          tooltip: {
            x: this.mousePosition.x,
            y: this.mousePosition.y,
            content: this.tooltipContent,
          },
        })
      } else {
        options.onPointerMove({
          chart,
          tooltip: null,
        })
      }
    }
  },
}

export default crosshairLinePlugin
