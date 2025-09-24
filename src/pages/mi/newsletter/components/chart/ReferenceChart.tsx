import { Box } from '@mui/material'
import { Chart as ChartJS } from 'chart.js'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Chart } from 'react-chartjs-2'

import '@/lib/chart/adapterDayjs'
import ReferenceChartPlugin from '@/lib/chart/plugins/ReferenceChartPlugin'
import { generateYAxis } from '@/lib/chart/utils/chartUtils'
import { IChartData } from '@/service/mi/newsletter'

dayjs.extend(utc)
dayjs.extend(timezone)

interface Props {
  chartData?: IChartData
  marketOpenTime?: number
  marketCloseTime?: number
}

export interface ReferenceChartRef {
  isRendered: () => boolean
  getImageData: () => string
}

ChartJS.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement)

type ChartJSOrUndefined = ChartJS | undefined

const ReferenceChart = forwardRef<ReferenceChartRef, Props>(({ chartData, marketOpenTime, marketCloseTime }, ref) => {
  const chartRef = useRef<ChartJSOrUndefined | null>(null)
  const [base64ChartImage, setBase64ChartImage] = useState<string>('')
  const [isChartRendered, setIsChartRendered] = useState<boolean>(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(
    ref,
    () => ({
      isRendered: () => isChartRendered,
      getImageData: () => base64ChartImage,
    }),
    [isChartRendered, base64ChartImage],
  )

  const convertChartToImage = useCallback((canvas: HTMLCanvasElement, setImageState: (image: string) => void) => {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.warn('Invalid canvas for image conversion')
      return
    }

    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height

      tempCtx.fillStyle = '#FFFFFF'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

      tempCtx.drawImage(canvas, 0, 0)

      const dataURL = tempCanvas.toDataURL('image/png', 1.0)
      setImageState(dataURL)
    }
  }, [])

  const getBorderColor = useCallback((color?: string, index?: number) => {
    const colors = ['#26757B', '#EFA460', '#94826B', '#8F5B5D', '#819E9A', '#7D68A4', '#EFD485', '#5C5C5C', '#363434']

    switch (color) {
      case 'blue':
        return '#2F62A3'
      case 'grey':
        return '#868E96'
    }

    return colors[index ?? 0]
  }, [])

  const timestamps = useMemo(() => (chartData?.timestamps || []).map((timestamp) => Number(timestamp)), [chartData?.timestamps])
  // y축 min/max 범위 계산 함수 - 적절한 단위를 자동으로 계산하고 퍼센트 패딩 적용
  const calculateYAxisRange = useCallback(
    (values: number[], paddingTop: number = 0, paddingBottom: number = 0, showNearAxis: boolean = false) => {
      if (!values.length) return { min: 0, max: 0 }

      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      const range = maxValue - minValue

      if (range === 0) {
        const center = minValue
        const padding = Math.max(1, Math.abs(center) * 0.1) || 1
        return {
          min: center - padding,
          max: center + padding,
        }
      }

      // 단위 계산
      const magnitude = Math.pow(10, Math.floor(Math.log10(range)))
      const normalizedRange = range / magnitude

      let step: number
      if (normalizedRange <= 1) {
        step = 0.1 * magnitude
      } else if (normalizedRange <= 2) {
        step = 0.2 * magnitude
      } else if (normalizedRange <= 5) {
        step = 0.5 * magnitude
      } else {
        step = magnitude
      }

      // min과 max를 스텝에 맞게 조정
      let min = Math.floor(minValue / step) * step
      let max = Math.ceil(maxValue / step) * step

      // 퍼센트 패딩 적용
      const adjustedRange = max - min
      const topPadding = (adjustedRange * paddingTop) / 100
      const bottomPadding = (adjustedRange * paddingBottom) / 100

      min = min - bottomPadding
      max = max + topPadding

      // showNearAxis가 true인 경우, 패딩 적용 후 가까운 축이 확장되도록 조정
      if (showNearAxis) {
        min = Math.floor(min - step)
        max = Math.ceil(max + step)
      }

      return { min, max }
    },
    [],
  )

  // sub y축들을 생성하는 로직
  const subYAxes = useMemo(() => {
    const axes: Record<string, ReturnType<typeof generateYAxis>> = {}
    const seriesCount = chartData?.series?.length ?? 0

    // 두 번째 그래프부터 sub y축 생성
    for (let i = 1; i < seriesCount; i++) {
      const series = chartData?.series?.[i]
      const unit = series?.label ?? series?.seriesId ?? ''

      axes[`sub-${i}`] = generateYAxis({
        position: 'right',
        unit,
        borderColor: i === 1 ? undefined : '#DEE2E6',
        scaleTop: 0.3,
        scaleBottom: 0.3,
        axisWidth: 30,
      })
    }

    // sub y축이 없는 경우 가상 y축 생성
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
  }, [chartData?.series])

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0,
        onComplete: () => {
          setTimeout(() => {
            const canvas = chartRef.current?.canvas
            if (canvas && canvas.width > 0 && canvas.height > 0) {
              convertChartToImage(canvas, (imageData) => {
                setBase64ChartImage(imageData)
                setIsChartRendered(true)
              })
            }
          }, 100)
        },
      },
      events: ['mousedown', 'mousemove', 'mouseup', 'click', 'mouseover', 'mouseout'] as (
        | 'mousedown'
        | 'mousemove'
        | 'mouseup'
        | 'click'
        | 'mouseover'
        | 'mouseout'
      )[],
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      onHover: () => {},
      layout: {
        padding: {
          right: 6,
          top: 14,
          left: 28,
          bottom: 30,
        },
      },
      elements: {
        line: {
          borderWidth: 3,
        },
      },
      scales: {
        x: {
          type: 'category' as const,
          labels: timestamps.map((t) => t.toString()),
          title: {
            display: false,
          },
          grid: {
            display: false,
          },
          border: {
            dash: [2, 2],
            width: 1,
            color: '#2E3F5E',
            display: false,
          },
          ticks: {
            display: false,
          },
        },
        y: {
          type: 'linear' as const,
          position: 'left' as const,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            display: false,
          },
          title: {
            display: false,
          },
          ...(() => {
            const values = chartData?.series?.[0]?.values ?? [0]
            return calculateYAxisRange(values, 30, 30, true) // 상하 10% 패딩
          })(),
        },
        ...Object.keys(subYAxes).reduce(
          (acc, key) => {
            const axis = subYAxes[key]
            const seriesIndex = key === 'virtual' ? -1 : parseInt(key.replace('sub-', ''))

            if (seriesIndex >= 1 && chartData?.series?.[seriesIndex]) {
              const values = chartData.series[seriesIndex].values ?? []
              const yAxisRange = calculateYAxisRange(values, 30, 30, true)

              acc[key] = {
                ...axis,
                type: 'linear' as const,
                position: 'right' as const,
                grid: {
                  display: false,
                },
                border: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
                title: {
                  display: false,
                },
                min: yAxisRange.min,
                max: yAxisRange.max,
              }
            } else {
              acc[key] = axis
            }

            return acc
          },
          {} as Record<string, unknown>,
        ),
      },
      plugins: {
        tooltip: {
          enabled: false,
          mode: 'index' as const,
          intersect: false,
        },
        ReferenceChartPlugin: {
          timestamps,
          xAxisTicks: 6,
          yAxisTicks: 5,
          decimalPlaces: 2,
          marketOpenTime,
          marketCloseTime,
          yIDs: ['y', ...Object.keys(subYAxes)],
          subYAxes: Object.keys(subYAxes).reduce(
            (acc, key) => {
              const axis = subYAxes[key]
              acc[key] = {
                unit: axis.unit,
                borderColor: (axis as { borderColor?: string }).borderColor,
                color: (axis as { color?: string }).color,
                isVirtual: axis.isVirtual,
              }
              return acc
            },
            {} as Record<string, { unit: string; borderColor?: string; color?: string; isVirtual?: boolean }>,
          ),
          boldLine: 'vertical',
        },
        legend: {
          display: false,
          position: 'top' as const,
        },
      },
    }),
    [timestamps, convertChartToImage, marketOpenTime, marketCloseTime, subYAxes, calculateYAxisRange, chartData?.series],
  )

  const datasets = useMemo(
    () =>
      chartData?.series?.map((s, index) => ({
        label: s.label || s.seriesId,
        data: timestamps.map((_: number, dataIndex: number) => ({
          x: dataIndex,
          y: s.values?.[dataIndex] ?? null,
        })),
        type: 'line' as const,
        borderColor: getBorderColor(chartData?.series[index].color, index),
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
        spanGaps: true,
        yAxisID: index === 0 ? 'y' : `sub-${index}`,
      })) ?? [],
    [chartData?.series, timestamps, getBorderColor],
  )

  // 차트가 완전히 렌더링되면 이미지만 표시
  const renderChartContent = useMemo(() => {
    if (isChartRendered && base64ChartImage) {
      return (
        <img
          src={base64ChartImage}
          alt="chart"
          width="100%"
          height="322px"
          draggable={false}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      )
    }

    return (
      <Box ref={chartContainerRef} position="relative" width="776px" boxSizing="border-box">
        <Box height="322px" sx={{ position: 'relative' }}>
          <Chart ref={chartRef} type={'candlestick'} data={{ datasets }} options={chartOptions} plugins={[ReferenceChartPlugin]} />
        </Box>
      </Box>
    )
  }, [isChartRendered, base64ChartImage, datasets, chartOptions])

  const hasVisibleData = (chartData?.series.length ?? 0) > 0

  if (!hasVisibleData || timestamps.length === 0) {
    return (
      <Box
        height="352px"
        width="100%"
        sx={{
          position: 'relative',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed #DEE2E6',
          borderRadius: '4px',
          color: '#6C757D',
        }}
      >
        현재 데이터를 불러올 수 없습니다.
      </Box>
    )
  }

  return renderChartContent
})

ReferenceChart.displayName = 'ReferenceChart'

export default ReferenceChart
