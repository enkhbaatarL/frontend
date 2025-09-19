import { Box } from '@mui/material'
import { Chart as ChartJS } from 'chart.js'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import html2canvas from 'html2canvas'
import { debounce } from 'lodash-es'
import { useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Chart } from 'react-chartjs-2'

import '@/lib/chart/adapterDayjs'
import MIButton from '@/components/common/button/MIButton'
import CandlestickChartOutlineIcon from '@/components/common/icons/CandlestickChartOutlineIcon'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
import ShowChartIcon from '@/components/common/icons/ShowChartIcon'
import InflectionPointChartPlugin from '@/lib/chart/plugins/InflectionPointChartPlugin'
import { INewsFlowChartData, IRelatedNewsEventItem, NewsletterDetailPageMode } from '@/service/mi/newsletter'
import { ChartType } from '@/types/dataDetailChart'

interface Props {
  chartData?: INewsFlowChartData
  relatedNews?: IRelatedNewsEventItem[]
  mode: NewsletterDetailPageMode
}

export interface InflectionPointChartRef {
  resetBoxPositions: () => void
}

ChartJS.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement)

type ChartJSOrUndefined = ChartJS | undefined

const InflectionPointChart = forwardRef<InflectionPointChartRef, Props>(({ chartData, relatedNews, mode }, ref) => {
  const mainChartRef = useRef<ChartJSOrUndefined | null>(null)
  const volumeChartRef = useRef<ChartJSOrUndefined | null>(null)
  const [chartType, setChartType] = useState<ChartType>(ChartType.LINE)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [boxPositions, setBoxPositions] = useState<Record<number, { x: number; y: number }>>({})
  const [base64ChartImage, setBase64ChartImage] = useState<string>('')
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const handleRedrawChart = useCallback(() => {
    if (mainChartRef.current) {
      mainChartRef.current.destroy()
    }
    if (volumeChartRef.current) {
      volumeChartRef.current.destroy()
    }
    setForceUpdate((prev) => prev + 1)
  }, [])

  // 차트 참조가 설정될 때 canvas ID 설정
  const setMainChartRef = useCallback((chartRef: ChartJSOrUndefined | null) => {
    mainChartRef.current = chartRef
    if (chartRef?.canvas && !chartRef.canvas.id) {
      chartRef.canvas.id = 'inflection-point-main-chart'
    }
  }, [])

  const setVolumeChartRef = useCallback((chartRef: ChartJSOrUndefined | null) => {
    volumeChartRef.current = chartRef
    if (chartRef?.canvas && !chartRef.canvas.id) {
      chartRef.canvas.id = 'inflection-point-volume-chart'
    }
  }, [])

  const handleBoxPositionChange = useCallback((timestamp: number, position: { x: number; y: number }) => {
    setBoxPositions((prev) => ({
      ...prev,
      [timestamp]: position,
    }))
  }, [])

  const resetBoxPositions = useCallback(() => {
    setBoxPositions({})
    handleRedrawChart()
  }, [handleRedrawChart])

  useImperativeHandle(
    ref,
    () => ({
      resetBoxPositions,
    }),
    [resetBoxPositions],
  )

  const timestamps = useMemo(
    () => (chartData?.chartData?.timestamps || []).map((timestamp) => Number(timestamp)),
    [chartData?.chartData?.timestamps],
  )

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
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
          right: 30,
          top: 0,
          left: 60,
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
          min: (() => {
            const values = chartData?.chartData?.series?.find((s) => s.seriesId?.toLowerCase() === 'close')?.values ?? [0]
            const minValue = Math.min(...values)
            const maxValue = Math.max(...values)
            const range = maxValue - minValue
            return minValue - range * 0.6
          })(),
          max: (() => {
            const values = chartData?.chartData?.series?.find((s) => s.seriesId?.toLowerCase() === 'close')?.values ?? [0]
            const minValue = Math.min(...values)
            const maxValue = Math.max(...values)
            const range = maxValue - minValue
            return maxValue + range * 0.6
          })(),
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
          mode: 'index' as const,
          intersect: false,
        },
        verticalAxisDecorator: {
          yIDs: ['y'],
          boldLine: 'vertical',
        },
        legend: {
          display: false,
          position: 'top' as const,
        },
        InflectionPointChartPlugin: {
          timestamps,
          xAxisTicks: 6,
          yAxisTicks: 8,
          decimalPlaces: 2,
          relatedNews,
          enableBoxDragging: mode === NewsletterDetailPageMode.EDIT,
          boxPositions,
          onBoxPositionChange: handleBoxPositionChange,
        },
      },
    }),
    [timestamps, relatedNews, boxPositions, handleBoxPositionChange, chartData?.chartData?.series, mode],
  )

  const { volumeSeries, closeDataSeries, openDataSeries, highDataSeries, lowDataSeries } = useMemo(() => {
    if (!chartData?.chartData?.series) {
      return { volumeSeries: null, closeDataSeries: null, openDataSeries: null, highDataSeries: null, lowDataSeries: null }
    }

    const series = chartData.chartData.series

    return {
      volumeSeries: series.find(
        (s) =>
          s.renderAs?.toLowerCase() === 'volume' ||
          s.seriesId?.toLowerCase().includes('volume') ||
          s.label?.toLowerCase().includes('volume'),
      ),
      closeDataSeries: series.find((s) => s.seriesId?.toLowerCase() === 'close'),
      openDataSeries: series.find((s) => s.seriesId?.toLowerCase() === 'open'),
      highDataSeries: series.find((s) => s.seriesId?.toLowerCase() === 'high'),
      lowDataSeries: series.find((s) => s.seriesId?.toLowerCase() === 'low'),
    }
  }, [chartData?.chartData?.series])

  const chartTypeOptions = useMemo(
    () => [
      {
        value: ChartType.LINE,
        label: 'Line',
        icon: <ShowChartIcon />,
      },
      {
        value: ChartType.CANDLE,
        label: 'Candles',
        icon: <CandlestickChartOutlineIcon />,
      },
    ],
    [],
  )

  const selectedChart = useMemo(
    () => chartTypeOptions.find((option) => option.value === chartType) ?? chartTypeOptions[0],
    [chartType, chartTypeOptions],
  )

  const mainDataset = useMemo(() => {
    if (chartType === ChartType.CANDLE) {
      // 캔들스틱 차트의 경우 - seriesId가 open, high, low, close인 데이터 사용
      if (!closeDataSeries || !openDataSeries || !highDataSeries || !lowDataSeries) {
        return []
      }

      return [
        {
          label: `${closeDataSeries.label || 'OHLC'}`,
          data: timestamps.map((_, index) => ({
            x: index,
            c: closeDataSeries.values?.[index] ?? null,
            o: openDataSeries.values?.[index] ?? null,
            h: highDataSeries.values?.[index] ?? null,
            l: lowDataSeries.values?.[index] ?? null,
          })),
          type: 'candlestick' as const,
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
        },
      ]
    }

    // 라인 차트의 경우 - seriesId가 'close'인 데이터만 사용
    if (!closeDataSeries) {
      return []
    }

    return [
      {
        label: closeDataSeries.label || closeDataSeries.seriesId,
        data: timestamps.map((_, index) => ({
          x: index,
          y: closeDataSeries.values?.[index] ?? null,
        })),
        type: 'line' as const,
        borderColor: '#2F62A3',
        borderWidth: 3,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
        spanGaps: true,
        yAxisID: 'y',
      },
    ]
  }, [closeDataSeries, openDataSeries, highDataSeries, lowDataSeries, timestamps, chartType])

  const volumeDataset = useMemo(() => {
    if (!volumeSeries?.isVisible) {
      return []
    }

    return [
      {
        label: volumeSeries.label || '',
        data: timestamps.map((_, index) => ({
          x: index,
          y: volumeSeries.values?.[index] ?? null,
        })),
        type: 'bar' as const,
        backgroundColor: timestamps.map((_, index) => {
          const value = volumeSeries.values?.[index] ?? null
          const prevValue = index > 0 ? (volumeSeries.values?.[index - 1] ?? null) : null

          if (value === null || prevValue === null) return 'rgba(60, 138, 54, 0.5)'
          return value < prevValue ? 'rgba(169, 20, 26, 0.5)' : 'rgba(60, 138, 54, 0.5)'
        }),
        yAxisID: 'y',
      },
    ]
  }, [volumeSeries, timestamps])

  const volumeChartOptions = useMemo(
    () => ({
      ...chartOptions,
      layout: {
        padding: {
          right: 30,
          top: 4,
          left: 60,
        },
      },
      elements: {
        line: {
          borderWidth: 0,
        },
      },
      scales: {
        ...chartOptions.scales,
        x: {
          ...chartOptions.scales.x,
          grid: {
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
          min: 0,
          max: Math.max(...(volumeSeries?.values ?? [0])),
        },
      },
      plugins: {
        ...chartOptions.plugins,
        InflectionPointChartPlugin: {
          timestamps,
          xAxisTicks: 6,
          yAxisTicks: 4,
          decimalPlaces: 0,
          useUnitDisplay: true,
        },
      },
    }),
    [chartOptions, volumeSeries?.values, timestamps],
  )

  const hasVolume = useMemo(() => volumeSeries?.isVisible && (volumeSeries.values?.length ?? 0) > 0, [volumeSeries])

  const debouncedGenerateChartImage = useMemo(
    () =>
      debounce(async () => {
        if (chartContainerRef.current) {
          try {
            // 차트가 완전히 렌더링될 때까지 잠시 대기
            await new Promise((resolve) => setTimeout(resolve, 200))

            const canvas = await html2canvas(chartContainerRef.current, {
              backgroundColor: '#ffffff',
              scale: 1,
              useCORS: true,
              allowTaint: true,
              logging: true,
            })

            const dataURL = canvas.toDataURL('image/png')
            setBase64ChartImage(dataURL)
          } catch (error) {
            console.error('Error generating chart image:', error)
          }
        }
      }, 500),
    [],
  )

  useEffect(() => {
    debouncedGenerateChartImage()
  }, [chartData, relatedNews, chartType, forceUpdate, boxPositions, debouncedGenerateChartImage])

  useEffect(
    () => () => {
      debouncedGenerateChartImage.cancel()
    },
    [debouncedGenerateChartImage],
  )

  const hasVisibleData =
    (chartType === ChartType.CANDLE ? closeDataSeries && openDataSeries && highDataSeries && lowDataSeries : closeDataSeries) || hasVolume
  if (!chartData?.chartData?.series?.length || !hasVisibleData) {
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
        차트 데이터가 없습니다
      </Box>
    )
  }

  return (
    <>
      {mode === NewsletterDetailPageMode.CAPTURE && <img src={base64ChartImage} alt="chart" width="776px" />}
      <>
        {mode !== NewsletterDetailPageMode.CAPTURE && (
          <Box display="flex" justifyContent="flex-end" px="30px" pb="12px" gap="8px">
            {mode === NewsletterDetailPageMode.EDIT && (
              <MIButton type={'outlined'} color={'gray'} contentType={'icon'} startIcon={<RefreshIcon />} onClick={resetBoxPositions} />
            )}
            <MIButton
              type={mode === NewsletterDetailPageMode.VIEW ? 'ghost' : 'outlined'}
              color={'gray'}
              valueSelect={selectedChart}
              startIcon={selectedChart.icon}
              contentType={'select'}
              onChange={({ value }) => {
                setChartType(value as ChartType)
              }}
              options={chartTypeOptions}
              minWidth="84px"
            />
          </Box>
        )}
        <Box
          ref={chartContainerRef}
          position="relative"
          width="776px"
          boxSizing="border-box"
          sx={{
            display: mode === NewsletterDetailPageMode.CAPTURE ? 'none' : 'block',
          }}
        >
          <Box height="352px" sx={{ position: 'relative' }}>
            <Chart
              key={`main-chart-${forceUpdate}`}
              ref={setMainChartRef}
              type={'candlestick'}
              data={{ datasets: mainDataset }}
              options={chartOptions}
              plugins={[InflectionPointChartPlugin]}
            />
          </Box>
          {hasVolume && (
            <Box position="relative" width="100%" overflow="hidden">
              <Box height={'120px'}>
                <Chart
                  key={`volume-chart-${forceUpdate}`}
                  ref={setVolumeChartRef}
                  type={'candlestick'}
                  data={{ datasets: volumeDataset }}
                  options={volumeChartOptions}
                  plugins={[InflectionPointChartPlugin]}
                />
              </Box>
            </Box>
          )}
        </Box>
      </>
    </>
  )
})

InflectionPointChart.displayName = 'InflectionPointChart'

export default InflectionPointChart
