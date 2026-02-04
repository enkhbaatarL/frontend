import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { Box, Stack, Typography } from '@mui/material'
import { Chart as ChartJS, Point, Tooltip, ChartDataset, ChartConfiguration, LinearScale, Tick } from 'chart.js'
import { FinancialDataPoint } from 'chart.js/auto'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import zoomPlugin from 'chartjs-plugin-zoom'
import dayjs from 'dayjs'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'

import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton.tsx'
import useSnackbar from '@/hooks/useSnackbar'
import ForecastChartTooltip, { TooltipContent } from '@/pages/mi/forecast/new-components/ForecastChartTooltip'
import ForecastCrosshairLine, { ForecastCrosshairLineHandle } from '@/pages/mi/forecast/new-components/ForecastCrosshairLine'
import gridAndAxesPlugin from '@/pages/mi/forecast/new-components/plugins/gridAndAxesPlugin'
import { generateYAxis } from '@/pages/mi/forecast/new-components/utils/chartUtils'
import { IForecastReport } from '@/service/mi/forecast'
import { ChartData, ChartType as MIChartType } from '@/types/dataDetailChart'
import { disableContextMenu } from '@/utils/mouse'
interface ForecastChartGraphProps {
  currency?: string
  unitCd?: string
  charts?: ChartData[]
  highlightChartData?: (ChartData & { dataType?: string; resultDates?: string[] }) | null
  isYAxisSeparated?: boolean
  height?: string | number
  chartType?: MIChartType
  chartVisibilityMap?: Map<string, boolean>
  hoveredChartKey?: string | null
  hoverReportCardInfo?: IForecastReport | null
  isLoading?: boolean
  onFixedModeChange?: (isFixedMode: boolean) => void
  spanGaps?: boolean
  chartColorMap?: Map<string, string>
  disableFixedMode?: boolean
  monthSelect?: string
  companyNo?: number
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

ChartJS.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement, zoomPlugin)

const createRedrawLinesPlugin = (
  hoverReportCardInfo: IForecastReport | null,
  chartVisibilityMap?: Map<string, boolean>,
  isFixedMode?: boolean,
  spanGaps: boolean = false,
  hoveredChartKey?: string | null,
  companyNo?: number,
) => {
  const visibilityMap = chartVisibilityMap
  const effectiveReportCardInfo = isFixedMode ? null : hoverReportCardInfo
  const effectiveHoveredKey = isFixedMode ? null : hoveredChartKey

  return {
    id: 'redrawLines',
    // Chart.js의 기본 그리기 비활성화 + 커스텀 그리기
    beforeDatasetDraw(chart: ChartJS, args: { index: number; meta: unknown }) {
      const { index } = args
      const dataset = chart.data.datasets[index]
      const chartType = (chart.config as ChartConfiguration).type

      // 라인 차트 타입인 경우, Chart.js의 기본 그리기를 취소(return false)
      if (dataset.type === 'line' || chartType === 'line') {
        const datasetAny = dataset as ChartDataset<'line'> & { metadata?: DatasetMeta }
        const metadata = (datasetAny as ChartDatasetType).metadata
        const isHighlight = metadata?.isHighlight === true

        if (isHighlight) {
          const meta = chart.getDatasetMeta(index)
          if (meta) {
            meta.hidden = true
          }
        }

        return false
      }
      return true
    },
    afterDraw(chart: ChartJS) {
      const ctx = chart.ctx
      const chartArea = chart.chartArea
      const xScale = chart.scales.x
      const yScale = chart.scales.y

      if (!chartArea || !xScale || !yScale) return

      const scaleMin = xScale.min ?? 0
      const scaleMax = xScale.max ?? 0
      const startIndex = Math.max(0, Math.floor(scaleMin) - 3)
      const endIndex = Math.ceil(scaleMax) + 3

      const originPixelX = xScale.getPixelForValue(0)

      ctx.save()
      // 클리핑 영역을 선 두께만큼 줄여서 선이 차트 영역 밖으로 나가지 않도록 처리
      const maxBorderWidth = Math.max(
        ...chart.data.datasets.map((d) => {
          const datasetAny = d as ChartDataset<'line'> & { borderWidth?: number }
          return (datasetAny.borderWidth as number) || 1
        }),
        1,
      )
      const clipPadding = Math.ceil(maxBorderWidth / 2)

      ctx.beginPath()
      ctx.rect(
        chartArea.left + clipPadding,
        chartArea.top + clipPadding,
        chartArea.right - chartArea.left - clipPadding * 2,
        chartArea.bottom - chartArea.top - clipPadding * 2,
      )
      ctx.clip()

      // 중복 렌더링 방지
      const drawnDatasets = new Set<string>()

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const chartType = (chart.config as ChartConfiguration).type
        if (dataset.type !== 'line' && chartType !== 'line') return

        const meta = chart.getDatasetMeta(datasetIndex)
        const datasetAny = dataset as ChartDataset<'line'> & { _opacity?: number }
        const metadata = (datasetAny as ChartDatasetType).metadata
        const isHighlight = metadata?.isHighlight === true

        if (!isHighlight && meta.hidden) return

        if (isHighlight) {
          const highlightKey = `highlight_${metadata?.goodsDataSourceNo}_${metadata?.visibilityKey}`
          if (drawnDatasets.has(highlightKey)) return
          drawnDatasets.add(highlightKey)
        } else {
          const visibilityKey = metadata?.visibilityKey as string | undefined
          const isVisible = visibilityMap?.get(visibilityKey ?? '') !== false
          if (!isVisible) return

          if (effectiveHoveredKey !== null && effectiveHoveredKey !== undefined) {
            if (visibilityKey !== effectiveHoveredKey) return
          }

          if (visibilityKey) {
            if (drawnDatasets.has(visibilityKey)) return
            drawnDatasets.add(visibilityKey)
          }
        }

        const borderColor = dataset.borderColor as string
        const baseBorderWidth = (dataset.borderWidth as number) || 1
        const borderDash = datasetAny.borderDash as number[] | undefined

        if (!borderColor || borderColor === 'transparent') return

        // hoverReportCardInfo가 있고, 현재 데이터셋이 타겟인 경우 -> 날짜 범위 체크
        const hasReportCardHover = effectiveReportCardInfo !== null && effectiveReportCardInfo !== undefined
        const isReportCardTarget =
          hasReportCardHover && metadata?.goodsDataSourceNo === effectiveReportCardInfo?.associatedGoodsDataSourceNo

        let startDate: dayjs.Dayjs | null = null
        let endDate: dayjs.Dayjs | null = null
        let timestamps: string[] | undefined = undefined

        if ((isReportCardTarget || isHighlight) && effectiveReportCardInfo) {
          startDate = dayjs(effectiveReportCardInfo.startPredictionResultDt)
          endDate = dayjs(effectiveReportCardInfo.endPredictionResultDt)
          timestamps = metadata?.timestamps
        }

        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        const data = dataset.data as { x: number; y: number | null }[]
        if (!data || data.length === 0) return

        const rangeStart = Math.max(0, startIndex)
        const rangeEnd = Math.min(data.length - 1, endIndex)

        // 데이터 포인트가 1개일 때 점으로 그리기 위한 반지름
        const singlePointRadius = companyNo === 2015 ? 3 : 2

        if (isHighlight) {
          ctx.strokeStyle = borderColor
          ctx.lineWidth = baseBorderWidth
          ctx.beginPath()
          ctx.setLineDash(borderDash || [])
          if (borderDash && borderDash.length > 0) {
            ctx.lineDashOffset = -originPixelX
          }
          let isFirstPoint = true
          let lastPixelX = 0
          let lastPixelY = 0
          let drawnPointCount = 0

          for (let i = rangeStart; i <= rangeEnd; i++) {
            const point = data[i]

            const isValidPoint = point && point.y !== null && point.y !== undefined && !Number.isNaN(point.y)

            if (!isValidPoint) {
              // 값이 없을 때:
              // spanGaps가 false(꺼짐)면 -> 선을 끊어야 하므로 isFirstPoint를 true로 만듦
              if (!spanGaps) {
                isFirstPoint = true
              }
              // spanGaps가 true(켜짐)면 -> 그냥 건너뜀 (continue).
              continue
            }

            const yValue = point.y as number
            const pixelX = xScale.getPixelForValue(point.x)
            let pixelY = yScale.getPixelForValue(yValue)
            pixelY = Math.max(chartArea.top + clipPadding, Math.min(chartArea.bottom - clipPadding, pixelY))
            lastPixelX = pixelX
            lastPixelY = pixelY
            drawnPointCount++

            if (isFirstPoint) {
              ctx.moveTo(pixelX, pixelY)
              isFirstPoint = false
            } else {
              ctx.lineTo(pixelX, pixelY)
            }
          }

          ctx.stroke()
          // 데이터가 1개일 때 선 대신 점으로 표시
          if (drawnPointCount === 1) {
            ctx.fillStyle = borderColor
            ctx.beginPath()
            ctx.arc(lastPixelX, lastPixelY, singlePointRadius, 0, Math.PI * 2)
            ctx.fill()
          }
        } else if (isReportCardTarget && startDate && endDate && timestamps) {
          let currentOpacity = 1
          let isFirstPoint = true
          let prevPixelX = 0
          let prevPixelY = 0
          let drawnPointCount = 0
          let lastPixelX = 0
          let lastPixelY = 0
          let lastPointOpacity = 1

          for (let i = rangeStart; i <= rangeEnd; i++) {
            const point = data[i]

            const isValidPoint = point && point.y !== null && point.y !== undefined && !Number.isNaN(point.y)

            if (!isValidPoint) {
              // 값이 없을 때:
              // spanGaps가 false(꺼짐)면 -> 선을 끊어야 하므로 isFirstPoint를 true로 만듦
              if (!spanGaps) {
                isFirstPoint = true
              }
              // spanGaps가 true(켜짐)면 -> 그냥 건너뜀 (continue).
              continue
            }

            const timestamp = timestamps[i]
            const yValue = point.y as number
            const pixelX = xScale.getPixelForValue(point.x)
            let pixelY = yScale.getPixelForValue(yValue)
            pixelY = Math.max(chartArea.top + clipPadding, Math.min(chartArea.bottom - clipPadding, pixelY))
            lastPixelX = pixelX
            lastPixelY = pixelY
            drawnPointCount++

            let pointOpacity = 1
            if (timestamp) {
              const timestampDate = dayjs(timestamp)
              const isAfterOrSame = timestampDate.isAfter(startDate, 'day') || timestampDate.isSame(startDate, 'day')
              const isBeforeOrSame = timestampDate.isBefore(endDate, 'day') || timestampDate.isSame(endDate, 'day')
              const isInRange = isAfterOrSame && isBeforeOrSame
              pointOpacity = isInRange ? 0 : 0.2
            }
            lastPointOpacity = pointOpacity

            if (!isFirstPoint && currentOpacity !== pointOpacity) {
              ctx.stroke()
              ctx.beginPath()
              ctx.setLineDash(borderDash || [])
              if (borderDash && borderDash.length > 0) {
                ctx.lineDashOffset = -originPixelX
              }
              ctx.moveTo(prevPixelX, prevPixelY)
              isFirstPoint = false
            }

            if (isFirstPoint) {
              ctx.beginPath()
              ctx.setLineDash(borderDash || [])
              if (borderDash && borderDash.length > 0) {
                ctx.lineDashOffset = -originPixelX
              }
              ctx.moveTo(pixelX, pixelY)
              isFirstPoint = false
            } else {
              ctx.lineTo(pixelX, pixelY)
            }

            const colorWithOpacity = applyOpacity(borderColor, pointOpacity)
            ctx.strokeStyle = colorWithOpacity
            ctx.lineWidth = baseBorderWidth

            prevPixelX = pixelX
            prevPixelY = pixelY
            currentOpacity = pointOpacity
          }

          ctx.stroke()
          // 데이터가 1개일 때 선 대신 점으로 표시
          if (drawnPointCount === 1) {
            ctx.fillStyle = applyOpacity(borderColor, lastPointOpacity)
            ctx.beginPath()
            ctx.arc(lastPixelX, lastPixelY, singlePointRadius, 0, Math.PI * 2)
            ctx.fill()
          }
        } else {
          ctx.strokeStyle = borderColor
          ctx.lineWidth = baseBorderWidth
          ctx.beginPath()
          ctx.setLineDash(borderDash || [])
          if (borderDash && borderDash.length > 0) {
            ctx.lineDashOffset = -originPixelX
          }
          let isFirstPoint = true
          let lastPixelX = 0
          let lastPixelY = 0
          let drawnPointCount = 0

          for (let i = rangeStart; i <= rangeEnd; i++) {
            const point = data[i]

            const isValidPoint = point && point.y !== null && point.y !== undefined && !Number.isNaN(point.y)

            if (!isValidPoint) {
              // 값이 없을 때:
              // spanGaps가 false(꺼짐)면 -> 선을 끊어야 하므로 isFirstPoint를 true로 만듦
              if (!spanGaps) {
                isFirstPoint = true
              }
              // spanGaps가 true(켜짐)면 -> 그냥 건너뜀 (continue).
              continue
            }

            const yValue = point.y as number
            const pixelX = xScale.getPixelForValue(point.x)
            let pixelY = yScale.getPixelForValue(yValue)
            pixelY = Math.max(chartArea.top + clipPadding, Math.min(chartArea.bottom - clipPadding, pixelY))
            lastPixelX = pixelX
            lastPixelY = pixelY
            drawnPointCount++

            if (isFirstPoint) {
              ctx.moveTo(pixelX, pixelY)
              isFirstPoint = false
            } else {
              ctx.lineTo(pixelX, pixelY)
            }
          }

          ctx.stroke()
          // 데이터가 1개일 때 선 대신 점으로 표시
          if (drawnPointCount === 1) {
            ctx.fillStyle = borderColor
            ctx.beginPath()
            ctx.arc(lastPixelX, lastPixelY, singlePointRadius, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })

      ctx.restore()
    },
  }
}

Tooltip.positioners.pointerPositioner = function (_elements, eventPosition) {
  return {
    x: eventPosition.x,
    y: eventPosition.y,
  }
}

type DatasetMeta = {
  isMain?: boolean
  chipColor?: string
  goodsNo?: number
  goodsDataNo?: number
  goodsDataName?: string
  goodsDataSourceNo?: number
  goodsDataSourceName?: string
  isDashed?: boolean
  toFixed?: number
  visibilityKey?: string
  isHighlight?: boolean
  timestamps?: string[]
  predictDates?: string[]
  resultDates?: string[]
}

type ChartDatasetType = ChartDataset<'line' | 'candlestick' | 'bar', (Point | FinancialDataPoint)[]> & {
  metadata?: DatasetMeta
}

export interface ForecastChartGraphHandle {
  resetZoom: () => void
  getCanvas: () => HTMLCanvasElement | null
}

const ForecastChartGraph = forwardRef<ForecastChartGraphHandle, Readonly<ForecastChartGraphProps>>(
  (
    {
      height,
      currency,
      unitCd,
      charts = [],
      highlightChartData = null,
      isYAxisSeparated,
      chartType = MIChartType.LINE,
      chartVisibilityMap,
      hoveredChartKey,
      hoverReportCardInfo,
      isLoading = false,
      onFixedModeChange,
      spanGaps = false,
      chartColorMap,
      disableFixedMode = false,
      monthSelect,
      companyNo,
    },
    ref,
  ) => {
    const chartRef = useRef<ChartJS | null>(null)
    const crosshairRef = useRef<ForecastCrosshairLineHandle | null>(null)
    const tooltipRef = useRef<HTMLDivElement | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const previousDataPointCountRef = useRef<number>(0)
    const zoomButtonStackRef = useRef<HTMLDivElement | null>(null)
    const mouseDownPositionRef = useRef<{ x: number; y: number } | null>(null)
    const isDragConfirmedRef = useRef<boolean>(false) // 드래그가 확정되었는지 판단하는 Ref (true -> 차트가 움직임)
    const mouseDownScaleRangeRef = useRef<{ min: number; max: number } | null>(null)
    const fixedModeScaleRangeRef = useRef<{ min: number; max: number } | null>(null) // 고정 모드 진입 시점의 x축 범위를 저장할 Ref
    const wasDraggingOnMouseUpRef = useRef<boolean>(false)

    const { showSnackbar } = useSnackbar()

    const [tooltip, setTooltip] = useState({ visible: false, top: 0, left: 0, content: {} })
    const [isCrosshairVisible, setIsCrosshairVisible] = useState(false)
    const [isPanning, setIsPanning] = useState(false)
    const [isTooltipPositionCalculated, setIsTooltipPositionCalculated] = useState(false)
    const [chartAreaCenter, setChartAreaCenter] = useState<{ top: number; left: number; bottom: number } | null>(null)
    const [fixedXScaleIndex, setFixedXScaleIndex] = useState<number | null>(null)
    const fixedXScaleIndexRef = useRef<number | null>(null)
    const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null)
    const [rippleDirection, setRippleDirection] = useState<'expand' | 'shrink' | null>(null)
    const [fixedTooltipPosition, setFixedTooltipPosition] = useState<{ top: number; left: number } | null>(null)
    const fixedTooltipPositionRef = useRef<{ top: number; left: number } | null>(null)

    const chartList = useMemo(() => charts || [], [charts])

    const dataPointCount = useMemo(() => {
      let maxCount = 0
      chartList.forEach((chart) => {
        const mainSeries = chart.series?.find((s) => s.seriesId === 'main') || chart.series?.[0]
        if (mainSeries?.values) {
          maxCount = Math.max(maxCount, mainSeries.values.length)
        }
      })
      return maxCount
    }, [chartList])

    /**
     * Crosshair/Tooltip/X축 렌더링에서 사용하는 "축 기준 timestamps"는
     * 항상 가장 긴 길이(=dataPointCount) 기준으로 맞춰야 Index fallback이 발생하지 않는다.
     */
    const axisBase = useMemo(() => {
      let best = chartList[0]
      let bestLen = 0

      chartList.forEach((c) => {
        const series = c.series?.find((s) => s.seriesId === 'main') || c.series?.[0]
        const valuesLen = series?.values?.length ?? 0
        const tsLen = c.timestamps?.length ?? 0
        const len = Math.max(valuesLen, tsLen)
        if (len > bestLen) {
          bestLen = len
          best = c
        }
      })

      return best
    }, [chartList])

    const axisTimestamps = useMemo(() => axisBase?.timestamps || [], [axisBase])
    const axisResultDates = useMemo(() => (axisBase as (ChartData & { resultDates?: string[] }) | undefined)?.resultDates || [], [axisBase])

    const firstChartSeries = useMemo(() => {
      const chart = chartList[0]
      const series = chart?.series || []

      return {
        closeDataSeries: series.find((s) => s.seriesId === 'close'),
        openDataSeries: series.find((s) => s.seriesId === 'open'),
        highDataSeries: series.find((s) => s.seriesId === 'high'),
        lowDataSeries: series.find((s) => s.seriesId === 'low'),
      }
    }, [chartList])

    const { closeDataSeries, openDataSeries, highDataSeries, lowDataSeries } = firstChartSeries

    const allDatasets = useMemo<ChartDatasetType[]>(() => {
      if (chartType === MIChartType.CANDLE) {
        const firstChart = chartList[0]
        if (!firstChart) return []

        const firstChartColor = chartColorMap?.get(firstChart.goodsDataSourceName ?? '') ?? '#2F62A3'

        return [
          {
            label: firstChart.goodsDataSourceName ?? '',
            data: Array.from({ length: dataPointCount }, (_, index) => {
              const c = closeDataSeries?.values[index] ?? null
              const o = openDataSeries?.values[index] ?? null
              const h = highDataSeries?.values[index] ?? null
              const l = lowDataSeries?.values[index] ?? null
              if (c !== null && o !== null && h !== null && l !== null) {
                return {
                  x: index,
                  c,
                  o,
                  h,
                  l,
                }
              }
              return {
                x: index,
                c: c ?? 0,
                o: o ?? 0,
                h: h ?? 0,
                l: l ?? 0,
              }
            }),
            type: 'candlestick',
            colors: {
              up: '#498B47',
              down: '#CC4D50',
              unchanged: '#5a5a5a',
            },
            borderColors: {
              up: '#498B47',
              down: '#CC4D50',
              unchanged: '#5a5a5a',
            },
            backgroundColors: {
              up: '#498B47',
              down: '#CC4D50',
              unchanged: '#5a5a5a',
            },
            borderWidth: companyNo === 2015 ? 2 : 1,
            yAxisID: 'y',
            metadata: {
              chipColor: firstChartColor,
              timestamps: firstChart.timestamps,
            },
          } as ChartDatasetType,
        ]
      }

      // companyNo가 2015일 때 borderWidth 증가량
      const borderWidthOffset = companyNo === 2015 ? 1 : 0

      return chartList.map((chart) => {
        const mainSeries = chart.series?.find((s) => s.seriesId === 'main') || chart.series?.[0]
        const dataType = (chart as ChartData & { dataType?: string }).dataType
        const isForecast = dataType === 'FORECAST'

        const displayName = chart.goodsDataSourceName ?? ''
        const chartColor = chartColorMap?.get(displayName) ?? '#2F62A3'

        // 라벨은 dataExplanation 기반 이름을 대문자로만 변환 (FORECAST 접미사 수동 추가 제거)
        const displayLabel = displayName.toUpperCase()
        const visibilityKey = `${displayName}_${dataType ?? ''}`

        return {
          label: displayLabel,
          data: Array.from({ length: dataPointCount }, (_, index) => ({
            x: index,
            y: mainSeries?.values[index] ?? null,
          })),
          type: 'line' as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clip: true as any,
          borderColor: chartColor,
          borderWidth: 1 + borderWidthOffset,
          borderDash: isForecast ? [4, 4] : undefined,
          pointRadius: 0,
          fill: false,
          tension: 0,
          spanGaps,
          yAxisID: isYAxisSeparated ? `sub-${chart.unitCd?.split('#').pop() ?? ''}` : 'y',
          metadata: {
            chipColor: chartColor,
            goodsNo: chart.goodsNo,
            goodsDataNo: chart.goodsDataNo,
            goodsDataName: chart.goodsDataName,
            goodsDataSourceNo: chart.goodsDataSourceNo,
            goodsDataSourceName: chart.goodsDataSourceName,
            isDashed: isForecast,
            visibilityKey,
            timestamps: chart.timestamps,
            predictDates: (chart as ChartData & { predictDates?: string[] }).predictDates,
            resultDates: (chart as ChartData & { resultDates?: string[] }).resultDates,
          },
        } as ChartDatasetType
      })
    }, [
      chartType,
      chartList,
      dataPointCount,
      isYAxisSeparated,
      closeDataSeries,
      openDataSeries,
      highDataSeries,
      lowDataSeries,
      spanGaps,
      chartColorMap,
      companyNo,
    ])

    const comparisonChartUnits = useMemo(
      () =>
        chartList
          .slice(1)
          .map((chart) => chart.unitCd)
          .filter((unit): unit is string => unit !== undefined),
      [chartList],
    )

    const subYAxes = useMemo(() => {
      const axes: Record<string, ReturnType<typeof generateYAxis>> = {}

      comparisonChartUnits.forEach((comparisonUnitCd, index) => {
        const unit = comparisonUnitCd?.split('#').at(-1) ?? ''
        axes[`sub-${unit}`] = generateYAxis({
          position: 'right',
          unit,
          borderColor: index === 0 ? undefined : '#DEE2E6',
        })
      })

      if (Object.keys(axes).length === 0) {
        axes['virtual'] = generateYAxis({
          position: 'right',
          unit: '',
          borderColor: '#DEE2E6',
          color: 'transparent',
          isVirtual: true,
        })
      }

      return axes
    }, [comparisonChartUnits])

    const externalTooltipHandler = useCallback(
      (context: { tooltip: { x: number; y: number; content: Record<string, unknown> } | null }) => {
        const { tooltip: chartTooltip } = context

        // 드래그 중일 때는 툴팁 업데이트 X
        if (isPanning) {
          return
        }

        if (!chartTooltip) {
          setTooltip((prev) => ({ ...prev, visible: false }))
          setIsTooltipPositionCalculated(false)
          return
        }

        // 고정 모드일 때는 저장된 툴팁 위치 사용
        if (fixedXScaleIndex !== null && fixedTooltipPositionRef.current) {
          setTooltip({
            visible: true,
            top: fixedTooltipPositionRef.current.top,
            left: fixedTooltipPositionRef.current.left,
            content: chartTooltip.content,
          })
          setIsTooltipPositionCalculated(true)
          return
        }

        const canvasRect = crosshairRef.current?.getCanvasRect()
        if (!canvasRect) {
          setIsTooltipPositionCalculated(false)
          setTooltip({
            visible: true,
            top: chartTooltip.y,
            left: chartTooltip.x + 30,
            content: chartTooltip.content,
          })
          return
        }

        // 위치 계산을 위해 먼저 툴팁을 숨겨진 상태로 렌더링하여 크기를 측정
        const tooltipElement = tooltipRef.current
        let tooltipWidth = 0
        let tooltipHeight = 0

        // 툴팁이 아직 DOM에 없거나 크기가 0인 경우, 임시로 표시하여 크기 측정
        if (!tooltipElement || tooltipElement.offsetWidth === 0 || tooltipElement.offsetHeight === 0) {
          setTooltip({
            visible: true,
            top: -9999,
            left: -9999,
            content: chartTooltip.content,
          })
          setIsTooltipPositionCalculated(false)

          // 다음 프레임에서 위치 계산
          requestAnimationFrame(() => {
            const element = tooltipRef.current
            if (!element) return

            const currentCanvasRect = crosshairRef.current?.getCanvasRect()
            if (!currentCanvasRect) return

            const rect = element.getBoundingClientRect()
            tooltipWidth = rect.width
            tooltipHeight = rect.height

            let targetX = chartTooltip.x + 30
            let targetY = chartTooltip.y - tooltipHeight / 2

            const wouldExceedRight = targetX + tooltipWidth > currentCanvasRect.right
            if (wouldExceedRight) {
              targetX = chartTooltip.x - tooltipWidth - 30
            }

            const margin = 28

            if (targetY + tooltipHeight > currentCanvasRect.bottom - margin) {
              const overflow = targetY + tooltipHeight - (currentCanvasRect.bottom - margin)
              targetY = Math.max(currentCanvasRect.top + margin, targetY - overflow)
            }

            if (targetY < currentCanvasRect.top + margin) {
              const underflow = currentCanvasRect.top + margin - targetY
              targetY = Math.min(currentCanvasRect.bottom - tooltipHeight - margin, targetY + underflow)
            }

            const finalX = Math.max(currentCanvasRect.left, Math.min(currentCanvasRect.right - tooltipWidth, targetX))
            const finalY = Math.max(currentCanvasRect.top + margin, Math.min(currentCanvasRect.bottom - tooltipHeight - margin, targetY))

            setTooltip({
              visible: true,
              top: finalY,
              left: finalX,
              content: chartTooltip.content,
            })
            setIsTooltipPositionCalculated(true)

            // 고정 모드가 활성화될 때 툴팁 위치 저장 (클릭 시점의 위치)
            if (fixedXScaleIndex !== null && !fixedTooltipPosition) {
              const position = { top: finalY, left: finalX }
              fixedTooltipPositionRef.current = position
              setFixedTooltipPosition(position)
            }
          })
          return
        }

        // 툴팁이 이미 렌더링되어 있는 경우, 바로 위치 계산
        const rect = tooltipElement.getBoundingClientRect()
        tooltipWidth = rect.width
        tooltipHeight = rect.height

        let targetX = chartTooltip.x + 30
        let targetY = chartTooltip.y - tooltipHeight / 2

        const wouldExceedRight = targetX + tooltipWidth > canvasRect.right
        if (wouldExceedRight) {
          targetX = chartTooltip.x - tooltipWidth - 30
        }

        const margin = 28

        if (targetY + tooltipHeight > canvasRect.bottom - margin) {
          const overflow = targetY + tooltipHeight - (canvasRect.bottom - margin)
          targetY = Math.max(canvasRect.top + margin, targetY - overflow)
        }

        if (targetY < canvasRect.top + margin) {
          const underflow = canvasRect.top + margin - targetY
          targetY = Math.min(canvasRect.bottom - tooltipHeight - margin, targetY + underflow)
        }

        const finalX = Math.max(canvasRect.left, Math.min(canvasRect.right - tooltipWidth, targetX))
        const finalY = Math.max(canvasRect.top + margin, Math.min(canvasRect.bottom - tooltipHeight - margin, targetY))

        setTooltip({
          visible: true,
          top: finalY,
          left: finalX,
          content: chartTooltip.content,
        })
        setIsTooltipPositionCalculated(true)

        // 고정 모드가 활성화될 때 툴팁 위치 저장 (클릭 시점의 위치)
        if (fixedXScaleIndex !== null && !fixedTooltipPosition) {
          const position = { top: finalY, left: finalX }
          fixedTooltipPositionRef.current = position
          setFixedTooltipPosition(position)
        }
      },
      [fixedXScaleIndex, fixedTooltipPosition, isPanning],
    )

    const isEmptyChart = useMemo(
      () =>
        allDatasets?.[0]?.data.every((value) => {
          if ('y' in value) return value.y === null
          if ('c' in value) return value.c === null
          return true
        }),
      [allDatasets],
    )

    const fullYAxisRange = useMemo(() => {
      if (isEmptyChart) return { min: 0, max: 0 }

      let min = Infinity
      let max = -Infinity

      allDatasets.forEach((dataset) => {
        dataset.data.forEach((point) => {
          if ('y' in point && point.y !== null && typeof point.y === 'number') {
            min = Math.min(min, point.y)
            max = Math.max(max, point.y)
          } else if ('c' in point && point.c !== null && typeof point.c === 'number') {
            const c = point.c
            const h = 'h' in point && point.h !== null && typeof point.h === 'number' ? point.h : c
            const l = 'l' in point && point.l !== null && typeof point.l === 'number' ? point.l : c
            min = Math.min(min, l)
            max = Math.max(max, h)
          }
        })
      })

      if (min === Infinity || max === -Infinity) {
        return { min: 0, max: 0 }
      }

      const range = max - min
      const padding = range * 0.1

      return {
        min: min - padding,
        max: max + padding,
      }
    }, [allDatasets, isEmptyChart])

    const createHighlightDatasets = useCallback(
      (reportCardInfo: IForecastReport | null): ChartDatasetType[] => {
        if (!reportCardInfo || chartType !== MIChartType.LINE) return []

        // 호버된 리포트 카드의 새 데이터(predictionResultList)가 있으면 그걸로 highlight 1개만 그림 (기본 그래프는 흐리게 유지)
        if (highlightChartData) {
          const mainSeries = highlightChartData.series?.find((s) => s.seriesId === 'main') || highlightChartData.series?.[0]
          const values = mainSeries?.values ?? []
          const chartColor = chartColorMap?.get(highlightChartData.goodsDataSourceName ?? '') ?? '#2F62A3'
          const highlightData = Array.from({ length: dataPointCount }, (_, index) => ({
            x: index,
            y: index < values.length ? (values[index] ?? null) : null,
          }))
          return [
            {
              label: `HIGHLIGHT_${highlightChartData.goodsDataSourceName ?? ''}`,
              data: highlightData,
              type: 'line' as const,
              borderColor: chartColor,
              borderWidth: companyNo === 2015 ? 3 : 2,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false,
              tension: 0,
              spanGaps,
              yAxisID: isYAxisSeparated ? `sub-${highlightChartData.unitCd?.split('#').pop() ?? ''}` : 'y',
              metadata: {
                chipColor: chartColor,
                goodsDataSourceNo: highlightChartData.goodsDataSourceNo,
                goodsDataSourceName: highlightChartData.goodsDataSourceName,
                isDashed: true,
                isHighlight: true,
                timestamps: highlightChartData.timestamps,
              },
            } as ChartDatasetType,
          ]
        }

        // highlightChartData 없으면 기존: chartList에서 같은 goodsDataSourceNo인 차트의 구간만 추출
        const result: ChartDatasetType[] = []
        chartList.forEach((chart) => {
          if (chart.goodsDataSourceNo !== reportCardInfo.associatedGoodsDataSourceNo) return

          const mainSeries = chart.series?.find((s) => s.seriesId === 'main') || chart.series?.[0]
          if (!mainSeries) return

          const dataType = (chart as ChartData & { dataType?: string }).dataType
          const isForecast = dataType === 'FORECAST'
          const chartColor = chartColorMap?.get(chart.goodsDataSourceName ?? '') ?? '#2F62A3'

          const visibilityKey = `${chart.goodsDataSourceName ?? ''}_${dataType ?? ''}`
          const isVisible = chartVisibilityMap?.get(visibilityKey) !== false

          if (!isVisible) return

          const timestamps = chart.timestamps || []
          const startDate = dayjs(reportCardInfo.startPredictionResultDt)
          const endDate = dayjs(reportCardInfo.endPredictionResultDt)

          const highlightData = Array.from({ length: dataPointCount }, (_, index) => {
            const timestamp = timestamps[index]
            if (!timestamp) {
              return { x: index, y: null }
            }

            const timestampDate = dayjs(timestamp)
            const isAfterOrSame = timestampDate.isAfter(startDate, 'day') || timestampDate.isSame(startDate, 'day')
            const isBeforeOrSame = timestampDate.isBefore(endDate, 'day') || timestampDate.isSame(endDate, 'day')
            const isInRange = isAfterOrSame && isBeforeOrSame

            return {
              x: index,
              y: isInRange ? (mainSeries?.values[index] ?? null) : null,
            }
          })

          result.push({
            label: `HIGHLIGHT_${chart.goodsDataSourceName ?? ''}`,
            data: highlightData,
            type: 'line' as const,
            borderColor: chartColor,
            borderWidth: companyNo === 2015 ? 3 : 2,
            borderDash: isForecast ? [4, 4] : undefined,
            pointRadius: 0,
            fill: false,
            tension: 0,
            spanGaps,
            yAxisID: isYAxisSeparated ? `sub-${chart.unitCd?.split('#').pop() ?? ''}` : 'y',
            metadata: {
              chipColor: chartColor,
              goodsDataSourceNo: chart.goodsDataSourceNo,
              goodsDataSourceName: chart.goodsDataSourceName,
              isDashed: isForecast,
              isHighlight: true,
              timestamps: chart.timestamps,
            },
          } as ChartDatasetType)
        })

        return result
      },
      [chartType, chartList, dataPointCount, chartVisibilityMap, isYAxisSeparated, chartColorMap, spanGaps, highlightChartData, companyNo],
    )

    const mainDataset = useMemo(() => [...allDatasets], [allDatasets])

    const redrawLinesPlugin = useMemo(
      () =>
        createRedrawLinesPlugin(
          hoverReportCardInfo ?? null,
          chartVisibilityMap,
          fixedXScaleIndex !== null,
          spanGaps,
          hoveredChartKey,
          companyNo,
        ),
      [hoverReportCardInfo, chartVisibilityMap, fixedXScaleIndex, spanGaps, hoveredChartKey, companyNo],
    )

    useEffect(() => {
      const chart = chartRef.current
      if (!chart) return

      if (chartType === MIChartType.CANDLE) return

      const currentHoveredKey = fixedXScaleIndex === null ? hoveredChartKey : null
      const hasHover = currentHoveredKey !== null && currentHoveredKey !== undefined
      const currentReportCardInfo = fixedXScaleIndex === null ? hoverReportCardInfo : null
      const hasReportCardHover = currentReportCardInfo !== null && currentReportCardInfo !== undefined

      // mainDataset을 기준으로 baseDatasets 생성 (중복 방지)
      // chart.data.datasets는 이전에 추가된 highlight dataset을 포함할 수 있으므로 mainDataset을 기준으로 재구성
      const baseDatasets = mainDataset.map((dataset) => ({ ...dataset }))

      const newHighlightDatasets = createHighlightDatasets(currentReportCardInfo ?? null)

      baseDatasets.forEach((dataset, datasetIndex) => {
        const metadata = (dataset as ChartDatasetType).metadata
        if (!metadata) return

        const visibilityKey = metadata.visibilityKey as string | undefined
        const isVisible = chartVisibilityMap?.get(visibilityKey ?? '') !== false
        const chipColor = metadata.chipColor as string

        const meta = chart.getDatasetMeta(datasetIndex)
        if (meta) {
          meta.hidden = !isVisible || !chipColor
        }

        if (!isVisible || !chipColor) {
          dataset.borderColor = 'transparent'
          return
        }

        const isHovered = visibilityKey === currentHoveredKey

        const chartOpacity = hasReportCardHover ? 0.2 : isHovered ? 1 : hasHover ? 0.2 : 1

        const baseBorderWidth = hasReportCardHover ? 1 : isHovered ? 2 : 1
        const borderWidth = companyNo === 2015 ? baseBorderWidth + 1 : baseBorderWidth

        dataset.borderColor = applyOpacity(chipColor, chartOpacity)
        dataset.borderWidth = borderWidth
      })

      chart.data.datasets = [...baseDatasets, ...newHighlightDatasets]
      chart.update('none')

      requestAnimationFrame(() => {
        if (chart.chartArea) {
          const centerX = chart.chartArea.left + chart.chartArea.width / 2
          const centerY = chart.chartArea.top + chart.chartArea.height / 2
          const bottom = chart.chartArea.bottom
          setChartAreaCenter({ left: centerX, top: centerY, bottom })
        }
      })
    }, [
      hoveredChartKey,
      hoverReportCardInfo,
      chartType,
      chartVisibilityMap,
      mainDataset,
      createHighlightDatasets,
      fixedXScaleIndex,
      companyNo,
    ])

    useEffect(() => {
      const chart = chartRef.current
      if (!chart) {
        return undefined
      }

      const updateChartAreaCenter = () => {
        if (chart.chartArea) {
          const centerX = chart.chartArea.left + chart.chartArea.width / 2
          const centerY = chart.chartArea.top + chart.chartArea.height / 2
          const bottom = chart.chartArea.bottom
          setChartAreaCenter({ left: centerX, top: centerY, bottom })
        }
      }

      const timeoutId = setTimeout(() => {
        updateChartAreaCenter()
      }, 100)

      const handleResize = () => {
        requestAnimationFrame(updateChartAreaCenter)
      }
      window.addEventListener('resize', handleResize)

      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener('resize', handleResize)
      }
    }, [charts, chartType, dataPointCount])

    const hasMatchingData = useMemo(() => {
      if (!hoverReportCardInfo || chartType !== MIChartType.LINE) return true

      const highlightDatasets = createHighlightDatasets(hoverReportCardInfo)
      return highlightDatasets.some((dataset) =>
        dataset.data.some((point) => {
          if ('y' in point) {
            return point.y !== null && point.y !== undefined
          }
          return false
        }),
      )
    }, [hoverReportCardInfo, chartType, createHighlightDatasets])

    const chartOptions = useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,
        datasets: {
          line: {
            clip: true as unknown as number | false,
          },
        },
        animation: {
          duration: 0,
        },
        scales: {
          x: {
            type: 'linear' as const,
            display: false,
            title: {
              display: false,
            },
            grid: {
              display: false,
            },
            // x축 간격 1칸만큼 좌우 여백
            min: dataPointCount > 0 ? -1 : 0,
            max: dataPointCount > 0 ? dataPointCount : undefined,
            bounds: 'data' as const,
            grace: 0,
            offset: false,
            border: {
              display: false,
            },
            afterBuildTicks(axis: LinearScale) {
              const totalLabels = dataPointCount
              if (totalLabels === 0) return

              const fullMin = 0
              const fullMax = totalLabels - 1
              const targetCount = 10
              const range = fullMax - fullMin
              const step = Math.max(1, Math.ceil(range / targetCount))

              const newTicks: { value: number }[] = []
              let currentTick = Math.ceil(fullMin)

              while (currentTick <= Math.floor(fullMax)) {
                if (currentTick >= 0 && currentTick < totalLabels) {
                  newTicks.push({ value: currentTick })
                }
                currentTick += step
              }

              const lastIndex = totalLabels - 1
              if (lastIndex >= Math.ceil(fullMin)) {
                const hasLastTick = newTicks.some((t) => t.value === lastIndex)
                if (!hasLastTick) {
                  newTicks.push({ value: lastIndex })
                }
              }

              newTicks.sort((a, b) => a.value - b.value)
              axis.ticks = newTicks
            },
            afterTickToLabelConversion(axis: LinearScale) {
              axis.ticks.forEach((tick: Tick) => {
                tick.label = ''
              })
            },
            ticks: {
              display: false,
              padding: 4,
              color: '#2E3F5E',
              font: {
                size: 14,
                family: 'Pretendard,sans-serif',
                weight: 'normal' as const,
              },
              callback() {
                return ''
              },
            },
          },
          y: {
            ...generateYAxis({
              isMain: true,
              position: 'left',
              unit: [currency ? `${currency}` : '', unitCd?.split('#').at(-1) ?? unitCd ?? ''].filter(Boolean).join('/'),
              borderColor: '#000000',
              padding: 14,
              maxTicksLimit: 19, // y축 최대 틱 수 제한
              toFixed: 1,
            }),
            min: fullYAxisRange.min,
            max: fullYAxisRange.max,
            afterDataLimits(scale: { min: number; max: number }) {
              scale.min = fullYAxisRange.min
              scale.max = fullYAxisRange.max
            },
            afterBuildTicks(axis: LinearScale) {
              if (axis.ticks && axis.ticks.length < 19) {
                const scale = axis as { min: number; max: number; ticks: Array<{ value: number }> }
                const min = scale.min ?? 0
                const max = scale.max ?? 0
                const range = max - min

                if (range > 0 && !isEmptyChart) {
                  const step = range / 18
                  const newTicks: Array<{ value: number }> = []

                  for (let i = 0; i <= 18; i++) {
                    const value = min + step * i
                    newTicks.push({ value })
                  }

                  axis.ticks = newTicks
                }
              }
            },
            afterTickToLabelConversion(axis: LinearScale) {
              if (axis.ticks.length > 0) {
                const ctx = axis.chart.ctx
                const chartArea = axis.chart.chartArea

                if (ctx && chartArea) {
                  const firstTick = axis.ticks[0]
                  const metrics = ctx.measureText(firstTick.label as string)
                  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
                  const firstLabelBoundary = axis.getPixelForTick(0) - chartArea.bottom - textHeight
                  if (firstLabelBoundary < 0) firstTick.label = ''

                  const lastTick = axis.ticks[axis.ticks.length - 1]
                  const lastMetrics = ctx.measureText(lastTick.label as string)
                  const lastTextHeight = lastMetrics.actualBoundingBoxAscent + lastMetrics.actualBoundingBoxDescent
                  const lastLabelBoundary = axis.getPixelForTick(axis.ticks.length - 1) + lastTextHeight / 2
                  if (lastLabelBoundary > axis.height) lastTick.label = ''
                }
              }
            },
          },
          ...(isYAxisSeparated ? subYAxes : {}),
        },
        plugins: {
          tooltip: {
            enabled: false,
          },
          verticalAxisDecorator: {
            yIDs: ['y', ...Object.keys(subYAxes)],
          },
          legend: {
            display: false,
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              modifierKey: null,
              threshold: 10, // 10px 이상 움직여야 드래그 처리
              onPan: ({ chart: _chart }: { chart: ChartJS }) => {
                // 고정 모드이면 이동 불가
                if (fixedXScaleIndexRef.current !== null) {
                  if (fixedModeScaleRangeRef.current) {
                    _chart.zoomScale('x', {
                      min: fixedModeScaleRangeRef.current.min,
                      max: fixedModeScaleRangeRef.current.max,
                    })
                  }
                  return false
                }
                if (!isDragConfirmedRef.current) return false

                requestAnimationFrame(() => {
                  if (lastMousePositionRef.current && chartRef.current?.canvas && !fixedXScaleIndex) {
                    const mousePos = lastMousePositionRef.current
                    // 드래그 후에도 마우스 위치는 동일하지만, 데이터 좌표는 변경되었을 수 있으므로
                    // 현재 마우스 위치에 해당하는 데이터 인덱스를 다시 계산
                    const xScaleValue = chartRef.current.scales.x.getValueForPixel(mousePos.x)
                    if (xScaleValue !== undefined) {
                      const xScaleIndex = Math.round(xScaleValue)
                      const clampedIndex = Math.max(0, Math.min(xScaleIndex, dataPointCount - 1))
                      const snappedPixelX = chartRef.current.scales.x.getPixelForValue(clampedIndex) ?? mousePos.x
                      crosshairRef.current?.updateCrosshairPosition(snappedPixelX, mousePos.y, clampedIndex)
                    }
                  }
                })

                return true
              },
            },
            zoom: {
              wheel: {
                enabled: true,
                modifierKey: 'ctrl',
              },
              pinch: {
                enabled: true,
              },
              mode: 'x',
              onZoom: () => {
                // 줌 후 차트가 업데이트되면 Crosshair 위치를 다시 계산하여 업데이트
                requestAnimationFrame(() => {
                  if (lastMousePositionRef.current && chartRef.current?.canvas && !fixedXScaleIndex) {
                    const mousePos = lastMousePositionRef.current
                    const xScaleValue = chartRef.current.scales.x.getValueForPixel(mousePos.x)
                    if (xScaleValue !== undefined) {
                      const xScaleIndex = Math.round(xScaleValue)
                      const clampedIndex = Math.max(0, Math.min(xScaleIndex, dataPointCount - 1))
                      const snappedPixelX = chartRef.current.scales.x.getPixelForValue(clampedIndex) ?? mousePos.x
                      crosshairRef.current?.updateCrosshairPosition(snappedPixelX, mousePos.y, clampedIndex)
                    }
                  }
                })
              },
            },
            limits: {
              x: {
                // 초기 뷰와 동일하게 좌우 한 칸 여백(-1 ~ dataPointCount) 유지
                min: dataPointCount > 0 ? -1 : 0,
                max: dataPointCount > 0 ? dataPointCount : undefined,
                minRange: 2,
              },
              y: {
                // Y축 초기 렌더링 시 고정
                min: fullYAxisRange.min,
                max: fullYAxisRange.max,
              },
            },
          },
          gridAndAxes: {
            timestamps: axisTimestamps,
            resultDates: axisResultDates,
            dataPointCount,
          },
        },
      }),
      // onPan 콜백은 클로저로 최신 fixedXScaleIndex와 isDragConfirmedRef를 참조하므로 의존성 배열에 추가하지 않음
      // fixedXScaleIndex를 의존성에 추가하면 fixedXScaleIndex 변경 시마다 chartOptions가 재생성되어 불필요한 리렌더링 발생
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isEmptyChart, dataPointCount, axisTimestamps, axisResultDates, subYAxes, unitCd, currency, isYAxisSeparated, fullYAxisRange],
    )

    useEffect(() => {
      const chart = chartRef.current
      if (!chart) return

      const zoomOptions = chart.config.options?.plugins?.zoom
      if (zoomOptions) {
        const isEnabled = fixedXScaleIndex === null
        if (zoomOptions.pan) {
          zoomOptions.pan.enabled = isEnabled
        }
        if (zoomOptions.zoom?.wheel) {
          zoomOptions.zoom.wheel.enabled = isEnabled
        }
        if (zoomOptions.zoom?.pinch) {
          zoomOptions.zoom.pinch.enabled = isEnabled
        }

        chart.update('none')
      }
    }, [fixedXScaleIndex])

    useImperativeHandle(
      ref,
      () => ({
        resetZoom: () => {
          if (chartRef.current) {
            chartRef.current.resetZoom()
          }
          fixedXScaleIndexRef.current = null
          fixedModeScaleRangeRef.current = null
          setFixedXScaleIndex(null)
          fixedTooltipPositionRef.current = null
          setFixedTooltipPosition(null)
          crosshairRef.current?.setFixedPosition(null, 0)
          isDragConfirmedRef.current = false
          wasDraggingOnMouseUpRef.current = false
          setIsPanning(false)
          mouseDownPositionRef.current = null
          mouseDownScaleRangeRef.current = null
        },
        getCanvas: () => chartRef.current?.canvas ?? null,
      }),
      [],
    )

    useEffect(() => {
      const currentDataPointCount = dataPointCount
      const prevDataPointCount = previousDataPointCountRef.current

      if (currentDataPointCount !== prevDataPointCount) {
        previousDataPointCountRef.current = currentDataPointCount

        if (chartRef.current && dataPointCount > 0) {
          chartRef.current.resetZoom()
        }
      }
    }, [dataPointCount])

    const updateCrosshairPositionFromMousePos = useCallback(
      (mousePos: { x: number; y: number }) => {
        if (!chartRef.current?.canvas) return

        // 드래그 중일 때는 크로스헤어와 툴팁 업데이트하지 않음
        if (isPanning) {
          return
        }

        const rect = chartRef.current.canvas.getBoundingClientRect()
        const isInsideCanvas = mousePos.x >= 0 && mousePos.x <= rect.width && mousePos.y >= 0 && mousePos.y <= rect.height

        setIsCrosshairVisible(isInsideCanvas)

        if (isInsideCanvas) {
          const xScaleValue = chartRef.current?.scales.x.getValueForPixel(mousePos.x)
          if (xScaleValue !== undefined) {
            const xScaleIndex = Math.round(xScaleValue)
            const clampedIndex = Math.max(0, Math.min(xScaleIndex, dataPointCount - 1))
            const snappedPixelX = chartRef.current?.scales.x.getPixelForValue(clampedIndex) ?? mousePos.x
            crosshairRef.current?.updateCrosshairPosition(snappedPixelX, mousePos.y, clampedIndex)
          }
        } else {
          crosshairRef.current?.handleMouseOut()
        }
      },
      [dataPointCount, isPanning],
    )

    // 확대/축소 핸들러
    const handleZoomIn = useCallback(() => {
      const chart = chartRef.current
      if (!chart) return

      const xScale = chart.scales.x
      if (!xScale) return

      const currentMin = xScale.min ?? 0
      const currentMax = xScale.max ?? dataPointCount - 1
      const currentRange = currentMax - currentMin
      const center = (currentMin + currentMax) / 2
      const zoomFactor = 0.6

      const newRange = currentRange * zoomFactor
      const minRange = 2 // 휠 줌 제한과 동일한 최소 범위
      const constrainedRange = Math.max(newRange, minRange)

      let newMin = Math.max(0, center - constrainedRange / 2)
      let newMax = Math.min(dataPointCount - 1, center + constrainedRange / 2)

      if (newMax - newMin < minRange) {
        const rangeDiff = minRange - (newMax - newMin)
        newMin = Math.max(0, newMin - rangeDiff / 2)
        newMax = Math.min(dataPointCount - 1, newMax + rangeDiff / 2)
      }

      const finalMin = Math.max(0, newMin)
      const finalMax = Math.min(dataPointCount > 0 ? dataPointCount - 1 : 0, newMax)

      chart.zoomScale('x', { min: finalMin, max: finalMax })

      // 드래그 상태 해제 및 크로스라인과 툴팁 숨기기
      setIsPanning(false)
      setIsCrosshairVisible(false)
      crosshairRef.current?.handleMouseOut()
      setTooltip((prev) => ({ ...prev, visible: false }))
      // 마우스 위치 초기화하여 다음 마우스 이동 시 크로스헤어가 다시 표시되도록 함
      lastMousePositionRef.current = null
      mouseDownPositionRef.current = null
    }, [dataPointCount])

    const handleZoomOut = useCallback(() => {
      const chart = chartRef.current
      if (!chart) return

      const xScale = chart.scales.x
      if (!xScale) return

      const fullMin = -1
      const fullMax = dataPointCount > 0 ? dataPointCount : 0
      const currentMin = xScale.min ?? fullMin
      const currentMax = xScale.max ?? fullMax
      const currentRange = currentMax - currentMin
      const center = (currentMin + currentMax) / 2
      // 확대(0.6)와 역수 관계로 한 번 축소가 한 번 확대를 되돌리도록 함
      const zoomFactor = 1 / 0.6

      const newRange = currentRange * zoomFactor
      const minRange = 2 // 휠 줌 제한과 동일한 최소 범위

      // 축소 시 전체 뷰(좌우 한 칸 여백)를 넘어가면 초기 상태로 스냅
      const fullRangeWithPadding = fullMax - fullMin
      if (newRange >= fullRangeWithPadding) {
        chart.zoomScale('x', { min: fullMin, max: fullMax })
      } else {
        let newMin = Math.max(fullMin, center - newRange / 2)
        let newMax = Math.min(fullMax, center + newRange / 2)

        if (newMax - newMin < minRange) {
          const rangeDiff = minRange - (newMax - newMin)
          newMin = Math.max(fullMin, newMin - rangeDiff / 2)
          newMax = Math.min(fullMax, newMax + rangeDiff / 2)
        }

        const finalMin = Math.max(fullMin, newMin)
        const finalMax = Math.min(fullMax, newMax)

        chart.zoomScale('x', { min: finalMin, max: finalMax })
      }

      // 드래그 상태 해제 및 크로스라인과 툴팁 숨기기 (마우스 이동 시 다시 표시됨)
      setIsPanning(false)
      setIsCrosshairVisible(false)
      crosshairRef.current?.handleMouseOut()
      setTooltip((prev) => ({ ...prev, visible: false }))
      // 마우스 위치 초기화하여 다음 마우스 이동 시 크로스헤어가 다시 표시되도록 함
      lastMousePositionRef.current = null
      mouseDownPositionRef.current = null
    }, [dataPointCount])

    useEffect(() => {
      onFixedModeChange?.(fixedXScaleIndex !== null)
    }, [fixedXScaleIndex, onFixedModeChange])

    const showSkeleton = isLoading || !charts || charts.length === 0
    const showChart = !showSkeleton

    const handleCloseFixedMode = useCallback(() => {
      fixedXScaleIndexRef.current = null
      fixedModeScaleRangeRef.current = null
      fixedTooltipPositionRef.current = null
      setFixedXScaleIndex(null)
      setFixedTooltipPosition(null)
      setRipplePosition(null)
      setRippleDirection(null)

      isDragConfirmedRef.current = false
      wasDraggingOnMouseUpRef.current = false
      setIsPanning(false)
      mouseDownPositionRef.current = null
      mouseDownScaleRangeRef.current = null

      crosshairRef.current?.setFixedPosition(null, 0, true)
      setIsCrosshairVisible(false)
      setTooltip((prev) => ({ ...prev, visible: false }))

      if (lastMousePositionRef.current && chartRef.current?.canvas) {
        requestAnimationFrame(() => {
          const mousePos = lastMousePositionRef.current
          if (!mousePos || !chartRef.current) return

          updateCrosshairPositionFromMousePos(mousePos)
        })
      }
    }, [updateCrosshairPositionFromMousePos])

    return (
      <Box
        ref={containerRef}
        height={height}
        width={'100%'}
        maxWidth={'100%'}
        sx={{
          position: 'relative',
          boxSizing: 'border-box',
          cursor: showChart
            ? fixedXScaleIndex !== null
              ? 'default'
              : isPanning
                ? 'grabbing'
                : isCrosshairVisible
                  ? 'crosshair'
                  : 'grab'
            : 'default',
        }}
        onContextMenu={disableContextMenu}
        onMouseDown={(event) => {
          if (showSkeleton) {
            return
          }
          if (fixedXScaleIndexRef.current !== null) {
            return
          }
          if (event.button === 0 && !event.ctrlKey && !event.metaKey) {
            if (chartRef.current?.canvas && chartRef.current.scales.x) {
              const rect = chartRef.current.canvas.getBoundingClientRect()
              mouseDownPositionRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              }

              mouseDownScaleRangeRef.current = {
                min: chartRef.current.scales.x.min,
                max: chartRef.current.scales.x.max,
              }
            }
            isDragConfirmedRef.current = false
            wasDraggingOnMouseUpRef.current = false
          }
        }}
        onClick={(event) => {
          if (showSkeleton) {
            return
          }
          // 확대/축소 버튼 영역 클릭 체크
          const zoomButtonRect = zoomButtonStackRef.current?.getBoundingClientRect()
          if (zoomButtonRect) {
            const isInsideZoomButton =
              event.clientX >= zoomButtonRect.left &&
              event.clientX <= zoomButtonRect.right &&
              event.clientY >= zoomButtonRect.top &&
              event.clientY <= zoomButtonRect.bottom

            if (isInsideZoomButton) {
              return
            }
          }

          const wasDragging = wasDraggingOnMouseUpRef.current || isPanning || isDragConfirmedRef.current

          if (wasDragging) {
            mouseDownPositionRef.current = null
            mouseDownScaleRangeRef.current = null
            isDragConfirmedRef.current = false
            wasDraggingOnMouseUpRef.current = false
            return
          }

          // 고정 모드가 비활성화된 경우 클릭 이벤트 무시
          if (disableFixedMode) {
            mouseDownPositionRef.current = null
            mouseDownScaleRangeRef.current = null
            isDragConfirmedRef.current = false
            wasDraggingOnMouseUpRef.current = false
            return
          }

          if (fixedXScaleIndex === null && chartRef.current?.canvas) {
            const tooltipContent = tooltip.content as Record<string, TooltipContent>
            const forecastItems = Object.values(tooltipContent).filter((item) => item.isForecast === true)
            const hasForecastWithValue = forecastItems.some((item) => item.value !== undefined)

            if (forecastItems.length > 0 && !hasForecastWithValue) {
              // forecast 항목이 있지만 모두 값이 없는 경우 고정 모드 진입하지 않음
              mouseDownPositionRef.current = null
              mouseDownScaleRangeRef.current = null
              isDragConfirmedRef.current = false
              wasDraggingOnMouseUpRef.current = false
              showSnackbar('Forecast data does not exist', {
                variant: 'info',
              })
              return
            }

            const rect = chartRef.current.canvas.getBoundingClientRect()
            if (rect) {
              const mousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              }

              const xScaleValue = chartRef.current?.scales.x.getValueForPixel(mousePos.x)
              if (xScaleValue !== undefined) {
                const xScaleIndex = Math.round(xScaleValue)
                const clampedIndex = Math.max(0, Math.min(xScaleIndex, dataPointCount - 1))

                const snappedPixelX = chartRef.current?.scales.x.getPixelForValue(clampedIndex) ?? mousePos.x

                // 리플 효과 시작 위치 설정
                if (chartRef.current.chartArea) {
                  const chartArea = chartRef.current.chartArea
                  setRipplePosition({
                    x: mousePos.x - chartArea.left,
                    y: mousePos.y - chartArea.top,
                  })
                  setRippleDirection('expand')
                }

                fixedXScaleIndexRef.current = clampedIndex

                if (chartRef.current.scales.x) {
                  fixedModeScaleRangeRef.current = {
                    min: chartRef.current.scales.x.min,
                    max: chartRef.current.scales.x.max,
                  }
                }

                const zoomOptions = chartRef.current.config.options?.plugins?.zoom
                if (zoomOptions?.pan) {
                  zoomOptions.pan.enabled = false
                }
                if (zoomOptions?.zoom?.wheel) {
                  zoomOptions.zoom.wheel.enabled = false
                }
                if (zoomOptions?.zoom?.pinch) {
                  zoomOptions.zoom.pinch.enabled = false
                }

                isDragConfirmedRef.current = false
                setIsPanning(false)

                setFixedXScaleIndex(clampedIndex)
                crosshairRef.current?.setFixedPosition(clampedIndex, snappedPixelX)

                if (tooltipRef.current && tooltip.visible) {
                  const tooltipRect = tooltipRef.current.getBoundingClientRect()
                  if (tooltipRect.width > 0 && tooltipRect.height > 0) {
                    const position = { top: tooltip.top, left: tooltip.left }
                    fixedTooltipPositionRef.current = position
                    setFixedTooltipPosition(position)
                  }
                }

                setTimeout(() => {
                  setRipplePosition(null)
                  setRippleDirection(null)
                }, 600)
              }
            }
          }

          // 마우스 다운 위치 초기화
          mouseDownPositionRef.current = null
          mouseDownScaleRangeRef.current = null
          isDragConfirmedRef.current = false
          wasDraggingOnMouseUpRef.current = false
        }}
        onMouseUp={(event) => {
          wasDraggingOnMouseUpRef.current = isPanning || isDragConfirmedRef.current

          setIsPanning(false)
          if (!fixedXScaleIndex && chartRef.current?.canvas) {
            const rect = chartRef.current.canvas.getBoundingClientRect()
            if (rect) {
              const mousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              }
              lastMousePositionRef.current = mousePos
              updateCrosshairPositionFromMousePos(mousePos)
            }
          }
        }}
        onMouseMove={(event) => {
          event.stopPropagation()

          if (fixedXScaleIndexRef.current !== null) {
            if (mouseDownPositionRef.current) {
              mouseDownPositionRef.current = null
              mouseDownScaleRangeRef.current = null
              isDragConfirmedRef.current = false
              setIsPanning(false)
            }
          }

          if (mouseDownPositionRef.current && chartRef.current?.canvas && !isPanning && fixedXScaleIndexRef.current === null) {
            const rect = chartRef.current.canvas.getBoundingClientRect()
            const currentPos = {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            }
            const distance = Math.sqrt(
              Math.pow(currentPos.x - mouseDownPositionRef.current.x, 2) + Math.pow(currentPos.y - mouseDownPositionRef.current.y, 2),
            )
            if (distance > 10) {
              lastMousePositionRef.current = currentPos
              setIsPanning(true)
              isDragConfirmedRef.current = true
              setIsCrosshairVisible(false)
              if (!fixedXScaleIndex) {
                crosshairRef.current?.handleMouseOut()
                setTooltip((prev) => ({ ...prev, visible: false }))
              }
              return
            }
          }

          if (isPanning) {
            const rect = chartRef.current?.canvas.getBoundingClientRect()
            if (rect) {
              lastMousePositionRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              }
            }
            setIsCrosshairVisible(false)
            if (!fixedXScaleIndex) {
              setTooltip((prev) => ({ ...prev, visible: false }))
            }
            return
          }

          const zoomButtonRect = zoomButtonStackRef.current?.getBoundingClientRect()
          if (zoomButtonRect) {
            const isInsideZoomButton =
              event.clientX >= zoomButtonRect.left &&
              event.clientX <= zoomButtonRect.right &&
              event.clientY >= zoomButtonRect.top &&
              event.clientY <= zoomButtonRect.bottom

            if (isInsideZoomButton) {
              setIsCrosshairVisible(false)
              if (!fixedXScaleIndex) {
                crosshairRef.current?.handleMouseOut()
              }
              if (!fixedXScaleIndex) {
                setTooltip((prev) => ({ ...prev, visible: false }))
              }
              return
            }
          }

          if (fixedXScaleIndex && chartRef.current?.canvas) {
            const rect = chartRef.current.canvas.getBoundingClientRect()
            if (rect) {
              const mousePos = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              }
              lastMousePositionRef.current = mousePos
              const snappedPixelX = chartRef.current?.scales.x.getPixelForValue(fixedXScaleIndex) ?? mousePos.x
              crosshairRef.current?.updateCrosshairPosition(snappedPixelX, mousePos.y, fixedXScaleIndex)
            }
            return
          }

          const rect = chartRef.current?.canvas.getBoundingClientRect()
          if (rect) {
            lastMousePositionRef.current = {
              x: event.clientX - rect.left,
              y: event.clientY - rect.top,
            }
          }

          if (animationFrameRef.current === null) {
            animationFrameRef.current = requestAnimationFrame(() => {
              animationFrameRef.current = null

              const mousePos = lastMousePositionRef.current
              if (!mousePos) return

              updateCrosshairPositionFromMousePos(mousePos)
            })
          }
        }}
        onWheel={(event) => {
          if (fixedXScaleIndex !== null) {
            return
          }
          if (event.ctrlKey) {
            event.stopPropagation()
            chartRef.current?.canvas.dispatchEvent(
              new WheelEvent(event.type, {
                deltaMode: event.deltaMode,
                deltaX: event.deltaX,
                deltaY: event.deltaY,
                deltaZ: event.deltaZ,
                clientX: event.clientX,
                clientY: event.clientY,
                ctrlKey: event.ctrlKey,
                bubbles: false,
                cancelable: true,
                view: window,
              }),
            )

            const rect = chartRef.current?.canvas.getBoundingClientRect()

            if (rect) {
              const x = event.clientX - rect.left
              const y = event.clientY - rect.top

              const xScaleValue = chartRef.current?.scales.x.getValueForPixel(x)
              if (xScaleValue !== undefined) {
                const xScaleIndex = Math.round(xScaleValue)
                const clampedIndex = Math.max(0, Math.min(xScaleIndex, dataPointCount - 1))
                const snappedPixelX = chartRef.current?.scales.x.getPixelForValue(clampedIndex) ?? x
                crosshairRef.current?.updateCrosshairPosition(snappedPixelX, y, clampedIndex)
              }
            }
          }
        }}
        onMouseLeave={() => {
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          lastMousePositionRef.current = null
          setIsPanning(false)
          if (!fixedXScaleIndex) {
            setIsCrosshairVisible(false)
            crosshairRef.current?.handleMouseOut()
          }
        }}
      >
        {/* 스켈레톤 */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: showSkeleton ? 1 : 0,
            pointerEvents: showSkeleton ? 'auto' : 'none',
            transition: 'opacity 0.3s ease-in-out',
            zIndex: showSkeleton ? 1 : 0,
          }}
        >
          <MIBaseSkeleton.BaseElement2 width={'100%'} height={height || '100%'} />
        </Box>

        {/* 그래프 */}
        <Box
          height={'100%'}
          sx={{
            position: 'relative',
            opacity: showChart ? 1 : 0,
            pointerEvents: showChart ? 'auto' : 'none',
            transition: 'opacity 0.3s ease-in-out',
            zIndex: showChart ? 2 : 0,
          }}
        >
          <Chart
            ref={chartRef}
            type={'candlestick'}
            data={{ datasets: mainDataset }}
            options={chartOptions}
            plugins={[gridAndAxesPlugin, redrawLinesPlugin]}
          />
          {hoverReportCardInfo && !hasMatchingData && chartAreaCenter && (
            <Box
              sx={{
                position: 'absolute',
                top: `${chartAreaCenter.top}px`,
                left: `${chartAreaCenter.left}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <Typography
                variant="body1M16"
                sx={{
                  color: 'contentText.Subtext',
                  userSelect: 'none',
                }}
              >
                Section not found
              </Typography>
            </Box>
          )}
        </Box>
        {/* 고정 모드 딤드 오버레이 */}
        {fixedXScaleIndex !== null && chartRef.current?.chartArea && (
          <Box
            sx={{
              position: 'absolute',
              top: `${chartRef.current.chartArea.top}px`,
              left: `${chartRef.current.chartArea.left}px`,
              width: `${chartRef.current.chartArea.right - chartRef.current.chartArea.left}px`,
              height: `${chartRef.current.chartArea.bottom - chartRef.current.chartArea.top}px`,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 12,
            }}
          >
            {/* 리플 효과 */}
            {ripplePosition !== null && rippleDirection === 'expand' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: `${ripplePosition.y}px`,
                  left: `${ripplePosition.x}px`,
                  width: '0px',
                  height: '0px',
                  borderRadius: '50%',
                  backgroundColor: '#0000001A',
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  animation: 'rippleExpand 0.6s ease-out',
                  '@keyframes rippleExpand': {
                    '0%': {
                      width: '0px',
                      height: '0px',
                      opacity: 0.8,
                    },
                    '100%': {
                      width: '2000px',
                      height: '2000px',
                      opacity: 0,
                    },
                  },
                }}
              />
            )}
            {/* 배경 오버레이 */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#0000001A',
                pointerEvents: 'none',
                animation: rippleDirection === 'expand' && ripplePosition !== null ? 'fadeIn 0.6s ease-out' : 'none',
                '@keyframes fadeIn': {
                  '0%': {
                    opacity: 0,
                  },
                  '100%': {
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>
        )}
        {showChart && (
          <>
            {/* 고정모드 시 팝업 외부 영역 클릭으로 닫기 + 외부 영역 상호작용 차단 */}
            {fixedXScaleIndex !== null && (
              <Box
                aria-hidden
                onClick={handleCloseFixedMode}
                sx={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 20,
                  backgroundColor: 'transparent',
                  cursor: 'default',
                  pointerEvents: 'auto',
                }}
              />
            )}
            <ForecastCrosshairLine ref={crosshairRef} chartRef={chartRef} onTooltipChange={externalTooltipHandler} />
            <ForecastChartTooltip
              ref={tooltipRef}
              {...tooltip}
              visibility={tooltip.visible && !isTooltipPositionCalculated && tooltip.left === -9999 ? 'hidden' : 'visible'}
              isFixedMode={fixedXScaleIndex !== null}
              monthSelect={monthSelect}
              onClose={handleCloseFixedMode}
            />
          </>
        )}
        {showChart && (
          <Stack
            ref={zoomButtonStackRef}
            direction="row"
            sx={{
              position: 'absolute',
              left: chartAreaCenter ? `${chartAreaCenter.left}px` : 'calc(50% + 26px)',
              bottom: '47px',
              transform: 'translateX(-50%)',
              pointerEvents: 'auto',
              zIndex: 13,
            }}
          >
            <Box
              width="36px"
              height="36px"
              onClick={handleZoomOut}
              sx={{
                borderTopLeftRadius: '10px',
                borderBottomLeftRadius: '10px',
                border: '1px solid #DEE2E6',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box',
                '&:hover': {
                  backgroundColor: '#F1F3F5',
                },
              }}
            >
              <RemoveRoundedIcon sx={{ color: 'gray.70', fontSize: '18px' }} />
            </Box>
            <Box
              width="36px"
              height="36px"
              onClick={handleZoomIn}
              sx={{
                borderTopRightRadius: '10px',
                borderBottomRightRadius: '10px',
                border: '1px solid #DEE2E6',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box',
                '&:hover': {
                  backgroundColor: '#F1F3F5',
                },
              }}
            >
              <AddRoundedIcon sx={{ color: 'gray.70', fontSize: '18px' }} />
            </Box>
          </Stack>
        )}
      </Box>
    )
  },
)

ForecastChartGraph.displayName = 'ForecastChartGraph'
export default ForecastChartGraph
