/* eslint-disable @typescript-eslint/no-explicit-any */
import Chart, { ActiveElement, ChartType, InteractionItem, Plugin } from 'chart.js/auto'
import dayjs from 'dayjs'
import { debounce, DebouncedFunc } from 'lodash-es'

import { DATA_CATEGORIES, HOVER_INDICATOR, LINE_STYLES } from '@/components/common/forecast-chart/constants'
import { createMakerSVG } from '@/components/common/forecast-chart/utils/loadImage'
import { getWeekOfMonth } from '@/lib/chart/utils/chartUtils'
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
  tooltipContent: { index?: number; label?: string; value?: number; category?: string; color?: string; goodsDataSourceNo?: number }[]
  interactionState: PointInteractionState
  clearSelectedPoint: () => void
  updateTooltipPosition: (viewDetail: boolean) => void
  destroy: () => void
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
    content: { index?: number; label?: string; value?: number; category?: string; color?: string; goodsDataSourceNo?: number }[]
  } | null
}

const adjustTooltipPosition = (tooltipX: number, tooltipY: number, chart: Chart) => {
  const chartArea = chart.chartArea

  const tooltipElement = document.querySelector('.mi-forecast-chart-tooltip') as HTMLElement
  let tooltipWidth = 300
  let tooltipHeight = 120

  if (tooltipElement) {
    const rect = tooltipElement.getBoundingClientRect()
    tooltipWidth = rect.width
    tooltipHeight = rect.height
  }

  let adjustedX = tooltipX
  let adjustedY = tooltipY

  if (tooltipX + tooltipWidth + 20 > chartArea.right) {
    adjustedX = tooltipX - tooltipWidth - 40
  } else if (tooltipX < chartArea.left) {
    adjustedX = chartArea.left + 10
  }

  if (tooltipY + tooltipHeight > chartArea.bottom) {
    adjustedY = tooltipY - tooltipHeight
  } else if (tooltipY < chartArea.top) {
    adjustedY = chartArea.top + 10
  }

  return { x: adjustedX, y: adjustedY }
}

// Class-based plugin implementation for isolated instances
class VerticalLineAndHighlightPlugin implements IVerticalLineAndHighlightPlugin {
  id = 'verticalLineAndHighlight'
  mousePosition: { x: number; y: number } | null = null
  selectedPoint: InteractionItem | null = null
  tooltipContent: { index?: number; label?: string; value?: number; category?: string; color?: string; goodsDataSourceNo?: number }[] = []
  interactionState: PointInteractionState = PointInteractionState.NONE
  _options: any = {}
  _chart: Chart | null = null
  private readonly markerImage: HTMLImageElement
  private resizeObserver: ResizeObserver | null = null
  private debouncedRecalculateTooltipPosition: DebouncedFunc<() => void> | null = null

  constructor() {
    this.markerImage = new Image()
    this.markerImage.src = createMakerSVG('#868E96')
  }

  reset() {
    this.mousePosition = null
    this.selectedPoint = null
    this.tooltipContent = []
    this.interactionState = PointInteractionState.NONE
    this._options.onViewForecastPoint?.(null)
    this._options.onPointerMove?.({
      plugin: this,
      chart: this._chart,
      tooltip: null,
    })
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
      showForecastTrendBackground: boolean
      showVerticalLine?: boolean
      showActualTag?: boolean
      showSteadinessTrend?: boolean
    },
  ) {
    this._options = options
    this._chart = chart
    const enable = options?.enable ?? true

    if (!enable) return
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const plugin = this

    if (!plugin) return

    if (typeof ResizeObserver !== 'undefined') {
      this.debouncedRecalculateTooltipPosition = debounce(() => {
        this.recalculateTooltipPosition()
      }, 50)

      this.resizeObserver = new ResizeObserver(() => {
        this.debouncedRecalculateTooltipPosition?.()
      })

      const chartContainer = chart.canvas.parentElement
      if (chartContainer) {
        this.resizeObserver.observe(chartContainer)
      }

      window.addEventListener('resize', this.handleWindowResize)
    }

    chart.canvas.addEventListener('mousemove', (event: MouseEvent) => {
      try {
        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        plugin.mousePosition = { x, y }

        const chartArea = chart.chartArea
        const isMouseInChartArea = x >= chartArea.left && x <= chartArea.right && y >= chartArea.top && y <= chartArea.bottom

        if (plugin.selectedPoint && isMouseInChartArea) {
          if (chart.canvas?.style) {
            chart.canvas.style.cursor = 'pointer'
          }
        } else {
          // Find the nearest forecast point
          const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false }, true)
          const hoverDistance = 10 // Distance in pixels to consider "near" a point

          // Find forecast points and calculate their distances
          const forecastPoints = points.filter((item) => {
            const dataset = chart.data.datasets[item.datasetIndex] as any
            const isForecastDatasets = dataset.category === DATA_CATEGORIES.FORECAST

            if (dataset.data.filter((data: any) => data !== null).length === 2) {
              const nonNullIndices = dataset.data
                .map((data: any, index: number) => (data !== null ? index : -1))
                .filter((index: number) => index !== -1)

              if (item.index !== Math.max(...nonNullIndices)) {
                return false
              }
            }

            return isForecastDatasets && Math.abs(item.element.x - x) < hoverDistance && Math.abs(item.element.y - y) < hoverDistance
          })

          // Find the nearest forecast point by calculating Euclidean distance
          const forecastPoint = forecastPoints.reduce((nearest: InteractionItem | null, item: InteractionItem) => {
            if (!nearest) return item

            const nearestDistance = Math.sqrt(Math.pow(nearest.element.x - x, 2) + Math.pow(nearest.element.y - y, 2))
            const itemDistance = Math.sqrt(Math.pow(item.element.x - x, 2) + Math.pow(item.element.y - y, 2))

            return itemDistance < nearestDistance ? item : nearest
          }, null)

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
        }

        // Trigger chart update to redraw with new state
        // Chart will redraw automatically
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
        // Chart will redraw automatically
      } catch (error) {
        console.error('Error in mouseout event:', error)
        // Reset cursor on error
        if (chart.canvas?.style) {
          chart.canvas.style.cursor = 'default'
        }
      }
    })

    chart.canvas.addEventListener('click', (event: any) => {
      try {
        const rect = chart.canvas?.getBoundingClientRect()

        if (!rect) return

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        const chartArea = chart.chartArea
        const isClickInChartArea = x >= chartArea.left && x <= chartArea.right && y >= chartArea.top && y <= chartArea.bottom

        // 이미 선택된 포인트가 있고 차트 영역을 클릭했다면 초기화
        if (this.selectedPoint && isClickInChartArea) {
          this.reset()
          // Chart will redraw automatically
          return
        }

        const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false }, true)
        const distance = 10

        // Find forecast points and calculate their distances
        const forecastPoints = points.filter((item) => {
          const dataset = chart.data.datasets[item.datasetIndex] as any
          const isForecastDatasets = dataset.category === DATA_CATEGORIES.FORECAST

          if (dataset.data.filter((data: any) => data !== null).length === 2) {
            const nonNullIndices = dataset.data
              .map((data: any, index: number) => (data !== null ? index : -1))
              .filter((index: number) => index !== -1)

            if (item.index !== Math.max(...nonNullIndices)) {
              return false
            }
          }

          return isForecastDatasets && Math.abs(item.element.x - x) < distance && Math.abs(item.element.y - y) < distance
        })

        // Find the nearest forecast point by calculating Euclidean distance
        const forecastPoint = forecastPoints.reduce((nearest: InteractionItem | null, item: InteractionItem) => {
          if (!nearest) return item

          const nearestDistance = Math.sqrt(Math.pow(nearest.element.x - x, 2) + Math.pow(nearest.element.y - y, 2))
          const itemDistance = Math.sqrt(Math.pow(item.element.x - x, 2) + Math.pow(item.element.y - y, 2))

          return itemDistance < nearestDistance ? item : nearest
        }, null)

        if (forecastPoint) {
          this.selectedPoint = forecastPoint
          this.interactionState = PointInteractionState.CLICKED
          options.onViewForecastPoint?.(forecastPoint.datasetIndex)

          const activePoint = (chart.tooltip as any)?._active?.[0]

          if (!activePoint) return

          // 클릭된 포인트의 실제 데이터 인덱스 찾기
          // this.selectedPoint.index는 차트 인덱스 (null padding 포함)
          // months 배열은 패딩이 없는 원본 배열이므로 -1을 해야 함
          const chartIndex = this.selectedPoint.index
          const months = options.months || []
          const currentIndex = Math.max(0, Math.min(chartIndex - 1, months.length - 1)) // null padding 보정

          // 클릭된 월의 모든 데이터를 툴팁에 포함
          const clickTooltipContent: any[] = []

          // 실제 데이터는 클릭 툴팁에서 제외 (Forecast 값만 표시)
          // chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          //   if (dataset.category === DATA_CATEGORIES.ACTUAL && !dataset.hidden && dataset.data[this.selectedPoint.index] !== null) {
          //     clickTooltipContent.push({
          //       label: dataset.label,
          //       value: dataset.data[this.selectedPoint.index] as number,
          //       category: DATA_CATEGORIES.ACTUAL,
          //       color: dataset.borderColor as string,
          //     })
          //   }
          // })

          // 클릭된 Forecast 데이터 추가
          const clickedForecastDataset = chart.data.datasets[this.selectedPoint.datasetIndex]
          const clickedValue = clickedForecastDataset.data[this.selectedPoint.index] as number

          if (clickedValue !== null && clickedValue !== undefined) {
            clickTooltipContent.push({
              index: this.selectedPoint.index,
              label: clickedForecastDataset.label,
              value: clickedValue,
              category: DATA_CATEGORIES.FORECAST,
              color:
                (clickedForecastDataset as any).pointBackgroundColor ||
                clickedForecastDataset.borderColor ||
                clickedForecastDataset.backgroundColor,
              goodsDataSourceNo: (clickedForecastDataset as any).metadata?.goodsDataSourceNo,
            })
          }

          // 다른 Forecast 데이터들도 추가 (중복 방지)
          if (this.selectedPoint) {
            const addedLabels = new Set([clickedForecastDataset.label]) // 이미 추가된 레이블 추적

            chart.data.datasets.forEach((dataset: any) => {
              if (
                dataset.category === DATA_CATEGORIES.FORECAST &&
                dataset.data &&
                this.selectedPoint &&
                dataset.data[this.selectedPoint.index] !== null &&
                !dataset.hidden &&
                !addedLabels.has(dataset.label) // 중복 방지
              ) {
                clickTooltipContent.push({
                  index: this.selectedPoint?.index,
                  label: dataset.label,
                  value: this.selectedPoint ? (dataset.data[this.selectedPoint.index] as number) : 0,
                  category: DATA_CATEGORIES.FORECAST,
                  color: dataset.backgroundColor as string,
                  goodsDataSourceNo: dataset.metadata?.goodsDataSourceNo,
                })
                addedLabels.add(dataset.label)
              }
            })
          }

          // Future 데이터들도 추가
          if (this.selectedPoint) {
            chart.data.datasets.forEach((dataset: any) => {
              if (
                dataset.category === DATA_CATEGORIES.FUTURE &&
                !dataset.hidden &&
                dataset.data &&
                this.selectedPoint &&
                this.selectedPoint &&
                dataset.data &&
                dataset.data[this.selectedPoint.index] !== null
              ) {
                clickTooltipContent.push({
                  label: dataset.label,
                  value: this.selectedPoint ? (dataset.data[this.selectedPoint.index] as number) : 0,
                  category: DATA_CATEGORIES.FUTURE,
                  color: dataset.borderColor as string,
                })
              }
            })
          }

          // 실제 차트 위치에서 툴팁 위치 계산 (클릭된 포인트의 element 위치 사용)
          const adjustedPosition = adjustTooltipPosition(this.selectedPoint.element.x, this.selectedPoint.element.y, chart)

          // 주차 정보를 포함한 라벨 생성
          let clickLabel = formatDate(months[currentIndex], 'MMMM YYYY')
          if (months[currentIndex]) {
            const dateObj = dayjs(months[currentIndex])
            const monthStr = dateObj.format('MMMM YYYY')
            const weekStr = getWeekOfMonth(dateObj)
            clickLabel = `${monthStr} (${weekStr}W)`
          }

          options.onPointerMove?.({
            plugin: this,
            chart,
            tooltip: {
              x: adjustedPosition.x,
              y: adjustedPosition.y,
              label: clickLabel,
              viewDetail: true,
              content: clickTooltipContent,
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
      showForecastTrendBackground: boolean
      showVerticalLine?: boolean
      showActualTag?: boolean
      showSteadinessTrend?: boolean
    },
  ) {
    const enable = options?.enable ?? true

    if (!enable) return

    const { ctx } = chart

    const verticalLineIndex = options.verticalLinedIndex
    const showForecastTrendBackground = options.showForecastTrendBackground
    const showVerticalLine = options.showVerticalLine ?? true
    const showSteadinessTrend = options.showSteadinessTrend ?? false

    const months = chart.data.labels || []

    const hoverImages: Record<string, HTMLImageElement> = {}

    if (options?.hoverImages) {
      Object.entries(options?.hoverImages).forEach(([key, image]) => {
        hoverImages[key] = image
      })
    }

    const topY = chart.scales.y.top
    const bottomY = chart.scales.y.bottom

    // Get vertical line x position
    let verticalLineX: number | null = null
    if (chart.getDatasetMeta(1).data[verticalLineIndex] && showVerticalLine) {
      verticalLineX = chart.getDatasetMeta(1).data[verticalLineIndex].x
    }

    // Draw fixed vertical line at the latest actual data point
    if (verticalLineX !== null && showVerticalLine) {
      const x = verticalLineX

      ctx.save()

      if (this.markerImage) {
        if (this.markerImage.complete && this.markerImage.naturalWidth > 0) {
          ctx.drawImage(this.markerImage, x - 6, topY - 13, 13, 8)
        }
      }

      ctx.beginPath()
      ctx.moveTo(x, topY)
      ctx.lineTo(x, bottomY)
      ctx.lineWidth = LINE_STYLES.VERTICAL_DIVIDER.LINE_WIDTH
      ctx.strokeStyle = LINE_STYLES.VERTICAL_DIVIDER.STROKE_STYLE
      ctx.stroke()

      ctx.restore()
    }

    // Draw fixed forecast trend background (항상 표시)
    if (showSteadinessTrend && verticalLineX !== null) {
      // 기준선 오른쪽에 데이터가 있는 마지막 인덱스 찾기
      // hideForecast === true 상태도 데이터 확인 (hidden 상태와 관계 X)
      let maxDataIndex = -1
      chart.data.datasets.forEach((dataset: any) => {
        if (dataset.data) {
          dataset.data.forEach((data: any, index: number) => {
            if (data !== null && data !== undefined) {
              maxDataIndex = Math.max(maxDataIndex, index)
            }
          })
        }
      })

      // 기준선 인덱스의 예측 데이터가 있는지 확인
      let hasForecastAtBaseline = false
      chart.data.datasets.forEach((dataset: any) => {
        if (
          dataset.category === DATA_CATEGORIES.FORECAST &&
          dataset.data[verticalLineIndex] !== null &&
          dataset.data[verticalLineIndex] !== undefined
        ) {
          hasForecastAtBaseline = true
        }
      })

      // 기준선 인덱스에 예측 데이터가 있는 경우
      if (hasForecastAtBaseline) {
        // 배경색은 기준선부터 기준선+1(다음 인덱스)까지 칠함
        const nextIndex = verticalLineIndex + 1
        let endX = verticalLineX

        // 기준선 다음 인덱스의 x 위치 찾기
        const actualDatasetIndex = chart.data.datasets.findIndex(
          (dataset: any) => dataset.category === DATA_CATEGORIES.ACTUAL && dataset.data && dataset.data.length > 0,
        )
        let datasetIndexForX = actualDatasetIndex
        if (datasetIndexForX === -1) {
          datasetIndexForX = chart.data.datasets.findIndex((dataset: any) => dataset.data && dataset.data.length > 0)
        }

        if (datasetIndexForX !== -1 && chart.getDatasetMeta(datasetIndexForX).data[nextIndex]) {
          endX = chart.getDatasetMeta(datasetIndexForX).data[nextIndex].x
        } else {
          // 다음 인덱스에 데이터가 없으면 기준선 위치를 사용 (배경색 칠지 않음)
          endX = verticalLineX
        }

        // 데이터를 분석해서 상태 자동 계산 (동일/상승/하락 세 가지로 구분)
        let calculatedTrend: 'NEUTRAL' | 'BULLISH' | 'BEARISH' = 'NEUTRAL'

        const actualDataset = chart.data.datasets.find((dataset: any) => dataset.category === DATA_CATEGORIES.ACTUAL)
        let baselineValue: number | null | undefined = actualDataset?.data?.[verticalLineIndex] as number | null | undefined

        if (baselineValue !== null && baselineValue !== undefined && typeof baselineValue === 'string') {
          baselineValue = Number(baselineValue)
          if (isNaN(baselineValue)) {
            baselineValue = undefined
          }
        }

        if ((baselineValue === null || baselineValue === undefined) && verticalLineIndex > 0) {
          let prevValue = actualDataset?.data?.[verticalLineIndex - 1] as number | null | undefined
          if (prevValue !== null && prevValue !== undefined && typeof prevValue === 'string') {
            prevValue = Number(prevValue)
            if (isNaN(prevValue)) {
              prevValue = undefined
            }
          }
          baselineValue = prevValue
        }

        // 기준선 인덱스의 예측 데이터만 수집 (그 달의 예측 데이터)
        const forecastDataPoints: Array<{ index: number; value: number; label?: string }> = []
        chart.data.datasets.forEach((dataset: any) => {
          if (dataset.category === DATA_CATEGORIES.FORECAST) {
            // 기준선 인덱스의 예측 데이터만 확인
            const value = dataset.data[verticalLineIndex]
            if (value !== null && value !== undefined) {
              const numValue = typeof value === 'number' ? value : Number(value)
              if (!isNaN(numValue) && isFinite(numValue)) {
                forecastDataPoints.push({ index: verticalLineIndex, value: numValue, label: dataset.label })
              }
            }
          }
        })

        // 상태 계산: 기준선 인덱스의 예측 데이터를 기준선 값과 비교
        if (baselineValue !== null && baselineValue !== undefined && forecastDataPoints.length > 0) {
          if (forecastDataPoints.length === 1) {
            const point = forecastDataPoints[0]

            if (point.value > baselineValue) {
              calculatedTrend = 'BULLISH'
            } else if (point.value < baselineValue) {
              calculatedTrend = 'BEARISH'
            }
          } else {
            let upCount = 0
            let downCount = 0
            let neutralCount = 0

            forecastDataPoints.forEach((point) => {
              if (point.value > baselineValue) {
                upCount++
              } else if (point.value < baselineValue) {
                downCount++
              } else {
                neutralCount++
              }
            })

            if (upCount > downCount && upCount > neutralCount) {
              calculatedTrend = 'BULLISH'
            } else if (downCount > upCount && downCount > neutralCount) {
              calculatedTrend = 'BEARISH'
            }
          }
        }

        let gradientColor: { start: string; end: string }

        if (calculatedTrend === 'BULLISH') {
          // 상승: 빨간색
          gradientColor = {
            start: 'rgba(160, 42, 116, 0)',
            end: 'rgba(160, 42, 116, 0.15)',
          }
        } else if (calculatedTrend === 'BEARISH') {
          // 하락: 파란색
          gradientColor = {
            start: 'rgba(51, 134, 194, 0)',
            end: 'rgba(51, 134, 194, 0.15)',
          }
        } else {
          // 동일: 회색
          gradientColor = {
            start: 'rgba(134, 142, 150, 0)',
            end: 'rgba(134, 142, 150, 0.15)',
          }
        }

        // 배경색은 다음 인덱스가 있을 때만 칠함
        if (endX > verticalLineX && datasetIndexForX !== -1 && chart.getDatasetMeta(datasetIndexForX).data[nextIndex]) {
          const gradient = ctx.createLinearGradient(0, topY, 0, bottomY)
          gradient.addColorStop(0, gradientColor.start)
          gradient.addColorStop(1, gradientColor.end)

          ctx.save()
          ctx.fillStyle = gradient
          ctx.fillRect(verticalLineX, topY, endX - verticalLineX, bottomY - topY)

          const labelText = calculatedTrend

          let labelColor = '#868E96'

          if (calculatedTrend === 'BULLISH') {
            labelColor = '#A02A74'
          } else if (calculatedTrend === 'BEARISH') {
            labelColor = '#3386C2'
          }

          const labelX = verticalLineX + (endX - verticalLineX) / 2
          const labelY = topY + 12

          ctx.font = '12px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          ctx.fillStyle = labelColor
          ctx.fillText(labelText, labelX, labelY)

          ctx.restore()
        }
      }
    }

    // Draw if selected point is selected from previous click
    if (this.selectedPoint && chart.data.datasets?.[this.selectedPoint.datasetIndex]?.label) {
      const activeImage = hoverImages[`${chart.data.datasets[this.selectedPoint.datasetIndex].label} Active`]

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(this.selectedPoint.element.x, topY)
      ctx.lineTo(this.selectedPoint.element.x, bottomY)
      ctx.lineWidth = LINE_STYLES.HOVER_LINE.LINE_WIDTH
      ctx.strokeStyle = LINE_STYLES.HOVER_LINE.STROKE_STYLE
      ctx.stroke()
      ctx.restore()

      if (activeImage) {
        if (activeImage.complete && activeImage.naturalWidth > 0) {
          ctx.drawImage(
            activeImage,
            this.selectedPoint.element.x - HOVER_INDICATOR.SIZE / 2,
            this.selectedPoint.element.y - HOVER_INDICATOR.SIZE / 2,
            HOVER_INDICATOR.SIZE,
            HOVER_INDICATOR.SIZE,
          )
        }
      }
    }

    // Draw hover vertical line and highlight
    if ((chart.tooltip as any)?._active?.length) {
      const activePoint = (chart.tooltip as any)._active[0]
      const activePoints = (chart.tooltip as any)._active

      const { x } = activePoint.element
      const currentIndex = activePoint.index

      // 선택된 포인트가 있을 때는 선택된 포인트를 기준으로 툴팁 표시
      if (this.selectedPoint) {
        // 클릭된 월의 Forecast 데이터만 툴팁에 포함 (중복 방지)
        const clickTooltipContent: any[] = []
        const addedLabels = new Set<string>() // 중복 방지용

        // 실제 데이터는 클릭 툴팁에서 제외 (Forecast 값만 표시)
        // chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        //   if (dataset.category === DATA_CATEGORIES.ACTUAL && !dataset.hidden && dataset.data[this.selectedPoint.index] !== null) {
        //     clickTooltipContent.push({
        //       label: dataset.label,
        //       value: dataset.data[this.selectedPoint.index] as number,
        //       category: DATA_CATEGORIES.ACTUAL,
        //       color: dataset.borderColor as string,
        //     })
        //   }
        // })

        // 클릭된 Forecast 데이터 추가
        const selectedForecastDataset = chart.data.datasets[this.selectedPoint.datasetIndex]
        const selectedValue = selectedForecastDataset.data[this.selectedPoint.index] as number

        if (selectedValue !== null && selectedValue !== undefined) {
          clickTooltipContent.push({
            index: this.selectedPoint.datasetIndex,
            label: selectedForecastDataset.label,
            value: selectedValue,
            category: DATA_CATEGORIES.FORECAST,
            color:
              (selectedForecastDataset as any).pointBackgroundColor ||
              selectedForecastDataset.borderColor ||
              selectedForecastDataset.backgroundColor,
            goodsDataSourceNo: (selectedForecastDataset as any).metadata?.goodsDataSourceNo,
          })
          addedLabels.add(selectedForecastDataset.label ?? '')
        }

        const adjustedPosition = adjustTooltipPosition(this.selectedPoint.element.x, this.selectedPoint.element.y, chart)

        // 주차 정보를 포함한 라벨 생성
        const originalMonths = options.months || []
        const chartIndex = this.selectedPoint.index
        const monthIndex = Math.max(0, Math.min(chartIndex - 1, originalMonths.length - 1))
        let clickLabel = formatDate(originalMonths[monthIndex], 'MMMM YYYY')
        if (originalMonths[monthIndex]) {
          const dateObj = dayjs(originalMonths[monthIndex])
          const monthStr = dateObj.format('MMMM YYYY')
          const weekStr = getWeekOfMonth(dateObj)
          clickLabel = `${monthStr} (${weekStr}W)`
        }

        options.onPointerMove?.({
          plugin: this,
          chart,
          tooltip: {
            x: adjustedPosition.x,
            y: adjustedPosition.y,
            label: clickLabel,
            viewDetail: true,
            content: clickTooltipContent,
          },
        })
        return
      }

      if (this.mousePosition && !this.selectedPoint) {
        const chartArea = chart.chartArea
        const isMouseInChart =
          this.mousePosition.x >= chartArea.left &&
          this.mousePosition.x <= chartArea.right &&
          this.mousePosition.y >= chartArea.top &&
          this.mousePosition.y <= chartArea.bottom

        if (isMouseInChart) {
          // Find the nearest point (considering both x and y coordinates)
          const nearestPoint = activePoints.reduce((prev: ActiveElement, curr: ActiveElement) => {
            if (!prev.element.x || !prev.element.y || !curr.element.x || !curr.element.y || !this.mousePosition) return prev

            // Calculate Euclidean distance (considering both x and y)
            const prevDistance = Math.sqrt(
              Math.pow(prev.element.x - this.mousePosition.x, 2) + Math.pow(prev.element.y - this.mousePosition.y, 2),
            )
            const currDistance = Math.sqrt(
              Math.pow(curr.element.x - this.mousePosition.x, 2) + Math.pow(curr.element.y - this.mousePosition.y, 2),
            )

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
                  const forecastDataset = forecastDatasets[i - 2] // Adjust index for the padding

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

            if (mainDataset?.data && showForecastTrendBackground && !showSteadinessTrend && currentIndex > 1 && prevData && currentData) {
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
                gradient.addColorStop(0, 'rgba(145, 145, 145, 0)') // Less opacity at top
                gradient.addColorStop(1, 'rgba(145, 145, 145, 0.15)') // More opacity at bottom
              }

              // Draw background highlight with gradient
              ctx.save()
              ctx.fillStyle = gradient
              ctx.fillRect(prevX, topY, x - prevX, bottomY - topY)

              ctx.restore()
            }

            const nearestPointIsForecast = (chart.data.datasets[nearestPoint?.datasetIndex] as any)?.category === DATA_CATEGORIES.FORECAST

            chart.data.datasets.forEach((dataset: any, datasetIndex: any) => {
              const datasetMeta = chart.getDatasetMeta(datasetIndex)

              if (!datasetMeta.hidden && !dataset.hidden && datasetMeta.data[currentIndex] && dataset.data[currentIndex] !== null) {
                const point = datasetMeta.data[currentIndex]
                const size = HOVER_INDICATOR.SIZE
                const xPos = point.x - size / 2
                const yPos = point.y - size / 2
                const img = hoverImages[`${dataset.label}`]

                // For forecast points, handle different interaction states
                if (dataset.category === DATA_CATEGORIES.FORECAST && this.mousePosition && img) {
                  // Add to tooltip content for forecast points
                  if (!nearestPointIsForecast || (nearestPointIsForecast && nearestPoint.datasetIndex === datasetIndex)) {
                    // Group forecast datasets by name - hidden 상태 필터링 추가
                    const forecastDatasets = chart.data.datasets.filter(
                      (ds: any) =>
                        ds.permission && ds.category === DATA_CATEGORIES.FORECAST && ds.data[currentIndex] !== null && !ds.hidden,
                    )

                    // Group datasets by their base name (without "Forecast" suffix)
                    const groupedDatasets = forecastDatasets.reduce((acc: any, ds: any) => {
                      const baseName = ds.label.replace(' Forecast', '')
                      acc[baseName] ??= []
                      acc[baseName].push(ds)
                      return acc
                    }, {})

                    // Sort datasets by their base name
                    const sortedBaseNames = Object.keys(groupedDatasets).sort((a, b) => a.localeCompare(b))

                    // Create ordered tooltip content (중복 방지)
                    if (this.tooltipContent.length === 0 || nearestPointIsForecast) {
                      this.tooltipContent = []
                    }

                    // Add actual data first (only once) - hidden 상태 체크 추가
                    const actualDataset = chart.data.datasets.find(
                      (ds: any) => ds.permission && ds.category === DATA_CATEGORIES.ACTUAL && !ds.hidden,
                    )

                    if (
                      actualDataset &&
                      actualDataset.data[currentIndex] !== null &&
                      !this.tooltipContent.some((item) => item.category === DATA_CATEGORIES.ACTUAL)
                    ) {
                      this.tooltipContent.push({
                        label: options.showActualTag ? `${actualDataset.label} Actual` : actualDataset.label,
                        value: actualDataset.data[currentIndex] as number,
                        category: DATA_CATEGORIES.ACTUAL,
                        color: actualDataset.borderColor as string,
                      })
                    }

                    // Then add forecast data for each baseName
                    sortedBaseNames.forEach((baseName) => {
                      const forecastDataset = groupedDatasets[baseName][0]
                      if (
                        forecastDataset &&
                        !this.tooltipContent.some(
                          (item) => item.category === DATA_CATEGORIES.FORECAST && item.label === forecastDataset.label,
                        )
                      ) {
                        this.tooltipContent.push({
                          index: currentIndex,
                          label: forecastDataset.label,
                          value: forecastDataset.data[currentIndex] as number,
                          category: DATA_CATEGORIES.FORECAST,
                          color:
                            (forecastDataset as any).pointBackgroundColor || forecastDataset.backgroundColor || forecastDataset.borderColor,
                          goodsDataSourceNo: forecastDataset.metadata?.goodsDataSourceNo,
                        })
                      }
                    })
                  }
                }

                if (
                  dataset.category === DATA_CATEGORIES.FORECAST &&
                  dataset.data[currentIndex] !== null &&
                  nearestPoint?.datasetIndex !== datasetIndex &&
                  !dataset.hidden &&
                  img &&
                  this.mousePosition
                ) {
                  const nonNullIndices = dataset.data
                    .map((data: any, index: number) => (data !== null ? index : -1))
                    .filter((index: number) => index !== -1)

                  if (dataset.data.filter((data: any) => data !== null).length === 2 && currentIndex !== Math.max(...nonNullIndices)) {
                    return
                  }

                  if (img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, xPos, yPos, size, size)
                  }
                }

                if (dataset.category === DATA_CATEGORIES.ACTUAL && !dataset.hidden && img && !this.selectedPoint) {
                  if (!this.tooltipContent.some((item) => item.category === DATA_CATEGORIES.ACTUAL && item.label === dataset.label)) {
                    this.tooltipContent.push({
                      label: dataset?.label,
                      value: dataset?.data[currentIndex] as number,
                      category: DATA_CATEGORIES.ACTUAL,
                      color: dataset?.borderColor as string,
                    })
                  }
                }

                if (dataset.category === DATA_CATEGORIES.FUTURE && !dataset.hidden && img && !this.selectedPoint) {
                  if (!this.tooltipContent.some((item) => item.category === DATA_CATEGORIES.FUTURE && item.label === dataset.label)) {
                    this.tooltipContent.push({
                      label: dataset?.label,
                      value: dataset?.data[currentIndex] as number,
                      category: DATA_CATEGORIES.FUTURE,
                      color: dataset?.borderColor as string,
                    })
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
                const activeImage = hoverImages[`${dataset.label} Active`]
                if (activeImage && activeImage.complete && activeImage.naturalWidth > 0) {
                  ctx.drawImage(activeImage, xPos, yPos, size, size)
                }
              } else if (this.interactionState === PointInteractionState.HOVER_NEAR) {
                // Draw a subtle highlight circle around the point
                const hoverImage = hoverImages[`${dataset.label} Hover`]
                if (hoverImage && hoverImage.complete && hoverImage.naturalWidth > 0) {
                  ctx.drawImage(hoverImage, xPos, yPos, size, size)
                }
              } else if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, xPos, yPos, size, size)
              }
            }
          }

          // 주차 정보를 포함한 라벨 생성
          let label: string = ''
          const originalMonths = options.months || []
          const monthIndex = Math.max(0, Math.min(currentIndex - 1, originalMonths.length - 1))

          if (originalMonths[monthIndex]) {
            const dateObj = dayjs(originalMonths[monthIndex])
            const thursdayOfCurrentWeek = dateObj.isoWeekday(4)
            const monthStr = thursdayOfCurrentWeek.format('MMMM YYYY')
            const weekStr = getWeekOfMonth(dateObj)
            label = `${monthStr} (${weekStr}W)`
          } else if (months[currentIndex]) {
            label = formatDate(months[currentIndex], 'MMMM YYYY')
          }

          const adjustedPosition = adjustTooltipPosition(this.mousePosition.x, this.mousePosition.y, chart)

          options.onPointerMove?.({
            plugin: this,
            chart,
            tooltip: {
              x: adjustedPosition.x,
              y: adjustedPosition.y,
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

  private recalculateTooltipPosition() {
    if (!this._chart) return

    const chartArea = this._chart.chartArea
    const tooltipElement = document.querySelector('.mi-forecast-chart-tooltip') as HTMLElement

    if (!tooltipElement) return

    const rect = tooltipElement.getBoundingClientRect()
    const tooltipWidth = rect.width
    const tooltipHeight = rect.height

    if (this.selectedPoint) {
      const clickTooltipContent: any[] = []

      this._chart.data.datasets.forEach((dataset: any) => {
        if (
          this.selectedPoint &&
          dataset.category === DATA_CATEGORIES.ACTUAL &&
          !dataset.hidden &&
          dataset.data[this.selectedPoint.index] !== null
        ) {
          clickTooltipContent.push({
            label: dataset.label,
            value: dataset.data[this.selectedPoint.index] as number,
            category: DATA_CATEGORIES.ACTUAL,
            color: dataset.borderColor as string,
          })
        }
      })

      clickTooltipContent.push({
        index: this.selectedPoint.datasetIndex,
        label: this._chart.data.datasets[this.selectedPoint.datasetIndex].label,
        value: this._chart.data.datasets[this.selectedPoint.datasetIndex].data[this.selectedPoint.index] as number,
        category: DATA_CATEGORIES.FORECAST,
        color: this._chart.data.datasets[this.selectedPoint.datasetIndex].backgroundColor as string,
        goodsDataSourceNo: (this._chart.data.datasets[this.selectedPoint.datasetIndex] as any).metadata?.goodsDataSourceNo,
      })

      let adjustedX = this.selectedPoint.element.x
      let adjustedY = this.selectedPoint.element.y

      // 차트 영역을 벗어나지 않도록 위치 조정
      if (adjustedX + tooltipWidth + 20 > chartArea.right) {
        adjustedX = adjustedX - tooltipWidth - 40
      } else if (adjustedX < chartArea.left) {
        adjustedX = chartArea.left + 10
      }

      if (adjustedY + tooltipHeight > chartArea.bottom) {
        adjustedY = adjustedY - tooltipHeight
      } else if (adjustedY < chartArea.top) {
        adjustedY = chartArea.top + 10
      }

      // 주차 정보를 포함한 라벨 생성
      const originalMonths = this._options.months || []
      const chartIndex = this.selectedPoint.index
      const monthIndex = Math.max(0, Math.min(chartIndex - 1, originalMonths.length - 1))
      let clickLabel = formatDate(originalMonths[monthIndex], 'MMMM YYYY')
      if (originalMonths[monthIndex]) {
        const dateObj = dayjs(originalMonths[monthIndex])
        const monthStr = dateObj.format('MMMM YYYY')
        const weekStr = getWeekOfMonth(dateObj)
        clickLabel = `${monthStr} (${weekStr}W)`
      }

      this._options.onPointerMove?.({
        plugin: this,
        chart: this._chart,
        tooltip: {
          x: adjustedX,
          y: adjustedY,
          label: clickLabel,
          viewDetail: true,
          content: clickTooltipContent,
        },
      })
    }
  }

  public updateTooltipPosition(viewDetail: boolean) {
    if (!this._chart) return

    if (this.selectedPoint) {
      const clickTooltipContent: any[] = []
      const addedLabels = new Set<string>() // 중복 방지용

      // 실제 데이터는 클릭 툴팁에서 제외 (Forecast만 표시)

      const targetForecastDataset = this._chart.data.datasets[this.selectedPoint.datasetIndex]
      const targetValue = targetForecastDataset.data[this.selectedPoint.index] as number

      if (targetValue !== null && targetValue !== undefined) {
        clickTooltipContent.push({
          label: targetForecastDataset.label,
          value: targetValue,
          category: DATA_CATEGORIES.FORECAST,
          color:
            (targetForecastDataset as any).pointBackgroundColor ||
            targetForecastDataset.borderColor ||
            targetForecastDataset.backgroundColor,
          goodsDataSourceNo: (targetForecastDataset as any).metadata?.goodsDataSourceNo,
        })
        addedLabels.add(targetForecastDataset.label ?? '')
      }

      const adjustedPosition = adjustTooltipPosition(this.selectedPoint.element.x, this.selectedPoint.element.y, this._chart)

      // 주차 정보를 포함한 라벨 생성
      const originalMonths = this._options.months || []
      const chartIndex = this.selectedPoint.index
      const monthIndex = Math.max(0, Math.min(chartIndex - 1, originalMonths.length - 1))
      let clickLabel = formatDate(originalMonths[monthIndex], 'MMMM YYYY')
      if (originalMonths[monthIndex]) {
        const dateObj = dayjs(originalMonths[monthIndex])
        const monthStr = dateObj.format('MMMM YYYY')
        const weekStr = getWeekOfMonth(dateObj)
        clickLabel = `${monthStr} (${weekStr}W)`
      }

      this._options.onPointerMove?.({
        plugin: this,
        chart: this._chart,
        tooltip: {
          x: adjustedPosition.x,
          y: adjustedPosition.y,
          label: clickLabel,
          viewDetail,
          content: clickTooltipContent,
        },
      })
    } else if (this.mousePosition && this.tooltipContent.length > 0) {
      const activePoint = (this._chart.tooltip as any)?._active?.[0]
      if (activePoint) {
        const months = this._chart.data.labels || []
        const currentIndex = activePoint.index
        let label = ''
        if (months[currentIndex]) {
          label = formatDate(months[currentIndex], 'MMMM YYYY')
        }

        const adjustedPosition = adjustTooltipPosition(this.mousePosition.x, this.mousePosition.y, this._chart)

        this._options.onPointerMove?.({
          plugin: this,
          chart: this._chart,
          tooltip: {
            x: adjustedPosition.x,
            y: adjustedPosition.y,
            label,
            viewDetail,
            content: this.tooltipContent,
          },
        })
      }
    }
  }

  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.debouncedRecalculateTooltipPosition) {
      this.debouncedRecalculateTooltipPosition.cancel()
      this.debouncedRecalculateTooltipPosition = null
    }

    window.removeEventListener('resize', this.handleWindowResize)
  }

  private readonly handleWindowResize = () => {
    this.debouncedRecalculateTooltipPosition?.()
  }
}

// Create a singleton instance for backward compatibility
const verticalLineAndHighlightPlugin = new VerticalLineAndHighlightPlugin()

// Export the singleton instance as default
export default verticalLineAndHighlightPlugin
