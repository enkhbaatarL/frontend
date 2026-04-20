import { Plugin, Chart as ChartJS } from 'chart.js'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import {
  applyInflectionHighLowLabelTextStyle,
  drawMarketHoursBackground,
  drawWhiteRoundedLabelBox,
  drawXAxisGrid,
  drawXAxisLabels,
  drawYAxisGrid,
  drawYAxisLabelsInflection,
  findNearestTimestampIndex,
  isPointInsideChartArea,
  isXInsideChartArea,
} from '@/lib/chart/plugins/chartPluginSharedDrawing'
import { IRelatedNewsEventItem } from '@/service/mi/newsletter'

dayjs.extend(utc)
dayjs.extend(timezone)

interface InflectionPointPluginOptions {
  timestamps?: number[]
  xAxisTicks?: number
  yAxisTicks?: number
  yAxisStep?: number
  decimalPlaces?: number
  useUnitDisplay?: boolean
  relatedNews?: IRelatedNewsEventItem[]
  enableBoxDragging?: boolean
  boxPositions?: Record<number, { x: number; y: number }>
  onBoxPositionChange?: (timestamp: number, position: { x: number; y: number }) => void
  /** 박스 드래그를 놓았을 때(실제 이동이 있었을 때만) — 스냅샷 반영 등 */
  onBoxDragEnd?: () => void
  onInitialPositionsSet?: (positions: Record<number, { x: number; y: number }>) => void
  titleEdits?: Record<number, string>
  onTitleEditStart?: (info: { timestamp: number; x: number; y: number; width: number; height: number; title: string }) => void
  showHighPoint?: boolean
  highPointData?: { value: number; timestamp: number; time: string }
  showLowPoint?: boolean
  lowPointData?: { value: number; timestamp: number; time: string }
  hideXAxisLabel?: boolean
  hideYAxisLabel?: boolean
  hideYAxisLabels?: boolean
  hideChartBorder?: boolean
  xAxisLabelYOffset?: number
  marketOpenTime?: number
  marketCloseTime?: number
  /** 기본 true. false면 상단 Y 눈금 여유/최댓값 폴백 없이 차트 영역 내만 (볼륨 차트용) */
  includeTopYAxisLabel?: boolean
}

const calcYAxisStep = (min: number, max: number, targetTicks: number = 5): number => {
  const range = max - min
  if (range <= 0 || targetTicks <= 0) return 1

  const rawStep = range / targetTicks
  if (rawStep <= 0) return 1

  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude

  if (normalized <= 1) return magnitude
  if (normalized <= 2) return 2 * magnitude
  if (normalized <= 2.5) return 2.5 * magnitude
  if (normalized <= 5) return 5 * magnitude
  return 10 * magnitude
}

interface BoxInfo {
  x: number
  y: number
  width: number
  height: number
  isAbove: boolean
  xPosition: number
  yPosition: number
  timestamp?: number
  title?: string
  titleLines?: string[]
  titleArea: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface DrawInfoBoxParams {
  ctx: CanvasRenderingContext2D
  xPosition: number
  yPosition: number
  title: string
  isAbove?: boolean
  timestamp?: number
  existingBoxes?: BoxInfo[]
  chartArea?: { left: number; right: number; top: number; bottom: number }
  customPosition?: { x: number; y: number }
  enableCollisionDetection?: boolean
  trend?: string
}

interface DragState {
  isMouseDown: boolean
  isDragging: boolean
  draggedBoxTimestamp: number | null
  draggedBoxWidth: number
  draggedBoxHeight: number
  dragOffset: { x: number; y: number }
  mouseDownPosition: { x: number; y: number }
  targetPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  animationFrameId: number
}

interface DrawConnectionLineParams {
  ctx: CanvasRenderingContext2D
  markerX: number
  markerY: number
  boxX: number
  boxY: number
  boxWidth: number
  boxHeight: number
  isAbove: boolean
}

// 원의 반지름
const CIRCLE_RADIUS = 11

// 차트별 드래그 상태 저장
const dragStateMap = new Map<string, DragState>()

// 차트별 박스 정보 저장
const boxInfoMap = new Map<string, BoxInfo[]>()

// 차트별 초기 위치 저장 (충돌 검사 후 최적화된 위치)
const initialPositionsMap = new Map<string, Record<number, { x: number; y: number }>>()

/** canvas id만으로 캐시하면 버전 전환(최초↔최신) 시 이전 스냅샷 좌표가 재사용됨 → 시그니처로 무효화 */
const layoutSignatureByChartId = new Map<string, string>()

/** 드래그 중 매 프레임 재계산을 회피하기 위한 캐시 */
interface DragFrameCache {
  visibleNews: IRelatedNewsEventItem[]
  boxInfos: BoxInfo[]
  timeStrings: Map<number, string>
}
const dragFrameCacheMap = new Map<string, DragFrameCache>()

/** 드래그 중 박스를 그리는 overlay canvas (chartId → canvas) */
const overlayCanvasMap = new Map<string, HTMLCanvasElement>()

const getOrCreateOverlayCanvas = (chart: ChartJS): HTMLCanvasElement | null => {
  const chartId = chart.canvas?.id || ''
  if (!chartId) return null
  const existing = overlayCanvasMap.get(chartId)
  if (existing) {
    if (existing.width !== chart.canvas.width || existing.height !== chart.canvas.height) {
      existing.width = chart.canvas.width
      existing.height = chart.canvas.height
    }
    return existing
  }
  const parent = chart.canvas?.parentElement
  if (!parent) return null
  const overlay = document.createElement('canvas')
  overlay.width = chart.canvas.width
  overlay.height = chart.canvas.height
  overlay.style.position = 'absolute'
  overlay.style.top = '0'
  overlay.style.left = '0'
  overlay.style.pointerEvents = 'none'
  if (window.getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative'
  }
  parent.appendChild(overlay)
  overlayCanvasMap.set(chartId, overlay)
  return overlay
}

// 드래그 상태 초기화
const CLICK_THRESHOLD = 5
const LERP_FACTOR = 0.25
const SNAP_THRESHOLD = 0.5

const lerp = (current: number, target: number, factor: number): number => current + (target - current) * factor

/** drawInfoBox의 차트 영역 제한과 동일 (박스 좌상단 기준, margin 기본 10) */
const clampBoxTopLeftToChartArea = (
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  chartArea: { left: number; right: number; top: number; bottom: number } | undefined,
  margin = 10,
): { x: number; y: number } => {
  if (!chartArea) return { x: boxX, y: boxY }
  return {
    x: Math.max(chartArea.left + margin, Math.min(boxX, chartArea.right - boxWidth - margin)),
    y: Math.max(chartArea.top + margin, Math.min(boxY, chartArea.bottom - boxHeight - margin)),
  }
}

const initDragState = (): DragState => ({
  isMouseDown: false,
  isDragging: false,
  draggedBoxTimestamp: null,
  draggedBoxWidth: 0,
  draggedBoxHeight: 0,
  dragOffset: { x: 0, y: 0 },
  mouseDownPosition: { x: 0, y: 0 },
  targetPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  animationFrameId: 0,
})

// 마우스 포인터가 박스 내부에 있는지 확인
const isPointInBox = (x: number, y: number, box: BoxInfo): boolean =>
  x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height

// 겹친 박스들 중 최상위 박스 찾기 (나중에 그려진 박스가 위에 있음)
const findTopBoxAtPoint = (x: number, y: number, boxes: BoxInfo[]): BoxInfo | null => {
  for (let i = boxes.length - 1; i >= 0; i--) {
    if (isPointInBox(x, y, boxes[i])) {
      return boxes[i]
    }
  }
  return null
}

const adjustDuplicateTimestamps = (news: IRelatedNewsEventItem[]): IRelatedNewsEventItem[] => {
  const timestampGroups = new Map<number, IRelatedNewsEventItem[]>()

  // 타임스탬프별로 그룹화
  news.forEach((item) => {
    if (!item.timestamp) return

    if (!timestampGroups.has(item.timestamp)) {
      timestampGroups.set(item.timestamp, [])
    }
    timestampGroups.get(item.timestamp)!.push(item)
  })

  const adjustedNews: IRelatedNewsEventItem[] = []

  // 각 그룹에서 1ms씩 차이나게 조정
  timestampGroups.forEach((group, originalTimestamp) => {
    if (group.length === 1) {
      // 단일 뉴스는 그대로 유지
      adjustedNews.push(...group)
    } else {
      // 여러 뉴스가 있는 경우 1ms씩 차이나게 조정
      group.forEach((item, index) => {
        const adjustedTimestamp = originalTimestamp + index
        adjustedNews.push({
          ...item,
          timestamp: adjustedTimestamp,
        })
      })
    }
  })

  return adjustedNews
}

const drawConnectionLine = (params: DrawConnectionLineParams) => {
  const { ctx, markerX, markerY, boxX, boxY, boxWidth, boxHeight, isAbove } = params

  ctx.strokeStyle = '#212529'
  ctx.lineWidth = 1
  ctx.setLineDash([])

  // 박스의 중심 Y 좌표 계산
  const boxCenterY = boxY + boxHeight / 2

  // 마커와 박스의 상대적 위치에 따라 연결선 시작점 결정
  const markerStartX = markerX
  let markerStartY

  // 박스가 마커보다 위에 있는지 아래에 있는지 확인
  const boxIsAboveMarker = boxCenterY < markerY
  const boxIsBelowMarker = boxCenterY > markerY

  if (boxIsAboveMarker) {
    // 박스가 마커 위에 있으면 원의 위쪽 가장자리에서 시작
    markerStartY = markerY - CIRCLE_RADIUS - 2
  } else if (boxIsBelowMarker) {
    // 박스가 마커 아래에 있으면 원의 아래쪽 가장자리에서 시작
    markerStartY = markerY + CIRCLE_RADIUS + 2
  } else {
    // 박스가 마커와 같은 높이에 있으면 원의 가장 가까운 가장자리에서 시작
    markerStartY = isAbove ? markerY - CIRCLE_RADIUS - 2 : markerY + CIRCLE_RADIUS + 2
  }

  // 박스 연결점 계산 - 박스의 가장 가까운 가장자리
  let boxConnectionX: number
  let boxConnectionY: number

  // X 좌표: 마커가 박스 범위 내에 있으면 마커 X, 아니면 가장 가까운 가장자리
  if (markerX < boxX) {
    boxConnectionX = boxX
  } else if (markerX > boxX + boxWidth) {
    boxConnectionX = boxX + boxWidth
  } else {
    boxConnectionX = markerX
  }

  // Y 좌표: 박스의 가장 가까운 가장자리에서 약간 안쪽으로
  const boxPadding = 4 // 박스 내부로 들어갈 거리
  if (boxIsAboveMarker) {
    boxConnectionY = boxY + boxHeight - boxPadding // 박스 아래쪽 가장자리에서 안쪽으로
  } else if (boxIsBelowMarker) {
    boxConnectionY = boxY + boxPadding // 박스 위쪽 가장자리에서 안쪽으로
  } else {
    // 같은 높이에 있으면 isAbove 플래그에 따라 결정
    boxConnectionY = isAbove ? boxY + boxHeight - boxPadding : boxY + boxPadding
  }

  ctx.beginPath()
  ctx.moveTo(markerStartX, markerStartY)
  ctx.lineTo(boxConnectionX, boxConnectionY)

  ctx.stroke()
}

/**
 * 캐시된 BoxInfo를 기반으로 박스를 다시 그린다.
 * 드래그 fast-path 전용: calculateBoxDimensions / measureText / 충돌검사를 모두 스킵.
 */
const renderCachedBoxInfo = (ctx: CanvasRenderingContext2D, box: BoxInfo, timeStr: string, trend?: string) => {
  const padding = 8
  const lineHeight = 16

  ctx.fillStyle = '#555555'
  ctx.font = '600 12px Pretendard,sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const timeX = box.x + padding
  const timeY = box.y + padding + lineHeight / 2

  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.strokeText(timeStr, timeX, timeY)
  ctx.fillText(timeStr, timeX, timeY)

  let titleColor = '#495057'
  if (trend === 'DOWN') titleColor = '#2F62A3'
  else if (trend === 'UP') titleColor = '#DF4B4A'

  ctx.fillStyle = titleColor
  ctx.font = '600 12px Pretendard,sans-serif'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2

  const titleX = box.x + padding
  const titleLines = box.titleLines ?? []
  titleLines.forEach((line, index) => {
    const titleY = box.y + padding + lineHeight + 2 + lineHeight / 2 + index * lineHeight
    ctx.strokeText(line, titleX, titleY)
    ctx.fillText(line, titleX, titleY)
  })

  drawConnectionLine({
    ctx,
    markerX: box.xPosition,
    markerY: box.yPosition,
    boxX: box.x,
    boxY: box.y,
    boxWidth: box.width,
    boxHeight: box.height,
    isAbove: box.isAbove,
  })
}

const stopDragAnimation = (dragState: DragState): void => {
  if (dragState.animationFrameId) {
    cancelAnimationFrame(dragState.animationFrameId)
    dragState.animationFrameId = 0
  }
}

/**
 * overlay canvas에 캐시된 모든 박스를 다시 그린다.
 * dragState가 있고 해당 박스가 드래그 중이면 currentPosition으로 위치를 대체한다.
 */
const renderOverlayBoxes = (chartId: string, dragState: DragState | null): void => {
  const overlay = overlayCanvasMap.get(chartId)
  if (!overlay) return
  const cache = dragFrameCacheMap.get(chartId)
  if (!cache) return
  const overlayCtx = overlay.getContext('2d')
  if (!overlayCtx) return

  overlayCtx.clearRect(0, 0, overlay.width, overlay.height)

  const draggedTs = dragState?.isDragging ? dragState.draggedBoxTimestamp : null
  for (const box of cache.boxInfos) {
    const boxTs = box.timestamp
    const timeStr = (boxTs && cache.timeStrings.get(boxTs)) || ''
    const trend = cache.visibleNews.find((n) => n.timestamp === boxTs)?.trend

    if (boxTs && dragState && draggedTs === boxTs) {
      const ddx = dragState.currentPosition.x - box.x
      const ddy = dragState.currentPosition.y - box.y
      renderCachedBoxInfo(
        overlayCtx,
        {
          ...box,
          x: dragState.currentPosition.x,
          y: dragState.currentPosition.y,
          titleArea: {
            ...box.titleArea,
            x: box.titleArea.x + ddx,
            y: box.titleArea.y + ddy,
          },
        },
        timeStr,
        trend,
      )
    } else {
      renderCachedBoxInfo(overlayCtx, box, timeStr, trend)
    }
  }
}

const startDragAnimation = (chartId: string, chart: ChartJS, pluginOptions: InflectionPointPluginOptions): void => {
  const dragState = dragStateMap.get(chartId)
  if (!dragState) return

  stopDragAnimation(dragState)

  // overlay가 혹시 없으면 보장 (정상 렌더에서 이미 만들어져 있음이 일반적)
  getOrCreateOverlayCanvas(chart)

  const tick = () => {
    if (!dragState.isDragging || dragState.draggedBoxTimestamp === null) return

    const dx = dragState.targetPosition.x - dragState.currentPosition.x
    const dy = dragState.targetPosition.y - dragState.currentPosition.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > SNAP_THRESHOLD) {
      dragState.currentPosition.x = lerp(dragState.currentPosition.x, dragState.targetPosition.x, LERP_FACTOR)
      dragState.currentPosition.y = lerp(dragState.currentPosition.y, dragState.targetPosition.y, LERP_FACTOR)
    } else {
      dragState.currentPosition.x = dragState.targetPosition.x
      dragState.currentPosition.y = dragState.targetPosition.y
    }

    const ts = dragState.draggedBoxTimestamp
    if (!pluginOptions.boxPositions) pluginOptions.boxPositions = {}
    const existing = pluginOptions.boxPositions[ts]
    if (existing) {
      existing.x = dragState.currentPosition.x
      existing.y = dragState.currentPosition.y
    } else {
      pluginOptions.boxPositions[ts] = {
        x: dragState.currentPosition.x,
        y: dragState.currentPosition.y,
      }
    }

    // 박스는 항상 overlay에 존재 → 메인 캔버스 재렌더 없이 overlay만 갱신
    renderOverlayBoxes(chartId, dragState)

    if (dragState.isDragging) {
      dragState.animationFrameId = requestAnimationFrame(tick)
    }
  }

  dragState.animationFrameId = requestAnimationFrame(tick)
}

/** mouseup / mouseout(캔버스 이탈) 공통: RAF가 쓴 좌표 유지, 상위 반영은 다음 프레임에 복사본으로 전달 */
const releaseBoxPointerInteraction = (
  chart: ChartJS,
  pluginOptions: InflectionPointPluginOptions,
  dragState: DragState,
  boxes: BoxInfo[],
  x: number,
  y: number,
): void => {
  if (!dragState.isMouseDown) return

  const endedBoxDrag = dragState.isDragging
  const draggedTimestamp = dragState.draggedBoxTimestamp

  stopDragAnimation(dragState)

  if (!dragState.isDragging) {
    const clickedBox = findTopBoxAtPoint(x, y, boxes)
    if (clickedBox?.timestamp && clickedBox.title && clickedBox.titleArea) {
      pluginOptions.onTitleEditStart?.({
        timestamp: clickedBox.timestamp,
        x: clickedBox.titleArea.x,
        y: clickedBox.titleArea.y,
        width: clickedBox.width,
        height: clickedBox.titleArea.height + 8,
        title: clickedBox.title,
      })
    }
  }

  dragState.isMouseDown = false
  dragState.isDragging = false
  dragState.draggedBoxTimestamp = null

  if (chart.canvas) {
    chart.canvas.style.cursor = 'default'
  }

  if (endedBoxDrag) {
    chart.draw()

    if (draggedTimestamp !== null && pluginOptions.onBoxPositionChange) {
      const finalPos = pluginOptions.boxPositions?.[draggedTimestamp]
      if (finalPos) {
        const ts = draggedTimestamp
        const copy = { x: finalPos.x, y: finalPos.y }
        const cb = pluginOptions.onBoxPositionChange
        const onDragEnd = pluginOptions.onBoxDragEnd
        requestAnimationFrame(() => {
          cb(ts, copy)
          onDragEnd?.()
        })
      } else {
        pluginOptions.onBoxDragEnd?.()
      }
    } else {
      pluginOptions.onBoxDragEnd?.()
    }
  }
}

const drawHighPoint = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  yScale: { getPixelForValue: (value: number) => number },
  highPointData: { value: number; timestamp: number; time: string },
  timestamps: number[],
) => {
  if (!highPointData) return

  const timestampIndex = timestamps.indexOf(highPointData.timestamp)
  if (timestampIndex === -1) return

  const xPosition = xScale.getPixelForValue(timestampIndex)
  const yPosition = yScale.getPixelForValue(highPointData.value)

  if (!isPointInsideChartArea(xPosition, yPosition, chartArea)) {
    return
  }

  applyInflectionHighLowLabelTextStyle(ctx)

  // 전체 텍스트 길이 계산
  const highText = 'High'
  const valueText = highPointData.value.toFixed(2)
  const timeText = highPointData.time

  const highWidth = ctx.measureText(highText).width
  const valueWidth = ctx.measureText(valueText).width
  const timeWidth = ctx.measureText(timeText).width

  const totalWidth = highWidth + 4 + valueWidth + 4 + timeWidth

  // 박스 크기 및 위치 계산
  const padding = 8
  const boxWidth = totalWidth + padding * 2
  const boxHeight = 24
  const textY = chartArea.top - 6
  let boxX = xPosition - totalWidth / 2 - padding
  const boxY = textY - 6

  // 차트 영역을 벗어나지 않도록 좌우 끝에 맞춤
  const edgePadding = 0 // 여백
  boxX = Math.max(chartArea.left + edgePadding, Math.min(boxX, chartArea.right - boxWidth - edgePadding))

  drawWhiteRoundedLabelBox(ctx, boxX, boxY, boxWidth, boxHeight)

  // 텍스트 그리기 (박스 내 좌측 패딩 기준)
  ctx.fillStyle = '#DF4B4A'
  let currentX = boxX + padding

  ctx.fillText(highText, currentX, textY)
  currentX += highWidth + 4

  ctx.fillText(valueText, currentX, textY)
  currentX += valueWidth + 4

  ctx.font = '400 12px Pretendard, sans-serif'
  ctx.fillText(timeText, currentX, textY)
}

const drawLowPoint = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  yScale: { getPixelForValue: (value: number) => number },
  lowPointData: { value: number; timestamp: number; time: string },
  timestamps: number[],
) => {
  if (!lowPointData) return

  // 타임스탬프 인덱스 찾기
  const timestampIndex = timestamps.indexOf(lowPointData.timestamp)
  if (timestampIndex === -1) return

  const xPosition = xScale.getPixelForValue(timestampIndex)
  const yPosition = yScale.getPixelForValue(lowPointData.value)

  if (!isPointInsideChartArea(xPosition, yPosition, chartArea)) {
    return
  }

  applyInflectionHighLowLabelTextStyle(ctx)

  // 전체 텍스트 길이 계산
  const lowText = 'Low'
  const valueText = lowPointData.value.toFixed(2)
  const timeText = lowPointData.time

  const lowWidth = ctx.measureText(lowText).width
  const valueWidth = ctx.measureText(valueText).width
  const timeWidth = ctx.measureText(timeText).width

  const totalWidth = lowWidth + 4 + valueWidth + 4 + timeWidth

  // 박스 크기 및 위치 계산
  const padding = 8
  const boxWidth = totalWidth + padding * 2
  const boxHeight = 24
  const textY = chartArea.bottom - 6
  let boxX = xPosition - totalWidth / 2 - padding
  const boxY = textY - 6

  // 차트 영역을 벗어나지 않도록 좌우 끝에 맞춤 (1px 여백)
  const edgePadding = 1
  boxX = Math.max(chartArea.left + edgePadding, Math.min(boxX, chartArea.right - boxWidth - edgePadding))

  drawWhiteRoundedLabelBox(ctx, boxX, boxY, boxWidth, boxHeight)

  // 텍스트 그리기 (박스 내 좌측 패딩 기준)
  ctx.fillStyle = '#1967D2'
  let currentX = boxX + padding

  ctx.fillText(lowText, currentX, textY)
  currentX += lowWidth + 4

  ctx.fillText(valueText, currentX, textY)
  currentX += valueWidth + 4

  ctx.font = '400 12px Pretendard, sans-serif'
  ctx.fillText(timeText, currentX, textY)
}

const extractYValue = (dataPoint: Record<string, unknown>): number | undefined => {
  if (typeof dataPoint !== 'object' || dataPoint === null) return undefined

  if ('y' in dataPoint && dataPoint.y !== null) {
    return dataPoint.y as number
  }
  if ('c' in dataPoint && dataPoint.c !== null) {
    return dataPoint.c as number
  }
  if ('h' in dataPoint && dataPoint.h !== null) {
    return dataPoint.h as number
  }

  return undefined
}

const drawMarker = (ctx: CanvasRenderingContext2D, xPosition: number, yPosition: number, trend?: string) => {
  let trendColor = 'rgba(46, 63, 94, 0.1)'

  if (trend === 'UP') trendColor = 'rgba(212, 42, 42, 0.1)'
  if (trend === 'DOWN') trendColor = 'rgba(28, 126, 214, 0.1)'

  ctx.lineWidth = 1
  ctx.setLineDash([])

  // 큰 원 (외부) - 변곡점 색상 표시
  ctx.beginPath()
  ctx.arc(xPosition, yPosition, CIRCLE_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = trendColor
  ctx.fill()

  // 작은 원 (내부)
  ctx.beginPath()
  ctx.arc(xPosition, yPosition, 5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = '#2E3F5E'
  ctx.stroke()
}

const splitTitleIntoLines = (text: string, maxCharsPerLine: number = 20): string[] => {
  const lines: string[] = []
  const segments = text.split('\n')

  for (const segment of segments) {
    if (segment.length === 0) {
      lines.push('')
      continue
    }
    for (let i = 0; i < segment.length; i += maxCharsPerLine) {
      const line = segment.slice(i, i + maxCharsPerLine).trim()
      lines.push(line)
    }
  }

  return lines.length > 0 ? lines : ['']
}

const calculateBoxDimensions = (ctx: CanvasRenderingContext2D, title: string, timestamp?: number) => {
  const time = timestamp ? dayjs(timestamp).tz('America/New_York').format('HH:mm') : dayjs().tz('America/New_York').format('HH:mm')
  const padding = 8
  const lineHeight = 16

  const titleLines = splitTitleIntoLines(title)
  const titleLineCount = titleLines.length

  ctx.font = '600 12px Pretendard,sans-serif'
  const timeWidth = ctx.measureText(time).width

  let maxTitleWidth = 0
  titleLines.forEach((line) => {
    const lineWidth = ctx.measureText(line).width
    maxTitleWidth = Math.max(maxTitleWidth, lineWidth)
  })

  const maxWidth = Math.max(timeWidth, maxTitleWidth)

  return {
    width: maxWidth + padding * 2,
    height: lineHeight * (1 + titleLineCount) + padding * 2 + 4,
    time,
    padding,
    lineHeight,
    titleLines,
  }
}

// 타이틀 영역 충돌 검사
const checkTitleCollision = (box1: BoxInfo, box2: BoxInfo): boolean =>
  !(
    box1.titleArea.x + box1.titleArea.width < box2.titleArea.x ||
    box2.titleArea.x + box2.titleArea.width < box1.titleArea.x ||
    box1.titleArea.y + box1.titleArea.height < box2.titleArea.y ||
    box2.titleArea.y + box2.titleArea.height < box1.titleArea.y
  )

// 박스가 캔버스 영역 내에 있는지 확인
const isBoxWithinCanvas = (box: BoxInfo, chartArea: { left: number; right: number; top: number; bottom: number }): boolean => {
  const margin = 10 // 캔버스 가장자리와의 최소 여백
  return (
    box.x >= chartArea.left + margin &&
    box.x + box.width <= chartArea.right - margin &&
    box.y >= chartArea.top + margin &&
    box.y + box.height <= chartArea.bottom - margin
  )
}

// 다른 박스들의 타이틀 영역과의 충돌이 있는지 확인
const hasAnyTitleCollision = (box: BoxInfo, existingBoxes: BoxInfo[]): boolean =>
  existingBoxes.some((existingBox) => checkTitleCollision(box, existingBox))

const adjustBoxPosition = (
  box: BoxInfo,
  existingBoxes: BoxInfo[],
  chartArea: { left: number; right: number; top: number; bottom: number },
): BoxInfo => {
  // 원본 위치 저장 (충돌 해결이 불가능할 때 돌아갈 위치)
  const originalBox = { ...box }
  const adjustedBox = { ...box }

  // 타이틀 영역 충돌이 없으면 바로 반환
  if (!hasAnyTitleCollision(adjustedBox, existingBoxes)) {
    return adjustedBox
  }

  const maxAttempts = 20 // 시도 횟수
  const stepSize = 4

  // 위아래 양 방향으로 시도
  const directions = adjustedBox.isAbove
    ? [-stepSize, stepSize] // 위쪽 박스는 위로 우선, 안되면 아래로
    : [stepSize, -stepSize] // 아래쪽 박스는 아래로 우선, 안되면 위로

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const direction of directions) {
      // 새로운 위치 계산
      const testBox = { ...box }
      const yDelta = direction * attempt
      testBox.y = box.y + yDelta
      // 타이틀 영역의 Y 좌표도 함께 업데이트
      testBox.titleArea = {
        ...box.titleArea,
        y: box.titleArea.y + yDelta,
      }

      // 캔버스 영역을 벗어나는지 확인
      if (!isBoxWithinCanvas(testBox, chartArea)) {
        continue
      }

      // 모든 기존 박스의 타이틀 영역과의 충돌 검사
      if (!hasAnyTitleCollision(testBox, existingBoxes)) {
        // 타이틀 영역 충돌이 없는 위치
        adjustedBox.y = testBox.y
        // 새로운 위치의 타이틀 영역도 업데이트
        adjustedBox.titleArea.y = testBox.titleArea.y
        return adjustedBox
      }
    }
  }

  // 충돌 해결이 불가능한 경우 원본 위치 반환
  return originalBox
}

const drawInfoBox = (params: DrawInfoBoxParams): BoxInfo | null => {
  const {
    ctx,
    xPosition,
    yPosition,
    title,
    isAbove = true,
    timestamp,
    existingBoxes = [],
    chartArea,
    customPosition,
    enableCollisionDetection = true,
  } = params
  const dimensions = calculateBoxDimensions(ctx, title, timestamp)
  const { width: boxWidth, height: boxHeight, time, padding, lineHeight, titleLines } = dimensions

  // 박스 위치 계산 - 커스텀 위치가 있으면 우선 사용
  let boxX: number
  let boxY: number

  if (customPosition) {
    boxX = customPosition.x
    boxY = customPosition.y
  } else {
    // 기본 위치 계산 - 마커에서 왼쪽으로 14px 간격
    boxX = xPosition - 14
    boxY = isAbove ? yPosition - boxHeight - 40 : yPosition + 40
  }

  // 차트 영역 내부로 제한
  if (chartArea) {
    boxX = Math.max(chartArea.left + 10, Math.min(boxX, chartArea.right - boxWidth - 10))
    boxY = Math.max(chartArea.top + 10, Math.min(boxY, chartArea.bottom - boxHeight - 10))
  }

  // 타이틀 영역 정보 계산
  ctx.font = '600 12px Pretendard,sans-serif'
  const titleAreaX = boxX + padding
  const titleAreaY = boxY + padding + lineHeight + 2 // 타이틀 텍스트 상단

  // 타이틀 라인들의 최대 너비 계산
  let maxTitleWidth = 0
  titleLines.forEach((line) => {
    const lineWidth = ctx.measureText(line).width
    maxTitleWidth = Math.max(maxTitleWidth, lineWidth)
  })

  const boxInfo: BoxInfo = {
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    isAbove,
    xPosition,
    yPosition,
    timestamp,
    title,
    titleLines,
    titleArea: {
      x: titleAreaX,
      y: titleAreaY,
      width: maxTitleWidth,
      height: lineHeight * titleLines.length,
    },
  }

  // 충돌 검사 및 위치 조정 (초기 렌더링 시에만 실행)
  let finalBox = boxInfo
  if (enableCollisionDetection && chartArea && existingBoxes.length > 0) {
    finalBox = adjustBoxPosition(boxInfo, existingBoxes, chartArea)
  }

  // 시간
  ctx.fillStyle = '#555555'
  ctx.font = '600 12px Pretendard,sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const timeX = finalBox.x + padding
  const timeY = finalBox.y + padding + lineHeight / 2

  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  ctx.strokeText(time, timeX, timeY)
  ctx.fillText(time, timeX, timeY)

  let titleColor = '#495057'
  if (params.trend === 'DOWN') {
    titleColor = '#2F62A3'
  } else if (params.trend === 'UP') {
    titleColor = '#DF4B4A'
  }

  ctx.fillStyle = titleColor
  ctx.font = '600 12px Pretendard,sans-serif'
  const titleX = finalBox.x + padding

  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2

  titleLines.forEach((line, index) => {
    const titleY = finalBox.y + padding + lineHeight + 2 + lineHeight / 2 + index * lineHeight
    ctx.strokeText(line, titleX, titleY)
    ctx.fillText(line, titleX, titleY)
  })

  if (chartArea) {
    drawConnectionLine({
      ctx,
      markerX: xPosition,
      markerY: yPosition,
      boxX: finalBox.x,
      boxY: finalBox.y,
      boxWidth: finalBox.width,
      boxHeight: finalBox.height,
      isAbove,
    })
  }

  return finalBox
}

const buildInflectionLayoutSignature = (
  chartArea: { left: number; top: number; right: number; bottom: number },
  visibleNews: IRelatedNewsEventItem[],
  timestamps: number[],
  boxPositions?: Record<number, { x: number; y: number }>,
  titleEdits?: Record<number, string>,
): string => {
  const areaPart = `${Math.round(chartArea.left)}:${Math.round(chartArea.top)}:${Math.round(chartArea.right)}:${Math.round(chartArea.bottom)}`
  const newsPart = visibleNews.map((n) => `${n.newsId}:${n.timestamp}:${n.title ?? ''}`).join('\u001e')
  const tsPart = timestamps.join(',')
  const bp = boxPositions ?? {}
  const bpPart = Object.entries(bp as Record<string, { x: number; y: number }>)
    .map(([k, v]) => {
      if (!v || typeof v.x !== 'number' || typeof v.y !== 'number') return ''
      return `${Number(k)}:${v.x},${v.y}`
    })
    .filter(Boolean)
    .sort()
    .join(';')
  const te = titleEdits ?? {}
  const tePart = Object.entries(te as Record<string, string>)
    .map(([k, v]) => `${Number(k)}:${v}`)
    .sort()
    .join('\u001f')
  return `${areaPart}\u001d${tsPart}\u001e${newsPart}\u001e${bpPart}\u001e${tePart}`
}

/**
 * - 범위 내: 가장 가까운 타임스탬프 인덱스
 * - 범위 이후: 유효한 데이터가 있는 마지막 인덱스 (isOutOfRange: true)
 * - 범위 이전: 유효한 데이터가 있는 첫 번째 인덱스 (isOutOfRange: true)
 */
const getEffectivePlotIndex = (
  originalTimestamp: number,
  timestamps: number[],
  chart: ChartJS,
): { index: number; isOutOfRange: boolean } => {
  if (timestamps.length === 0) return { index: -1, isOutOfRange: false }

  const firstTimestamp = timestamps[0]
  const lastTimestamp = timestamps.at(-1)
  if (lastTimestamp === undefined) return { index: -1, isOutOfRange: false }

  const firstDataset = chart.data.datasets[0]

  if (originalTimestamp > lastTimestamp) {
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (firstDataset?.data[i]) {
        return { index: i, isOutOfRange: true }
      }
    }
    return { index: timestamps.length - 1, isOutOfRange: true }
  }

  if (originalTimestamp < firstTimestamp) {
    for (let i = 0; i < timestamps.length; i++) {
      if (firstDataset?.data[i]) {
        return { index: i, isOutOfRange: true }
      }
    }
    return { index: 0, isOutOfRange: true }
  }

  let timestampIndex = timestamps.indexOf(originalTimestamp)
  if (timestampIndex === -1) {
    timestampIndex = findNearestTimestampIndex(originalTimestamp, timestamps)
  }
  return { index: timestampIndex, isOutOfRange: false }
}

const computeRelatedNewsMarkerXPosition = (
  newsTimestamp: number,
  originalTimestamp: number,
  effectiveIndex: number,
  isOutOfRange: boolean,
  timestamps: number[],
  xScale: { getPixelForValue: (value: number) => number },
): number => {
  const baseXPosition = xScale.getPixelForValue(effectiveIndex)
  if (isOutOfRange) return baseXPosition
  const timeOffset = newsTimestamp - originalTimestamp
  const nextTimestampIndex = Math.min(effectiveIndex + 1, timestamps.length - 1)
  const nextXPosition = xScale.getPixelForValue(nextTimestampIndex)
  const timeRange = timestamps[nextTimestampIndex] - timestamps[effectiveIndex]
  const pixelRange = nextXPosition - baseXPosition
  const offsetPixels = timeRange > 0 ? (timeOffset / timeRange) * pixelRange : 0
  return baseXPosition + offsetPixels
}

const drawNewsMarkers = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  yScale: { getPixelForValue: (value: number) => number },
  relatedNews: IRelatedNewsEventItem[],
  timestamps: number[],
  chart: ChartJS,
  boxPositions?: Record<number, { x: number; y: number }>,
  options?: InflectionPointPluginOptions,
) => {
  let chartId = chart.canvas?.id
  if (!chartId) {
    chartId = `chart-${Date.now()}-${Math.random().toString(36).substring(7)}`
    if (chart.canvas) {
      chart.canvas.id = chartId
    }
  }

  // 박스는 항상 overlay 캔버스에 그려서, 드래그 시작 시 메인 캔버스를 재렌더할 필요가 없게 한다.
  const overlayCanvas = getOrCreateOverlayCanvas(chart)
  const overlayCtx = overlayCanvas?.getContext('2d') ?? null
  if (overlayCanvas && overlayCtx) {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
  }

  if (!relatedNews?.length) return

  // overlay가 있으면 박스는 overlay에, 없으면 메인에 폴백
  const boxCtx = overlayCtx ?? ctx

  const dragState = dragStateMap.get(chartId)
  const isDragging = Boolean(options?.enableBoxDragging && dragState?.isDragging)
  const cache = dragFrameCacheMap.get(chartId)

  // ── fast-path: 드래그 중이고 캐시가 있으면 재계산 없이 캐시 기반 렌더링 ──
  // 메인 캔버스는 chart.js가 clear했으므로 마커를 다시 그리고, 박스는 overlay에 renderOverlayBoxes로 그린다.
  if (isDragging && cache) {
    ctx.save()

    for (const news of cache.visibleNews) {
      if (!news.timestamp) continue
      const originalTs = news.timestamp - (news.timestamp % 1)
      const { index: ei, isOutOfRange } = getEffectivePlotIndex(originalTs, timestamps, chart)
      if (ei === -1) continue
      const xPos = computeRelatedNewsMarkerXPosition(news.timestamp, originalTs, ei, isOutOfRange, timestamps, xScale)
      if (!isOutOfRange && !isXInsideChartArea(xPos, chartArea)) continue
      const ds = chart.data.datasets[0]
      if (!ds?.data[ei]) continue
      const dp = ds.data[ei] as unknown as Record<string, unknown>
      const yVal = extractYValue(dp)
      if (yVal === undefined) continue
      const yPos = yScale.getPixelForValue(yVal)
      if (yPos >= chartArea.top && yPos <= chartArea.bottom) {
        drawMarker(ctx, xPos, yPos, news.trend)
      }
    }

    renderOverlayBoxes(chartId, dragState ?? null)

    ctx.restore()
    return
  }

  // ── normal path ──
  const visibleNews = adjustDuplicateTimestamps(relatedNews.filter((news) => news.showInChart)).reverse()
  if (!visibleNews.length) return

  if (!isDragging) {
    const layoutSig = buildInflectionLayoutSignature(chartArea, visibleNews, timestamps, boxPositions, options?.titleEdits)
    const prevSig = layoutSignatureByChartId.get(chartId)
    if (prevSig !== layoutSig) {
      layoutSignatureByChartId.set(chartId, layoutSig)
      initialPositionsMap.delete(chartId)
      boxInfoMap.delete(chartId)
    }
  }

  ctx.save()

  const existingBoxes: BoxInfo[] = []

  visibleNews.forEach((news) => {
    if (!news.timestamp) return

    const originalTimestamp = news.timestamp - (news.timestamp % 1)
    const { index: effectiveIndex, isOutOfRange } = getEffectivePlotIndex(originalTimestamp, timestamps, chart)

    if (effectiveIndex === -1) return

    const xPosition = computeRelatedNewsMarkerXPosition(news.timestamp, originalTimestamp, effectiveIndex, isOutOfRange, timestamps, xScale)

    if (!isOutOfRange && !isXInsideChartArea(xPosition, chartArea)) return

    const firstDataset = chart.data.datasets[0]
    if (!firstDataset?.data[effectiveIndex]) return

    const dataPoint = firstDataset.data[effectiveIndex] as unknown as Record<string, unknown>
    const yValue = extractYValue(dataPoint)
    if (yValue === undefined) return

    const yPosition = yScale.getPixelForValue(yValue)

    if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
      drawMarker(ctx, xPosition, yPosition, news.trend)
    }
  })

  const sortedNews = visibleNews
    .map((news) => {
      if (!news.timestamp) return null

      const originalTimestamp = news.timestamp - (news.timestamp % 1)
      const { index: effectiveIndex, isOutOfRange } = getEffectivePlotIndex(originalTimestamp, timestamps, chart)

      if (effectiveIndex === -1) return null

      const xPosition = computeRelatedNewsMarkerXPosition(
        news.timestamp,
        originalTimestamp,
        effectiveIndex,
        isOutOfRange,
        timestamps,
        xScale,
      )

      return { news, timestampIndex: effectiveIndex, xPosition, isOutOfRange }
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.xPosition - b.xPosition)

  const hasInitialPositions = initialPositionsMap.has(chartId)
  const initialPositions = initialPositionsMap.get(chartId) || {}
  const newInitialPositions: Record<number, { x: number; y: number }> = {}

  sortedNews.forEach((item, index) => {
    if (!item) return

    const { news, timestampIndex, xPosition, isOutOfRange } = item

    if (!isOutOfRange && !isXInsideChartArea(xPosition, chartArea)) return

    const firstDataset = chart.data.datasets[0]
    if (!firstDataset?.data[timestampIndex]) return

    const dataPoint = firstDataset.data[timestampIndex] as unknown as Record<string, unknown>
    const yValue = extractYValue(dataPoint)
    if (yValue === undefined) return

    const yPosition = yScale.getPixelForValue(yValue)

    if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
      if (news.title) {
        const isAbove = index % 2 === 0
        const customPosition = news.timestamp ? boxPositions?.[news.timestamp] : undefined

        const useInitialPosition = hasInitialPositions && !customPosition
        const enableCollisionDetection = !hasInitialPositions && !customPosition

        let finalPosition = customPosition
        if (useInitialPosition && news.timestamp && initialPositions[news.timestamp]) {
          finalPosition = initialPositions[news.timestamp]
        }

        if (dragState?.isDragging && news.timestamp && dragState.draggedBoxTimestamp === news.timestamp) {
          finalPosition = boxPositions?.[news.timestamp]
        }

        const effectiveTitle = (news.timestamp && options?.titleEdits?.[news.timestamp]) || news.title

        // 박스와 연결선을 overlay에 그린다 (boxCtx = overlayCtx)
        const boxInfo = drawInfoBox({
          ctx: boxCtx,
          xPosition,
          yPosition,
          title: effectiveTitle,
          isAbove,
          timestamp: news.timestamp,
          existingBoxes,
          chartArea,
          customPosition: finalPosition,
          enableCollisionDetection,
          trend: news.trend,
        })

        if (boxInfo && news.timestamp) {
          existingBoxes.push(boxInfo)

          if (!hasInitialPositions) {
            newInitialPositions[news.timestamp] = {
              x: boxInfo.x,
              y: boxInfo.y,
            }
          }
        }
      }
    }
  })

  boxInfoMap.set(chartId, existingBoxes)

  if (!hasInitialPositions && Object.keys(newInitialPositions).length > 0) {
    initialPositionsMap.set(chartId, newInitialPositions)
    if (options?.onInitialPositionsSet) {
      options.onInitialPositionsSet(newInitialPositions)
    }
  }

  // 드래그 시작 시 바로 쓰이도록 캐시를 항상 채워둔다. (dayjs.tz 비용은 정상 렌더에 한 번만 발생)
  if (existingBoxes.length > 0) {
    const timeStrings = new Map<number, string>()
    for (const box of existingBoxes) {
      if (box.timestamp) {
        timeStrings.set(box.timestamp, dayjs(box.timestamp).tz('America/New_York').format('HH:mm'))
      }
    }
    dragFrameCacheMap.set(chartId, {
      visibleNews,
      boxInfos: existingBoxes,
      timeStrings,
    })
  } else {
    dragFrameCacheMap.delete(chartId)
  }

  ctx.restore()
}

const InflectionPointChartPlugin: Plugin = {
  id: 'InflectionPointChartPlugin',
  beforeEvent(chart, args, options) {
    const pluginOptions = options as InflectionPointPluginOptions
    if (!pluginOptions.enableBoxDragging) return

    const { event } = args
    if (event.type !== 'mousemove') return

    const chartId = chart.canvas?.id || ''
    const dragState = dragStateMap.get(chartId)
    if (!dragState?.isDragging) return

    const rect = chart.canvas?.getBoundingClientRect()
    // false를 돌려받으면 해당 이벤트를 완전히 discard 한다.
    // eslint-disable-next-line consistent-return
    if (!rect) return false

    const nativeEvent = event.native as MouseEvent | undefined
    const x = (nativeEvent?.clientX ?? event.x ?? 0) - rect.left
    const y = (nativeEvent?.clientY ?? event.y ?? 0) - rect.top

    const newX = x - dragState.dragOffset.x
    const newY = y - dragState.dragOffset.y

    const clamped = clampBoxTopLeftToChartArea(newX, newY, dragState.draggedBoxWidth, dragState.draggedBoxHeight, chart.chartArea)
    dragState.targetPosition.x = clamped.x
    dragState.targetPosition.y = clamped.y

    // eslint-disable-next-line consistent-return
    return false
  },
  afterEvent(chart, args, options) {
    const pluginOptions = options as InflectionPointPluginOptions
    if (!pluginOptions.enableBoxDragging) return

    const { event } = args

    // 차트 ID 생성 - canvas ID가 없으면 설정
    let chartId = chart.canvas?.id
    if (!chartId) {
      chartId = `chart-${Date.now()}-${Math.random().toString(36).substring(7)}`
      if (chart.canvas) {
        chart.canvas.id = chartId
      }
    }

    // 드래그 상태 초기화 (필요시)
    if (!dragStateMap.has(chartId)) {
      dragStateMap.set(chartId, initDragState())
    }

    const dragState = dragStateMap.get(chartId)!
    const boxes = boxInfoMap.get(chartId) || []

    // Canvas 상대 좌표 계산
    const rect = chart.canvas?.getBoundingClientRect()
    if (!rect) return

    const nativeEvent = event.native as MouseEvent | undefined
    const x = (nativeEvent?.clientX ?? event.x ?? 0) - rect.left
    const y = (nativeEvent?.clientY ?? event.y ?? 0) - rect.top

    if (event.type === 'mousedown') {
      const clickedBox = findTopBoxAtPoint(x, y, boxes)

      if (clickedBox && pluginOptions.relatedNews && pluginOptions.timestamps) {
        let timestamp = clickedBox.timestamp

        if (!timestamp) {
          const adjustedNews = adjustDuplicateTimestamps(pluginOptions.relatedNews?.filter((news) => news.showInChart) ?? [])

          timestamp = adjustedNews.find((news) => {
            if (!news.timestamp) return false

            const originalTimestamp = news.timestamp - (news.timestamp % 1)
            let timestampIndex = pluginOptions.timestamps?.indexOf(originalTimestamp)

            if (timestampIndex === -1) {
              timestampIndex = findNearestTimestampIndex(originalTimestamp, pluginOptions.timestamps ?? [])
            }

            if (timestampIndex === -1 || timestampIndex === undefined) return false

            const timeOffset = news.timestamp - originalTimestamp
            const baseXPosition = chart.scales.x.getPixelForValue(timestampIndex)

            const timestampsLength = pluginOptions.timestamps?.length ?? 1
            const nextTimestampIndex = Math.min(timestampIndex + 1, timestampsLength - 1)
            const nextXPosition = chart.scales.x.getPixelForValue(nextTimestampIndex)
            const currentTimestamp = pluginOptions.timestamps?.[timestampIndex] ?? 0
            const nextTimestamp = pluginOptions.timestamps?.[nextTimestampIndex] ?? 0
            const timeRange = nextTimestamp - currentTimestamp
            const pixelRange = nextXPosition - baseXPosition
            const offsetPixels = timeRange > 0 ? (timeOffset / timeRange) * pixelRange : 0

            const expectedXPosition = baseXPosition + offsetPixels

            return Math.abs(clickedBox.xPosition - expectedXPosition) < 5
          })?.timestamp
        }

        if (timestamp) {
          dragState.isMouseDown = true
          dragState.isDragging = false
          dragState.draggedBoxTimestamp = timestamp
          dragState.draggedBoxWidth = clickedBox.width
          dragState.draggedBoxHeight = clickedBox.height
          dragState.dragOffset.x = x - clickedBox.x
          dragState.dragOffset.y = y - clickedBox.y
          dragState.mouseDownPosition.x = x
          dragState.mouseDownPosition.y = y
          dragState.targetPosition.x = clickedBox.x
          dragState.targetPosition.y = clickedBox.y
          dragState.currentPosition.x = clickedBox.x
          dragState.currentPosition.y = clickedBox.y
        }
      }
    } else if (event.type === 'mousemove' && dragState.isMouseDown) {
      if (!dragState.isDragging) {
        const dx = x - dragState.mouseDownPosition.x
        const dy = y - dragState.mouseDownPosition.y
        if (Math.hypot(dx, dy) > CLICK_THRESHOLD) {
          dragState.isDragging = true
          if (chart.canvas) {
            chart.canvas.style.cursor = 'grabbing'
          }
          startDragAnimation(chartId, chart, pluginOptions)
        }
      }
    } else if (event.type === 'mouseup') {
      if (dragState.isMouseDown) {
        releaseBoxPointerInteraction(chart, pluginOptions, dragState, boxes, x, y)
      }
    } else if (event.type === 'mouseout') {
      if (!dragState.isMouseDown) return
      const related = nativeEvent?.relatedTarget
      if (related && chart.canvas && related instanceof Node && chart.canvas.contains(related)) {
        return
      }
      releaseBoxPointerInteraction(chart, pluginOptions, dragState, boxes, x, y)
    } else if (event.type === 'mousemove' && !dragState.isMouseDown) {
      const hoveredBox = findTopBoxAtPoint(x, y, boxes)

      if (chart.canvas) {
        if (hoveredBox) {
          const isInTitleArea =
            hoveredBox.titleArea &&
            x >= hoveredBox.titleArea.x - 4 &&
            x <= hoveredBox.titleArea.x + hoveredBox.titleArea.width + 4 &&
            y >= hoveredBox.titleArea.y &&
            y <= hoveredBox.titleArea.y + hoveredBox.titleArea.height
          chart.canvas.style.cursor = isInTitleArea ? 'text' : 'grab'
        } else {
          chart.canvas.style.cursor = 'default'
        }
      }
    }
  },
  beforeDraw(chart, _args, options) {
    const { ctx, chartArea } = chart

    if (!chartArea) return

    ctx.save()

    // 축 그리드 그리기
    const pluginOptions = options as InflectionPointPluginOptions

    // market hours 배경 그리기 (가장 먼저 그려서 다른 요소들 아래에 위치)
    if (pluginOptions?.timestamps && pluginOptions.timestamps.length > 0 && pluginOptions.marketOpenTime && pluginOptions.marketCloseTime) {
      const xScale = chart.scales.x
      if (xScale) {
        drawMarketHoursBackground(
          ctx,
          chartArea,
          xScale,
          pluginOptions.timestamps,
          pluginOptions.marketOpenTime,
          pluginOptions.marketCloseTime,
        )
      }
    }

    // x축 그리드 그리기 (beforeDraw에서는 위쪽 끝 선 제외, hideChartBorder시 전체 스킵)
    if (!pluginOptions.hideChartBorder && pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisGrid(ctx, chartArea, xScale, pluginOptions.timestamps, false, 'hourly')
      }
    }

    // y축 그리드 그리기
    const yScale = chart.scales.y
    if (yScale && !pluginOptions.hideYAxisLabels) {
      const targetTicks = pluginOptions.yAxisTicks ?? 5
      const yAxisStep =
        typeof pluginOptions.yAxisStep === 'number' && pluginOptions.yAxisStep > 0
          ? pluginOptions.yAxisStep
          : calcYAxisStep(yScale.min, yScale.max, targetTicks)
      drawYAxisGrid(ctx, chartArea, yScale, yAxisStep)
    }

    ctx.restore()
  },
  afterDraw(chart, _args, options) {
    const { ctx, chartArea } = chart

    if (!chartArea) return

    ctx.save()

    // 축 라벨 그리기
    const pluginOptions = options as InflectionPointPluginOptions

    // x축 라벨 그리기
    if (!pluginOptions.hideXAxisLabel && pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisLabels(ctx, chartArea, xScale, pluginOptions.timestamps, {
          mode: 'hourly',
          yOffset: pluginOptions.xAxisLabelYOffset ?? 12,
        })
      }
    }

    // x축 그리드 그리기 (afterDraw에서는 위쪽 끝 선 포함, hideChartBorder시 전체 스킵)
    if (
      !pluginOptions.hideChartBorder &&
      !pluginOptions.hideYAxisLabel &&
      pluginOptions?.timestamps &&
      pluginOptions.timestamps.length > 0
    ) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisGrid(ctx, chartArea, xScale, pluginOptions.timestamps, true, 'hourly')
      }
    }

    // y축 라벨 그리기
    const yScale = chart.scales.y
    if (yScale && !pluginOptions.hideYAxisLabels) {
      const targetTicks = pluginOptions.yAxisTicks ?? 5
      const yAxisStep =
        typeof pluginOptions.yAxisStep === 'number' && pluginOptions.yAxisStep > 0
          ? pluginOptions.yAxisStep
          : calcYAxisStep(yScale.min, yScale.max, targetTicks)
      drawYAxisLabelsInflection(
        ctx,
        chartArea,
        yScale,
        pluginOptions.useUnitDisplay,
        yAxisStep,
        pluginOptions.includeTopYAxisLabel !== false,
      )
    }

    // 뉴스 마커 그리기
    if (pluginOptions?.relatedNews && pluginOptions?.timestamps) {
      const xScale = chart.scales.x
      const yScaleForMarkers = chart.scales.y
      if (xScale && yScaleForMarkers) {
        drawNewsMarkers(
          ctx,
          chartArea,
          xScale,
          yScaleForMarkers,
          pluginOptions.relatedNews,
          pluginOptions.timestamps,
          chart,
          pluginOptions.boxPositions,
          pluginOptions,
        )
      }
    }

    // 최고점 표시
    if (pluginOptions?.showHighPoint && pluginOptions?.highPointData && pluginOptions?.timestamps) {
      const xScale = chart.scales.x
      const yScaleForHighPoint = chart.scales.y
      if (xScale && yScaleForHighPoint) {
        drawHighPoint(ctx, chartArea, xScale, yScaleForHighPoint, pluginOptions.highPointData, pluginOptions.timestamps)
      }
    }

    // 최저점 표시
    if (pluginOptions?.showLowPoint && pluginOptions?.lowPointData && pluginOptions?.timestamps) {
      const xScale = chart.scales.x
      const yScaleForLowPoint = chart.scales.y
      if (xScale && yScaleForLowPoint) {
        drawLowPoint(ctx, chartArea, xScale, yScaleForLowPoint, pluginOptions.lowPointData, pluginOptions.timestamps)
      }
    }

    ctx.restore()
  },
  /** 차트 리마운트(갱신) 시 overlay 캔버스와 모듈 레벨 캐시를 정리 — 남으면 이전 박스 그림이 DOM에 유령으로 남음 */
  beforeDestroy(chart) {
    const chartId = chart.canvas?.id
    if (!chartId) return

    const dragState = dragStateMap.get(chartId)
    if (dragState) stopDragAnimation(dragState)

    const overlay = overlayCanvasMap.get(chartId)
    if (overlay?.parentElement) {
      overlay.parentElement.removeChild(overlay)
    }

    overlayCanvasMap.delete(chartId)
    dragStateMap.delete(chartId)
    boxInfoMap.delete(chartId)
    initialPositionsMap.delete(chartId)
    layoutSignatureByChartId.delete(chartId)
    dragFrameCacheMap.delete(chartId)
  },
}

export default InflectionPointChartPlugin
