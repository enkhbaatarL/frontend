import { Box, CircularProgress } from '@mui/material'
import Chart, { FinancialDataPoint, Tooltip } from 'chart.js/auto'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import '@/lib/chart/adapterDayjs'
import MIChartLegendToggle from './MIChartLegendToggle'
import MIChartTooltip from './MIChartTooltip'

import fillBetweenPlugin from '@/lib/chart/line/plugins/fillBetweenPlugin'
import crosshairLinePlugin from '@/lib/chart/plugins/crosshairLinePlugin'
import priceIndicatorPlugin from '@/lib/chart/plugins/priceIndicatorPlugin'
import verticalAxisDecoratorPlugin from '@/lib/chart/plugins/verticalAxisDecoratorPlugin'
import { generateYAxis } from '@/lib/chart/utils/chartUtils'
import { ChartType, ChartData, Indicator } from '@/types/dataDetailChart'
import { disableContextMenu } from '@/utils/mouse'

interface MIChartProps {
  mainData: {
    unit: string
    data?: ChartData
  }
  indicators?: Indicator[]
  comparisonCharts?: ChartData[]
  width?: string | number
  height?: string | number
  interval?: 'day' | 'month' | 'year'
  chartType?: ChartType
}

Chart.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement)

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
  ma_20: '#DF4B4A',
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

export default function MIChart(props: Readonly<MIChartProps>) {
  const { height, interval = 'day', mainData, chartType = ChartType.LINE, indicators = [], comparisonCharts = [] } = props
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chartInstance, setChartInstance] = useState<Chart<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    | FinancialDataPoint[]
    | {
        x: number | string
        y: number | null
      }[],
    unknown
  > | null>(null)
  const [tooltip, setTooltip] = useState({ visible: false, top: 0, left: 0, content: {} })

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

  const mainDatasets = useMemo(() => {
    const mainDataSeries = mainData?.data?.series.find((series) => series.seriesId === 'main')

    if (chartType === ChartType.LINE) {
      return {
        label: mainDataSeries?.label ?? '',
        data:
          mainDataSeries?.values.map((value, index) => ({
            x: mainData?.data?.timestamps[index] ?? '',
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
      }
    }

    return null
  }, [mainData?.data, chartType])

  const indicatorDatasets = useMemo(() => {
    const ma = indicators.find((indicator) => indicator.indicatorType === 'MOVING_AVERAGE')
    const bb = indicators.find((indicator) => indicator.indicatorType === 'BOLLINGER_BANDS')

    return {
      MA: ma?.series
        .map((series) => ({
          label: maLabels[series.seriesId],
          data: series.values.map((value, index) => ({
            x: ma.timestamps[index],
            y: value,
          })),
          type: 'line',
          borderColor: maColors[series.seriesId],
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
      BB: bb?.series.map((series) => ({
        label: bbLabels[series.seriesId],
        data: series.values.map((value, index) => ({
          x: bb.timestamps[index],
          y: value,
        })),
        type: 'line',
        borderColor: bbColors[series.seriesId],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      })),
    }
  }, [indicators])

  const comparisonDatasets = useMemo(() => {
    const colors = ['#0CA678', '#FF973C', '#5191F5', '#8F5B5D', '#819E9A', '#7D68A4']

    return comparisonCharts.map((chart, index) => ({
      label: chart.series[0].label,
      data: chart.series[0].values.map((value, idx) => ({
        x: chart.timestamps[idx],
        y: value,
      })),
      type: 'line',
      pointRadius: 0,
      borderColor: colors[index % colors.length],
      borderWidth: 3,
      fill: false,
      tension: 0.1,
      yAxisID: chart.unitCd,
    }))
  }, [comparisonCharts])

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

  const createChart = () => {
    setIsLoading(true)
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
      data: FinancialDataPoint[] | { x: number | string; y: number | null }[]
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

    if (mainDatasets !== null) datasets.push(mainDatasets)
    if (indicatorDatasets.MA) datasets.push(...indicatorDatasets.MA)
    if (indicatorDatasets.BB) datasets.push(...indicatorDatasets.BB)
    if (comparisonDatasets.length) {
      datasets.push(...comparisonDatasets)
    }

    const newChartInstance = new Chart(ctx, {
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
            fillColor: 'rgba(206, 212, 218, 0.1)',
          },
          legend: {
            display: false,
          },
          crosshairLinePlugin: {
            onPointerMove: externalTooltipHandler,
          },
        },
      },
    })

    setChartInstance(newChartInstance)
    setIsLoading(false)
  }

  useEffect(() => {
    if (
      mainData.data &&
      (!indicators.length || indicatorDatasets.MA || indicatorDatasets.BB) &&
      (comparisonCharts.length === 0 || comparisonDatasets.length > 0)
    ) {
      createChart()
    }
  }, [mainData.data, indicatorDatasets, comparisonDatasets, interval, mainData.unit, subYAxes])

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
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress sx={{ color: 'gray.40' }} />
        </Box>
      )}
      <Box
        sx={{
          position: 'absolute',
          top: `${chartInstance?.chartArea?.top}px`,
          left: `${(chartInstance?.chartArea?.left ?? 0) + 10}px`,
        }}
      >
        <MIChartLegendToggle
          labels={comparisonDatasets.map((data) => data.label)}
          colors={comparisonDatasets.map((data) => data.borderColor)}
          onChange={(index, isShow) => {
            if (chartInstance) {
              // TODO: 그래프 on/off 기능 구현
              console.log(index, isShow)
            }
          }}
        />
      </Box>

      <canvas ref={chartRef} />
      <MIChartTooltip {...tooltip} />
    </Box>
  )
}
