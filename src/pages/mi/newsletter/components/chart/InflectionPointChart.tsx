import { Box } from '@mui/material'
import { Chart as ChartJS } from 'chart.js'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
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

dayjs.extend(utc)
dayjs.extend(timezone)

interface Props {
  chartData?: INewsFlowChartData
  relatedNews?: IRelatedNewsEventItem[]
  mode: NewsletterDetailPageMode
  marketOpenTime?: number
  marketCloseTime?: number
}

export interface InflectionPointChartRef {
  resetBoxPositions: () => void
}

ChartJS.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement)

type ChartJSOrUndefined = ChartJS | undefined

const InflectionPointChart = forwardRef<InflectionPointChartRef, Props>(
  ({ chartData, relatedNews, mode, marketOpenTime, marketCloseTime }, ref) => {
    const mainChartRef = useRef<ChartJSOrUndefined | null>(null)
    const volumeChartRef = useRef<ChartJSOrUndefined | null>(null)
    const [chartType, setChartType] = useState<ChartType>(ChartType.CANDLE)
    const [forceUpdate, setForceUpdate] = useState(0)
    const [boxPositions, setBoxPositions] = useState<Record<number, { x: number; y: number }>>({})
    const [mainChartImage, setMainChartImage] = useState<HTMLCanvasElement | null>(null)
    const [volumeChartImage, setVolumeChartImage] = useState<HTMLCanvasElement | null>(null)
    const [base64ChartImage, setBase64ChartImage] = useState<string>('')
    const chartContainerRef = useRef<HTMLDivElement>(null)

    const saveChartCanvas = useCallback((canvas: HTMLCanvasElement, setCanvasState: (canvas: HTMLCanvasElement) => void) => {
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height

        tempCtx.fillStyle = '#FFFFFF'
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

        tempCtx.drawImage(canvas, 0, 0)
        setCanvasState(tempCanvas)
      }
    }, [])

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
          step = 1 * magnitude
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

    const hasVolume = useMemo(() => volumeSeries?.isVisible && (volumeSeries.values?.length ?? 0) > 0, [volumeSeries])

    useEffect(() => {
      if (mainChartImage && volumeChartImage) {
        // 메인 차트와 볼륨 차트를 합쳐서 하나의 이미지로 생성
        const combinedCanvas = document.createElement('canvas')
        const combinedCtx = combinedCanvas.getContext('2d')

        if (combinedCtx) {
          combinedCanvas.width = mainChartImage.width
          combinedCanvas.height = mainChartImage.height + volumeChartImage.height

          combinedCtx.fillStyle = '#FFFFFF'
          combinedCtx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height)

          combinedCtx.drawImage(mainChartImage, 0, 0)

          combinedCtx.drawImage(volumeChartImage, 0, mainChartImage.height)

          const dataURL = combinedCanvas.toDataURL('image/png')
          setBase64ChartImage(dataURL)
        }
      } else if (mainChartImage && !hasVolume) {
        const dataURL = mainChartImage.toDataURL('image/png')
        setBase64ChartImage(dataURL)
      }
    }, [mainChartImage, volumeChartImage, hasVolume])

    // 최고점 데이터 계산
    const highPointData = useMemo(() => {
      if (!highDataSeries?.values || !timestamps.length) return null

      const values = highDataSeries.values
      const maxValue = Math.max(...values)
      const maxIndex = values.findIndex((value) => value === maxValue)

      if (maxIndex === -1) return null

      const timestamp = timestamps[maxIndex]
      const time = dayjs(timestamp).tz('America/New_York').format('HH:mm')

      return {
        value: maxValue,
        timestamp,
        time,
      }
    }, [highDataSeries?.values, timestamps])

    // 최저점 데이터 계산
    const lowPointData = useMemo(() => {
      if (!lowDataSeries?.values || !timestamps.length) return null

      const values = lowDataSeries.values
      const minValue = Math.min(...values)
      const minIndex = values.findIndex((value) => value === minValue)

      if (minIndex === -1) return null

      const timestamp = timestamps[minIndex]
      const time = dayjs(timestamp).tz('America/New_York').format('HH:mm')

      return {
        value: minValue,
        timestamp,
        time,
      }
    }, [lowDataSeries?.values, timestamps])

    const chartOptions = useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0,
          onComplete: () => {
            const canvas = mainChartRef.current?.canvas
            if (canvas) {
              saveChartCanvas(canvas, setMainChartImage)
            }
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
            right: 30,
            top: 20,
            left: 60,
            bottom: 6,
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
              const values = chartData?.chartData?.series?.find((s) => s.seriesId?.toLowerCase() === 'close')?.values ?? [0]
              return calculateYAxisRange(values, 30, 30, true)
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
            yAxisTicks: 5,
            yAxisStep: 1,
            decimalPlaces: 2,
            relatedNews,
            enableBoxDragging: mode === NewsletterDetailPageMode.EDIT,
            boxPositions,
            onBoxPositionChange: handleBoxPositionChange,
            showHighPoint: true,
            highPointData,
            showLowPoint: true,
            lowPointData,
            hideXAxisLabel: true,
            marketOpenTime,
            marketCloseTime,
          },
        },
      }),
      [
        timestamps,
        relatedNews,
        boxPositions,
        handleBoxPositionChange,
        chartData?.chartData?.series,
        mode,
        saveChartCanvas,
        calculateYAxisRange,
        highPointData,
        lowPointData,
        marketOpenTime,
        marketCloseTime,
      ],
    )

    const chartTypeOptions = useMemo(
      () => [
        {
          value: ChartType.CANDLE,
          label: 'Candles',
          icon: <CandlestickChartOutlineIcon />,
        },
        {
          value: ChartType.LINE,
          label: 'Line',
          icon: <ShowChartIcon />,
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
              up: '#DF4B4A',
              down: '#1967D2',
              unchanged: '#5a5a5a',
            },
            borderColors: {
              up: '#DF4B4A',
              down: '#1967D2',
              unchanged: '#5a5a5a',
            },
            backgroundColors: {
              up: '#DF4B4A',
              down: '#1967D2',
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
          backgroundColor: '#CED4DA',
          yAxisID: 'y',
        },
      ]
    }, [volumeSeries, timestamps])

    const volumeChartOptions = useMemo(
      () => ({
        ...chartOptions,
        animation: {
          duration: 0,
          onComplete: () => {
            const canvas = volumeChartRef.current?.canvas
            if (canvas) {
              saveChartCanvas(canvas, setVolumeChartImage)
            }
          },
        },
        layout: {
          padding: {
            right: 30,
            top: 16,
            left: 60,
            bottom: 30,
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
            max: (() => {
              const values = volumeSeries?.values ?? [0]
              const range = calculateYAxisRange(values, 2, 0)
              return range.max
            })(),
          },
        },
        plugins: {
          ...chartOptions.plugins,
          InflectionPointChartPlugin: {
            timestamps,
            xAxisTicks: 6,
            yAxisTicks: 4,
            yAxisStep: 1000,
            decimalPlaces: 0,
            useUnitDisplay: true,
            marketOpenTime,
            marketCloseTime,
          },
        },
      }),
      [chartOptions, volumeSeries?.values, timestamps, saveChartCanvas, calculateYAxisRange, marketOpenTime, marketCloseTime],
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
        {mode === NewsletterDetailPageMode.CAPTURE && <>{base64ChartImage && <img src={base64ChartImage} alt="chart" width="100%" />}</>}
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
            <Box height="322px" sx={{ position: 'relative' }}>
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
                <Box height={'170px'}>
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
  },
)

InflectionPointChart.displayName = 'InflectionPointChart'

export default InflectionPointChart
