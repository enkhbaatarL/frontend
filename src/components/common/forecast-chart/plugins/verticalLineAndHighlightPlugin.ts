/* eslint-disable @typescript-eslint/no-explicit-any */
import Chart, { ActiveElement, ChartType, InteractionItem, Plugin } from 'chart.js/auto'

import { DATA_CATEGORIES, HOVER_INDICATOR, LINE_STYLES } from '@/components/common/forecast-chart/constants'
import { createMakerSVG } from '@/components/common/forecast-chart/utils/loadImage'
import { formatDate } from '@/utils/date'

// Define interaction states
export enum PointInteractionState {
  NONE = 'none',
  HOVER = 'hover',
  HOVER_NEAR = 'hover_near',
  CLICKED = 'clicked',
}

interface IVerticalLineAndHighlightPlugin extends Plugin<ChartType> {
  mousePosition: { x: number; y: number } | null
  selectedPoint: InteractionItem | null
  tooltipContent: { label?: string; value?: number; category?: string; color?: string }[]
  interactionState: PointInteractionState
  clearSelectedPoint: () => void
  _options: any
  _chart: Chart | null
}

export interface PointerMoveEventContext {
  plugin: IVerticalLineAndHighlightPlugin
  chart: Chart
  tooltip: {
    x: number
    y: number
    viewDetail?: boolean
    label: string
    content: { label?: string; value?: number; category?: string; color?: string; goodsDataSourceNo?: number }[]
  } | null
}

// Class-based plugin implementation for isolated instances
class VerticalLineAndHighlightPlugin implements IVerticalLineAndHighlightPlugin {
  id = 'verticalLineAndHighlight'
  mousePosition: { x: number; y: number } | null = null
  selectedPoint: InteractionItem | null = null
  tooltipContent: { label?: string; value?: number; category?: string; color?: string }[] = []
  interactionState: PointInteractionState = PointInteractionState.NONE
  _options: any = {}
  _chart: Chart | null = null
  private readonly markerImage: HTMLImageElement

  constructor() {
    this.markerImage = new Image()
    this.markerImage.src = createMakerSVG('#868E96')
  }

  clearSelectedPoint() {
    this.selectedPoint = null
    this.interactionState = PointInteractionState.NONE
    this._options.onViewForecastPoint?.(null)
    this.mousePosition = null
    this.tooltipContent = []
    this._options.onPointerMove?.({
      plugin: this,
      chart: this._chart,
      tooltip: null,
    })

    if (this._chart?.canvas?.style) {
      // Reset cursor when clearing selected point
      this._chart.canvas.style.cursor = 'default'
      this._chart.update()
    }
  }

  afterInit(
    chart: Chart,
    _args: unknown,
    options: {
      enable: boolean
      verticalLinedIndex: number
      months: string[]
      maxIndex: number
      onPointerMove?: (context: PointerMoveEventContext) => void
      onViewForecastPoint?: (index: number | null) => void
      hoverImages: Record<string, HTMLImageElement>
      showForecastTrend: boolean
      showVerticalLine?: boolean
    },
  ) {
    this._options = options
    this._chart = chart
    const enable = options?.enable ?? true

    if (!enable) return
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const plugin = this

    if (!plugin) return

    chart.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      try {
        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        plugin.mousePosition = { x, y }

        // Find the nearest forecast point
        const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false }, true)
        const hoverDistance = 10 // Distance in pixels to consider "near" a point

        // Find forecast points from the first dataset
        const forecastPoint = points.find(
          (item) =>
            (chart.data.datasets[item.datasetIndex] as any).category === DATA_CATEGORIES.FORECAST &&
            Math.abs(item.element.x - x) < hoverDistance &&
            Math.abs(item.element.y - y) < hoverDistance,
        )

        if (forecastPoint) {
          const distance = Math.sqrt(Math.pow(forecastPoint.element.x - x, 2) + Math.pow(forecastPoint.element.y - y, 2))

          // Update interaction state based on distance to point
          if (distance > 10) {
            plugin.interactionState = PointInteractionState.HOVER
          } else {
            plugin.interactionState = PointInteractionState.HOVER_NEAR
          }

          // Set cursor to pointer for clickable forecast points
          if (chart.canvas?.style && !plugin.selectedPoint) {
            chart.canvas.style.cursor = 'pointer'
          }
        } else {
          plugin.interactionState = PointInteractionState.NONE
          // Reset cursor to default when not over clickable forecast points
          if (chart.canvas?.style) {
            chart.canvas.style.cursor = 'default'
          }
        }

        // Trigger chart update to redraw with new state
        chart.update()
      } catch (error) {
        console.error('Error in mousemove event:', error)
        plugin.mousePosition = null
        plugin.tooltipContent = []
        plugin.interactionState = PointInteractionState.NONE
        // Reset cursor on error
        if (chart.canvas?.style) {
          chart.canvas.style.cursor = 'default'
        }
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      plugin.interactionState = PointInteractionState.NONE
      if (plugin.selectedPoint) return

      try {
        plugin.mousePosition = null
        plugin.tooltipContent = []
        // Reset cursor when mouse leaves chart
        if (chart.canvas?.style) {
          chart.canvas.style.cursor = 'default'
        }
        options.onPointerMove?.({
          plugin,
          chart,
          tooltip: null,
        })

        // Trigger chart update to redraw with new state
        chart.update()
      } catch (error) {
        console.error('Error in mouseout event:', error)
        // Reset cursor on error
        if (chart.canvas?.style) {
          chart.canvas.style.cursor = 'default'
        }
      }
    })

    chart.canvas.addEventListener('click', (event: any) => {
      // 이미 선택된 포인트가 있다면 클릭 이벤트를 무시
      if (this.selectedPoint) {
        return
      }

      try {
        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false }, true)
        const distance = 10

        // Find forecast points from the first dataset
        const forecastPoint = points.find(
          (item) =>
            (chart.data.datasets[item.datasetIndex] as any).category === DATA_CATEGORIES.FORECAST &&
            Math.abs(item.element.x - x) < distance &&
            Math.abs(item.element.y - y) < distance,
        )

        if (forecastPoint) {
          this.selectedPoint = forecastPoint
          this.interactionState = PointInteractionState.CLICKED
          options.onViewForecastPoint?.(forecastPoint.datasetIndex)

          const activePoint = (chart.tooltip as any)?._active?.[0]

          if (!activePoint) return

          const currentIndex = activePoint.index
          const months = chart.data.labels || []

          options.onPointerMove?.({
            plugin: this,
            chart,
            tooltip: {
              x,
              y,
              label: formatDate(months[currentIndex], 'MMMM YYYY'),
              viewDetail: true,
              content: [
                {
                  label: chart.data.datasets[this.selectedPoint.datasetIndex].label,
                  value: chart.data.datasets[this.selectedPoint.datasetIndex].data[this.selectedPoint.index] as number,
                  category: DATA_CATEGORIES.FORECAST,
                  color: chart.data.datasets[this.selectedPoint.datasetIndex].borderColor as string,
                  goodsDataSourceNo: (chart.data.datasets[this.selectedPoint.datasetIndex] as any).metadata?.goodsDataSourceNo,
                },
              ],
            },
          })
        }
      } catch (error) {
        console.error('Error in click event:', error)
      }
    })
  }

  afterDraw(
    chart: Chart,
    _args: unknown,
    options: {
      enable: boolean
      verticalLinedIndex: number
      months: string[]
      maxIndex: number
      onPointerMove?: (context: PointerMoveEventContext) => void
      onViewForecastPoint?: (index: number | null) => void
      hoverImages: Record<string, HTMLImageElement>
      showForecastTrend: boolean
      showVerticalLine?: boolean
    },
  ) {
    const enable = options?.enable ?? true

    if (!enable) return

    const { ctx } = chart

    const verticalLineIndex = options.verticalLinedIndex
    const showForecastTrend = options.showForecastTrend
    const showVerticalLine = options.showVerticalLine ?? true

    const months = chart.data.labels || []

    const hoverImages: Record<string, HTMLImageElement> = {}

    if (options?.hoverImages) {
      Object.entries(options?.hoverImages).forEach(([key, image]) => {
        hoverImages[key] = image
      })
    }

    const topY = chart.scales.y.top
    const bottomY = chart.scales.y.bottom

    // Draw fixed vertical line at the latest actual data point
    if (chart.getDatasetMeta(0).data[verticalLineIndex] && showVerticalLine) {
      const x = chart.getDatasetMeta(0).data[verticalLineIndex].x

      ctx.save()

      if (this.markerImage) {
        ctx.drawImage(this.markerImage, x - 6, topY - 13, 13, 8)
      }

      ctx.beginPath()
      ctx.moveTo(x, topY)
      ctx.lineTo(x, bottomY)
      ctx.lineWidth = LINE_STYLES.VERTICAL_DIVIDER.LINE_WIDTH
      ctx.strokeStyle = LINE_STYLES.VERTICAL_DIVIDER.STROKE_STYLE
      ctx.stroke()

      ctx.restore()
    }

    // Draw if selected point is selected from previous click
    if (this.selectedPoint && chart.data.datasets?.[this.selectedPoint.datasetIndex]?.label) {
      const activeImage = hoverImages[`${chart.data.datasets[this.selectedPoint.datasetIndex].label} Active`]

      if (activeImage) {
        ctx.drawImage(
          activeImage,
          this.selectedPoint.element.x - HOVER_INDICATOR.SIZE / 2,
          this.selectedPoint.element.y - HOVER_INDICATOR.SIZE / 2,
          HOVER_INDICATOR.SIZE,
          HOVER_INDICATOR.SIZE,
        )
      }
    }

    // Draw hover vertical line and highlight
    if ((chart.tooltip as any)?._active?.length) {
      const activePoint = (chart.tooltip as any)._active[0]
      const activePoints = (chart.tooltip as any)._active

      const { x } = activePoint.element
      const currentIndex = activePoint.index

      const isNearestPoint = (point: { x: number; y: number }) => {
        if (!point) return false
        if (!this.mousePosition) return false
        if (!point.x) return false
        if (!point.y) return false

        return Math.abs(point.x - this.mousePosition.x) < 10 && Math.abs(point.y - this.mousePosition.y) < 10
      }

      if (this.mousePosition && !this.selectedPoint) {
        const chartArea = chart.chartArea
        const isMouseInChart =
          this.mousePosition.x >= chartArea.left &&
          this.mousePosition.x <= chartArea.right &&
          this.mousePosition.y >= chartArea.top &&
          this.mousePosition.y <= chartArea.bottom

        if (isMouseInChart) {
          // Find the nearest point
          const nearestPoint = activePoints.reduce((prev: ActiveElement, curr: ActiveElement) => {
            if (!prev.element.x || !prev.element.y || !curr.element.x || !curr.element.y || !this.mousePosition) return prev

            const prevDistance = Math.abs(prev.element.x - this.mousePosition.x)
            const currDistance = Math.abs(curr.element.x - this.mousePosition.x)

            return currDistance < prevDistance ? curr : prev
          })

          // Draw hover vertical line at the nearest point
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(nearestPoint.element.x, topY)
          ctx.lineTo(nearestPoint.element.x, bottomY)
          ctx.lineWidth = LINE_STYLES.HOVER_LINE.LINE_WIDTH
          ctx.strokeStyle = LINE_STYLES.HOVER_LINE.STROKE_STYLE
          ctx.stroke()
          ctx.restore()

          // Only highlight if we're within the main data range (excluding padding)
          // and not at the first month
          if (nearestPoint.index >= HOVER_INDICATOR.MIN_INDEX && !this.selectedPoint) {
            // Reset tooltip content
            this.tooltipContent = []

            // Get the previous month's x position
            const index = chart.data.datasets.findIndex((dataset: any) => dataset.data.length > 0)
            const prevX = chart.getDatasetMeta(index).data[currentIndex - 1].x

            // Find forecast for this month
            let forecastValue = 0

            const mainDataset = chart.data.datasets.find((dataset) => (dataset as any).category === DATA_CATEGORIES.ACTUAL)
            const forecastDatasets = chart.data.datasets.filter(
              (dataset) => (dataset as any).category === DATA_CATEGORIES.FORECAST && dataset.label === `${mainDataset?.label} Forecast`,
            )

            // Look for a forecast that ends at our current month
            if (forecastDatasets && forecastDatasets.length > 1) {
              for (let i = 1; i < months.length - 2; i++) {
                if (i + 1 === currentIndex) {
                  // This is a forecast that ends at our current month
                  const forecastDataset = forecastDatasets[i - 1] // Adjust index for the padding

                  if (forecastDataset && forecastDataset.data[currentIndex] !== null) {
                    forecastValue = forecastDataset.data[currentIndex] as number
                    break
                  }
                }
              }
            } else {
              forecastValue = forecastDatasets[0]?.data[currentIndex] as number
            }

            const prevData = (mainDataset?.data[currentIndex - 1] as number) ?? 0
            const currentData = (mainDataset?.data[currentIndex] as number) ?? 0

            if (mainDataset?.data && showForecastTrend && currentIndex > 1 && prevData && currentData) {
              // Determine if forecast is greater than actual

              const isForecastRight = (forecastValue - prevData) * (currentData - prevData) > 0

              // isForecastGreater = forecastValue !== null && forecastValue > actualDataset?.data?.[currentIndex]
              // Create gradient for background highlight
              const gradient = ctx.createLinearGradient(0, topY, 0, bottomY)

              if (isForecastRight) {
                // Green gradient for forecast > actual
                gradient.addColorStop(0, 'rgba(5, 91, 229, 0)') // Less opacity at top
                gradient.addColorStop(1, 'rgba(5, 91, 229, 0.15)') // More opacity at bottom
              } else {
                // Red gradient for forecast < actual
                gradient.addColorStop(0, 'rgba(145, 145, 145, 0.00)') // Less opacity at top
                gradient.addColorStop(1, 'rgba(145, 145, 145, 0.15)') // More opacity at bottom
              }

              // Draw background highlight with gradient
              ctx.save()
              ctx.fillStyle = gradient
              ctx.fillRect(prevX, topY, x - prevX, bottomY - topY)
              ctx.restore()
            }

            const nearestPointIsForecast = (chart.data.datasets[nearestPoint?.datasetIndex] as any)?.category === DATA_CATEGORIES.FORECAST

            chart.data.datasets.forEach((dataset: any, datasetIndex: any, data: any) => {
              const datasetMeta = chart.getDatasetMeta(datasetIndex)

              if (!datasetMeta.hidden && datasetMeta.data[currentIndex] && dataset.data[currentIndex] !== null) {
                const point = datasetMeta.data[currentIndex]
                const size = HOVER_INDICATOR.SIZE
                const xPos = point.x - size / 2
                const yPos = point.y - size / 2
                const img = hoverImages[`${dataset.label}`]

                const mouseIsNear = isNearestPoint(point)

                // For forecast points, handle different interaction states
                if (dataset.category === DATA_CATEGORIES.FORECAST && dataset.data[currentIndex - 1] !== null && img && this.mousePosition) {
                  // Add to tooltip content regardless
                  if (!nearestPointIsForecast || (nearestPointIsForecast && nearestPoint.datasetIndex === datasetIndex))
                    this.tooltipContent.push({
                      label: dataset?.label,
                      value: dataset?.data[currentIndex] as number,
                      category: DATA_CATEGORIES.FORECAST,
                      color: data[datasetIndex - 1]?.borderColor as string,
                    })
                }
                if (
                  dataset.category === DATA_CATEGORIES.ACTUAL &&
                  !dataset.hidden &&
                  img &&
                  !this.selectedPoint &&
                  !nearestPointIsForecast
                ) {
                  // ctx.drawImage(img, xPos, yPos, size, size)
                  this.tooltipContent.push({
                    label: dataset?.label,
                    value: dataset?.data[currentIndex] as number,
                    category: DATA_CATEGORIES.ACTUAL,
                    color: dataset?.borderColor as string,
                  })
                }

                if (
                  dataset.category === DATA_CATEGORIES.FUTURE &&
                  !dataset.hidden &&
                  img &&
                  !this.selectedPoint &&
                  !nearestPointIsForecast
                ) {
                  // ctx.drawImage(img, xPos, yPos, size, size)
                  this.tooltipContent.push({
                    label: dataset?.label,
                    value: dataset?.data[currentIndex] as number,
                    category: DATA_CATEGORIES.FUTURE,
                    color: dataset?.borderColor as string,
                  })
                }

                if (
                  dataset.category === DATA_CATEGORIES.FORECAST &&
                  dataset.data[currentIndex - 1] !== null &&
                  nearestPoint?.datasetIndex !== datasetIndex &&
                  img &&
                  this.mousePosition
                ) {
                  if (this.interactionState === PointInteractionState.CLICKED && mouseIsNear) {
                    ctx.drawImage(hoverImages[`${dataset.label} Active`], xPos, yPos, size, size)
                  } else if (this.interactionState === PointInteractionState.HOVER_NEAR && mouseIsNear) {
                    // Draw a subtle highlight circle around the point
                    ctx.drawImage(hoverImages[`${dataset.label} Hover`], xPos, yPos, size, size)
                  } else {
                    ctx.drawImage(img, xPos, yPos, size, size)
                  }
                }
              }
            })

            if (nearestPointIsForecast && this.mousePosition) {
              const dataset = chart.data.datasets[nearestPoint.datasetIndex]
              const datasetMeta = chart.getDatasetMeta(nearestPoint.datasetIndex)
              const point = datasetMeta.data[nearestPoint.index]
              const size = HOVER_INDICATOR.SIZE
              const xPos = point.x - size / 2
              const yPos = point.y - size / 2
              const img = hoverImages[`${dataset.label}`]

              if (this.interactionState === PointInteractionState.CLICKED) {
                ctx.drawImage(hoverImages[`${dataset.label} Active`], xPos, yPos, size, size)
              } else if (this.interactionState === PointInteractionState.HOVER_NEAR) {
                // Draw a subtle highlight circle around the point
                ctx.drawImage(hoverImages[`${dataset.label} Hover`], xPos, yPos, size, size)
              } else {
                ctx.drawImage(img, xPos, yPos, size, size)
              }
            }
          }

          let label: string = ''

          if (months[currentIndex]) {
            label = formatDate(months[currentIndex], 'MMMM YYYY')
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
    }
  }
}

// Create a singleton instance for backward compatibility
const verticalLineAndHighlightPlugin = new VerticalLineAndHighlightPlugin()

// Export the singleton instance as default
export default verticalLineAndHighlightPlugin
