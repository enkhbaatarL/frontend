/* eslint-disable @typescript-eslint/no-explicit-any */
import Chart, { ChartType, InteractionItem, Plugin } from 'chart.js/auto'
import dayjs from 'dayjs'

import { DATA_CATEGORIES, GRADIENT_COLORS, HOVER_INDICATOR, LINE_STYLES } from '../constants'

// Define interaction states
export enum PointInteractionState {
  NONE = 'none',
  HOVER = 'hover',
  HOVER_NEAR = 'hover_near',
  CLICKED = 'clicked',
}

interface VerticalLineAndHighlightPlugin extends Plugin<ChartType> {
  mousePosition: { x: number; y: number } | null
  seletedPoint: InteractionItem | null
  tooltipContent: { label?: string; value?: number; category?: string; color?: string }[]
  interactionState: PointInteractionState
  nearestPoint: InteractionItem | null
  clearSelectedPoint: () => void
  _options: any
  _chart: Chart | null
}

export interface PointerMoveEventContext {
  plugin: VerticalLineAndHighlightPlugin
  chart: Chart
  tooltip: {
    x: number
    y: number
    viewDetail?: boolean
    label: string
    content: { label?: string; value?: number; category?: string; color?: string }[]
  } | null
}

// Create a custom plugin to draw the vertical line and background highlight
const verticalLineAndHighlightPlugin: VerticalLineAndHighlightPlugin = {
  id: 'verticalLineAndHighlight',
  mousePosition: null,
  seletedPoint: null,
  tooltipContent: [],
  interactionState: PointInteractionState.NONE,
  nearestPoint: null,
  _options: {},
  _chart: null,

  clearSelectedPoint() {
    this.seletedPoint = null
    this.interactionState = PointInteractionState.NONE
    this._options.onViewForecastPoint?.(null)
    this.mousePosition = null
    this.tooltipContent = []
    this._options.onPointerMove?.({
      plugin: this,
      chart: this._chart,
      tooltip: null,
    })

    if (this._chart) {
      this._chart.update()
    }
  },

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
      showForecastTrend: boolean
    },
  ) {
    const { ctx } = chart

    const verticalLineIndex = options.verticalLinedIndex
    const showForecastTrend = options.showForecastTrend

    const months = chart.data.labels || []
    const futureDatasets = chart.data.datasets.filter((item) => (item as any).category === DATA_CATEGORIES.FUTURE)
    const forecastDatasets = chart.data.datasets.filter((item) => (item as any).category === DATA_CATEGORIES.FORECAST)
    const actualDataset = chart.data.datasets.find((item) => (item as any).category === DATA_CATEGORIES.ACTUAL)

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
      ctx.lineWidth = LINE_STYLES.VERTICAL_DIVIDER.LINE_WIDTH
      ctx.strokeStyle = LINE_STYLES.VERTICAL_DIVIDER.STROKE_STYLE
      ctx.stroke()

      ctx.restore()
    }

    // Draw hover vertical line and highlight
    if ((chart.tooltip as any)?._active?.length) {
      const activePoint = (chart.tooltip as any)._active[0]
      const { x } = activePoint.element
      const currentIndex = activePoint.index

      // Only highlight if we're within the main data range (excluding padding)
      // and not at the first month
      if (currentIndex >= HOVER_INDICATOR.MIN_INDEX && currentIndex <= months.length - 1) {
        // Reset tooltip content
        this.tooltipContent = []

        // Get the previous month's x position
        const prevX = chart.getDatasetMeta(0).data[currentIndex - 1].x

        // Find forecast for this month
        let forecastValue = null

        // Look for a forecast that ends at our current month
        if (forecastDatasets.length > 1) {
          for (let i = 1; i < months.length - 2; i++) {
            if (i + 1 === currentIndex) {
              // This is a forecast that ends at our current month
              const forecastDataset = forecastDatasets[i - 1] // Adjust index for the padding

              if (forecastDataset && forecastDataset.data[currentIndex] !== null) {
                forecastValue = forecastDataset.data[currentIndex]
                break
              }
            }
          }
        } else {
          forecastValue = forecastDatasets[0].data[currentIndex]
        }

        if (
          currentIndex >= 1 &&
          currentIndex <= months.length &&
          actualDataset?.data[currentIndex] !== null &&
          actualDataset?.data[currentIndex] !== undefined
        ) {
          // Determine if forecast is greater than actual
          let isForecastGreater = false

          isForecastGreater = forecastValue !== null && forecastValue > actualDataset?.data?.[currentIndex]

          if (showForecastTrend && forecastValue !== null) {
            // Create gradient for background highlight
            const gradient = ctx.createLinearGradient(0, topY, 0, bottomY)

            if (isForecastGreater) {
              // Green gradient for forecast > actual
              gradient.addColorStop(0, GRADIENT_COLORS.POSITIVE.START_COLOR) // Less opacity at top
              gradient.addColorStop(1, GRADIENT_COLORS.POSITIVE.END_COLOR) // More opacity at bottom
            } else {
              // Red gradient for forecast < actual
              gradient.addColorStop(0, GRADIENT_COLORS.NEGATIVE.START_COLOR) // Less opacity at top
              gradient.addColorStop(1, GRADIENT_COLORS.NEGATIVE.END_COLOR) // More opacity at bottom
            }

            // Draw background highlight with gradient
            ctx.save()
            ctx.fillStyle = gradient
            ctx.fillRect(prevX, topY, x - prevX, bottomY - topY)
            ctx.restore()
          }

          chart.data.datasets.forEach((dataset, datasetIndex) => {
            const datasetMeta = chart.getDatasetMeta(datasetIndex)

            if (!datasetMeta.hidden && datasetMeta.data[currentIndex] && dataset.data[currentIndex] !== null) {
              const point = datasetMeta.data[currentIndex]
              const size = HOVER_INDICATOR.SIZE
              const xPos = point.x - size / 2
              const yPos = point.y - size / 2

              // Use the cached image for this color
              if ((dataset as any).category === DATA_CATEGORIES.FORECAST && dataset.data[currentIndex - 1] !== null) {
                if (showForecastTrend) {
                  ctx.drawImage(hoverImages[isForecastGreater ? 'forecastPositive' : 'forecastNegative'], xPos, yPos, size, size)
                } else {
                  ctx.drawImage(hoverImages['forecast'], xPos, yPos, size, size)
                }
              } else if ((dataset as any).category !== DATA_CATEGORIES.FORECAST && !(dataset as any).hidden) {
                const img = hoverImages[dataset.label ?? '']

                ctx.drawImage(img, xPos, yPos, size, size)
              }
            }
          })
        }

        if (actualDataset?.data[currentIndex] !== null) {
          this.tooltipContent.push({
            label: actualDataset?.label,
            value: actualDataset?.data[currentIndex] as number,
            category: DATA_CATEGORIES.ACTUAL,
            color: actualDataset?.borderColor as string,
          })
        }

        this.tooltipContent.push({
          label: 'Forecast',
          value: forecastValue as number,
          category: DATA_CATEGORIES.FORECAST,
          color: actualDataset?.borderColor as string,
        })

        if (typeof forecastValue === 'number' && typeof actualDataset?.data[currentIndex] === 'number') {
          this.tooltipContent.push({
            label: 'Forecast Error',
            value: forecastValue - actualDataset?.data[currentIndex],
            category: DATA_CATEGORIES.FORECAST_ERROR,
          })
        }

        futureDatasets.forEach((dataset) => {
          if (!(dataset as { hidden?: boolean }).hidden && dataset.data[currentIndex] !== null) {
            this.tooltipContent.push({
              label: dataset.label,
              value: dataset.data[currentIndex] as number,
              category: DATA_CATEGORIES.FUTURE,
              color: dataset.borderColor as string,
            })
          }
        })
      }

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
            plugin: this,
            chart,
            tooltip: {
              x: this.mousePosition.x,
              y: this.mousePosition.y,
              label,
              viewDetail: false,
              content: this.tooltipContent,
            },
          })
        } else {
          options.onPointerMove?.({
            plugin: this,
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
      ctx.lineWidth = LINE_STYLES.HOVER_LINE.LINE_WIDTH
      ctx.strokeStyle = LINE_STYLES.HOVER_LINE.STROKE_STYLE
      ctx.stroke()
      ctx.restore()
    }
  },
}

export default verticalLineAndHighlightPlugin
