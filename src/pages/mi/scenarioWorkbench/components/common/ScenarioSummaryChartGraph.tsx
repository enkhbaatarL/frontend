import { Box } from '@mui/material'
import {
  CategoryScale,
  Chart as ChartJS,
  ChartDataset,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  Plugin,
  Point,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Chart } from 'react-chartjs-2'

import ScenarioSummaryChartTooltip, {
  ScenarioSummaryTooltipContent,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryChartTooltip'
import ScenarioSummaryCrosshairLine, {
  ScenarioSummaryCrosshairLineHandle,
} from '@/pages/mi/scenarioWorkbench/components/common/ScenarioSummaryCrosshairLine'
import { ChartData } from '@/types/dataDetailChart'
import { disableContextMenu } from '@/utils/mouse'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Title, Tooltip, Filler, Legend)

type ScenarioSummaryChartData = ChartData & {
  dataType?: string
  resultDates?: string[]
  startDates?: string[]
  visibilityKey?: string
}

interface ScenarioSummaryChartGraphProps {
  charts: ScenarioSummaryChartData[]
  height: string | number
  targetLabel?: string
  chartVisibilityMap?: Map<string, boolean>
  hoveredChartKey?: string | null
  chartColorMap?: Map<string, string>
  spanGaps?: boolean
  disableIntroAnimation?: boolean
}

type DatasetMeta = {
  chipColor?: string
  goodsDataSourceNo?: number
  goodsDataSourceName?: string
  isDashed?: boolean
  toFixed?: number
  visibilityKey?: string
  timestamps?: string[]
  resultDates?: string[]
  startDates?: string[]
}

type ScenarioLineDataset = ChartDataset<'line', Point[]> & {
  metadata?: DatasetMeta
}

const applyOpacity = (color: string, alpha: number): string => {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  if (color.startsWith('rgba')) {
    return color.replaceAll(/[\d.]+\)$/g, `${alpha})`)
  }
  return color
}

const getCurrentLineX = (timestamps: string[], xScale: { getPixelForValue: (value: number) => number }): number | null => {
  if (timestamps.length === 0) return null

  const today = dayjs().startOf('day')
  const dateList = timestamps.map((timestamp) => dayjs(timestamp))
  const first = dateList[0]
  const last = dateList.at(-1)
  if (!first.isValid() || !last?.isValid() || today.isBefore(first, 'day') || today.isAfter(last, 'day')) return null

  const exactIndex = dateList.findIndex((date) => date.isSame(today, 'day'))
  if (exactIndex >= 0) return xScale.getPixelForValue(exactIndex)

  const nextIndex = dateList.findIndex((date) => date.isAfter(today, 'day'))
  if (nextIndex <= 0) return null

  const prev = dateList[nextIndex - 1]
  const next = dateList[nextIndex]
  const total = next.diff(prev, 'millisecond')
  if (total <= 0) return xScale.getPixelForValue(nextIndex)

  const ratio = today.diff(prev, 'millisecond') / total
  return xScale.getPixelForValue(nextIndex - 1 + ratio)
}

const TODAY_MARKER_WIDTH = 10
const TODAY_MARKER_HEIGHT = 7

const INTRO_LINE_REVEAL_MS = 1000

type ProgressiveLineAnimCtx = {
  type?: string
  index: number
  xStarted?: boolean
  yStarted?: boolean
}

const buildProgressiveLineIntroAnimation = (pointCount: number, yAxisMin: number, onComplete: () => void) => {
  const n = Math.max(1, pointCount)
  const totalDuration = INTRO_LINE_REVEAL_MS
  const segmentDuration = Math.max(4, totalDuration / n)
  const segmentDelay = (ctx: { index: number }) => (ctx.index / n) * totalDuration
  const previousY = (ctx: { index: number; datasetIndex: number; chart: ChartJS }) => {
    const yScale = ctx.chart.scales.y
    const baselineY = typeof yScale?.getPixelForValue === 'function' ? yScale.getPixelForValue(yAxisMin) : NaN
    if (ctx.index === 0) return baselineY

    const meta = ctx.chart.getDatasetMeta(ctx.datasetIndex)
    const prevPoint = meta?.data?.[ctx.index - 1] as { getProps?: (keys: string[], final?: boolean) => { y?: number } } | undefined

    if (prevPoint && typeof prevPoint.getProps === 'function') {
      try {
        const y = prevPoint.getProps(['y'], true)?.y
        if (typeof y === 'number' && Number.isFinite(y)) return y
      } catch {
        void 0
      }
    }
    return baselineY
  }

  let completeNotified = false
  return {
    x: {
      type: 'number',
      easing: 'linear',
      duration: segmentDuration,
      from: NaN,
      delay(ctx: ProgressiveLineAnimCtx) {
        if (ctx.type !== 'data' || ctx.xStarted) {
          return 0
        }
        ctx.xStarted = true
        return segmentDelay(ctx)
      },
    },
    y: {
      type: 'number',
      easing: 'linear',
      duration: segmentDuration,
      from: previousY,
      delay(ctx: ProgressiveLineAnimCtx) {
        if (ctx.type !== 'data' || ctx.yStarted) {
          return 0
        }
        ctx.yStarted = true
        return segmentDelay(ctx)
      },
    },
    onComplete: () => {
      if (completeNotified) return
      completeNotified = true
      onComplete()
    },
  } as unknown as NonNullable<ChartOptions<'line'>['animation']>
}

const VERTICAL_GRID_MAX_LINES = 96

const buildScenarioSummaryPlugin = (timestamps: string[], resultDates: string[]): Plugin<'line'> => ({
  id: 'scenarioSummaryChartChrome',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart
    const xScale = scales.x
    if (!chartArea || !xScale) return

    const { left, right, top, bottom } = chartArea

    ctx.save()
    ctx.strokeStyle = '#DEE2E6'
    ctx.lineWidth = 1
    ctx.setLineDash([1, 2])

    const len = timestamps.length
    const stride = len > VERTICAL_GRID_MAX_LINES ? Math.max(1, Math.ceil(len / VERTICAL_GRID_MAX_LINES)) : 1

    for (let index = 0; index < len; index += stride) {
      const x = Math.round(xScale.getPixelForValue(index)) + 0.5
      if (x < left || x > right) continue
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x, bottom)
      ctx.stroke()
    }

    ctx.restore()
  },
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart
    const xScale = scales.x
    if (!chartArea || !xScale) return

    const { left, right, top, bottom } = chartArea

    ctx.save()
    ctx.strokeStyle = '#212529'
    ctx.lineWidth = 1
    ctx.setLineDash([])

    ctx.beginPath()
    ctx.moveTo(left + 0.5, top)
    ctx.lineTo(left + 0.5, bottom)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(left, bottom + 0.5)
    ctx.lineTo(right, bottom + 0.5)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.font = '14px Pretendard, sans-serif'
    ctx.fillStyle = '#495057'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const seenYears = new Set<string>()
    timestamps.forEach((timestamp, index) => {
      const year = resultDates[index] || dayjs(timestamp).format('YYYY')
      if (!year || seenYears.has(year)) return
      seenYears.add(year)

      const x = xScale.getPixelForValue(index)
      if (x < left || x > right) return
      ctx.fillText(year, x, bottom + 8)
    })
    ctx.restore()

    const currentX = getCurrentLineX(timestamps, xScale)
    if (currentX === null || currentX < left || currentX > right) return

    ctx.save()
    ctx.strokeStyle = '#868E96'
    ctx.fillStyle = '#868E96'
    ctx.lineWidth = 1
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(Math.round(currentX) + 0.5, top)
    ctx.lineTo(Math.round(currentX) + 0.5, bottom)
    ctx.stroke()

    const markerX = Math.round(currentX) + 0.5
    const markerTipY = top - 3
    const markerBaseY = top - TODAY_MARKER_HEIGHT - 3

    ctx.beginPath()
    ctx.moveTo(markerX - TODAY_MARKER_WIDTH / 2, markerBaseY)
    ctx.lineTo(markerX + TODAY_MARKER_WIDTH / 2, markerBaseY)
    ctx.lineTo(markerX, markerTipY)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  },
})

const getAxisBase = (charts: ScenarioSummaryChartData[]) => {
  let best = charts[0]
  let bestLen = 0

  charts.forEach((chart) => {
    const series = chart.series?.find((s) => s.seriesId === 'main') || chart.series?.[0]
    const valuesLen = series?.values?.length ?? 0
    const tsLen = chart.timestamps?.length ?? 0
    const len = Math.max(valuesLen, tsLen)
    if (len > bestLen) {
      bestLen = len
      best = chart
    }
  })

  return best
}

const getDataMaxPrecision = (charts: ScenarioSummaryChartData[]) => {
  let maxPrecision = 0

  charts.forEach((chart) => {
    chart.series?.forEach((series) => {
      series.values.forEach((value) => {
        if (value === null || value === undefined) return
        const dotIndex = String(value).indexOf('.')
        if (dotIndex !== -1) maxPrecision = Math.max(maxPrecision, String(value).length - dotIndex - 1)
      })
    })
  })

  return maxPrecision
}

const Y_AXIS_RANGE_PADDING_RATIO = 0.08
const Y_AXIS_SINGLE_VALUE_PAD = 2.5
const Y_AXIS_TICK_TARGET = 9

const niceTickStep = (rawStep: number): number => {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  let factor = 10
  if (normalized <= 1) factor = 1
  else if (normalized <= 2) factor = 2
  else if (normalized <= 5) factor = 5
  return factor * magnitude
}

type YAxisScale = { min: number; max: number; tickStep: number }

const getYAxisScale = (charts: ScenarioSummaryChartData[]): YAxisScale => {
  let dataMin = Number.POSITIVE_INFINITY
  let dataMax = Number.NEGATIVE_INFINITY

  charts.forEach((chart) => {
    chart.series?.forEach((series) => {
      series.values.forEach((value) => {
        if (value === null || value === undefined) return
        dataMin = Math.min(dataMin, value)
        dataMax = Math.max(dataMax, value)
      })
    })
  })

  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    const tickStep = niceTickStep(5 / Math.max(1, Y_AXIS_TICK_TARGET - 1))
    return { min: 0, max: tickStep * Math.max(8, Y_AXIS_TICK_TARGET - 1), tickStep }
  }

  const range = dataMax - dataMin
  const pad = range > 0 ? range * Y_AXIS_RANGE_PADDING_RATIO : Math.max(Math.abs(dataMax) * 0.05, Y_AXIS_SINGLE_VALUE_PAD)

  let paddedMin = dataMin - pad
  const paddedMax = dataMax + pad

  if (dataMin >= 0) {
    paddedMin = Math.max(0, paddedMin)
  }

  const span = paddedMax - paddedMin
  const rawStep = span / Math.max(1, Y_AXIS_TICK_TARGET - 1)
  const tickStep = niceTickStep(rawStep)

  const alignFloor = (v: number, step: number) => Math.floor(v / step + Number.EPSILON) * step
  const alignCeil = (v: number, step: number) => Math.ceil(v / step - Number.EPSILON) * step

  let min = alignFloor(paddedMin, tickStep)
  let max = alignCeil(paddedMax, tickStep)

  if (dataMin >= 0 && min < 0) {
    min = 0
  }

  if (min >= max) {
    max = min + tickStep * Math.max(8, Y_AXIS_TICK_TARGET - 1)
  }

  return { min, max, tickStep }
}

const TOOLTIP_ANCHOR_Y_RATIO = 0.45 // 위에서 45% 위치

const getViewportTooltipPosition = (chartTooltip: { x: number; y: number }, canvasRect: DOMRect, tooltipHeight: number) => ({
  left: canvasRect.left + chartTooltip.x + 30,
  top: canvasRect.top + chartTooltip.y - tooltipHeight * TOOLTIP_ANCHOR_Y_RATIO,
})

const ScenarioSummaryChartGraph = ({
  charts,
  height,
  targetLabel,
  chartVisibilityMap,
  hoveredChartKey,
  chartColorMap,
  spanGaps = true,
  disableIntroAnimation = false,
}: ScenarioSummaryChartGraphProps) => {
  const chartRef = useRef<ChartJS<'line'> | null>(null)
  const crosshairRef = useRef<ScenarioSummaryCrosshairLineHandle | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null)

  const [tooltip, setTooltip] = useState({
    visible: false,
    top: 0,
    left: 0,
    content: {} as Record<string, ScenarioSummaryTooltipContent>,
  })
  const [isTooltipPositionCalculated, setIsTooltipPositionCalculated] = useState(false)
  const [isCrosshairVisible, setIsCrosshairVisible] = useState(false)
  const [introAnimationDone, setIntroAnimationDone] = useState(disableIntroAnimation)

  const handleIntroAnimationComplete = useCallback(() => {
    setIntroAnimationDone(true)
  }, [])

  useEffect(() => {
    if (disableIntroAnimation) {
      setIntroAnimationDone(true)
    }
  }, [disableIntroAnimation])

  const dataPointCount = useMemo(() => {
    let maxCount = 0
    charts.forEach((chart) => {
      const mainSeries = chart.series?.find((s) => s.seriesId === 'main') || chart.series?.[0]
      if (mainSeries?.values) maxCount = Math.max(maxCount, mainSeries.values.length)
    })
    return maxCount
  }, [charts])

  const axisBase = useMemo(() => getAxisBase(charts), [charts])
  const axisTimestamps = useMemo(() => axisBase?.timestamps || [], [axisBase])
  const axisResultDates = useMemo(() => axisBase?.resultDates || [], [axisBase])
  const yAxisScale = useMemo(() => getYAxisScale(charts), [charts])
  const dataMaxPrecision = useMemo(() => getDataMaxPrecision(charts), [charts])

  const datasets = useMemo<ScenarioLineDataset[]>(
    () =>
      charts.map((chart, index) => {
        const mainSeries = chart.series?.find((s) => s.seriesId === 'main') || chart.series?.[0]
        const displayName = chart.goodsDataSourceName ?? ''
        const visibilityKey = chart.visibilityKey ?? `${displayName}_${chart.dataType ?? ''}`
        const isVisible = chartVisibilityMap?.get(visibilityKey) !== false
        const color = chartColorMap?.get(displayName) ?? '#2F62A3'
        const isHovered = hoveredChartKey === visibilityKey
        const hasHover = hoveredChartKey !== null && hoveredChartKey !== undefined
        const opacity = !isVisible ? 0 : hasHover && !isHovered ? 0.2 : 1

        return {
          label: displayName,
          data: Array.from({ length: dataPointCount }, (_, pointIndex) => ({
            x: pointIndex,
            y: mainSeries?.values[pointIndex] ?? null,
          })),
          type: 'line',
          hidden: !isVisible,
          borderColor: applyOpacity(color, opacity),
          backgroundColor: color,
          borderWidth: isHovered ? 2 : 1,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          tension: 0,
          spanGaps,
          yAxisID: 'y',
          order: index,
          metadata: {
            chipColor: color,
            goodsDataSourceNo: chart.goodsDataSourceNo,
            goodsDataSourceName: displayName,
            isDashed: false,
            toFixed: dataMaxPrecision > 0 ? dataMaxPrecision : undefined,
            visibilityKey,
            timestamps: chart.timestamps,
            resultDates: chart.resultDates,
            startDates: chart.startDates,
          },
        }
      }),
    [chartColorMap, chartVisibilityMap, charts, dataMaxPrecision, dataPointCount, hoveredChartKey, spanGaps],
  )

  const scenarioPlugin = useMemo(() => buildScenarioSummaryPlugin(axisTimestamps, axisResultDates), [axisResultDates, axisTimestamps])

  const chartOptions = useMemo(() => {
    const shouldPlayIntroAnimation = !disableIntroAnimation && !introAnimationDone && dataPointCount > 0
    const introOnlyAnimations = shouldPlayIntroAnimation
      ? {
        animations: {
          colors: { duration: 0 },
          numbers: { type: 'number' as const, properties: ['x', 'y'] },
        },
      }
      : {}

    return {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio ?? 1, 2) : 1,
      animation: shouldPlayIntroAnimation
        ? buildProgressiveLineIntroAnimation(dataPointCount, yAxisScale.min, handleIntroAnimationComplete)
        : { duration: 0 },
      ...introOnlyAnimations,
      parsing: false,
      layout: {
        padding: { top: 28, right: 24, bottom: 28, left: 0 },
      },
      scales: {
        x: {
          type: 'linear',
          display: false,
          min: dataPointCount > 0 ? -1 : 0,
          max: dataPointCount > 0 ? dataPointCount : undefined,
          grid: { display: false },
          border: { display: false },
          ticks: { display: false },
        },
        y: {
          min: yAxisScale.min,
          max: yAxisScale.max,
          grid: {
            display: true,
            color: '#DEE2E6',
            borderDash: [1, 2],
            drawTicks: false,
          },
          border: { display: false },
          ticks: {
            stepSize: yAxisScale.tickStep,
            padding: 18,
            color: '#495057',
            font: {
              size: 14,
              family: 'Pretendard, sans-serif',
              weight: 'normal',
            },
            callback(value: string | number) {
              return String(value)
            },
          },
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
        },
        legend: {
          display: false,
        },
        gridAndAxes: {
          timestamps: axisTimestamps,
          resultDates: axisResultDates,
          dataPointCount,
        },
      },
    } as unknown as ChartOptions<'line'>
  }, [
    axisResultDates,
    axisTimestamps,
    dataPointCount,
    disableIntroAnimation,
    handleIntroAnimationComplete,
    introAnimationDone,
    yAxisScale.max,
    yAxisScale.min,
    yAxisScale.tickStep,
  ])

  const externalTooltipHandler = useCallback((context: { tooltip: { x: number; y: number; content: Record<string, unknown> } | null }) => {
    const { tooltip: chartTooltip } = context

    if (!chartTooltip) {
      setTooltip((prev) => ({ ...prev, visible: false }))
      setIsTooltipPositionCalculated(false)
      return
    }

    const tooltipElement = tooltipRef.current
    const canvasRect = chartRef.current?.canvas.getBoundingClientRect()
    if (!canvasRect) return

    if (!tooltipElement || tooltipElement.offsetWidth === 0 || tooltipElement.offsetHeight === 0) {
      setTooltip({
        visible: true,
        top: -9999,
        left: -9999,
        content: chartTooltip.content as Record<string, ScenarioSummaryTooltipContent>,
      })
      setIsTooltipPositionCalculated(false)

      requestAnimationFrame(() => {
        const element = tooltipRef.current
        if (!element) return

        const rect = element.getBoundingClientRect()
        const tooltipHeight = rect.height
        const currentCanvasRect = chartRef.current?.canvas.getBoundingClientRect()
        if (!currentCanvasRect) return

        const nextPosition = getViewportTooltipPosition(chartTooltip, currentCanvasRect, tooltipHeight)

        setTooltip({
          visible: true,
          top: nextPosition.top,
          left: nextPosition.left,
          content: chartTooltip.content as Record<string, ScenarioSummaryTooltipContent>,
        })
        setIsTooltipPositionCalculated(true)
      })
      return
    }

    const rect = tooltipElement.getBoundingClientRect()
    const nextPosition = getViewportTooltipPosition(chartTooltip, canvasRect, rect.height)

    setTooltip({
      visible: true,
      top: nextPosition.top,
      left: nextPosition.left,
      content: chartTooltip.content as Record<string, ScenarioSummaryTooltipContent>,
    })
    setIsTooltipPositionCalculated(true)
  }, [])

  const updateCrosshairPositionFromMousePos = useCallback(
    (mousePos: { x: number; y: number }) => {
      const chart = chartRef.current
      if (!chart?.canvas) return

      const { left, right, top, bottom } = chart.chartArea
      const isInsideChartArea = mousePos.x >= left && mousePos.x <= right && mousePos.y >= top && mousePos.y <= bottom

      setIsCrosshairVisible(isInsideChartArea)

      if (!isInsideChartArea) {
        crosshairRef.current?.handleMouseOut()
        return
      }

      const xScaleValue = chart.scales.x.getValueForPixel(mousePos.x)
      if (xScaleValue === undefined) return

      const xScaleIndex = Math.round(xScaleValue)
      const clampedIndex = Math.max(0, Math.min(xScaleIndex, dataPointCount - 1))
      const snappedPixelX = chart.scales.x.getPixelForValue(clampedIndex) ?? mousePos.x
      crosshairRef.current?.updateCrosshairPosition(snappedPixelX, mousePos.y, clampedIndex)
    },
    [dataPointCount],
  )

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
    },
    [],
  )

  return (
    <Box
      height={height}
      width="100%"
      maxWidth="100%"
      sx={{
        position: 'relative',
        boxSizing: 'border-box',
        cursor: isCrosshairVisible ? 'crosshair' : 'default',
      }}
      onContextMenu={disableContextMenu}
      onMouseMove={(event) => {
        event.stopPropagation()
        const rect = chartRef.current?.canvas.getBoundingClientRect()
        if (!rect) return

        lastMousePositionRef.current = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }

        animationFrameRef.current ??= requestAnimationFrame(() => {
          animationFrameRef.current = null
          const mousePos = lastMousePositionRef.current
          if (!mousePos) return
          updateCrosshairPositionFromMousePos(mousePos)
        })
      }}
      onMouseLeave={() => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        lastMousePositionRef.current = null
        setIsCrosshairVisible(false)
        crosshairRef.current?.handleMouseOut()
      }}
    >
      <Box
        height="100%"
        sx={{
          position: 'relative',
        }}
      >
        <Chart ref={chartRef} type="line" data={{ datasets }} options={chartOptions} plugins={[scenarioPlugin]} />
      </Box>
      <ScenarioSummaryCrosshairLine
        ref={crosshairRef}
        chartRef={chartRef as unknown as RefObject<ChartJS | null>}
        onTooltipChange={externalTooltipHandler}
      />
      <ScenarioSummaryChartTooltip
        ref={tooltipRef}
        {...tooltip}
        visibility={tooltip.visible && !isTooltipPositionCalculated && tooltip.left === -9999 ? 'hidden' : 'visible'}
        targetLabel={targetLabel}
        highlightVisibilityKey={hoveredChartKey}
      />
    </Box>
  )
}

export default ScenarioSummaryChartGraph
