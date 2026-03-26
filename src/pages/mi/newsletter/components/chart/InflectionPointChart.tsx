import { Box, Collapse } from '@mui/material'
import { Chart as ChartJS } from 'chart.js'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { isEmpty } from 'lodash-es'
import { useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { Chart } from 'react-chartjs-2'

import '@/lib/chart/adapterDayjs'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CandlestickChartIcon from '@/components/common/icons/CandlestickChartIcon'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
import ShowChartIcon from '@/components/common/icons/ShowChartIcon'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import InflectionPointChartPlugin from '@/lib/chart/plugins/InflectionPointChartPlugin'
import { useChartImageCapture } from '@/pages/mi/newsletter/components/chart/useChartImageCapture'
import { INewsFlowChartData, IRelatedNewsEventItem, NewsletterDetailPageMode } from '@/service/mi/newsletter'
import { ChartType } from '@/types/dataDetailChart'
import { calculateYAxisRange, filterValidChartValues } from '@/utils/dataUtil'

dayjs.extend(utc)
dayjs.extend(timezone)

type BoxPosition = { x: number; y: number }
type BoxPositions = Record<number, BoxPosition>
type TitleEdits = Record<number, string>

interface TitleEditInfo {
  timestamp: number
  x: number
  y: number
  width: number
  height: number
  title: string
}

interface Props {
  chartData?: INewsFlowChartData
  relatedNews?: IRelatedNewsEventItem[]
  mode: NewsletterDetailPageMode
  marketOpenTime?: number
  marketCloseTime?: number
  /** 거래량 패널 표시 여부 (기본값: true) */
  showVolumePanel?: boolean
  /** 그래프 유형 / 리셋 버튼 툴바 표시 여부 (기본값: false) */
  showChartToolbar?: boolean
  /** 차트 이미지가 생성/변경될 때마다 호출 (즉시 이미지 반영용) */
  onChartImageReady?: (image: string) => void
  /** controlled: 차트 타입 (미전달 시 내부 state 사용) */
  chartType?: ChartType
  /** controlled: 차트 타입 변경 시 호출 */
  onChartTypeChange?: (value: ChartType) => void
  /** controlled: 박스 위치 (미전달 시 내부 state 사용) */
  boxPositions?: BoxPositions
  /** controlled: 박스 위치 변경 시 호출 */
  onBoxPositionChange?: (timestamp: number, position: BoxPosition) => void
  /** controlled: 박스 위치 초기화 (미전달 시 내부 reset 사용) */
  onResetBoxPositions?: () => void
  /** controlled: 뉴스 제목 편집 내용 (timestamp → 편집된 제목) */
  titleEdits?: TitleEdits
  /** controlled: 뉴스 제목 편집 저장 콜백 */
  onTitleEdit?: (timestamp: number, newTitle: string) => void
  /** 차트 ID 접미사 (메인/모달 등 인스턴스 구분용, 기본: 'main') */
  chartIdSuffix?: string
}

export interface InflectionPointChartRef {
  resetBoxPositions: () => void
  waitForChartImage: () => Promise<string>
}

ChartJS.register(CandlestickController, CandlestickElement, OhlcController, OhlcElement)

type ChartJSOrUndefined = ChartJS | undefined

/** 거래량 영역 높이 (표시 높이 조절 시 여기만 수정) */
const VOLUME_HEIGHT_FULL = 170
const VOLUME_HEIGHT_COLLAPSED = 32

const InflectionPointChart = forwardRef<InflectionPointChartRef, Props>(
  (
    {
      chartData,
      relatedNews,
      mode,
      marketOpenTime,
      marketCloseTime,
      showVolumePanel = true,
      showChartToolbar = false,
      onChartImageReady,
      chartType: chartTypeProp,
      onChartTypeChange,
      boxPositions: boxPositionsProp,
      onBoxPositionChange: onBoxPositionChangeProp,
      onResetBoxPositions,
      titleEdits: titleEditsProp,
      onTitleEdit: onTitleEditProp,
      chartIdSuffix = 'main',
    },
    ref,
  ) => {
    const mainChartRef = useRef<ChartJSOrUndefined | null>(null)
    const volumeChartRef = useRef<ChartJSOrUndefined | null>(null)
    const [chartTypeInternal, setChartTypeInternal] = useState<ChartType>(ChartType.CANDLE)
    const [forceUpdate, setForceUpdate] = useState(0)
    const [boxPositionsInternal, setBoxPositionsInternal] = useState<BoxPositions>({})
    const [titleEditsInternal, setTitleEditsInternal] = useState<TitleEdits>({})
    const [editingTitle, setEditingTitle] = useState<(TitleEditInfo & { text: string }) | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const chartContainerRef = useRef<HTMLDivElement>(null)

    const chartType = chartTypeProp ?? chartTypeInternal
    const boxPositions = boxPositionsProp ?? boxPositionsInternal
    const titleEdits = titleEditsProp ?? titleEditsInternal

    const handleRedrawChart = useCallback(() => {
      if (mainChartRef.current) {
        mainChartRef.current.destroy()
      }
      if (volumeChartRef.current) {
        volumeChartRef.current.destroy()
      }
      setForceUpdate((prev) => prev + 1)
    }, [])

    // 차트 참조가 설정될 때 canvas ID 설정 (인스턴스별 고유 ID로 initialPositionsMap 분리)
    const setMainChartRef = useCallback(
      (chartRef: ChartJSOrUndefined | null) => {
        mainChartRef.current = chartRef
        if (chartRef?.canvas && !chartRef.canvas.id) {
          chartRef.canvas.id = `inflection-point-main-chart-${chartIdSuffix}`
        }
      },
      [chartIdSuffix],
    )

    const setVolumeChartRef = useCallback((chartRef: ChartJSOrUndefined | null) => {
      volumeChartRef.current = chartRef
      if (chartRef?.canvas && !chartRef.canvas.id) {
        chartRef.canvas.id = 'inflection-point-volume-chart'
      }
    }, [])

    const handleChartTypeChange = useCallback(
      (value: ChartType) => {
        if (onChartTypeChange) {
          onChartTypeChange(value)
        } else {
          setChartTypeInternal(value)
        }
      },
      [onChartTypeChange],
    )

    const handleBoxPositionChange = useCallback(
      (timestamp: number, position: BoxPosition) => {
        if (onBoxPositionChangeProp) {
          onBoxPositionChangeProp(timestamp, position)
        } else {
          setBoxPositionsInternal((prev) => ({
            ...prev,
            [timestamp]: position,
          }))
        }
      },
      [onBoxPositionChangeProp],
    )

    const handleTitleEdit = useCallback(
      (timestamp: number, newTitle: string) => {
        if (onTitleEditProp) {
          onTitleEditProp(timestamp, newTitle)
        } else {
          setTitleEditsInternal((prev) => ({ ...prev, [timestamp]: newTitle }))
        }
      },
      [onTitleEditProp],
    )

    const handleTitleEditStart = useCallback(
      (info: TitleEditInfo) => {
        const currentText = titleEdits[info.timestamp] ?? info.title
        setEditingTitle({ ...info, text: currentText })
      },
      [titleEdits],
    )

    const handleTitleEditSave = useCallback(() => {
      if (!editingTitle) return
      handleTitleEdit(editingTitle.timestamp, editingTitle.text)
      setEditingTitle(null)
    }, [editingTitle, handleTitleEdit])

    useEffect(() => {
      if (textareaRef.current && editingTitle) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        textareaRef.current.focus()
        textareaRef.current.select()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- editingTitle 전체 참조 시 매 keystroke마다 실행됨, timestamp 변경 시에만 필요
    }, [editingTitle?.timestamp])

    const resetBoxPositions = useCallback(() => {
      if (onResetBoxPositions) {
        onResetBoxPositions()
      } else {
        setBoxPositionsInternal({})
      }
      handleRedrawChart()
    }, [handleRedrawChart, onResetBoxPositions])

    const timestamps = useMemo(() => (chartData?.chartData?.timestamps || []).map(Number), [chartData?.chartData?.timestamps])

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

    const shouldShowVolume = hasVolume && showVolumePanel
    /** hasVolume이면 항상 하단 영역 표시 (전체 or x축만) → 이미지 합성에 volume 포함 */
    const { base64ChartImage, saveMainChartCanvas, saveVolumeChartCanvas, chartImageResolversRef } = useChartImageCapture(!!hasVolume)

    // 차트 이미지가 생성/변경될 때마다 상위로 전파 (즉시 반영)
    const onChartImageReadyRef = useRef(onChartImageReady)
    onChartImageReadyRef.current = onChartImageReady
    useEffect(() => {
      document.body.dataset.mainChartImageReady = base64ChartImage ? String(base64ChartImage.length) : ''
      if (base64ChartImage) onChartImageReadyRef.current?.(base64ChartImage)
    }, [base64ChartImage])

    useEffect(() => {
      const timer = window.setTimeout(() => {
        const canvases = chartContainerRef.current?.querySelectorAll('canvas')
        document.body.dataset.mainChartCanvasInfo = JSON.stringify({
          fallbackRan: true,
          canvasCount: canvases?.length ?? 0,
          mainRefCanvas: !!mainChartRef.current?.canvas,
          volumeRefCanvas: !!volumeChartRef.current?.canvas,
          firstCanvasSize: canvases?.item(0)
            ? {
              width: (canvases.item(0) as HTMLCanvasElement).width,
              height: (canvases.item(0) as HTMLCanvasElement).height,
            }
            : null,
          secondCanvasSize:
            canvases && canvases.length > 1
              ? {
                width: (canvases.item(1) as HTMLCanvasElement).width,
                height: (canvases.item(1) as HTMLCanvasElement).height,
              }
              : null,
        })

        const mainCanvas = mainChartRef.current?.canvas ?? (canvases?.item(0) as HTMLCanvasElement | null)
        if (mainCanvas) {
          document.body.dataset.mainChartCanvasSaved = `${mainCanvas.width}x${mainCanvas.height}`
          saveMainChartCanvas(mainCanvas)
        }

        const volumeCanvas =
          volumeChartRef.current?.canvas ?? (canvases && canvases.length > 1 ? (canvases.item(1) as HTMLCanvasElement | null) : null)
        if (volumeCanvas) {
          document.body.dataset.volumeChartCanvasSaved = `${volumeCanvas.width}x${volumeCanvas.height}`
          saveVolumeChartCanvas(volumeCanvas)
        }
      }, 300)

      return () => window.clearTimeout(timer)
    }, [timestamps, chartType, shouldShowVolume, forceUpdate, saveMainChartCanvas, saveVolumeChartCanvas])

    useImperativeHandle(
      ref,
      () => ({
        resetBoxPositions,
        waitForChartImage: () => {
          if (base64ChartImage) return Promise.resolve(base64ChartImage)
          return new Promise<string>((resolve) => {
            chartImageResolversRef.current.push(resolve)
          })
        },
      }),
      [resetBoxPositions, base64ChartImage, chartImageResolversRef],
    )

    // 최고점 데이터 계산
    const highPointData = useMemo(() => {
      if (!highDataSeries?.values || !timestamps.length) return null

      const values = highDataSeries.values
      // 빈 값(null, undefined, NaN) 필터링
      const validValues = filterValidChartValues(values)

      if (!validValues.length) return null

      const maxValue = Math.max(...validValues)
      const maxIndex = values.indexOf(maxValue)

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
      // 빈 값(null, undefined, NaN) 필터링
      const validValues = filterValidChartValues(values)

      if (!validValues.length) return null

      const minValue = Math.min(...validValues)
      const minIndex = values.indexOf(minValue)

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
            requestAnimationFrame(() => {
              const canvas = mainChartRef.current?.canvas
              if (canvas) saveMainChartCanvas(canvas)
            })
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
              const closeSeries = chartData?.chartData?.series?.find((s) => s.seriesId?.toLowerCase() === 'close')
              const range = closeSeries?.range
              const values = closeSeries?.values ?? [0]
              return isEmpty(range) ? calculateYAxisRange(values, 30, 30, true) : { min: range?.[0], max: range?.[1] }
            })(),
            afterDataLimits(scale: { min: number; max: number }) {
              const closeSeries = chartData?.chartData?.series?.find((s) => s.seriesId?.toLowerCase() === 'close')
              const range = closeSeries?.range
              if (isEmpty(range)) {
                const values = closeSeries?.values ?? [0]
                const { min, max } = calculateYAxisRange(values, 30, 30, true)
                scale.min = min
                scale.max = max
              } else {
                scale.min = range?.[0] ?? 0
                scale.max = range?.[1] ?? 0
              }
            },
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
            yAxisStep: closeDataSeries?.dtick,
            relatedNews,
            enableBoxDragging: mode === NewsletterDetailPageMode.EDIT,
            boxPositions,
            onBoxPositionChange: handleBoxPositionChange,
            titleEdits,
            onTitleEditStart: handleTitleEditStart,
            showHighPoint: true,
            highPointData,
            showLowPoint: true,
            lowPointData,
            hideXAxisLabel: true,
            marketOpenTime,
            marketCloseTime,
            seriesTicks: chartData?.chartData?.series?.map((series) => series.dtick) || [],
          },
        },
      }),
      [
        timestamps,
        closeDataSeries?.dtick,
        relatedNews,
        boxPositions,
        handleBoxPositionChange,
        titleEdits,
        handleTitleEditStart,
        chartData?.chartData?.series,
        mode,
        saveMainChartCanvas,
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
          icon: <CandlestickChartIcon />,
        },
        {
          value: ChartType.LINE,
          label: 'Line',
          icon: <ShowChartIcon />,
        },
      ],
      [],
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
          borderWidth: 1,
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

      /** 항상 전체 차트 렌더링 → 컨테이너 overflow로 위쪽 크롭되어 숨김 */
      return [
        {
          label: volumeSeries.label || '',
          data: timestamps.map((_, index) => ({
            x: index,
            y: volumeSeries.values?.[index] ?? null,
          })),
          type: 'bar' as const,
          backgroundColor: '#CED4DA',
          borderSkipped: true,
          yAxisID: 'y',
        },
      ]
    }, [volumeSeries, timestamps])

    /** 항상 전체 거래량 차트 렌더링 → 컨테이너 overflow로 크롭 (그래프가 사라지지 않고 잘려서 숨겨짐) */
    const volumeChartOptions = useMemo(
      () => ({
        ...chartOptions,
        animation: {
          duration: 0,
          onComplete: () => {
            requestAnimationFrame(() => {
              const canvas = volumeChartRef.current?.canvas
              if (canvas) saveVolumeChartCanvas(canvas)
            })
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
            min: (() => {
              const range = volumeSeries?.range
              if (!isEmpty(range) && range?.[0] !== null) return range?.[0] ?? 0
              return 0
            })(),
            max: (() => {
              const range = volumeSeries?.range
              if (!isEmpty(range) && range?.[1] !== null) return range?.[1] ?? 0
              const values = volumeSeries?.values ?? [0]
              const { max } = calculateYAxisRange(values, 2, 0)
              return max
            })(),
            afterDataLimits(scale: { min: number; max: number }) {
              const range = volumeSeries?.range
              if (range && !isEmpty(range)) {
                if (range[0] !== null) scale.min = range[0]
                if (range[1] !== null) scale.max = range[1]
              } else {
                const values = volumeSeries?.values ?? [0]
                const { max } = calculateYAxisRange(values, 2, 0)
                scale.min = 0
                scale.max = max
              }
            },
          },
        },
        plugins: {
          ...chartOptions.plugins,
          InflectionPointChartPlugin: {
            timestamps,
            xAxisTicks: 6,
            yAxisTicks: 4,
            yAxisStep: (() => {
              const dtick = volumeSeries?.dtick
              if (typeof dtick === 'number' && dtick > 0) return dtick
              const values = volumeSeries?.values ?? [0]
              const { step } = calculateYAxisRange(values, 2, 0)
              return Math.max(1, Math.round(step))
            })(),
            useUnitDisplay: true,
            includeTopYAxisLabel: false,
            marketOpenTime,
            marketCloseTime,
            seriesTicks: chartData?.chartData?.series?.map((series) => series.dtick) || [],
          },
        },
      }),
      [
        chartOptions,
        timestamps,
        marketOpenTime,
        marketCloseTime,
        chartData?.chartData?.series,
        saveVolumeChartCanvas,
        volumeSeries?.range,
        volumeSeries?.values,
        volumeSeries?.dtick,
      ],
    )

    const hasVisibleData =
      (chartType === ChartType.CANDLE ? closeDataSeries && openDataSeries && highDataSeries && lowDataSeries : closeDataSeries) || hasVolume

    if (!chartData?.chartData?.series?.length || !hasVisibleData || timestamps.length === 0) {
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

    return (
      <Box width="776px" boxSizing="border-box">
        <Collapse in={showChartToolbar} timeout={{ enter: 300, exit: 250 }}>
          <Box display="flex" justifyContent={mode === NewsletterDetailPageMode.EDIT ? 'flex-end' : 'space-between'} gap="8px" mr="32px">
            <MISelectMenu<ChartType>
              variant="outlined"
              selected={chartType}
              onSelected={(value: ChartType) => handleChartTypeChange(value)}
              items={chartTypeOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
                icon: opt.icon,
              }))}
              zIndex={1310}
              sx={{
                height: '36px',
              }}
            />
            {mode === NewsletterDetailPageMode.EDIT && (
              <MIBaseButton
                variant="outlined"
                onClick={resetBoxPositions}
                sx={{
                  height: '36px',
                  padding: '8px',
                }}
              >
                <RefreshIcon />
              </MIBaseButton>
            )}
          </Box>
        </Collapse>
        <Box ref={chartContainerRef} width="776px" boxSizing="border-box" sx={{ position: 'relative' }}>
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
            <Box
              position="relative"
              width="100%"
              overflow="hidden"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                maxHeight: shouldShowVolume ? VOLUME_HEIGHT_FULL : VOLUME_HEIGHT_COLLAPSED,
                transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* 고정 높이 → 컨테이너가 줄어들며 위쪽이 overflow로 크롭되는 효과 */}
              <Box height={VOLUME_HEIGHT_FULL} sx={{ flexShrink: 0 }}>
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
          {editingTitle && (
            <textarea
              ref={textareaRef}
              value={editingTitle.text}
              onChange={(e) => {
                setEditingTitle((prev) => (prev ? { ...prev, text: e.target.value } : null))
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto'
                  textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
                }
              }}
              onBlur={handleTitleEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setEditingTitle(null)
                }
              }}
              style={{
                position: 'absolute',
                left: editingTitle.x - 7,
                top: editingTitle.y - 5,
                width: Math.max(editingTitle.width - 2, 80),
                minHeight: editingTitle.height,
                font: '600 12px Pretendard, sans-serif',
                lineHeight: '16px',
                color: '#495057',
                background: '#fff',
                border: '2px solid #228BE6',
                borderRadius: '3px',
                padding: '3px 5px',
                resize: 'none',
                outline: 'none',
                zIndex: 10,
                boxSizing: 'border-box' as const,
                overflow: 'hidden',
                wordBreak: 'break-all' as const,
              }}
            />
          )}
        </Box>
      </Box>
    )
  },
)

InflectionPointChart.displayName = 'InflectionPointChart'

export default InflectionPointChart
