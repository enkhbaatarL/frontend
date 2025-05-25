import { Box } from '@mui/material'
import { Chart, Point, Tooltip } from 'chart.js'
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
import { generateYAxis } from '@/lib/chart/utils/chartUtils'
import { ChartData, ChartType, Indicator } from '@/types/dataDetailChart'
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
  mainData: {
    unit: string
    data?: ChartData
  }
  indicators?: Indicator[]
  comparisonCharts?: ChartData[]
  displayDataInfo: DisplayDataInfo
  width?: string | number
  height?: string | number
  interval?: 'day' | 'month' | 'year'
  chartType?: ChartType
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
  bb_middle: '#2A8D3E',
  bb_lower: '#1967D2',
}

const bbLabels: {
  [key: string]: string
} = {
  bb_upper: 'Upper BB',
  bb_middle: 'Middle BB',
  bb_lower: 'Lower BB',
}

const MIChart = forwardRef<HTMLCanvasElement, Readonly<MIChartProps>>((props, ref) => {
  const { height, interval = 'day', mainData, chartType = ChartType.LINE, indicators = [], comparisonCharts = [] } = props
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [chartInstance, setChartInstance] = useState<Chart | null>(null)
  const [tooltip, setTooltip] = useState({ visible: false, top: 0, left: 0, content: {} })
  const [hideComparisonChartIndexList, setHideComparisonChartIndexList] = useState<number[]>([])

  const mainDataSeries = useMemo(() => mainData?.data?.series.find((series) => series.seriesId === 'main'), [mainData?.data?.series])
  const closeDataSeries = useMemo(() => mainData?.data?.series.find((series) => series.seriesId === 'close'), [mainData?.data?.series])
  const openDataSeries = useMemo(() => mainData?.data?.series.find((series) => series.seriesId === 'open'), [mainData?.data?.series])
  const highDataSeries = useMemo(() => mainData?.data?.series.find((series) => series.seriesId === 'high'), [mainData?.data?.series])
  const lowDataSeries = useMemo(() => mainData?.data?.series.find((series) => series.seriesId === 'low'), [mainData?.data?.series])

  const mainDatasets = useMemo(() => {
    if (chartType === ChartType.LINE) {
      if (mainData?.data?.chartType === ChartType.LINE) {
        return [
          {
            label: mainDataSeries?.label ?? '',
            data:
              mainDataSeries?.values.map((value, index) => ({
                x: dayjs(mainData?.data?.timestamps[index]).valueOf(),
                y: value ?? null,
              })) ?? [],
            type: 'line',
            borderColor: '#2F62A3',
            borderWidth: 3,
            pointRadius: 0,
            fill: false,
            tension: 0.1,
            yAxisID: 'y',
            metadata: {
              isMain: true,
            },
          },
        ]
      }

      if (mainData?.data?.chartType === ChartType.CANDLE) {
        return [closeDataSeries, openDataSeries, highDataSeries, lowDataSeries].map((series, index) => ({
          label: series?.label ?? '',
          data:
            series?.values.map((value, index) => ({
              x: dayjs(mainData?.data?.timestamps[index]).valueOf(),
              y: value ?? null,
            })) ?? [],
          type: 'line',
          borderColor: ['#2F62A3', '#498B47', '#CC4D50', '#5a5a5a'][index],
          borderWidth: 3,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
          yAxisID: 'y',
          metadata: {
            isMain: true,
          },
        }))
      }
    }

    if (chartType === ChartType.CANDLE) {
      return [
        {
          label: closeDataSeries?.label ?? '',
          data:
            closeDataSeries?.values.map((value, index) => ({
              x: dayjs(mainData?.data?.timestamps[index]).valueOf(),
              c: value,
              o: openDataSeries?.values[index] ?? 0,
              h: highDataSeries?.values[index] ?? 0,
              l: lowDataSeries?.values[index] ?? 0,
            })) ?? [],
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
        .map((series) => ({
          label: maLabels[series.seriesId],
          data: series.values.map((value, index) => ({
            x: dayjs(ma.timestamps[index]).valueOf(),
            y: value,
          })),
          type: 'line',
          borderColor: props.displayDataInfo.MA[maLabels[series.seriesId]] ? maColors[series.seriesId] : 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
          yAxisID: 'y',
        }))
        .sort((a, b) => {
          const numA = parseInt(a.label.replace('MA', ''))
          const numB = parseInt(b.label.replace('MA', ''))
          return numA - numB
        }),
      BB: bb?.series.map((series) => {
        const label = bbLabels[series.seriesId]
        const isMiddleBBInCandle = label === 'Middle BB' && chartType === ChartType.CANDLE
        const borderColor = isMiddleBBInCandle ? '#F0D92D' : bbColors[series.seriesId]
        const borderWidth = isMiddleBBInCandle ? 2 : 1

        return {
          label,
          data: series.values.map((value, index) => ({
            x: dayjs(bb.timestamps[index]).valueOf(),
            y: value,
          })),
          type: 'line',
          borderColor: props.displayDataInfo.BB ? borderColor : 'transparent',
          borderWidth,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        }
      }),
    }
  }, [chartType, indicators, props.displayDataInfo.BB, props.displayDataInfo.MA])

  const comparisonDatasets = useMemo(() => {
    const colors = ['#0CA678', '#FF973C', '#5191F5', '#8F5B5D', '#819E9A', '#7D68A4']

    return comparisonCharts.map((chart, index) => ({
      label: chart.series[0].label,
      data: chart.series[0].values.map((value, idx) => ({
        x: dayjs(chart.timestamps[idx]).valueOf(),
        y: value,
      })),
      type: 'line',
      pointRadius: 0,
      borderColor: hideComparisonChartIndexList.includes(index) ? 'transparent' : colors[index % colors.length],
      borderWidth: 3,
      fill: false,
      tension: 0.1,
      yAxisID: chart.unitCd,
      metaData: {
        chipColor: colors[index % colors.length],
      },
    }))
  }, [comparisonCharts, hideComparisonChartIndexList])

  const comparisonChartUnits = useMemo(() => comparisonCharts.map((chart) => chart.unitCd), [comparisonCharts])

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

    const datasets: Array<{
      label: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: any
      data: FinancialDataPoint[] | Point[]
      colors?: Record<string, string>
      borderColors?: Record<string, string>
      borderColor?: string
      backgroundColors?: Record<string, string>
      borderWidth?: number
      pointRadius?: number
      fill?: boolean
      tension?: number
      metadata?: Record<string, number | string | boolean>
    }> = []

    if (mainDatasets !== null) datasets.push(...mainDatasets)
    if (indicatorDatasets.BB) datasets.push(...indicatorDatasets.BB)
    if (indicatorDatasets.MA) datasets.push(...indicatorDatasets.MA)
    if (comparisonDatasets.length) {
      datasets.push(...comparisonDatasets)
    }

    const newChartInstance = new Chart(ctx, {
      type: 'candlestick',
      data: {
        datasets,
      },
      plugins: [verticalAxisDecoratorPlugin, crosshairLinePlugin, priceIndicatorPlugin, fillBetweenPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: interval,
              options: {
                locale: 'ko',
              },
            },
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
            adapters: {
              date: {
                locale: 'ko',
              },
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            afterTickToLabelConversion(axis: any) {
              if (axis.ticks.length > 0) {
                axis.ticks[0].label = ''
              }
            },
            ticks: {
              maxTicksLimit: 12,
              padding: 12,
              color: '#2E3F5E',
              font: {
                size: 14,
                family: 'Pretendard,sans-serif',
                weight: '500',
              },
            },
          },
          y: generateYAxis({
            isMain: true,
            position: 'left',
            unit: mainData.unit,
            borderColor: '#DEE2E6',
          }),
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
            limits: {
              x: {
                min: mainDatasets?.[0]?.data[0]?.x,
                max: mainDatasets?.[0]?.data[mainDatasets[0].data.length - 1]?.x,
              },
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
          top: `${chartInstance?.chartArea?.top}px`,
          left: `${(chartInstance?.chartArea?.left ?? 0) + 10}px`,
        }}
      >
        <MIChartLegendToggle
          labels={comparisonDatasets.map((data) => data.label)}
          colors={comparisonDatasets.map((data) => data.metaData?.chipColor)}
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
})

MIChart.displayName = 'MIChart'

export default MIChart
