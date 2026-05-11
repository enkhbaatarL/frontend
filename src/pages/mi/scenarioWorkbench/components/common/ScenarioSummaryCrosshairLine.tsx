import { Chart as ChartJS } from 'chart.js'
import dayjs from 'dayjs'
import { forwardRef, RefObject, useCallback, useEffect, useImperativeHandle, useRef } from 'react'

import { ScenarioSummaryTooltipContent } from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChartTooltip'
import { formatValue } from '@/utils/number'

type ChartPoint = {
  x?: number
  y?: number | null
  c?: number | null
}

const INDICATOR_CONTAINER_ID = 'scenario-summary-indicator-container'
const INDICATOR_BOX_HEIGHT = 24
const DATE_INDICATOR_BOX_WIDTH = 84
const VALUE_INDICATOR_BOX_MIN_WIDTH = 48

interface ScenarioSummaryCrosshairLineProps {
  chartRef: RefObject<ChartJS | null>
  onTooltipChange: (context: { tooltip: { x: number; y: number; content: Record<string, ScenarioSummaryTooltipContent> } | null }) => void
}

export interface ScenarioSummaryCrosshairLineHandle {
  updateCrosshairPosition: (mouseX: number, mouseY: number, xScaleIndex: number) => void
  handleMouseOut: () => void
  getCanvasRect: () => { left: number; right: number; top: number; bottom: number } | null
}

const createIndicatorContainer = () => {
  const container = document.createElement('div')
  container.id = INDICATOR_CONTAINER_ID
  Object.assign(container.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '100',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
  })
  return container
}

const getIndicatorContainer = (appendTarget: HTMLElement | null | undefined) => {
  if (!appendTarget) return null

  Array.from(appendTarget.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement && child.id === 'main-indicator-container')
    .forEach((staleContainer) => staleContainer.remove())

  const containers = Array.from(appendTarget.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child.id === INDICATOR_CONTAINER_ID,
  )

  const [container, ...duplicates] = containers
  duplicates.forEach((duplicate) => duplicate.remove())

  if (container) return container

  const newContainer = createIndicatorContainer()
  appendTarget.appendChild(newContainer)
  return newContainer
}

const getNonOverlappingTop = (container: HTMLElement, desiredTop: number, height: number, yAxisId: string): number => {
  const padding = 2
  let nextTop = desiredTop

  const existingRects = Array.from(container.children)
    .filter((child) => (child as HTMLElement).dataset.yAxisId === yAxisId)
    .map((child) => ({
      top: (child as HTMLElement).offsetTop,
      bottom: (child as HTMLElement).offsetTop + (child as HTMLElement).offsetHeight,
    }))

  while (existingRects.some((rect) => nextTop < rect.bottom && nextTop + height > rect.top)) {
    nextTop += height + padding
  }

  return nextTop
}

const isVisibleDataset = (chart: ChartJS, datasetIndex: number) => {
  const dataset = chart.data.datasets[datasetIndex]
  const meta = chart.getDatasetMeta(datasetIndex)
  return (dataset as { hidden?: boolean }).hidden !== true && meta.hidden !== true
}

const findPoint = (data: unknown, xScaleIndex: number): ChartPoint | undefined => {
  if (!Array.isArray(data)) return undefined
  return data.find((point): point is ChartPoint => {
    if (!point || typeof point !== 'object' || !('x' in point)) return false
    return (point as ChartPoint).x === xScaleIndex
  })
}

const getPointValue = (point?: ChartPoint): number | null => {
  if (!point) return null
  if (typeof point.y === 'number') return point.y
  if (typeof point.c === 'number') return point.c
  return null
}

const ScenarioSummaryCrosshairLine = forwardRef<ScenarioSummaryCrosshairLineHandle, ScenarioSummaryCrosshairLineProps>(
  ({ chartRef, onTooltipChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null)

    const updateValueAndDateIndicators = useCallback((chart: ChartJS, xScaleIndex: number, mousePos: { x: number; y: number }) => {
      const chartArea = chart.chartArea
      const chartAreaBottom = chartArea.bottom

      const chartWrapper = chart.canvas.parentElement
      const chartParent = chartWrapper?.parentElement
      const appendTarget = chartParent ?? chartWrapper
      const mainIndicatorContainer = getIndicatorContainer(appendTarget)

      if (!mainIndicatorContainer) return
      mainIndicatorContainer.innerHTML = ''

      const pluginOptions = (chart.config.options as { plugins?: { gridAndAxes?: { timestamps?: string[] } } })?.plugins?.gridAndAxes ?? {}
      const firstDataset = chart.data.datasets[0]
      const metadata = (firstDataset as { metadata?: { timestamps?: string[] } })?.metadata
      const timestamps = pluginOptions.timestamps?.length ? pluginOptions.timestamps : metadata?.timestamps || []
      const roundedIndex = Math.round(xScaleIndex)
      const timestamp = timestamps[roundedIndex]

      const dateBox = document.createElement('div')
      dateBox.id = 'date-indicator'
      dateBox.style.position = 'absolute'
      dateBox.style.backgroundColor = 'black'
      dateBox.style.color = 'white'
      dateBox.style.display = 'flex'
      dateBox.style.alignItems = 'center'
      dateBox.style.justifyContent = 'center'
      dateBox.style.width = `${DATE_INDICATOR_BOX_WIDTH}px`
      dateBox.style.height = `${INDICATOR_BOX_HEIGHT}px`
      dateBox.style.padding = '2px 8px'
      dateBox.style.fontSize = '14px'
      dateBox.style.fontWeight = '400'
      dateBox.style.fontFamily = 'Pretendard'
      dateBox.style.lineHeight = '20px'
      dateBox.style.whiteSpace = 'nowrap'
      dateBox.style.boxSizing = 'border-box'
      dateBox.textContent = timestamp ? dayjs(timestamp).format('YY/MM/DD') : `Index: ${roundedIndex}`
      mainIndicatorContainer.appendChild(dateBox)

      const dateBoxWidth = dateBox.offsetWidth
      const desiredLeft = mousePos.x - dateBoxWidth / 2
      const minLeft = chartArea.left
      const maxLeft = chartArea.right - dateBoxWidth

      dateBox.style.left = `${Math.max(minLeft, Math.min(maxLeft, desiredLeft))}px`
      dateBox.style.top = `${chartAreaBottom}px`

      const mainDataset = chart.data.datasets[0]
      if (!mainDataset) return

      const yAxisId = (mainDataset as { yAxisID?: string }).yAxisID ?? 'y'
      const yScale = chart.scales[yAxisId]
      if (!yScale) return

      let toFixed = (mainDataset as { metadata?: { toFixed?: number } }).metadata?.toFixed ?? 2
      const yRange = yScale.max - yScale.min
      if (yRange > 0) {
        const labelStep = yRange / 5
        const magnitude = Math.floor(Math.log10(labelStep))
        toFixed = Math.max(0, -magnitude)
      }

      const mouseYValue = yScale.getValueForPixel(mousePos.y)
      if (mouseYValue === null || mouseYValue === undefined) return

      const valueBox = document.createElement('div')
      valueBox.style.position = 'absolute'
      valueBox.style.backgroundColor = 'black'
      valueBox.style.color = 'white'
      valueBox.style.display = 'flex'
      valueBox.style.alignItems = 'center'
      valueBox.style.justifyContent = 'center'
      valueBox.style.minWidth = `${VALUE_INDICATOR_BOX_MIN_WIDTH}px`
      valueBox.style.height = `${INDICATOR_BOX_HEIGHT}px`
      valueBox.style.padding = '2px 8px'
      valueBox.style.fontSize = '14px'
      valueBox.style.fontWeight = '400'
      valueBox.style.fontFamily = 'Pretendard'
      valueBox.style.lineHeight = '20px'
      valueBox.style.whiteSpace = 'nowrap'
      valueBox.style.boxSizing = 'border-box'
      valueBox.textContent = formatValue(mouseYValue, '', 'en-US', toFixed)
      valueBox.dataset.yAxisId = yAxisId
      mainIndicatorContainer.appendChild(valueBox)

      const boxHeight = valueBox.offsetHeight ?? INDICATOR_BOX_HEIGHT
      const boxWidth = valueBox.offsetWidth ?? 0
      const desiredTop = mousePos.y - boxHeight / 2
      const minTop = chartArea.top
      const maxTop = chartArea.bottom - boxHeight
      const topThreshold = minTop + boxHeight * 1.5

      let finalTop: number
      if (desiredTop < minTop) {
        finalTop = minTop
      } else if (desiredTop <= topThreshold) {
        finalTop = Math.max(minTop, desiredTop)
      } else if (desiredTop > maxTop) {
        finalTop = maxTop
      } else {
        finalTop = Math.max(minTop, Math.min(maxTop, getNonOverlappingTop(mainIndicatorContainer, desiredTop, boxHeight, yAxisId)))
      }

      valueBox.style.left = `${chartArea.left - boxWidth}px`
      valueBox.style.top = `${finalTop}px`
    }, [])

    const handleMouseOut = useCallback(() => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      const chart = chartRef.current
      const chartParent = chart?.canvas?.parentElement?.parentElement
      const appendTarget = chartParent ?? chart?.canvas?.parentElement
      appendTarget
        ?.querySelectorAll(`#${INDICATOR_CONTAINER_ID}, #main-indicator-container`)
        .forEach((mainIndicatorContainer) => mainIndicatorContainer.remove())

      lastMousePositionRef.current = null
      onTooltipChange({ tooltip: null })
    }, [chartRef, onTooltipChange])

    const updateCrosshairPosition = useCallback(
      (mouseX: number, mouseY: number, xScaleIndex: number) => {
        const chart = chartRef.current
        const canvas = canvasRef.current
        if (!chart || !canvas) return

        const pluginOptions =
          (chart.config.options as { plugins?: { gridAndAxes?: { timestamps?: string[]; resultDates?: string[] } } })?.plugins
            ?.gridAndAxes ?? {}
        const pluginTimestamps = pluginOptions.timestamps ?? []
        const pluginResultDates = pluginOptions.resultDates ?? []
        const firstDataset = chart.data.datasets[0]
        const metadata = (firstDataset as { metadata?: { timestamps?: string[]; startDates?: string[] } })?.metadata
        const timestamps = pluginTimestamps.length > 0 ? pluginTimestamps : metadata?.timestamps || []
        const startDates = metadata?.startDates || []
        const roundedIndex = Math.round(xScaleIndex)
        const timestamp = timestamps[roundedIndex]
        const formattedDate = timestamp
          ? dayjs(timestamp).format('YYYY-MM-DD')
          : pluginResultDates[roundedIndex] || `Index: ${roundedIndex}`
        const startDate = startDates[roundedIndex] || undefined

        const chartArea = chart.chartArea
        const top = chartArea.top
        const left = chartArea.left
        const width = chartArea.right - chartArea.left
        const height = chartArea.bottom - chartArea.top

        canvas.width = width
        canvas.height = height
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.style.top = `${top}px`
        canvas.style.left = `${left}px`

        const ctx = canvas.getContext('2d', { willReadFrequently: false })
        if (!ctx) return

        ctx.imageSmoothingEnabled = false
        ctx.clearRect(0, 0, width, height)

        const canvasX = Math.round(mouseX - left) + 0.5
        const canvasY = Math.round(mouseY - top) + 0.5

        ctx.save()
        ctx.strokeStyle = '#868E96'
        ctx.lineWidth = 1
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.moveTo(canvasX, 0)
        ctx.lineTo(canvasX, height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, canvasY)
        ctx.lineTo(width, canvasY)
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.imageSmoothingEnabled = false
        const pointRadius = 3
        const pointBorderWidth = 1

        for (let datasetIndex = chart.data.datasets.length - 1; datasetIndex >= 0; datasetIndex -= 1) {
          if (!isVisibleDataset(chart, datasetIndex)) continue

          const dataset = chart.data.datasets[datasetIndex]
          const point = findPoint(dataset.data, roundedIndex)
          const yValue = getPointValue(point)
          if (yValue === null) continue

          const yAxisId = (dataset as { yAxisID?: string }).yAxisID ?? 'y'
          const yScale = chart.scales[yAxisId]
          if (!yScale) continue

          const pointPixelY = yScale.getPixelForValue(yValue)
          const pointCanvasY = Math.round(pointPixelY - top) + 0.5
          if (pointCanvasY < 0 || pointCanvasY > height) continue

          ctx.beginPath()
          ctx.arc(canvasX, pointCanvasY, pointRadius, 0, Math.PI * 2)
          ctx.fillStyle = '#FFFFFF'
          ctx.fill()

          ctx.beginPath()
          ctx.arc(canvasX, pointCanvasY, pointRadius, 0, Math.PI * 2)
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = pointBorderWidth
          ctx.stroke()
        }
        ctx.restore()

        updateValueAndDateIndicators(chart, xScaleIndex, { x: mouseX, y: mouseY })

        const tooltipContent: Record<string, ScenarioSummaryTooltipContent> = {}
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          if (!isVisibleDataset(chart, datasetIndex)) return

          const point = findPoint(dataset.data, roundedIndex)
          const value = getPointValue(point)
          const datasetMetadata = (
            dataset as {
              metadata?: {
                isDashed?: boolean
                chipColor?: string
                toFixed?: number
                goodsDataSourceNo?: number
                startDates?: string[]
              }
            }
          ).metadata

          tooltipContent[datasetIndex] = {
            label: dataset.label,
            color: datasetMetadata?.chipColor,
            value: value ?? undefined,
            date: formattedDate,
            startDate: datasetMetadata?.startDates?.[roundedIndex] || startDate,
            toFixed: datasetMetadata?.toFixed,
            isForecast: datasetMetadata?.isDashed ?? false,
            goodsDataSourceNo: datasetMetadata?.goodsDataSourceNo,
          }
        })

        onTooltipChange({
          tooltip: {
            x: mouseX,
            y: mouseY,
            content: tooltipContent,
          },
        })

        lastMousePositionRef.current = { x: mouseX, y: mouseY }
      },
      [chartRef, onTooltipChange, updateValueAndDateIndicators],
    )

    useEffect(() => {
      const chart = chartRef.current
      if (!chart) return undefined

      const canvas = canvasRef.current
      if (canvas) {
        const chartArea = chart.chartArea
        const top = chartArea.top
        const left = chartArea.left
        const width = chartArea.right - chartArea.left
        const height = chartArea.bottom - chartArea.top

        canvas.width = width
        canvas.height = height
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        canvas.style.top = `${top}px`
        canvas.style.left = `${left}px`
      }

      const resizeObserver = new ResizeObserver(() => {
        const currentCanvas = canvasRef.current
        if (!currentCanvas) return

        const chartArea = chart.chartArea
        const top = chartArea.top
        const left = chartArea.left
        const width = chartArea.right - chartArea.left
        const height = chartArea.bottom - chartArea.top

        currentCanvas.width = width
        currentCanvas.height = height
        currentCanvas.style.width = `${width}px`
        currentCanvas.style.height = `${height}px`
        currentCanvas.style.top = `${top}px`
        currentCanvas.style.left = `${left}px`
      })

      resizeObserver.observe(chart.canvas)

      return () => {
        resizeObserver.disconnect()
      }
    }, [chartRef])

    const getCanvasRect = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas) return null

      const width = canvas.width
      const height = canvas.height
      const left = Number.parseInt(canvas.style.left)
      const top = Number.parseInt(canvas.style.top)

      return {
        left,
        right: left + width,
        top,
        bottom: top + height,
      }
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        updateCrosshairPosition,
        handleMouseOut,
        getCanvasRect,
      }),
      [updateCrosshairPosition, handleMouseOut, getCanvasRect],
    )

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    )
  },
)

ScenarioSummaryCrosshairLine.displayName = 'ScenarioSummaryCrosshairLine'

export default ScenarioSummaryCrosshairLine
