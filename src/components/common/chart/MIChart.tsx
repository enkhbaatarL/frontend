import { Box } from '@mui/material'
import Chart, { FinancialDataPoint, Tooltip } from 'chart.js/auto'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import zoomPlugin from 'chartjs-plugin-zoom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import '@/lib/chart/adapterDayjs'
import MIChartLegendToggle from './MIChartLegendToggle'
import MIChartTooltip from './MIChartTooltip'
import { ChartType, LineData, OHLCData } from './type'

import fillBetweenPlugin from '@/lib/chart/line/plugins/fillBetweenPlugin'
import crosshairLinePlugin from '@/lib/chart/plugins/crosshairLinePlugin'
import priceIndicatorPlugin from '@/lib/chart/plugins/priceIndicatorPlugin'
import verticalAxisDecoratorPlugin from '@/lib/chart/plugins/verticalAxisDecoratorPlugin'
import { generateYAxis } from '@/lib/chart/utils/chartUtils'

interface MIChartProps {
  mainData?: {
    label: string
    unit: string
    data: OHLCData[]
    sma5?: LineData[]
    sma20?: LineData[]
    sma60?: LineData[]
    sma120?: LineData[]
    bb?: {
      upper: LineData[]
      lower: LineData[]
    }
  }
  comparisionDataGroup?: Array<{
    label: string
    unit: string
    data: LineData[]
  }>
  width?: string | number
  height?: string | number
  interval?: 'day' | 'month' | 'year'
  numberOfBars?: number
  chartType?: ChartType
}

Chart.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement)

Tooltip.positioners.pointerPositioner = function (_elements, eventPosition) {
  return {
    x: eventPosition.x,
    y: eventPosition.y,
  }
}

export default function MIChart(props: Readonly<MIChartProps>) {
  const {
    height,
    interval = 'day',
    numberOfBars = 60,
    mainData = { unit: '', data: [], label: '' },
    chartType = 'candlestick',
    comparisionDataGroup = [],
  } = props
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [chartInstance, setChartInstance] = useState<Chart<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    | FinancialDataPoint[]
    | {
        x: number
        y: number | null
      }[],
    unknown
  > | null>(null)
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 })
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

  const comparisionDatasets = useMemo(() => {
    //TODO: Need to refactor logic pick color
    const colors = ['#0CA678', '#FF973C', '#5191F5']

    return comparisionDataGroup.map((comparisionData, index) => ({
      label: comparisionData.label,
      data: comparisionData.data.map((item) => ({ x: item.time.getTime(), y: item.value })),
      type: 'line',
      pointRadius: 0,
      borderColor: colors[index % 3],
      borderWidth: 3,
      fill: false,
      tension: 0.1,
      yAxisID: comparisionData.unit === 'mg' ? 'y1' : 'y2',
    }))
  }, [comparisionDataGroup])

  const generateSMADatasets = useCallback(
    (label: string, color: string, data: LineData[]) => ({
      label,
      data: data.map((item) => ({ x: item.time.getTime(), y: item.value })),
      type: 'line',
      pointRadius: 0,
      borderColor: color,
      borderWidth: 1,
      fill: false,
      tension: 0.1,
      yAxisID: 'y',
    }),
    [],
  )

  const subYAxes = useMemo(() => {
    const axises: Record<string, ReturnType<typeof generateYAxis>> = {}

    if (comparisionDatasets.some((data) => data.yAxisID === 'y1')) {
      axises.y1 = generateYAxis({ position: 'right', unit: 'mg' })
    }
    if (comparisionDatasets.some((data) => data.yAxisID === 'y2')) {
      axises.y2 = generateYAxis({ position: 'right', unit: '$/MMbtu', borderColor: '#DEE2E6' })
    }

    return axises
  }, [comparisionDatasets])

  const createChart = () => {
    if (mainData.data.length === 0) return

    if (chartInstance) {
      chartInstance.destroy()
    }

    if (!chartRef.current) return

    let priceData

    if (chartType === 'candlestick') {
      priceData = mainData.data.map((d) => ({
        x: d.time.getTime(),
        o: d.open,
        h: d.high,
        l: d.low,
        c: d.close,
      }))
    } else {
      priceData = mainData.data.map((d) => ({
        x: d.time.getTime(),
        y: d.close,
      }))
    }

    if (visibleRange.start === 0 && visibleRange.end === 0) {
      setVisibleRange({
        start: Math.max(0, mainData.data.length - numberOfBars),
        end: mainData.data.length - 1,
      })
    }

    const ctx = chartRef.current

    if (!ctx) return

    const datasets: Array<{
      label: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: any
      data: FinancialDataPoint[] | { x: number; y: number | null }[]
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

    if (chartType === 'candlestick') {
      datasets.push({
        label: mainData.label,
        data: priceData,
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
        metadata: {
          isMain: true,
        },
      })
    } else {
      datasets.push({
        label: mainData.label,
        data: priceData,
        type: 'line',
        borderColor: '#2F62A3',
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
        metadata: {
          isMain: true,
        },
      })
    }

    if (comparisionDatasets.length) {
      datasets.push(...comparisionDatasets)
    }

    if (mainData.sma5?.length) {
      datasets.push(generateSMADatasets('MA5', '#0CA678', mainData.sma5))
    }

    if (mainData.sma20?.length) {
      datasets.push(generateSMADatasets('MA20', '#F03E3E', mainData.sma20))
    }

    if (mainData.sma60?.length) {
      datasets.push(generateSMADatasets('MA60', '#F76707', mainData.sma60))
    }

    if (mainData.sma120?.length) {
      datasets.push(generateSMADatasets('MA120', '#7048E8', mainData.sma120))
    }

    if (mainData.bb) {
      datasets.push(
        {
          label: 'Upper BB',
          data: mainData.bb.upper.map((item) => ({ x: item.time.getTime(), y: item.value })),
          type: 'line',
          pointRadius: 0,
          borderColor: '#FF6B6B',
          borderWidth: 1,
          fill: false,
          tension: 0.1,
        },
        {
          label: 'Lower BB',
          data: mainData.bb.lower.map((item) => ({ x: item.time.getTime(), y: item.value })),
          type: 'line',
          pointRadius: 0,
          borderColor: '#5191F5',
          borderWidth: 1,
          tension: 0.1,
          fill: false,
        },
      )
    }

    const newChartInstance = new Chart(ctx, {
      type: chartType,
      data: {
        datasets,
      },
      plugins: [zoomPlugin, verticalAxisDecoratorPlugin, crosshairLinePlugin, priceIndicatorPlugin, fillBetweenPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
            min: mainData.data[visibleRange.start]?.time.getTime(),
            max: mainData.data[visibleRange.end]?.time.getTime(),
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
              // Remove the first tick label
              if (axis.ticks.length > 0) {
                axis.ticks[0].label = ''
              }
            },
            ticks: {
              maxTicksLimit: 12,
              padding: 12,
              color: '#2E3F5E', // Change this to your desired color
              font: {
                size: 14, // Font size in pixels
                family: 'Pretendard,sans-serif', // Font family
                weight: '500', // Optional: font weight
              },
            },
          },
          y: generateYAxis({ isMain: true, position: 'left', unit: mainData.unit, borderColor: '#DEE2E6' }),
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
            display: false, // Hides the built-in legend
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
            },
            zoom: {
              wheel: {
                enabled: true,
                speed: 0.1,
              },
              enabled: true,
              mode: 'x',
            },
            limits: {
              x: {
                min: mainData.data[0].time.getTime(),
                max: mainData.data[mainData.data.length - 1].time.getTime(),
              },
            },
          },
          crosshairLinePlugin: {
            onPointerMove: externalTooltipHandler,
          },
        },
      },
    })

    setChartInstance(newChartInstance)
  }

  useEffect(() => {
    if (mainData.data.length > 0) {
      createChart()
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy()
      }
    }
  }, [mainData, visibleRange, chartType, numberOfBars, interval])

  return (
    <Box height={height} width={'100%'} maxWidth={'100%'} sx={{ position: 'relative', boxSizing: 'border-box' }}>
      <Box
        sx={{
          position: 'absolute',
          top: `${chartInstance?.chartArea?.top}px`,
          left: `${(chartInstance?.chartArea?.left ?? 0) + 10}px`,
        }}
      >
        <MIChartLegendToggle
          labels={['비교군 데이터명 비교군 데이터명', '비교군 데이터명', '비교군 데이터명 비교군 데이터명', '비교군 데이터명']}
        />
      </Box>

      <canvas ref={chartRef} />
      <MIChartTooltip {...tooltip} />
    </Box>
  )
}
