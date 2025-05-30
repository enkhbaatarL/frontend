import { Box } from '@mui/material'
import { Chart, Point, Tooltip, ChartTypeRegistry, ChartDataset, Plugin } from 'chart.js'
import { FinancialDataPoint } from 'chart.js/auto'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import zoomPlugin from 'chartjs-plugin-zoom'
import dayjs from 'dayjs'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import '@/lib/chart/adapterDayjs'
import MIChartLegendToggle from './MIChartLegendToggle'
import MIChartTooltip from './MIChartTooltip'

import fillBetweenPlugin from '@/lib/chart/line/plugins/fillBetweenPlugin'
import crosshairLinePlugin from '@/lib/chart/plugins/crosshairLinePlugin'
import priceIndicatorPlugin from '@/lib/chart/plugins/valueIndicatorPlugin'
import verticalAxisDecoratorPlugin from '@/lib/chart/plugins/verticalAxisDecoratorPlugin'
import { generateYAxis, getChartLabel } from '@/lib/chart/utils/chartUtils'
import { ChartType as MIChartType, Indicator } from '@/types/dataDetailChart'
import { disableContextMenu } from '@/utils/mouse'

interface CustomChartData {
  timestamps: string[]
  series: Array<{
    seriesId: string
    label: string
    values: (number | null)[]
  }>
  chartType?: MIChartType
  unitCd?: string
}

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
  mainData: {
    unit: string
    data?: CustomChartData
  }
  indicators?: Indicator[]
  comparisonCharts?: CustomChartData[]
  displayDataInfo: DisplayDataInfo
  width?: string | number
  height?: string | number
  interval: 'day' | 'week' | 'month' | 'year'
  chartType?: MIChartType
  currentRangeBetween: string[]
}

Chart.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement, zoomPlugin)

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

type ChartDatasetType = ChartDataset<'line' | 'candlestick', (Point | FinancialDataPoint)[]>

type ChartTypeValue = 'line' | 'candlestick'
type ChartDataType = (Point | FinancialDataPoint | null)[]
type ChartPluginType = Plugin<keyof ChartTypeRegistry, ChartDataType>

const MIChart = forwardRef<HTMLCanvasElement, Readonly<MIChartProps>>(
  (
    {
      height,
      interval,
      mainData,
      chartType = MIChartType.LINE,
      indicators = [],
      comparisonCharts = [],
      currentRangeBetween,
      displayDataInfo,
    },
    ref,
  ) => {
    const chartRef = useRef<HTMLCanvasElement>(null)
    const [chartInstance, setChartInstance] = useState<Chart | null>(null)
    const [tooltip, setTooltip] = useState({ visible: false, top: 0, left: 0, content: {} })
    const [hideComparisonChartIndexList, setHideComparisonChartIndexList] = useState<number[]>([])

    const { sortedTimestamps, timestampToIndex } = useMemo(() => {
      const allTimestamps = new Set<number>()

      mainData?.data?.timestamps?.forEach((timestamp: string) => allTimestamps.add(dayjs(timestamp).valueOf()))
      comparisonCharts.forEach((chart) =>
        chart.timestamps?.forEach((timestamp: string) => {
          allTimestamps.add(dayjs(timestamp).valueOf())
        }),
      )
      indicators.forEach((indicator) => {
        indicator.series.forEach((series) => {
          series.values.forEach((_, index) => {
            if (mainData?.data?.timestamps?.[index]) {
              allTimestamps.add(dayjs(mainData.data.timestamps[index]).valueOf())
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
    }, [mainData.data?.timestamps, comparisonCharts, indicators, currentRangeBetween])

    const {
      mainDataSeries,
      closeDataSeries,
      openDataSeries,
      highDataSeries,
      lowDataSeries,
      volumeDataSeries, // 거래량
      refDataSeries,
    } = useMemo(() => {
      const series = mainData?.data?.series || []
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
    }, [mainData?.data?.series])

    const mainDatasets = useMemo(() => {
      if (chartType === MIChartType.LINE) {
        if (mainData?.data?.chartType === MIChartType.LINE) {
          return [
            {
              label: mainDataSeries?.label ?? '',
              data:
                mainDataSeries?.values?.map((value, index) => {
                  const timestamp = dayjs(mainData?.data?.timestamps[index]).valueOf()
                  return {
                    x: timestampToIndex.get(timestamp) ?? index,
                    y: value ?? null,
                  }
                }) ?? sortedTimestamps.map((_, index) => ({ x: index, y: null })),
              type: 'line',
              borderColor: '#2F62A3',
              borderWidth: 3,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
              yAxisID: 'y',
              metadata: {
                isMain: true,
                chipColor: 'common.black',
              },
            },
            ...refDataSeries.map((series) => ({
              label: series.label,
              data:
                series.values.length === 0
                  ? sortedTimestamps.map((_, index) => ({ x: index, y: null }))
                  : series.values.map((value, index) => {
                    const timestamp = dayjs(mainData?.data?.timestamps[index]).valueOf()
                    return {
                      x: timestampToIndex.get(timestamp) ?? index,
                      y: value ?? null,
                    }
                  }),
              type: 'line',
              borderWidth: 0,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
              yAxisID: 'y',
              metadata: {
                isMain: true,
                chipColor: 'common.black',
              },
            })),
            ...(volumeDataSeries
              ? [
                {
                  label: volumeDataSeries.label,
                  data: volumeDataSeries.values.map((value, index) => ({
                    x: index,
                    y: value ?? null,
                  })),
                  type: 'line',
                  borderWidth: 0,
                  pointRadius: 0,
                  fill: false,
                  tension: 0.1,
                  yAxisID: 'y',
                },
              ]
              : []),
          ]
        }

        if (mainData?.data?.chartType === MIChartType.CANDLE) {
          return [closeDataSeries, openDataSeries, highDataSeries, lowDataSeries].map((series, index) => ({
            label: series?.label ?? '',
            data:
              series?.values.map((value, index) => ({
                x: index,
                y: value ?? null,
              })) ?? sortedTimestamps.map((_, index) => ({ x: index, y: null })),
            type: 'line',
            borderColor: ['#40597A', '#7A8790', '#9DAFB9', '#C7CED4'][index],
            borderWidth: series?.seriesId === 'close' ? 3 : 0,
            pointRadius: 0,
            fill: false,
            tension: 0.1,
            yAxisID: 'y',
            metadata: {
              isMain: true,
              chipColor: ['#40597A', '#7A8790', '#9DAFB9', '#C7CED4'][index],
            },
          }))
        }
      }

      if (chartType === MIChartType.CANDLE) {
        return [
          {
            label: closeDataSeries?.label ?? '',
            data:
              closeDataSeries?.values.map((value, index) => ({
                x: index,
                c: value ?? null,
                o: openDataSeries?.values[index] ?? value ?? null,
                h: highDataSeries?.values[index] ?? value ?? null,
                l: lowDataSeries?.values[index] ?? value ?? null,
              })) ??
              sortedTimestamps.map((_, index) => ({
                x: index,
                c: null,
                o: null,
                h: null,
                l: null,
              })),
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
      mainData?.data?.chartType,
      mainData?.data?.timestamps,
      mainDataSeries?.label,
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
      const ma = indicators.find((indicator) => indicator.indicatorType === 'MOVING_AVERAGE')
      const bb = indicators.find((indicator) => indicator.indicatorType === 'BOLLINGER_BANDS')

      return {
        MA: ma?.series
          .map((series, index) => ({
            label: maLabels[series.seriesId],
            data: series.values.map((value, index) => ({
              x: index,
              y: value ?? null,
            })),
            type: 'line',
            borderColor: displayDataInfo.MA[maLabels[series.seriesId]] ? maColors[series.seriesId] : 'transparent',
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            tension: 0.1,
            yAxisID: 'y',
            metadata: {
              isMain: true,
              chipColor: maColors[series.seriesId],
              hasDivider: index === 0,
            },
          }))
          .sort((a, b) => {
            const numA = parseInt(a.label.replace('MA', ''))
            const numB = parseInt(b.label.replace('MA', ''))
            return numA - numB
          }),
        BB: bb?.series.map((series, index) => ({
          label: bbLabels[series.seriesId],
          data: series.values.map((value, index) => ({
            x: index,
            y: value ?? null,
          })),
          type: 'line',
          borderColor: displayDataInfo.BB ? bbColors[series.seriesId] : 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
          metadata: {
            isMain: true,
            chipColor: bbColors[series.seriesId],
            hasDivider: index === 0,
          },
        })),
      }
    }, [indicators, displayDataInfo.BB, displayDataInfo.MA])

    const comparisonDatasets = useMemo(() => {
      const colors = ['#26757B', '#EFA460', '#94826B', '#8F5B5D', '#819E9A', '#7D68A4', '#EFD485', '#5C5C5C', '#363434']

      return comparisonCharts.map((chart, index) => ({
        label: chart.series[0].label,
        data: chart.series[0].values.map((value, idx) => {
          const timestamp = dayjs(chart.timestamps[idx]).valueOf()
          return {
            x: timestampToIndex.get(timestamp) ?? idx,
            y: value ?? null,
          }
        }),
        type: 'line',
        pointRadius: 0,
        borderColor: hideComparisonChartIndexList.includes(index) ? 'transparent' : colors[index % colors.length],
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        yAxisID: chart.unitCd ?? 'y',
        metadata: {
          chipColor: colors[index % colors.length],
          hasDivider: index === 0,
        },
      }))
    }, [comparisonCharts, hideComparisonChartIndexList, timestampToIndex])

    const comparisonChartUnits = useMemo(
      () => comparisonCharts.map((chart) => chart.unitCd).filter((unit): unit is string => unit !== undefined),
      [comparisonCharts],
    )

    const subYAxes = useMemo(() => {
      const axes: Record<string, ReturnType<typeof generateYAxis>> = {}

      comparisonChartUnits.forEach((unit, index) => {
        axes[unit] = generateYAxis({
          position: 'right',
          unit,
          borderColor: index === 0 ? undefined : '#DEE2E6',
        })
      })

      return axes
    }, [comparisonChartUnits])

    const externalTooltipHandler = useCallback(
      (context: { tooltip: { x: number; y: number; content: Record<string, number | null> } | null }) => {
        const { tooltip: chartTooltip } = context

        if (!chartTooltip) {
          setTooltip((prev) => ({ ...prev, visible: false }))

          return
        }

        setTooltip({
          visible: true,
          top: chartTooltip.y - 4,
          left: chartTooltip.x + 6,
          content: chartTooltip.content,
        })
      },
      [],
    )

    const isEmptyChart = useMemo(
      () =>
        mainDatasets?.[0]?.data.every((value) => {
          if ('y' in value) return value.y === null
          if ('c' in value) return value.c === null
          return true
        }),
      [mainDatasets],
    )

    const createChart = () => {
      if (chartInstance) {
        chartInstance.destroy()
        setChartInstance(null)
      }

      const ctx = chartRef.current
      if (!ctx) return
      const existingChart = Chart.getChart(ctx)
      if (existingChart) {
        existingChart.destroy()
      }

      const datasets: ChartDatasetType[] = []

      if (mainDatasets !== null) datasets.push(...(mainDatasets as ChartDatasetType[]))
      if (indicatorDatasets.BB) datasets.push(...(indicatorDatasets.BB as ChartDatasetType[]))
      if (indicatorDatasets.MA) datasets.push(...(indicatorDatasets.MA as ChartDatasetType[]))
      if (comparisonDatasets.length) {
        datasets.push(...(comparisonDatasets as ChartDatasetType[]))
      }

      const chartTypeValue: ChartTypeValue = chartType === MIChartType.CANDLE ? 'candlestick' : 'line'

      const newChartInstance = new Chart(ctx, {
        type: chartTypeValue,
        data: {
          datasets,
        },
        plugins: [verticalAxisDecoratorPlugin, crosshairLinePlugin, priceIndicatorPlugin, fillBetweenPlugin as ChartPluginType],
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            x: {
              type: 'category',
              labels: sortedTimestamps.map((timestamp) => timestamp.toString()),
              title: {
                display: false,
              },
              grid: {
                color: '#ADB5BD',
                drawTicks: false,
              },
              border: {
                dash: [2, 2],
                width: 1,
                color: '#2E3F5E',
              },
              afterTickToLabelConversion(axis) {
                if (axis.ticks.length > 0) {
                  axis.ticks[0].label = ''
                  axis.ticks[axis.ticks.length - 1].label = ''
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
                  const date = dayjs(Number(timestamp))
                  return getChartLabel(date, interval)
                },
              },
            },
            y: {
              ...generateYAxis({
                isMain: true,
                position: 'left',
                unit: mainData.unit.split('#').at(-1) ?? mainData.unit,
                borderColor: '#DEE2E6',
              }),
              min: isEmptyChart ? 0 : undefined,
              max: isEmptyChart ? 0 : undefined,
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
            crosshairLinePlugin: {
              onPointerMove: externalTooltipHandler,
            },
            zoom: {
              pan: {
                enabled: true,
                mode: 'x',
                modifierKey: null,
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
              },
            },
          },
        },
      })

      setChartInstance(newChartInstance)
    }

    useEffect(() => {
      if (
        mainData.data &&
        (!indicators.length || indicatorDatasets.MA || indicatorDatasets.BB) &&
        (comparisonCharts.length === 0 || comparisonDatasets.length > 0)
      ) {
        createChart()
      }
    }, [mainData.data, indicatorDatasets, comparisonDatasets, interval, mainData.unit, subYAxes, chartType])

    useEffect(() => {
      if (ref && typeof ref === 'function') {
        ref(chartRef.current)
      } else if (ref) {
        ref.current = chartRef.current
      }
    }, [ref])

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
      >
        <Box
          sx={{
            position: 'absolute',
            top: `${(chartInstance?.chartArea?.top ?? 0) - 1}px`,
            left: `${(chartInstance?.chartArea?.left ?? 0) + 10}px`,
          }}
        >
          <MIChartLegendToggle
            labels={comparisonDatasets.map((data) => data.label)}
            colors={comparisonDatasets.map((data) => data.metadata?.chipColor)}
            onChange={(index, isShow) => {
              setHideComparisonChartIndexList((prev) => (isShow ? prev.filter((item) => item !== index) : [...prev, index]))
            }}
          />
        </Box>
        <Box height={'100%'}>
          <canvas ref={chartRef} />
        </Box>
        <MIChartTooltip {...tooltip} />
      </Box>
    )
  },
)

MIChart.displayName = 'MIChart'

export default MIChart
