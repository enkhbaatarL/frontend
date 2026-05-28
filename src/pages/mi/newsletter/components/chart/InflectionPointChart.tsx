import { Box, Collapse } from '@mui/material'
import { Chart as ChartJS } from 'chart.js'
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { isEmpty } from 'lodash-es'
import {
  useMemo,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useLayoutEffect,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { Chart } from 'react-chartjs-2'

import '@/lib/chart/adapterDayjs'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import CandlestickChartIcon from '@/components/common/icons/CandlestickChartIcon'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
import ShowChartIcon from '@/components/common/icons/ShowChartIcon'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import InflectionPointChartPlugin, {
  drawInflectionNewsTitleBoxes,
  getInflectionNewsBoxLayout,
  type InflectionPointNewsBoxInfo,
} from '@/lib/chart/plugins/InflectionPointChartPlugin'
import {
  findVolumeSeriesInChart,
  INFLECTION_CHART_VOLUME_PANEL_COLLAPSED_HEIGHT,
  INFLECTION_CHART_VOLUME_PANEL_FULL_HEIGHT,
  INFLECTION_POINT_CHART_EMPTY_STATE_HEIGHT,
  INFLECTION_POINT_CHART_MAIN_HEIGHT,
  INFLECTION_POINT_CHART_OUTER_WIDTH,
} from '@/pages/mi/newsletter/components/chart/inflectionPointChartLayout'
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
  /** 드래그 중 React 리렌더 없이 최신 좌표를 외부 저장소에 반영 */
  onBoxPositionPreview?: (timestamp: number, position: BoxPosition) => void
  /** 드래그 종료 시 외부 저장소의 최신 좌표를 React 구독 상태에 반영 */
  onBoxPositionCommit?: () => void
  /** 박스 드래그를 놓은 직후(실제 이동이 있었을 때만) */
  onBoxDragEnd?: () => void
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
const TITLE_BOX_CLICK_THRESHOLD = 5
const TITLE_BOX_DEFERRED_SYNC_DELAY_MS = 500
const TITLE_BOX_MARKER_RADIUS = 11
const TITLE_BOX_TEXT_SHADOW = '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'

const areBoxPositionsEqual = (left: BoxPositions, right: BoxPositions) => {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false

  return leftKeys.every((key) => {
    const leftPosition = left[Number(key)]
    const rightPosition = right[Number(key)]
    return leftPosition?.x === rightPosition?.x && leftPosition?.y === rightPosition?.y
  })
}

const getTitleOverlayTextColor = (trend?: string) => {
  if (trend === 'DOWN') return '#2F62A3'
  if (trend === 'UP') return '#DF4B4A'
  return '#495057'
}

const getTitleOverlayLinePoints = (box: InflectionPointNewsBoxInfo) => {
  const boxCenterY = box.y + box.height / 2
  const boxIsAboveMarker = boxCenterY < box.yPosition
  const boxIsBelowMarker = boxCenterY > box.yPosition

  let markerStartY: number
  if (boxIsAboveMarker) {
    markerStartY = box.yPosition - TITLE_BOX_MARKER_RADIUS - 2
  } else if (boxIsBelowMarker) {
    markerStartY = box.yPosition + TITLE_BOX_MARKER_RADIUS + 2
  } else {
    markerStartY = box.isAbove ? box.yPosition - TITLE_BOX_MARKER_RADIUS - 2 : box.yPosition + TITLE_BOX_MARKER_RADIUS + 2
  }

  let boxConnectionX: number
  if (box.xPosition < box.x) {
    boxConnectionX = box.x
  } else if (box.xPosition > box.x + box.width) {
    boxConnectionX = box.x + box.width
  } else {
    boxConnectionX = box.xPosition
  }

  const boxPadding = 4
  let boxConnectionY: number
  if (boxIsAboveMarker) {
    boxConnectionY = box.y + box.height - boxPadding
  } else if (boxIsBelowMarker) {
    boxConnectionY = box.y + boxPadding
  } else {
    boxConnectionY = box.isAbove ? box.y + box.height - boxPadding : box.y + boxPadding
  }

  return {
    x1: box.xPosition,
    y1: markerStartY,
    x2: boxConnectionX,
    y2: boxConnectionY,
  }
}

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
      onBoxPositionPreview,
      onBoxPositionCommit,
      onBoxDragEnd,
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
    const editingTitleRef = useRef<(TitleEditInfo & { text: string }) | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const titleOverlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const titleOverlayBoxElementsRef = useRef<Map<number, HTMLDivElement>>(new Map())
    const titleOverlayLineElementsRef = useRef<Map<number, SVGLineElement>>(new Map())
    const titleOverlayBoxesRef = useRef<InflectionPointNewsBoxInfo[]>([])
    const titleOverlayPositionsRef = useRef<BoxPositions>({})
    const titleOverlayRafRef = useRef<number | null>(null)
    const titleOverlayPendingLayerMoveRef = useRef<{ timestamp: number; position: BoxPosition } | null>(null)
    const titleOverlayDeferredSyncTimerRef = useRef<number | null>(null)
    const titleOverlayDeferredSyncRef = useRef<{
      timestamp: number
      position: BoxPosition
      boxPositions: BoxPositions
    } | null>(null)
    const titleOverlayCommittedPositionsRef = useRef<BoxPositions | null>(null)
    const titleOverlayDragRef = useRef<{
      isMouseDown: boolean
      isDragging: boolean
      timestamp: number | null
      dragOffset: BoxPosition
      mouseDownPosition: BoxPosition
      latestPosition: BoxPosition | null
      clickedBox: InflectionPointNewsBoxInfo | null
    }>({
      isMouseDown: false,
      isDragging: false,
      timestamp: null,
      dragOffset: { x: 0, y: 0 },
      mouseDownPosition: { x: 0, y: 0 },
      latestPosition: null,
      clickedBox: null,
    })
    const [titleOverlayVersion, setTitleOverlayVersion] = useState(0)
    const [titleOverlayBoxes, setTitleOverlayBoxes] = useState<InflectionPointNewsBoxInfo[]>([])

    const chartType = chartTypeProp ?? chartTypeInternal
    const boxPositions = boxPositionsProp ?? boxPositionsInternal
    const titleEdits = titleEditsProp ?? titleEditsInternal
    const useTitleOverlay = mode === NewsletterDetailPageMode.EDIT

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
        const changed = chartRef !== mainChartRef.current
        mainChartRef.current = chartRef
        if (chartRef?.canvas && !chartRef.canvas.id) {
          chartRef.canvas.id = `inflection-point-main-chart-${chartIdSuffix}`
        }
        if (chartRef && changed) {
          setTitleOverlayVersion((prev) => prev + 1)
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
      editingTitleRef.current = editingTitle
    }, [editingTitle])

    const closeActiveTitleEdit = useCallback(() => {
      const current = editingTitleRef.current
      if (!current) return
      handleTitleEdit(current.timestamp, current.text)
      setEditingTitle(null)
    }, [handleTitleEdit])

    useEffect(() => {
      if (textareaRef.current && editingTitle) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        textareaRef.current.focus()
        textareaRef.current.select()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- editingTitle 전체 참조 시 매 keystroke마다 실행됨, timestamp 변경 시에만 필요
    }, [editingTitle?.timestamp])

    const cancelTitleOverlayDeferredSync = useCallback(() => {
      if (titleOverlayDeferredSyncTimerRef.current !== null) {
        window.clearTimeout(titleOverlayDeferredSyncTimerRef.current)
        titleOverlayDeferredSyncTimerRef.current = null
      }
      titleOverlayDeferredSyncRef.current = null
    }, [])

    const resetBoxPositions = useCallback(() => {
      cancelTitleOverlayDeferredSync()
      titleOverlayPositionsRef.current = {}
      titleOverlayCommittedPositionsRef.current = {}
      if (onResetBoxPositions) {
        onResetBoxPositions()
      } else {
        setBoxPositionsInternal({})
      }
      handleRedrawChart()
    }, [cancelTitleOverlayDeferredSync, handleRedrawChart, onResetBoxPositions])

    const timestamps = useMemo(() => (chartData?.chartData?.timestamps || []).map(Number), [chartData?.chartData?.timestamps])

    const { volumeSeries, closeDataSeries, openDataSeries, highDataSeries, lowDataSeries } = useMemo(() => {
      if (!chartData?.chartData?.series) {
        return { volumeSeries: null, closeDataSeries: null, openDataSeries: null, highDataSeries: null, lowDataSeries: null }
      }

      const series = chartData.chartData.series

      return {
        volumeSeries: findVolumeSeriesInChart(series),
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
    const onBoxDragEndRef = useRef(onBoxDragEnd)
    onBoxDragEndRef.current = onBoxDragEnd
    useEffect(() => {
      document.body.dataset.mainChartImageReady = base64ChartImage ? String(base64ChartImage.length) : ''
      if (base64ChartImage) onChartImageReadyRef.current?.(base64ChartImage)
    }, [base64ChartImage])

    const resizeTitleOverlayCanvas = useCallback(() => {
      const chart = mainChartRef.current
      const overlayCanvas = titleOverlayCanvasRef.current
      const sourceCanvas = chart?.canvas
      if (!overlayCanvas || !sourceCanvas) return null

      const cssWidth = sourceCanvas.clientWidth || sourceCanvas.width
      const cssHeight = sourceCanvas.clientHeight || sourceCanvas.height
      if (!cssWidth || !cssHeight) return null

      if (overlayCanvas.width !== sourceCanvas.width || overlayCanvas.height !== sourceCanvas.height) {
        overlayCanvas.width = sourceCanvas.width
        overlayCanvas.height = sourceCanvas.height
      }
      overlayCanvas.style.width = `${cssWidth}px`
      overlayCanvas.style.height = `${cssHeight}px`

      return {
        scaleX: sourceCanvas.width / cssWidth,
        scaleY: sourceCanvas.height / cssHeight,
      }
    }, [])

    const drawTitleOverlay = useCallback(
      (drawOptions?: { boxPositions?: BoxPositions; omitBoxPositionsFromLayoutSignature?: boolean }) => {
        const chart = mainChartRef.current
        const overlayCanvas = titleOverlayCanvasRef.current
        if (!useTitleOverlay || !chart || !overlayCanvas || !chart.chartArea || !chart.scales.x || !chart.scales.y) {
          titleOverlayBoxesRef.current = []
          setTitleOverlayBoxes([])
          return []
        }

        const scale = resizeTitleOverlayCanvas()
        const ctx = overlayCanvas.getContext('2d')
        if (!scale || !ctx) {
          titleOverlayBoxesRef.current = []
          setTitleOverlayBoxes([])
          return []
        }

        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
        ctx.save()
        ctx.scale(scale.scaleX, scale.scaleY)

        const nextBoxes = getInflectionNewsBoxLayout({
          ctx,
          chartArea: chart.chartArea,
          xScale: chart.scales.x,
          yScale: chart.scales.y,
          relatedNews: relatedNews ?? [],
          timestamps,
          chart,
          boxPositions: drawOptions?.boxPositions ?? boxPositions,
          options: {
            titleEdits,
          },
          omitBoxPositionsFromLayoutSignature: drawOptions?.omitBoxPositionsFromLayoutSignature,
        })
        drawInflectionNewsTitleBoxes(ctx, nextBoxes)
        ctx.restore()

        titleOverlayBoxesRef.current = nextBoxes
        setTitleOverlayBoxes(nextBoxes)
        return nextBoxes
      },
      [boxPositions, relatedNews, resizeTitleOverlayCanvas, timestamps, titleEdits, useTitleOverlay],
    )

    const applyTitleOverlayLayerPosition = useCallback(
      (timestamp: number, position: BoxPosition) => {
        let movedBox: InflectionPointNewsBoxInfo | null = null
        const nextBoxes = titleOverlayBoxesRef.current.map((box) => {
          if (box.timestamp !== timestamp) return box

          const dx = position.x - box.x
          const dy = position.y - box.y
          movedBox = {
            ...box,
            x: position.x,
            y: position.y,
            titleArea: {
              ...box.titleArea,
              x: box.titleArea.x + dx,
              y: box.titleArea.y + dy,
            },
          }
          return movedBox
        })

        if (!movedBox) {
          drawTitleOverlay({
            boxPositions: titleOverlayPositionsRef.current,
            omitBoxPositionsFromLayoutSignature: true,
          })
          return
        }

        titleOverlayBoxesRef.current = nextBoxes

        const boxElement = titleOverlayBoxElementsRef.current.get(timestamp)
        if (boxElement) {
          boxElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`
        }

        const lineElement = titleOverlayLineElementsRef.current.get(timestamp)
        if (lineElement) {
          const { x1, y1, x2, y2 } = getTitleOverlayLinePoints(movedBox)
          lineElement.setAttribute('x1', String(x1))
          lineElement.setAttribute('y1', String(y1))
          lineElement.setAttribute('x2', String(x2))
          lineElement.setAttribute('y2', String(y2))
        }
      },
      [drawTitleOverlay],
    )

    const scheduleTitleOverlayLayerMove = useCallback(
      (timestamp: number, position: BoxPosition) => {
        titleOverlayPendingLayerMoveRef.current = { timestamp, position }
        if (titleOverlayRafRef.current !== null) return

        titleOverlayRafRef.current = requestAnimationFrame(() => {
          const pending = titleOverlayPendingLayerMoveRef.current
          titleOverlayPendingLayerMoveRef.current = null
          titleOverlayRafRef.current = null
          if (pending) {
            applyTitleOverlayLayerPosition(pending.timestamp, pending.position)
          }
        })
      },
      [applyTitleOverlayLayerPosition],
    )

    const saveMainChartWithOverlay = useCallback(
      (drawOptions?: { boxPositions?: BoxPositions; omitBoxPositionsFromLayoutSignature?: boolean }) => {
        const canvas = mainChartRef.current?.canvas
        if (!canvas) return
        if (useTitleOverlay) {
          const isDraggingBox = titleOverlayDragRef.current.isMouseDown
          if (isDraggingBox && !drawOptions) return

          const liveBoxPositions = titleOverlayPositionsRef.current
          const fallbackBoxPositions = Object.keys(liveBoxPositions).length ? liveBoxPositions : boxPositions
          drawTitleOverlay(
            drawOptions ?? {
              boxPositions: fallbackBoxPositions,
              omitBoxPositionsFromLayoutSignature: false,
            },
          )
          saveMainChartCanvas(canvas, titleOverlayCanvasRef.current ?? undefined)
          return
        }
        saveMainChartCanvas(canvas)
      },
      [boxPositions, drawTitleOverlay, saveMainChartCanvas, useTitleOverlay],
    )

    const flushTitleOverlayDeferredSync = useCallback(() => {
      titleOverlayDeferredSyncTimerRef.current = null
      const pending = titleOverlayDeferredSyncRef.current
      if (!pending) return

      if (titleOverlayDragRef.current.isMouseDown) {
        titleOverlayDeferredSyncTimerRef.current = window.setTimeout(flushTitleOverlayDeferredSync, TITLE_BOX_DEFERRED_SYNC_DELAY_MS)
        return
      }

      titleOverlayDeferredSyncRef.current = null
      if (onBoxPositionChangeProp) {
        onBoxPositionChangeProp(pending.timestamp, pending.position)
      } else {
        setBoxPositionsInternal(pending.boxPositions)
      }
      onBoxPositionCommit?.()
      titleOverlayCommittedPositionsRef.current = pending.boxPositions
      saveMainChartWithOverlay({ boxPositions: pending.boxPositions })
      onBoxDragEndRef.current?.()
    }, [onBoxPositionChangeProp, onBoxPositionCommit, saveMainChartWithOverlay])

    const scheduleTitleOverlayDeferredSync = useCallback(
      (payload: { timestamp: number; position: BoxPosition; boxPositions: BoxPositions }) => {
        titleOverlayDeferredSyncRef.current = payload
        if (titleOverlayDeferredSyncTimerRef.current !== null) return

        titleOverlayDeferredSyncTimerRef.current = window.setTimeout(flushTitleOverlayDeferredSync, TITLE_BOX_DEFERRED_SYNC_DELAY_MS)
      },
      [flushTitleOverlayDeferredSync],
    )

    const chartImageEffectBoxPositions = useTitleOverlay ? undefined : boxPositions

    useEffect(() => {
      const timer = window.setTimeout(() => {
        const canvases = chartContainerRef.current?.querySelectorAll('canvas:not([data-inflection-title-overlay="true"])')
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
          if (mainChartRef.current?.canvas === mainCanvas) {
            saveMainChartWithOverlay()
          } else {
            saveMainChartCanvas(mainCanvas)
          }
        }

        const volumeCanvas =
          volumeChartRef.current?.canvas ?? (canvases && canvases.length > 1 ? (canvases.item(1) as HTMLCanvasElement | null) : null)
        if (volumeCanvas) {
          document.body.dataset.volumeChartCanvasSaved = `${volumeCanvas.width}x${volumeCanvas.height}`
          saveVolumeChartCanvas(volumeCanvas)
        }
      }, 300)

      return () => window.clearTimeout(timer)
    }, [
      timestamps,
      chartType,
      shouldShowVolume,
      forceUpdate,
      saveMainChartCanvas,
      saveMainChartWithOverlay,
      saveVolumeChartCanvas,
      chartImageEffectBoxPositions,
      titleEdits,
      relatedNews,
    ])

    useLayoutEffect(() => {
      if (!useTitleOverlay) return
      const isDraggingBox = titleOverlayDragRef.current.isMouseDown
      const hasPendingLiveSync = titleOverlayDeferredSyncRef.current !== null
      const committedPositions = titleOverlayCommittedPositionsRef.current
      const hasStaleCommittedProps =
        committedPositions !== null &&
        !areBoxPositionsEqual(boxPositions, committedPositions) &&
        !areBoxPositionsEqual(boxPositions, titleOverlayPositionsRef.current)
      const shouldKeepLiveOverlay = isDraggingBox || hasPendingLiveSync || hasStaleCommittedProps

      if (!shouldKeepLiveOverlay) {
        titleOverlayPositionsRef.current = { ...boxPositions }
      }
      drawTitleOverlay(
        shouldKeepLiveOverlay
          ? {
            boxPositions: titleOverlayPositionsRef.current,
            omitBoxPositionsFromLayoutSignature: true,
          }
          : undefined,
      )
    }, [boxPositions, drawTitleOverlay, titleOverlayVersion, useTitleOverlay])

    const getTitleOverlayPoint = useCallback((event: MouseEvent | ReactMouseEvent<Element>): BoxPosition | null => {
      const rect = titleOverlayCanvasRef.current?.getBoundingClientRect()
      if (!rect) return null
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
    }, [])

    const clampTitleOverlayPosition = useCallback((position: BoxPosition, box: InflectionPointNewsBoxInfo): BoxPosition => {
      const chartArea = mainChartRef.current?.chartArea
      if (!chartArea) return position
      return {
        x: Math.max(chartArea.left + 10, Math.min(position.x, chartArea.right - box.width - 10)),
        y: Math.max(chartArea.top + 10, Math.min(position.y, chartArea.bottom - box.height - 10)),
      }
    }, [])

    const cancelTitleOverlayPendingDraw = useCallback(() => {
      if (titleOverlayRafRef.current !== null) {
        cancelAnimationFrame(titleOverlayRafRef.current)
        titleOverlayRafRef.current = null
      }
      titleOverlayPendingLayerMoveRef.current = null
    }, [])

    const handleTitleOverlayMouseMove = useCallback(
      (event: MouseEvent) => {
        const drag = titleOverlayDragRef.current
        if (!drag.isMouseDown || drag.timestamp === null || !drag.clickedBox) return

        const point = getTitleOverlayPoint(event)
        if (!point) return

        if (!drag.isDragging) {
          const dx = point.x - drag.mouseDownPosition.x
          const dy = point.y - drag.mouseDownPosition.y
          if (Math.hypot(dx, dy) > TITLE_BOX_CLICK_THRESHOLD) {
            cancelTitleOverlayDeferredSync()
            drag.isDragging = true
            closeActiveTitleEdit()
            if (drag.timestamp !== null) {
              const boxElement = titleOverlayBoxElementsRef.current.get(drag.timestamp)
              if (boxElement) boxElement.style.cursor = 'grabbing'
            }
          }
        }

        if (!drag.isDragging) return

        const nextPosition = clampTitleOverlayPosition(
          {
            x: point.x - drag.dragOffset.x,
            y: point.y - drag.dragOffset.y,
          },
          drag.clickedBox,
        )
        drag.latestPosition = nextPosition

        titleOverlayPositionsRef.current[drag.timestamp] = nextPosition
        onBoxPositionPreview?.(drag.timestamp, nextPosition)
        scheduleTitleOverlayLayerMove(drag.timestamp, nextPosition)
        event.preventDefault()
      },
      [
        cancelTitleOverlayDeferredSync,
        clampTitleOverlayPosition,
        closeActiveTitleEdit,
        getTitleOverlayPoint,
        onBoxPositionPreview,
        scheduleTitleOverlayLayerMove,
      ],
    )

    const handleTitleOverlayMouseUp = useCallback(
      (event: MouseEvent) => {
        const drag = titleOverlayDragRef.current
        globalThis.removeEventListener('mousemove', handleTitleOverlayMouseMove)
        globalThis.removeEventListener('mouseup', handleTitleOverlayMouseUp)

        if (!drag.isMouseDown) return

        const timestamp = drag.timestamp
        const clickedBox = drag.clickedBox
        const endedBoxDrag = drag.isDragging && timestamp !== null && drag.latestPosition !== null

        if (endedBoxDrag && timestamp !== null && drag.latestPosition) {
          const latestPosition = drag.latestPosition
          titleOverlayPositionsRef.current[timestamp] = latestPosition
          const nextPositions = { ...titleOverlayPositionsRef.current }
          titleOverlayPositionsRef.current = nextPositions
          cancelTitleOverlayPendingDraw()
          applyTitleOverlayLayerPosition(timestamp, latestPosition)
          onBoxPositionPreview?.(timestamp, latestPosition)
          titleOverlayCommittedPositionsRef.current = nextPositions
          scheduleTitleOverlayDeferredSync({
            timestamp,
            position: latestPosition,
            boxPositions: nextPositions,
          })
        } else if (clickedBox?.timestamp && clickedBox.title && clickedBox.titleArea) {
          handleTitleEditStart({
            timestamp: clickedBox.timestamp,
            x: clickedBox.titleArea.x,
            y: clickedBox.titleArea.y,
            width: clickedBox.width,
            height: clickedBox.titleArea.height + 8,
            title: clickedBox.title,
          })
        }

        titleOverlayDragRef.current = {
          isMouseDown: false,
          isDragging: false,
          timestamp: null,
          dragOffset: { x: 0, y: 0 },
          mouseDownPosition: { x: 0, y: 0 },
          latestPosition: null,
          clickedBox: null,
        }
        if (timestamp !== null) {
          const boxElement = titleOverlayBoxElementsRef.current.get(timestamp)
          if (boxElement) boxElement.style.cursor = 'grab'
        }
        event.preventDefault()
      },
      [
        applyTitleOverlayLayerPosition,
        cancelTitleOverlayPendingDraw,
        handleTitleEditStart,
        handleTitleOverlayMouseMove,
        onBoxPositionPreview,
        scheduleTitleOverlayDeferredSync,
      ],
    )

    const handleTitleOverlayMouseDown = useCallback(
      (event: ReactMouseEvent<HTMLDivElement>, clickedBox: InflectionPointNewsBoxInfo) => {
        if (!useTitleOverlay || event.button !== 0) return

        cancelTitleOverlayDeferredSync()
        const point = getTitleOverlayPoint(event)
        if (!point) return

        const latestClickedBox = clickedBox.timestamp
          ? (titleOverlayBoxesRef.current.find((box) => box.timestamp === clickedBox.timestamp) ?? clickedBox)
          : clickedBox
        if (!latestClickedBox?.timestamp) return

        titleOverlayDragRef.current = {
          isMouseDown: true,
          isDragging: false,
          timestamp: latestClickedBox.timestamp,
          dragOffset: {
            x: point.x - latestClickedBox.x,
            y: point.y - latestClickedBox.y,
          },
          mouseDownPosition: point,
          latestPosition: { x: latestClickedBox.x, y: latestClickedBox.y },
          clickedBox: latestClickedBox,
        }

        globalThis.addEventListener('mousemove', handleTitleOverlayMouseMove)
        globalThis.addEventListener('mouseup', handleTitleOverlayMouseUp)
        event.preventDefault()
        event.stopPropagation()
      },
      [cancelTitleOverlayDeferredSync, getTitleOverlayPoint, handleTitleOverlayMouseMove, handleTitleOverlayMouseUp, useTitleOverlay],
    )

    useEffect(
      () => () => {
        globalThis.removeEventListener('mousemove', handleTitleOverlayMouseMove)
        globalThis.removeEventListener('mouseup', handleTitleOverlayMouseUp)
        cancelTitleOverlayPendingDraw()
        cancelTitleOverlayDeferredSync()
      },
      [cancelTitleOverlayDeferredSync, cancelTitleOverlayPendingDraw, handleTitleOverlayMouseMove, handleTitleOverlayMouseUp],
    )

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

    const chartPluginBoxPositions = useTitleOverlay ? undefined : boxPositions

    const chartOptions = useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0,
          onComplete: () => {
            requestAnimationFrame(() => {
              saveMainChartWithOverlay()
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
            enableBoxDragging: mode === NewsletterDetailPageMode.EDIT && !useTitleOverlay,
            boxPositions: chartPluginBoxPositions,
            onBoxPositionChange: handleBoxPositionChange,
            onBoxDragStart: closeActiveTitleEdit,
            onBoxDragEnd: () => {
              onBoxDragEndRef.current?.()
            },
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
            renderNewsBoxes: !useTitleOverlay,
          },
        },
      }),
      [
        timestamps,
        closeDataSeries?.dtick,
        relatedNews,
        chartPluginBoxPositions,
        closeActiveTitleEdit,
        handleBoxPositionChange,
        titleEdits,
        handleTitleEditStart,
        chartData?.chartData?.series,
        mode,
        saveMainChartWithOverlay,
        highPointData,
        lowPointData,
        marketOpenTime,
        marketCloseTime,
        useTitleOverlay,
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
          height={`${INFLECTION_POINT_CHART_EMPTY_STATE_HEIGHT}px`}
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
      <Box width={`${INFLECTION_POINT_CHART_OUTER_WIDTH}px`} boxSizing="border-box">
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
        <Box ref={chartContainerRef} width={`${INFLECTION_POINT_CHART_OUTER_WIDTH}px`} boxSizing="border-box" sx={{ position: 'relative' }}>
          <Box height={`${INFLECTION_POINT_CHART_MAIN_HEIGHT}px`} sx={{ position: 'relative' }}>
            <Chart
              key={`main-chart-${forceUpdate}`}
              ref={setMainChartRef}
              type={'candlestick'}
              data={{ datasets: mainDataset }}
              options={chartOptions}
              plugins={[InflectionPointChartPlugin]}
            />
            {useTitleOverlay && (
              <>
                <canvas
                  ref={titleOverlayCanvasRef}
                  data-inflection-title-overlay="true"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    zIndex: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
                <svg
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    overflow: 'visible',
                    zIndex: 2,
                    pointerEvents: 'none',
                  }}
                >
                  {titleOverlayBoxes.map((box, index) => {
                    const timestamp = box.timestamp
                    const { x1, y1, x2, y2 } = getTitleOverlayLinePoints(box)
                    return (
                      <line
                        key={timestamp ?? `line-${index}`}
                        data-inflection-title-line={timestamp}
                        ref={(element) => {
                          if (!timestamp) return
                          if (element) {
                            titleOverlayLineElementsRef.current.set(timestamp, element)
                          } else {
                            titleOverlayLineElementsRef.current.delete(timestamp)
                          }
                        }}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#212529"
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    )
                  })}
                </svg>
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 3,
                    pointerEvents: 'none',
                  }}
                >
                  {titleOverlayBoxes.map((box, index) => {
                    const timestamp = box.timestamp
                    const latestPosition = timestamp ? titleOverlayPositionsRef.current[timestamp] : undefined
                    const x = latestPosition?.x ?? box.x
                    const y = latestPosition?.y ?? box.y
                    const titleLines = box.titleLines?.length ? box.titleLines : [box.title ?? '']

                    return (
                      <Box
                        key={timestamp ?? `box-${index}`}
                        data-inflection-title-box={timestamp}
                        ref={(element: HTMLDivElement | null) => {
                          if (!timestamp) return
                          if (element) {
                            titleOverlayBoxElementsRef.current.set(timestamp, element)
                          } else {
                            titleOverlayBoxElementsRef.current.delete(timestamp)
                          }
                        }}
                        onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => handleTitleOverlayMouseDown(event, box)}
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: `${box.width}px`,
                          height: `${box.height}px`,
                          boxSizing: 'border-box',
                          padding: '8px',
                          transform: `translate3d(${x}px, ${y}px, 0)`,
                          cursor: 'grab',
                          pointerEvents: 'auto',
                          userSelect: 'none',
                          touchAction: 'none',
                          willChange: 'transform',
                          background: 'transparent',
                        }}
                      >
                        <Box
                          sx={{
                            font: '600 12px Pretendard, sans-serif',
                            lineHeight: '16px',
                            color: '#555555',
                            textShadow: TITLE_BOX_TEXT_SHADOW,
                            whiteSpace: 'pre',
                          }}
                        >
                          {timestamp ? dayjs(timestamp).tz('America/New_York').format('HH:mm') : ''}
                        </Box>
                        <Box sx={{ mt: '2px' }}>
                          {titleLines.map((line, lineIndex) => (
                            <Box
                              key={`${timestamp ?? index}-${lineIndex}`}
                              sx={{
                                font: '600 12px Pretendard, sans-serif',
                                lineHeight: '16px',
                                color: getTitleOverlayTextColor(box.trend),
                                textShadow: TITLE_BOX_TEXT_SHADOW,
                                whiteSpace: 'pre',
                              }}
                            >
                              {line}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </>
            )}
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
                maxHeight: shouldShowVolume ? INFLECTION_CHART_VOLUME_PANEL_FULL_HEIGHT : INFLECTION_CHART_VOLUME_PANEL_COLLAPSED_HEIGHT,
                transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* 고정 높이 → 컨테이너가 줄어들며 위쪽이 overflow로 크롭되는 효과 */}
              <Box height={INFLECTION_CHART_VOLUME_PANEL_FULL_HEIGHT} sx={{ flexShrink: 0 }}>
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
