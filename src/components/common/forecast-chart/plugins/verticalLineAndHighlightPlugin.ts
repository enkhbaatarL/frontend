/* eslint-disable @typescript-eslint/no-explicit-any */
import Chart, { ChartType, InteractionItem, Plugin } from 'chart.js/auto'
import dayjs from 'dayjs'

import { DATA_CATEGORIES, HOVER_INDICATOR, LINE_STYLES } from '../constants'

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
  tooltipContent: { label?: string; value?: number; category?: string; color?: string; fullSize: boolean }[]
  interactionState: PointInteractionState
  nearestPoint: InteractionItem | null
  clearSelectedPoint: () => void
  tooltip?: any
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

  afterInit(
    chart,
    _args,
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
      if (plugin.seletedPoint) return
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
        } else {
          plugin.interactionState = PointInteractionState.NONE
        }

        // Trigger chart update to redraw with new state
        chart.update()
      } catch (error) {
        console.error('Error in mousemove event:', error)
        plugin.mousePosition = null
        plugin.tooltipContent = []
        plugin.interactionState = PointInteractionState.NONE
        plugin.nearestPoint = null
      }
    })

    chart.canvas.addEventListener('mouseout', () => {
      plugin.interactionState = PointInteractionState.NONE
      if (plugin.seletedPoint) return
      try {
        plugin.mousePosition = null
        plugin.tooltipContent = []
        plugin.nearestPoint = null
        if (plugin.tooltip && typeof plugin.tooltip === 'object' && 'fullSize' in plugin.tooltip) {
          plugin.tooltip.fullSize = false
        }
        options.onPointerMove?.({
          plugin,
          chart,
          tooltip: null,
        })

        if (chart?.canvas && chart.canvas.ownerDocument) {
          chart.update()
        }
      } catch (error) {
        console.error('Error in mouseout event:', error)
      }
    })

    chart.canvas.addEventListener('click', (event) => {
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
          plugin.seletedPoint = forecastPoint
          plugin.interactionState = PointInteractionState.CLICKED
          options.onViewForecastPoint?.(forecastPoint.datasetIndex)

          const activePoint = (chart.tooltip as any)._active[0]
          const currentIndex = activePoint.index
          const months = chart.data.labels || []

          options.onPointerMove?.({
            plugin,
            chart,
            tooltip: {
              x,
              y,
              label: dayjs(months[currentIndex] as string, 'YY-MM').format('MMMM YYYY'),
              viewDetail: true,
              content: [
                {
                  label: chart.data.datasets[plugin.seletedPoint.datasetIndex].label,
                  value: chart.data.datasets[plugin.seletedPoint.datasetIndex].data[plugin.seletedPoint.index] as number,
                  category: DATA_CATEGORIES.FORECAST,
                  color: chart.data.datasets[plugin.seletedPoint.datasetIndex].borderColor as string,
                },
              ],
            },
          })
        }
      } catch (error) {
        console.error('Error in click event:', error)
      }
    })

    // chart.canvas.addEventListener('mouseup', function () {
    //   plugin.seletedPoint = null
    //   options.onViewForecastPoint?.(null)
    // })
  },

  afterDraw(
    chart,
    _args,
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
    const actualDataset = chart.data.datasets.find((item) => (item as any).category === DATA_CATEGORIES.ACTUAL)

    const hoverImages: Record<string, HTMLImageElement> = {}

    if (options?.hoverImages) {
      Object.entries(options?.hoverImages).forEach(([key, image]) => {
        hoverImages[key] = image
      })
    }

    // Draw if selected point is selected from previous click
    if (this.seletedPoint && chart.data.datasets?.[this.seletedPoint.datasetIndex]?.label) {
      const activeImage = hoverImages[`${chart.data.datasets[this.seletedPoint.datasetIndex].label} Active`]

      if (activeImage) {
        ctx.drawImage(
          activeImage,
          this.seletedPoint.element.x - HOVER_INDICATOR.SIZE / 2,
          this.seletedPoint.element.y - HOVER_INDICATOR.SIZE / 2,
          HOVER_INDICATOR.SIZE,
          HOVER_INDICATOR.SIZE,
        )
      }
    }

    const topY = chart.scales.y.top
    const bottomY = chart.scales.y.bottom

    // Draw fixed vertical line at the latest actual data point
    if (chart.getDatasetMeta(0).data[verticalLineIndex] && showVerticalLine) {
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
      const activePoints = (chart.tooltip as any)._active

      const { x } = activePoint.element
      const currentIndex = activePoint.index

      // Draw hover vertical line

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, topY)
      ctx.lineTo(x, bottomY)
      ctx.lineWidth = LINE_STYLES.HOVER_LINE.LINE_WIDTH
      ctx.strokeStyle = LINE_STYLES.HOVER_LINE.STROKE_STYLE
      ctx.stroke()
      ctx.restore()

      // Only highlight if we're within the main data range (excluding padding)
      // and not at the first month
      if (currentIndex >= HOVER_INDICATOR.MIN_INDEX && !this.seletedPoint) {
        // Reset tooltip content
        this.tooltipContent = []

        // Get the previous month's x position
        const index = chart.data.datasets.findIndex((dataset) => dataset.data.length > 0)
        const prevX = chart.getDatasetMeta(index).data[currentIndex - 1].x

        if (showForecastTrend && currentIndex > 1) {
          // Create gradient for background highlight
          const gradient = ctx.createLinearGradient(0, topY, 0, bottomY)

          gradient.addColorStop(0, 'rgba(5, 91, 229, 0)') // Less opacity at top
          gradient.addColorStop(1, 'rgba(5, 91, 229, 0.15)') // More opacity at bottom

          // Draw background highlight with gradient
          ctx.save()
          ctx.fillStyle = gradient
          ctx.fillRect(prevX, topY, x - prevX, bottomY - topY)
          ctx.restore()
        }

        let renderNerestPoint = () => {}

        const isNearestPoint = (point: { x: number; y: number }) => {
          if (!point) return false
          if (!this.mousePosition) return false
          if (!point.x) return false
          if (!point.y) return false

          const distance = Math.sqrt(Math.pow(point.x - this.mousePosition?.x, 2) + Math.pow(point.y - this.mousePosition.y, 2))

          return distance < HOVER_INDICATOR.SIZE / 2
        }

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const datasetMeta = chart.getDatasetMeta(datasetIndex)

          if (!datasetMeta.hidden && datasetMeta.data[currentIndex] && dataset.data[currentIndex] !== null) {
            const point = datasetMeta.data[currentIndex]
            const size = HOVER_INDICATOR.SIZE
            const xPos = point.x - size / 2
            const yPos = point.y - size / 2
            const img = hoverImages[`${dataset.label}`]

            const mouseIsNear = isNearestPoint(point)

            // For forecast points, handle different interaction states
            if (
              (dataset as any).category === DATA_CATEGORIES.FORECAST &&
              dataset.data[currentIndex - 1] !== null &&
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
              // Add to tooltip content regardless
              this.tooltipContent.push({
                label: dataset?.label,
                value: dataset?.data[currentIndex] as number,
                category: DATA_CATEGORIES.FORECAST,
                color: actualDataset?.borderColor as string,
                fullSize: false,
              })
            }
            if (
              (dataset as any).category === DATA_CATEGORIES.ACTUAL &&
              !(dataset as any).hidden &&
              img &&
              !this.seletedPoint &&
              this.interactionState !== PointInteractionState.HOVER_NEAR
            ) {
              ctx.drawImage(img, xPos, yPos, size, size)
              this.tooltipContent.push({
                label: dataset?.label,
                value: dataset?.data[currentIndex] as number,
                category: DATA_CATEGORIES.ACTUAL,
                color: dataset?.borderColor as string,
                fullSize: false,
              })
            }

            if (
              (dataset as any).category === DATA_CATEGORIES.FUTURE &&
              !(dataset as any).hidden &&
              img &&
              !this.seletedPoint &&
              this.interactionState !== PointInteractionState.HOVER_NEAR
            ) {
              ctx.drawImage(img, xPos, yPos, size, size)
              this.tooltipContent.push({
                label: dataset?.label,
                value: dataset?.data[currentIndex] as number,
                category: DATA_CATEGORIES.FUTURE,
                color: dataset?.borderColor as string,
                fullSize: false,
              })
            }

            if (mouseIsNear) {
              renderNerestPoint = () => {
                if (
                  (dataset as any).category === DATA_CATEGORIES.FORECAST &&
                  dataset.data[currentIndex - 1] !== null &&
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

                if (
                  (dataset as any).category === DATA_CATEGORIES.ACTUAL &&
                  !(dataset as any).hidden &&
                  img &&
                  !this.seletedPoint &&
                  this.interactionState !== PointInteractionState.HOVER_NEAR
                ) {
                  ctx.drawImage(img, xPos, yPos, size, size)
                }

                if (
                  (dataset as any).category === DATA_CATEGORIES.FUTURE &&
                  !(dataset as any).hidden &&
                  img &&
                  !this.seletedPoint &&
                  this.interactionState !== PointInteractionState.HOVER_NEAR
                ) {
                  ctx.drawImage(img, xPos, yPos, size, size)
                }
              }
            }
          }
        })

        renderNerestPoint()
      }

      if (this.mousePosition && !this.seletedPoint) {
        const chartArea = chart.chartArea
        const mouseIsNear = activePoints.some((point: InteractionItem) => {
          if (!point.element) return false
          if (!this.mousePosition) return false
          if (!point.element.x) return false
          if (!point.element.y) return false

          const distance = Math.sqrt(
            Math.pow(point.element.x - this.mousePosition?.x, 2) + Math.pow(point.element.y - this.mousePosition.y, 2),
          )

          return distance < HOVER_INDICATOR.SIZE / 2
        })
        const isMouseInChart =
          this.mousePosition.x >= chartArea.left &&
          this.mousePosition.x <= chartArea.right &&
          this.mousePosition.y >= chartArea.top &&
          this.mousePosition.y <= chartArea.bottom

        if (isMouseInChart && mouseIsNear) {
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
    }
  },
}

export default verticalLineAndHighlightPlugin
