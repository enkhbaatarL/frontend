import { Box } from '@mui/material'
import { ChartType, Plugin, Chart, Point, FinancialDataPoint } from 'chart.js/auto'
import { ReactNode } from 'react'

import { getFormattedDateFromChart } from '@/lib/chart/utils/chartUtils'

declare module 'chart.js' {
  interface ChartDatasetProperties<TType extends ChartType, TData> {
    metadata?: {
      chipColor?: string
      isMain?: boolean
    }
  }
}

type EmptyObject = Record<string, never>

interface CrosshairLinePlugin extends Plugin {
  id: string
  mousePosition: { x: number; y: number } | null
  tooltipContent: Record<string, { label?: ReactNode; value?: number; color?: string; date: string }>
  afterDraw(chart: Chart<ChartType>, args: EmptyObject, options: unknown): void
}

const LegendIcon = () => (
  <svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 11.5L20 11.5" stroke="#40597A" strokeWidth="2" strokeLinecap="round" />
    <circle cx="11" cy="11.5" r="3.25" fill="white" stroke="#40597A" strokeWidth="1.5" />
  </svg>
)

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
    chart.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      try {
        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        this.mousePosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }

        const xScale = chart.scales.x
        const xScaleIndex = xScale.getValueForPixel(this.mousePosition.x)

        if (xScaleIndex === undefined) return

        this.tooltipContent = {}
        const formattedDate = getFormattedDateFromChart(chart, xScaleIndex)

        chart.data.datasets.forEach((dataset, index) => {
          const point = dataset.data.find((p) => {
            if (typeof p !== 'object' || p === null) return false
            return 'x' in p && p.x === xScaleIndex
          }) as Point | FinancialDataPoint | undefined

          let value: number | undefined

          if (point) {
            if ('y' in point && point.y !== null) {
              value = point.y
            } else if ('c' in point && point.c !== null) {
              value = point.c
            }
          }

          this.tooltipContent[index] = {
            label: (
              <Box display="flex" alignItems="center" height="20px" gap="2px">
                <LegendIcon />
                <Box mt="1px">{dataset.label}</Box>
              </Box>
            ),
            color: dataset.metadata?.chipColor as string,
            value,
            date: formattedDate,
          }
        })

        if (chart.ctx) {
          chart.draw()
        }
      } catch (err) {
        console.error(err)
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      try {
        this.mousePosition = null
        this.tooltipContent = {}
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
        tooltip: {
          x: number
          y: number
          content: Record<string, { label?: ReactNode; value?: number; color?: string; date: string }>
        } | null
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
