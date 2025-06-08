import { Box } from '@mui/material'
import { ChartType, Plugin, Chart, Point, FinancialDataPoint } from 'chart.js/auto'
import { ReactNode } from 'react'

import { getFormattedDateFromChart } from '@/lib/chart/utils/chartUtils'

declare module 'chart.js' {
  interface ChartDatasetProperties<TType extends ChartType, TData> {
    metadata?: {
      chipColor?: string
      isMain?: boolean
      hasDivider?: boolean
    }
  }
}

type EmptyObject = Record<string, never>

interface CrosshairLinePlugin extends Plugin {
  id: string
  mousePosition: { x: number; y: number } | null
  tooltipContent: Record<string, { label?: ReactNode; value?: number; color?: string; date: string; hasDivider?: boolean }>
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
    let isModifierKeyPressed = false
    let lastMousePosition: { x: number; y: number } | null = null

    const updateCrosshairPosition = (mouseX: number, mouseY: number, xScaleIndex: number) => {
      // Ctrl(or Cmd)키
      // O: 가장 가까운 데이터 포인트에 크로스라인 표시
      // X: 마우스 위치에 크로스라인 표시

      // TODO: 확정 문의 필요
      if (!isModifierKeyPressed) {
        this.mousePosition = {
          x: mouseX,
          y: mouseY,
        }
      } else {
        const mainDataset = chart.data.datasets[0]
        if (!mainDataset) return

        const nearestPoint = mainDataset.data.find((p) => {
          if (typeof p !== 'object' || p === null) return false
          return 'x' in p && p.x === xScaleIndex
        }) as Point | FinancialDataPoint | undefined

        if (!nearestPoint) return

        let yValue: number | undefined
        if ('y' in nearestPoint && nearestPoint.y !== null) {
          yValue = nearestPoint.y
        } else if ('c' in nearestPoint && nearestPoint.c !== null) {
          yValue = nearestPoint.c
        }

        if (yValue === undefined) return

        const yScale = chart.scales.y
        const yPixel = yScale.getPixelForValue(yValue)

        this.mousePosition = {
          x: chart.scales.x.getPixelForValue(xScaleIndex),
          y: yPixel,
        }
      }

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
          hasDivider: dataset.metadata?.hasDivider,
        }
      })

      if (chart.ctx) {
        chart.draw()
      }
    }

    chart.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      try {
        const rect = chart.canvas?.getBoundingClientRect()
        if (!rect) return

        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        lastMousePosition = { x: mouseX, y: mouseY }

        const xScale = chart.scales.x
        const xScaleIndex = xScale.getValueForPixel(mouseX)

        if (xScaleIndex === undefined) return

        updateCrosshairPosition(mouseX, mouseY, xScaleIndex)
      } catch (err) {
        console.error(err)
      }
    })

    const handleKeyEvent = (event: KeyboardEvent) => {
      if (event.key === 'Control' || event.key === 'Meta') {
        isModifierKeyPressed = event.type === 'keydown'

        if (lastMousePosition) {
          const xScale = chart.scales.x
          const xScaleIndex = xScale.getValueForPixel(lastMousePosition.x)

          if (xScaleIndex === undefined) return

          updateCrosshairPosition(lastMousePosition.x, lastMousePosition.y, xScaleIndex)
        }
      }
    }

    window.addEventListener('keydown', handleKeyEvent)
    window.addEventListener('keyup', handleKeyEvent)

    chart.canvas.addEventListener('mouseout', () => {
      try {
        this.mousePosition = null
        this.tooltipContent = {}
        lastMousePosition = null
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
