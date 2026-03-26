import { Box } from '@mui/material'
import { Chart as ChartJS } from 'chart.js'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { isEmpty } from 'lodash-es'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Chart } from 'react-chartjs-2'

import '@/lib/chart/adapterDayjs'
import ReferenceChartPlugin from '@/lib/chart/plugins/ReferenceChartPlugin'
import { generateYAxis } from '@/lib/chart/utils/chartUtils'
import { IChartData } from '@/service/mi/newsletter'
import { calculateYAxisRange } from '@/utils/dataUtil'
import { applyRoundedCornersToCanvas } from '@/utils/image'

dayjs.extend(utc)
dayjs.extend(timezone)

interface Props {
  chartData?: IChartData
  marketOpenTime?: number
  marketCloseTime?: number
  onChartImageReady?: (image: string) => void
}

export interface ReferenceChartRef {
  waitForChartImage: () => Promise<string>
}

ChartJS.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement)

type ChartJSOrUndefined = ChartJS | undefined

const ReferenceChart = forwardRef<ReferenceChartRef, Props>(({ chartData, marketOpenTime, marketCloseTime, onChartImageReady }, ref) => {
  const chartRef = useRef<ChartJSOrUndefined | null>(null)
  const [base64ChartImage, setBase64ChartImage] = useState<string>('')
  const [isChartRendered, setIsChartRendered] = useState<boolean>(false)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartImageResolversRef = useRef<((image: string) => void)[]>([])

  useImperativeHandle(
    ref,
    () => ({
      waitForChartImage: () => {
        if (base64ChartImage) return Promise.resolve(base64ChartImage)
        return new Promise<string>((resolve) => {
          chartImageResolversRef.current.push(resolve)
        })
      },
    }),
    [base64ChartImage],
  )

  useEffect(() => {
    if (!base64ChartImage || chartImageResolversRef.current.length === 0) return
    chartImageResolversRef.current.forEach((resolve) => resolve(base64ChartImage))
    chartImageResolversRef.current = []
  }, [base64ChartImage])

  // 차트 이미지가 생성/변경될 때, 상위로 전파 (즉시 반영)
  const onChartImageReadyRef = useRef(onChartImageReady)
  onChartImageReadyRef.current = onChartImageReady
  useEffect(() => {
    if (base64ChartImage) onChartImageReadyRef.current?.(base64ChartImage)
  }, [base64ChartImage])

  const convertChartToImage = useCallback((canvas: HTMLCanvasElement, setImageState: (image: string) => void) => {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.warn('Invalid canvas for image conversion')
      return
    }

    const withRoundedCorners = applyRoundedCornersToCanvas(canvas)
    const dataURL = withRoundedCorners.toDataURL('image/png', 1)
    setImageState(dataURL)
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

  const timestamps = useMemo(() => (chartData?.timestamps || []).map(Number), [chartData?.timestamps])

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
          right: 38,
          top: 14,
          left: 38,
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
            const range = chartData?.series?.[0]?.range
            const values = chartData?.series?.[0]?.values ?? [0]
            return isEmpty(range) ? calculateYAxisRange(values, 30, 30, true) : { min: range?.[0], max: range?.[1] }
          })(),
          afterDataLimits(scale: { min: number; max: number }) {
            const range = chartData?.series?.[0]?.range
            if (isEmpty(range)) {
              const values = chartData?.series?.[0]?.values ?? [0]
              const { min, max } = calculateYAxisRange(values, 30, 30, true)
              scale.min = min
              scale.max = max
            } else {
              scale.min = range?.[0] ?? 0
              scale.max = range?.[1] ?? 0
            }
          },
        },
        ...Object.keys(subYAxes).reduce(
          (acc, key) => {
            const axis = subYAxes[key]
            const seriesIndex = key === 'virtual' ? -1 : Number.parseInt(key.replace('sub-', ''))

            if (seriesIndex >= 1 && chartData?.series?.[seriesIndex]) {
              const values = chartData.series[seriesIndex].values ?? []
              const range = chartData?.series?.[seriesIndex]?.range
              const yAxisRange = isEmpty(range)
                ? calculateYAxisRange(values, 30, 30, true)
                : {
                  min: range?.[0],
                  max: range?.[1],
                }

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
                afterDataLimits(scale: { min: number; max: number }) {
                  if (!isEmpty(range)) {
                    scale.min = range?.[0] ?? 0
                    scale.max = range?.[1] ?? 0
                  }
                },
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
          seriesTicks: chartData?.series?.map((series) => series.dtick) || [],
          boldLine: 'vertical',
        },
        legend: {
          display: false,
          position: 'top' as const,
        },
      },
    }),
    [timestamps, convertChartToImage, marketOpenTime, marketCloseTime, subYAxes, chartData?.series],
  )

  const datasets = useMemo(
    () =>
      chartData?.series?.map((s, index) => {
        const borderColor = getBorderColor(chartData?.series[index].color, index)
        const shouldFill = s.isBidirectional

        return {
          label: s.label || s.seriesId,
          data: timestamps.map((_: number, dataIndex: number) => ({
            x: dataIndex,
            y: s.values?.[dataIndex] ?? null,
          })),
          type: 'line' as const,
          borderColor,
          backgroundColor: shouldFill ? `${borderColor}40` : undefined,
          borderWidth: 1,
          pointRadius: 0,
          fill: shouldFill,
          tension: 0.1,
          spanGaps: true,
          yAxisID: index === 0 ? 'y' : `sub-${index}`,
        }
      }) ?? [],
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
