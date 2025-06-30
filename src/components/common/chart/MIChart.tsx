import { Box } from '@mui/material'
import { Chart as ChartJS, Point, Tooltip, ChartDataset } from 'chart.js'
import { FinancialDataPoint } from 'chart.js/auto'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import zoomPlugin from 'chartjs-plugin-zoom'
import dayjs from 'dayjs'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'

import '@/lib/chart/adapterDayjs'
import MIChartLegendToggle from './MIChartLegendToggle'
import MIChartTooltip from './MIChartTooltip'
import MICrosshairLine, { MICrosshairLineHandle } from './MICrosshairLine'

import fillBetweenPlugin from '@/lib/chart/line/plugins/fillBetweenPlugin'
import valueIndicatorPlugin from '@/lib/chart/plugins/valueIndicatorPlugin'
import verticalAxisDecoratorPlugin from '@/lib/chart/plugins/verticalAxisDecoratorPlugin'
import volumeTextPlugin from '@/lib/chart/plugins/volumeTextPlugin'
import { generateYAxis, getChartLabel } from '@/lib/chart/utils/chartUtils'
import { ChartData, ChartType as MIChartType, Indicator, ChartRange } from '@/types/dataDetailChart'
import { disableContextMenu } from '@/utils/mouse'

export interface DisplayDataInfo {
  BB: boolean
  MA: {
    [key: string]: boolean
    MA5: boolean
    MA20: boolean
    MA60: boolean
    MA120: boolean
  }
}

interface MIChartProps {
  currency?: string
  unitCd?: string
  mainChart?: ChartData
  indicators?: Indicator[]
  comparisonCharts?: ChartData[]
  displayDataInfo: DisplayDataInfo
  width?: string | number
  height?: string | number
  chartRange?: ChartRange
  chartType?: MIChartType
  currentRangeBetween: string[]
  hideComparisonChartIndexList: number[]
  setHideComparisonChartIndexList: (index: number, isShow: boolean) => void
}

ChartJS.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement, zoomPlugin)

Tooltip.positioners.pointerPositioner = function (_elements, eventPosition) {
  return {
    x: eventPosition.x,
    y: eventPosition.y,
  }
}

const maColors: {
  [key: string]: string
} = {
  ma_5: '#2A8D3E',
  ma_20: '#D6336C',
  ma_60: '#EB670F',
  ma_120: '#7451DD',
}

const maLabels: {
  [key: string]: string
} = {
  ma_5: 'MA5',
  ma_20: 'MA20',
  ma_60: 'MA60',
  ma_120: 'MA120',
}

const bbColors: {
  [key: string]: string
} = {
  bb_upper: '#DF4B4A',
  bb_middle: '#4263EB',
  bb_lower: '#37B24D',
}

const bbLabels: {
  [key: string]: string
} = {
  bb_upper: 'Upper BB',
  bb_middle: 'Middle BB',
  bb_lower: 'Lower BB',
}

type ChartDatasetType = ChartDataset<'line' | 'candlestick' | 'bar', (Point | FinancialDataPoint)[]>

const MIChart = forwardRef<HTMLCanvasElement, Readonly<MIChartProps>>(
  (
    {
      height,
      chartRange,
      currency,
      unitCd,
      mainChart,
      chartType = MIChartType.LINE,
      indicators = [],
      comparisonCharts = [],
      currentRangeBetween,
      displayDataInfo,
      hideComparisonChartIndexList,
      setHideComparisonChartIndexList,
    },
    ref,
  ) => {
    const mainChartRef = useRef<ChartJS | null>(null)
    const volumeChartRef = useRef<ChartJS | null>(null)
    const crosshairRef = useRef<MICrosshairLineHandle | null>(null)
    const tooltipRef = useRef<HTMLDivElement | null>(null)

    const [tooltip, setTooltip] = useState({ visible: false, top: 0, left: 0, content: {} })
    const [isMouseHoverLegend, setIsMouseHoverLegend] = useState(false)

    const { sortedTimestamps, timestampToIndex } = useMemo(() => {
      const allTimestamps = new Set<number>()

      mainChart?.timestamps?.forEach((timestamp: string) => allTimestamps.add(dayjs(timestamp).valueOf()))
      comparisonCharts.forEach((chart) =>
        chart.timestamps?.forEach((timestamp: string) => {
          allTimestamps.add(dayjs(timestamp).valueOf())
        }),
      )
      indicators.forEach((indicator) => {
        indicator.series.forEach((series) => {
          series.values.forEach((_, index) => {
            if (mainChart?.timestamps?.[index]) {
              allTimestamps.add(dayjs(mainChart?.timestamps[index]).valueOf())
            }
          })
        })
      })

      if (allTimestamps.size === 0) {
        currentRangeBetween.forEach((timestamp) => {
          allTimestamps.add(dayjs(timestamp).valueOf())
        })
      }

      const sorted = Array.from(allTimestamps).sort((a, b) => a - b)
      const timestampMap = new Map(sorted.map((timestamp, idx) => [timestamp, idx]))

      return { sortedTimestamps: sorted, timestampToIndex: timestampMap }
    }, [mainChart?.timestamps, comparisonCharts, indicators, currentRangeBetween])

    const {
      mainDataSeries,
      closeDataSeries,
      openDataSeries,
      highDataSeries,
      lowDataSeries,
      volumeDataSeries, // 거래량
      refDataSeries,
    } = useMemo(() => {
      const series = mainChart?.series || []
      const excludeSeriesIds = ['main', 'close', 'open', 'high', 'low', 'volume']

      return {
        mainDataSeries: series.find((s) => s.seriesId === 'main'),
        closeDataSeries: series.find((s) => s.seriesId === 'close'),
        openDataSeries: series.find((s) => s.seriesId === 'open'),
        highDataSeries: series.find((s) => s.seriesId === 'high'),
        lowDataSeries: series.find((s) => s.seriesId === 'low'),
        volumeDataSeries: series.find((s) => s.seriesId === 'volume'),
        refDataSeries: series.filter((s) => !excludeSeriesIds.includes(s.seriesId)),
      }
    }, [mainChart?.series])

    const mainDatasets = useMemo(() => {
      if (chartType === MIChartType.LINE) {
        if (mainChart?.chartType === MIChartType.LINE) {
          return [
            {
              label: mainChart?.goodsDataSourceName ?? '',
              data: sortedTimestamps.map((timestamp) => {
                const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
                const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
                return {
                  x: timestampToIndex.get(timestamp) ?? 0,
                  y: index !== undefined && index !== -1 ? (mainDataSeries?.values[index] ?? null) : null,
                }
              }),
              type: 'line',
              borderColor: '#2F62A3',
              borderWidth: 3,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
              spanGaps: true,
              yAxisID: 'y',
              metadata: {
                isMain: true,
                chipColor: 'common.black',
              },
            },
            // NOTE: ref, volume 데이터는 표시하지 않음 - hidden: true 지정 (y축 범위 문제)
            ...refDataSeries.map((series) => ({
              label: series.label,
              data: sortedTimestamps.map((timestamp) => {
                const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
                const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
                return {
                  x: timestampToIndex.get(timestamp) ?? 0,
                  y: index !== undefined && index !== -1 ? (series.values[index] ?? null) : null,
                }
              }),
              type: 'line',
              borderWidth: 0,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
              spanGaps: true,
              yAxisID: 'y',
              hidden: true,
              metadata: {
                isMain: true,
                chipColor: 'common.black',
              },
            })),
          ]
        }

        if (mainChart?.chartType === MIChartType.CANDLE) {
          return [closeDataSeries, openDataSeries, highDataSeries, lowDataSeries].map((series, seriesIndex) => ({
            label: `${mainChart?.goodsDataSourceName} (${series?.seriesId})`,
            data: sortedTimestamps.map((timestamp) => {
              const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
              const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
              return {
                x: timestampToIndex.get(timestamp) ?? 0,
                y: index !== undefined && index !== -1 ? (series?.values[index] ?? null) : null,
              }
            }),
            type: 'line',
            borderColor: ['#40597A', '#7A8790', '#9DAFB9', '#B1BEC6'][seriesIndex], // 가시성 문제로 #C7CED4 -> #B1BEC6 적용
            borderWidth: series?.seriesId === 'close' ? 3 : 0,
            pointRadius: 0,
            fill: false,
            tension: 0.1,
            spanGaps: true,
            hidden: seriesIndex !== 0,
            yAxisID: 'y',
            metadata: {
              isMain: true,
              chipColor: ['#40597A', '#7A8790', '#9DAFB9', '#B1BEC6'][seriesIndex],
            },
          }))
        }
      }

      if (chartType === MIChartType.CANDLE) {
        return [
          {
            label: mainChart?.goodsDataSourceName ?? '',
            data: sortedTimestamps.map((timestamp) => {
              const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
              const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
              return {
                x: timestampToIndex.get(timestamp) ?? 0,
                c: index !== undefined && index !== -1 ? (closeDataSeries?.values[index] ?? null) : null,
                o: index !== undefined && index !== -1 ? (openDataSeries?.values[index] ?? null) : null,
                h: index !== undefined && index !== -1 ? (highDataSeries?.values[index] ?? null) : null,
                l: index !== undefined && index !== -1 ? (lowDataSeries?.values[index] ?? null) : null,
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
            borderWidth: 1,
            yAxisID: 'y',
            metadata: {
              isMain: true,
              chipColor: 'common.black',
            },
          },
        ]
      }

      return null
    }, [
      chartType,
      mainChart?.chartType,
      mainChart?.goodsDataSourceName,
      mainChart?.timestamps,
      mainDataSeries?.values,
      sortedTimestamps,
      refDataSeries,
      volumeDataSeries,
      timestampToIndex,
      closeDataSeries,
      openDataSeries,
      highDataSeries,
      lowDataSeries,
    ])

    const indicatorDatasets = useMemo(() => {
      const ma = indicators?.find((indicator) => indicator.indicatorType === 'MOVING_AVERAGE')
      const bb = indicators?.find((indicator) => indicator.indicatorType === 'BOLLINGER_BANDS')

      return {
        MA:
          ma?.series
            ?.map((series) => ({
              label: maLabels[series.seriesId],
              data: sortedTimestamps.map((timestamp) => {
                const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
                const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
                return {
                  x: timestampToIndex.get(timestamp) ?? 0,
                  y: index !== undefined && index !== -1 ? (series.values[index] ?? null) : null,
                }
              }),
              type: 'line',
              borderColor: displayDataInfo.MA[maLabels[series.seriesId]] ? maColors[series.seriesId] : 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
              spanGaps: true,
              yAxisID: 'y',
              metadata: {
                isMain: true,
                chipColor: maColors[series.seriesId],
                hasDivider: maLabels[series.seriesId] === 'MA5',
              },
            }))
            .sort((a, b) => {
              const numA = parseInt(a.label.replace('MA', ''))
              const numB = parseInt(b.label.replace('MA', ''))
              return numA - numB
            }) ?? [],
        BB:
          bb?.series
            ?.map((series) => ({
              label: bbLabels[series.seriesId],
              data: sortedTimestamps.map((timestamp) => {
                const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
                const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
                return {
                  x: timestampToIndex.get(timestamp) ?? 0,
                  y: index !== undefined && index !== -1 ? (series.values[index] ?? null) : null,
                }
              }),
              type: 'line',
              borderColor: displayDataInfo.BB ? bbColors[series.seriesId] : 'transparent',
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
              spanGaps: true,
              metadata: {
                isMain: true,
                chipColor: bbColors[series.seriesId],
                hasDivider: bbLabels[series.seriesId] === 'Upper BB',
              },
            }))
            .sort((a, b) => {
              const order: Record<string, number> = { 'Upper BB': 0, 'Middle BB': 1, 'Lower BB': 2 }
              return order[a.label] - order[b.label]
            }) ?? [],
      }
    }, [indicators, displayDataInfo.BB, displayDataInfo.MA, mainChart?.timestamps, sortedTimestamps, timestampToIndex])

    const comparisonDatasets = useMemo(() => {
      const colors = ['#26757B', '#EFA460', '#94826B', '#8F5B5D', '#819E9A', '#7D68A4', '#EFD485', '#5C5C5C', '#363434']

      return comparisonCharts.map((chart, index) => ({
        label: chart.goodsDataSourceName,
        data: sortedTimestamps.map((timestamp) => {
          const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
          const chartIndex = chart.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
          return {
            x: timestampToIndex.get(timestamp) ?? 0,
            y: chartIndex !== undefined && chartIndex !== -1 ? (chart.series[0].values[chartIndex] ?? null) : null,
          }
        }),
        type: 'line',
        pointRadius: 0,
        borderColor: hideComparisonChartIndexList.includes(index) ? 'transparent' : colors[index % colors.length],
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        spanGaps: true,
        yAxisID: `sub-${chart.unitCd?.split('#').at(-1) ?? ''}`,
        metadata: {
          chipColor: colors[index % colors.length],
          hasDivider: index === 0,
          goodsNo: chart.goodsNo,
          goodsDataNo: chart.goodsDataNo,
          goodsDataName: chart.goodsDataName,
          goodsDataSourceNo: chart.goodsDataSourceNo,
          goodsDataSourceName: chart.goodsDataSourceName,
        },
      }))
    }, [comparisonCharts, hideComparisonChartIndexList, timestampToIndex, sortedTimestamps])

    const volumeDatasets = useMemo(
      () =>
        volumeDataSeries
          ? [
            {
              label: volumeDataSeries.label,
              data: sortedTimestamps.map((timestamp) => {
                const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
                const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
                return {
                  x: timestampToIndex.get(timestamp) ?? 0,
                  y: index !== undefined && index !== -1 ? (volumeDataSeries.values[index] ?? null) : null,
                }
              }),
              type: 'line',
              borderWidth: 0,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
              spanGaps: true,
              yAxisID: 'y',
              hidden: true,
              metadata: {
                hasDivider: true,
                chipColor: '#2E3F5E',
                toFixed: 0,
              },
            },
          ]
          : [],
      [mainChart?.timestamps, timestampToIndex, volumeDataSeries, sortedTimestamps],
    )

    const comparisonChartUnits = useMemo(
      () => comparisonCharts.map((chart) => chart.unitCd).filter((unit): unit is string => unit !== undefined),
      [comparisonCharts],
    )

    const subYAxes = useMemo(() => {
      const axes: Record<string, ReturnType<typeof generateYAxis>> = {}

      comparisonChartUnits.forEach((unitCd, index) => {
        const unit = unitCd?.split('#').at(-1) ?? ''
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

        if (!chartTooltip) {
          setTooltip((prev) => ({ ...prev, visible: false }))

          return
        }

        const canvasRect = crosshairRef.current?.getCanvasRect()
        if (!canvasRect) {
          setTooltip({
            visible: true,
            top: chartTooltip.y + 10,
            left: chartTooltip.x + 12,
            content: chartTooltip.content,
          })
          return
        }

        const tooltipElement = tooltipRef.current
        let tooltipWidth = 0
        let tooltipHeight = 0

        if (tooltipElement) {
          const rect = tooltipElement.getBoundingClientRect()
          tooltipWidth = rect.width
          tooltipHeight = rect.height
        }

        let targetX = chartTooltip.x + 12
        let targetY = chartTooltip.y + 10

        const wouldExceedRight = targetX + tooltipWidth > canvasRect.right
        if (wouldExceedRight) {
          targetX = chartTooltip.x - tooltipWidth - 12
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
      },
      [],
    )

    const isSynchronizing = useRef(false)
    const syncChartScales = useCallback(({ chart }: { chart: ChartJS }) => {
      if (isSynchronizing.current) return

      try {
        if (mainChartRef.current && volumeChartRef.current) {
          isSynchronizing.current = true

          const sourceScales = chart.scales.x
          const targetChart = mainChartRef.current.scales.x === sourceScales ? volumeChartRef.current : mainChartRef.current

          targetChart.zoomScale('x', { min: sourceScales.min, max: sourceScales.max }, 'none')
        }
      } catch (error) {
        console.error(error)
      } finally {
        isSynchronizing.current = false
      }
    }, [])

    const isEmptyChart = useMemo(
      () =>
        mainDatasets?.[0]?.data.every((value) => {
          if ('y' in value) return value.y === null
          if ('c' in value) return value.c === null
          return true
        }),
      [mainDatasets],
    )

    const mainDataset = useMemo(() => {
      const datasets = []

      if (mainDatasets !== null) datasets.push(...mainDatasets)
      if (indicatorDatasets.BB) datasets.push(...indicatorDatasets.BB)
      if (indicatorDatasets.MA) datasets.push(...indicatorDatasets.MA)
      if (comparisonDatasets.length) datasets.push(...comparisonDatasets)
      if (volumeDatasets) datasets.push(...volumeDatasets)

      return datasets as ChartDatasetType[]
    }, [comparisonDatasets, indicatorDatasets.BB, indicatorDatasets.MA, mainDatasets])

    const chartOptions = useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: {
            type: 'category' as const,
            labels: sortedTimestamps.map((timestamp) => timestamp.toString()),
            title: {
              display: false,
            },
            grid: {
              color: '#ADB5BD',
              drawTicks: false,
              offset: false,
            },
            border: {
              dash: [2, 2],
              width: 1,
              color: '#2E3F5E',
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            afterTickToLabelConversion(axis: any) {
              if (axis.ticks.length > 0) {
                const ctx = axis.chart.ctx
                const chartArea = axis.chart.chartArea

                if (ctx && chartArea) {
                  const firstTick = axis.ticks[0]
                  const firstLabelBoundary = axis.getPixelForTick(0) - chartArea.left - ctx.measureText(firstTick.label).width / 2
                  if (firstLabelBoundary < 0) firstTick.label = ''

                  const lastTick = axis.ticks[axis.ticks.length - 1]
                  const lastLabelBoundary =
                    axis.getPixelForTick(axis.ticks.length - 1) - chartArea.left + ctx.measureText(lastTick.label).width / 2
                  if (lastLabelBoundary > axis.width) lastTick.label = ''
                }
              }
            },
            ticks: {
              maxTicksLimit: 12,
              padding: 12,
              color: '#2E3F5E',
              font: {
                size: 14,
                family: 'Pretendard,sans-serif',
                weight: 'bold' as const,
              },
              callback(tickValue: string | number) {
                const index = typeof tickValue === 'string' ? parseInt(tickValue) : tickValue
                const timestamp = sortedTimestamps[index]
                return getChartLabel(dayjs(Number(timestamp)), chartRange)
              },
            },
          },
          y: {
            ...generateYAxis({
              isMain: true,
              position: 'left',
              unit: [currency ? `${currency}` : '', unitCd?.split('#').at(-1) ?? unitCd ?? ''].filter(Boolean).join('/'),
              borderColor: '#DEE2E6',
            }),
            min: isEmptyChart ? 0 : undefined,
            max: isEmptyChart ? 0 : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            afterTickToLabelConversion(axis: any) {
              if (axis.ticks.length > 0) {
                const ctx = axis.chart.ctx
                const chartArea = axis.chart.chartArea

                if (ctx && chartArea) {
                  const firstTick = axis.ticks[0]
                  const metrics = ctx.measureText(firstTick.label)
                  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
                  const firstLabelBoundary = axis.getPixelForTick(0) - chartArea.bottom - textHeight
                  if (firstLabelBoundary < 0) firstTick.label = ''

                  const lastTick = axis.ticks[axis.ticks.length - 1]
                  const lastMetrics = ctx.measureText(lastTick.label)
                  const lastTextHeight = lastMetrics.actualBoundingBoxAscent + lastMetrics.actualBoundingBoxDescent
                  const lastLabelBoundary = axis.getPixelForTick(axis.ticks.length - 1) + lastTextHeight / 2
                  if (lastLabelBoundary > axis.height) lastTick.label = ''
                }
              }
            },
          },
          ...subYAxes,
        },
        plugins: {
          tooltip: {
            enabled: false,
          },
          verticalAxisDecorator: {
            yIDs: ['y', ...Object.keys(subYAxes)],
          },
          fillBetween: {
            labels: ['Upper BB', 'Lower BB'],
            fillColor: 'rgba(206, 212, 218, 0.12)',
          },
          legend: {
            display: false,
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              modifierKey: null,
              onPan: syncChartScales,
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
              onZoom: syncChartScales,
            },
          },
        },
      }),
      [chartRange, isEmptyChart, sortedTimestamps, subYAxes, unitCd, syncChartScales],
    )

    const volumeDataset = useMemo(() => {
      if (!volumeDataSeries) return [] as ChartDatasetType[]

      return [
        {
          label: volumeDataSeries.label,
          data: sortedTimestamps.map((timestamp) => {
            const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
            const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
            const value = index !== undefined && index !== -1 ? (volumeDataSeries.values[index] ?? null) : null

            return {
              x: timestampToIndex.get(timestamp) ?? 0,
              y: value,
            }
          }),
          type: 'bar',
          backgroundColor: sortedTimestamps.map((timestamp) => {
            const timestampStr = dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ss')
            const index = mainChart?.timestamps?.findIndex((t) => dayjs(t).format('YYYY-MM-DDTHH:mm:ss') === timestampStr)
            const value = index !== undefined && index !== -1 ? (volumeDataSeries.values[index] ?? null) : null
            const prevValue = index !== undefined && index !== -1 && index > 0 ? (volumeDataSeries.values[index - 1] ?? null) : null

            if (value === null || prevValue === null) return 'rgba(60, 138, 54, 0.5)'
            return value < prevValue ? 'rgba(169, 20, 26, 0.5)' : 'rgba(60, 138, 54, 0.5)'
          }),
          yAxisID: 'y',
        },
      ] as ChartDatasetType[]
    }, [volumeDataSeries, mainChart?.timestamps, sortedTimestamps, timestampToIndex])

    const hasVolume = useMemo(() => (volumeDataSeries?.values.length ?? 0) > 0, [volumeDataSeries?.values.length])

    const volumeChartOptions = useMemo(
      () => ({
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...generateYAxis({
              isMain: true,
              position: 'left',
              unit: [currency ? `${currency}` : '', unitCd?.split('#').at(-1) ?? unitCd ?? ''].filter(Boolean).join('/'),
              borderColor: '#DEE2E6',
              scaleTop: 0.24,
              scaleBottom: 0,
            }),
            min: 0,
            max: Math.max(...(volumeDataSeries?.values ?? [0])),
            afterTickToLabelConversion: chartOptions.scales.y.afterTickToLabelConversion,
            ticks: {
              maxTicksLimit: 4,
              padding: 12,
              color: '#2E3F5E',
              font: {
                size: 14,
                family: 'Pretendard,sans-serif',
                weight: 'normal' as const,
              },
              callback(tickValue: number | string) {
                const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(0)}M`
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`
                }
                return value.toString()
              },
            },
          },
          ...Object.fromEntries(
            Object.entries(subYAxes).map(([key, value]) => [
              key,
              {
                ...value,
                ticks: {
                  ...value.ticks,
                  display: false,
                },
              },
            ]),
          ),
        },
        plugins: {
          ...chartOptions.plugins,
        },
      }),
      [chartOptions, subYAxes, unitCd, volumeDataSeries?.values],
    )

    useEffect(() => {
      if (ref && typeof ref === 'function') {
        ref(mainChartRef.current?.canvas ?? null)
      } else if (ref) {
        ref.current = mainChartRef.current?.canvas ?? null
      }
    }, [ref])

    useEffect(() => {
      if (mainChartRef.current && volumeChartRef.current) {
        syncChartScales({ chart: mainChartRef.current })
      }
    }, [syncChartScales])

    return (
      <Box
        height={height}
        width={'100%'}
        maxWidth={'100%'}
        sx={{
          position: 'relative',
          boxSizing: 'border-box',
        }}
        onContextMenu={disableContextMenu}
        onMouseMove={(event) => {
          event.stopPropagation()
          const rect = mainChartRef.current?.canvas.getBoundingClientRect()
          const canvasRect = crosshairRef.current?.getCanvasRect()
          if (rect && canvasRect) {
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top

            const isInsideCanvas = x >= canvasRect.left && x <= canvasRect.right && y >= canvasRect.top && y <= canvasRect.bottom

            if (isInsideCanvas && !isMouseHoverLegend) {
              const xScaleIndex = mainChartRef.current?.scales.x.getValueForPixel(x)
              if (xScaleIndex !== undefined) {
                crosshairRef.current?.updateCrosshairPosition(x, y, xScaleIndex)
              }
            } else {
              crosshairRef.current?.handleMouseOut()
            }
          }
        }}
        onWheel={(event) => {
          if (event.ctrlKey) {
            event.stopPropagation()
            mainChartRef.current?.canvas.dispatchEvent(
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

            const rect = mainChartRef.current?.canvas.getBoundingClientRect()

            if (rect) {
              const x = event.clientX - rect.left
              const y = event.clientY - rect.top

              const xScaleIndex = mainChartRef.current?.scales.x.getValueForPixel(x)
              if (xScaleIndex !== undefined) {
                crosshairRef.current?.updateCrosshairPosition(x, y, xScaleIndex)
              }
            }
          }
        }}
        onMouseLeave={() => {
          crosshairRef.current?.handleMouseOut()
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '20px',
            left: '78px',
            zIndex: 20,
          }}
        >
          <MIChartLegendToggle
            goodsInfoList={comparisonDatasets.map((data) => ({
              goodsNo: data.metadata?.goodsNo ?? 0,
              goodsDataNo: data.metadata?.goodsDataNo ?? 0,
              goodsDataName: data.metadata?.goodsDataName ?? '',
              goodsDataSourceNo: data.metadata?.goodsDataSourceNo ?? 0,
              goodsDataSourceName: data.metadata?.goodsDataSourceName ?? '',
            }))}
            colors={comparisonDatasets.map((data) => data.metadata?.chipColor)}
            hideComparisonChartIndexList={hideComparisonChartIndexList}
            onChange={setHideComparisonChartIndexList}
            setIsMouseHoverLegend={setIsMouseHoverLegend}
          />
        </Box>
        <Box height={hasVolume ? 'calc(100% - 142px)' : '100%'} sx={{ position: 'relative' }}>
          <Chart
            ref={mainChartRef}
            type={'candlestick'}
            data={{ datasets: mainDataset }}
            options={chartOptions}
            plugins={[verticalAxisDecoratorPlugin, valueIndicatorPlugin, fillBetweenPlugin]}
          />
        </Box>
        {hasVolume && (
          <Box
            position={'absolute'}
            bottom={0}
            left={0}
            width={'100%'}
            maxWidth={'100%'}
            bgcolor={'white'}
            overflow={'hidden'}
            borderTop={'1px solid #DEE2E6'}
          >
            <Box mt={'-20px'} height={'203px'}>
              <Chart
                ref={volumeChartRef}
                type={'candlestick'}
                data={{ datasets: volumeDataset }}
                options={volumeChartOptions}
                plugins={[verticalAxisDecoratorPlugin, volumeTextPlugin]}
              />
            </Box>
          </Box>
        )}
        <MICrosshairLine
          ref={crosshairRef}
          chartRef={mainChartRef}
          volumeChartRef={hasVolume ? volumeChartRef : undefined}
          onTooltipChange={externalTooltipHandler}
        />
        <MIChartTooltip ref={tooltipRef} {...tooltip} />
      </Box>
    )
  },
)

MIChart.displayName = 'MIChart'

export default MIChart
