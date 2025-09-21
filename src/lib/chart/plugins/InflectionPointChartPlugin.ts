import { Plugin, Chart as ChartJS } from 'chart.js'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { IRelatedNewsEventItem } from '@/service/mi/newsletter'

dayjs.extend(utc)
dayjs.extend(timezone)

interface InflectionPointPluginOptions {
  timestamps?: number[]
  xAxisTicks?: number
  yAxisTicks?: number
  decimalPlaces?: number
  useUnitDisplay?: boolean
  relatedNews?: IRelatedNewsEventItem[]
  enableBoxDragging?: boolean
  boxPositions?: Record<number, { x: number; y: number }>
  onBoxPositionChange?: (timestamp: number, position: { x: number; y: number }) => void
  onInitialPositionsSet?: (positions: Record<number, { x: number; y: number }>) => void
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
  score?: number
  isAbove?: boolean
  timestamp?: number
  existingBoxes?: BoxInfo[]
  chartArea?: { left: number; right: number; top: number; bottom: number }
  customPosition?: { x: number; y: number }
  enableCollisionDetection?: boolean
}

interface DragState {
  isDragging: boolean
  draggedBoxTimestamp: number | null
  dragOffset: { x: number; y: number }
  initialPosition: { x: number; y: number }
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
const CIRCLE_RADIUS = 12

// 차트별 드래그 상태 저장
const dragStateMap = new Map<string, DragState>()

// 차트별 박스 정보 저장
const boxInfoMap = new Map<string, BoxInfo[]>()

// 차트별 초기 위치 저장 (충돌 검사 후 최적화된 위치)
const initialPositionsMap = new Map<string, Record<number, { x: number; y: number }>>()

// 드래그 상태 초기화
const initDragState = (_chartId: string): DragState => ({
  isDragging: false,
  draggedBoxTimestamp: null,
  dragOffset: { x: 0, y: 0 },
  initialPosition: { x: 0, y: 0 },
})

// 마우스 포인터가 박스 내부에 있는지 확인
const isPointInBox = (x: number, y: number, box: BoxInfo): boolean =>
  x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height

// 겹친 박스들 중 최상위 박스 찾기 (나중에 그려진 박스가 위에 있음)
const findTopBoxAtPoint = (x: number, y: number, boxes: BoxInfo[]): BoxInfo | null => {
  // 역순으로 순회하여 최상위 박스부터 찾기
  for (let i = boxes.length - 1; i >= 0; i--) {
    if (isPointInBox(x, y, boxes[i])) {
      return boxes[i]
    }
  }
  return null
}

const drawXAxisGrid = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  timestamps: number[],
  maxTicksLimit: number,
) => {
  // 틱 간격 계산
  const totalTicks = Math.min(timestamps.length, maxTicksLimit)
  const tickStep = Math.max(1, Math.floor(timestamps.length / totalTicks))

  // 차트의 왼쪽과 오른쪽 끝에 검은선 그리기
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.setLineDash([])

  // 왼쪽 끝 선
  ctx.beginPath()
  ctx.moveTo(chartArea.left, chartArea.top)
  ctx.lineTo(chartArea.left, chartArea.bottom)
  ctx.stroke()

  // 오른쪽 끝 선
  ctx.beginPath()
  ctx.moveTo(chartArea.right, chartArea.top)
  ctx.lineTo(chartArea.right, chartArea.bottom)
  ctx.stroke()

  // 보조선을 점선으로 그리기
  ctx.strokeStyle = '#ADB5BD'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  // 보조선 그리기
  for (let i = 0; i < timestamps.length; i += tickStep) {
    const xPosition = xScale.getPixelForValue(i)

    // 차트 영역 내부에 있는지 확인
    if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
      ctx.beginPath()
      ctx.moveTo(xPosition, chartArea.top)
      ctx.lineTo(xPosition, chartArea.bottom)
      ctx.stroke()
    }
  }
}

const drawYAxisGrid = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  yScale: { getPixelForValue: (value: number) => number; min: number; max: number },
  maxTicks: number,
) => {
  ctx.strokeStyle = '#DEE2E6'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  // y축 범위 계산
  const min = yScale.min
  const max = yScale.max
  const range = max - min
  const step = range / (maxTicks - 1)

  // 보조선 그리기
  for (let i = 0; i < maxTicks; i++) {
    const value = min + step * i
    const yPosition = yScale.getPixelForValue(value)

    // 차트 영역 내부에 있는지 확인
    if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
      ctx.beginPath()
      ctx.moveTo(chartArea.left, yPosition)
      ctx.lineTo(chartArea.right, yPosition)
      ctx.stroke()
    }
  }
}

const formatYAxisLabel = (value: number, decimalPlaces: number, useUnitDisplay?: boolean): string => {
  if (useUnitDisplay && value >= 1000000) {
    return `${Number((value / 1000000).toFixed(decimalPlaces)).toLocaleString()}M`
  } else {
    return Number(value.toFixed(decimalPlaces)).toLocaleString()
  }
}

const drawYAxisLabels = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  yScale: { getPixelForValue: (value: number) => number; min: number; max: number },
  maxTicks: number,
  decimalPlaces: number,
  useUnitDisplay?: boolean,
) => {
  // 텍스트 스타일 설정
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  // y축 범위 계산
  const min = yScale.min
  const max = yScale.max
  const range = max - min
  const step = range / (maxTicks - 1)

  // 라벨 위치 (y축 왼쪽 12px 패딩)
  const xPosition = chartArea.left - 12

  // 첫번째와 마지막 틱 제외하고 모든 틱 라벨 그리기
  for (let i = 0; i < maxTicks; i++) {
    if (i === 0 || i === maxTicks - 1) continue

    const value = min + step * i
    const yPosition = yScale.getPixelForValue(value)

    // 차트 영역 내부에 있는지 확인
    if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
      const label = formatYAxisLabel(value, decimalPlaces, useUnitDisplay)

      if (label) {
        ctx.fillText(label, xPosition, yPosition)
      }
    }
  }
}

const drawXAxisLabels = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  timestamps: number[],
  maxTicksLimit: number,
) => {
  // 텍스트 스타일 설정
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // 틱 간격 계산
  const totalTicks = Math.min(timestamps.length, maxTicksLimit)
  const tickStep = Math.max(1, Math.floor(timestamps.length / totalTicks))

  // 라벨 위치 (x축 아래 12px 패딩)
  const yPosition = chartArea.bottom + 12

  // 모든 틱 라벨 그리기
  for (let i = 0; i < timestamps.length; i += tickStep) {
    const timestamp = timestamps[i]
    const label = dayjs(timestamp).tz('America/New_York').format('HH:mm')

    // x 위치 계산
    const xPosition = xScale.getPixelForValue(i)

    // 차트 영역 내부에 있는지 확인
    if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
      ctx.fillText(label, xPosition, yPosition)
    }
  }

  // 마지막 틱이 포함되지 않은 경우 마지막 틱도 그리기
  if (timestamps.length > 1 && (timestamps.length - 1) % tickStep !== 0) {
    const lastIndex = timestamps.length - 1
    const lastTimestamp = timestamps[lastIndex]
    const lastLabel = dayjs(lastTimestamp).tz('America/New_York').format('HH:mm')
    const lastXPosition = xScale.getPixelForValue(lastIndex)

    if (lastXPosition >= chartArea.left && lastXPosition <= chartArea.right) {
      ctx.textAlign = 'right'
      ctx.fillText(lastLabel, lastXPosition + 16, yPosition)
    }
  }
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
  let trendColor = 'rgba(46, 63, 94, 0.3)'

  if (trend === 'UP') trendColor = 'rgba(175, 0, 0, 0.3)'
  if (trend === 'DOWN') trendColor = 'rgba(41, 116, 255, 0.3)'

  // 큰 원 (외부) - 변곡점 색상 표시
  ctx.beginPath()
  ctx.arc(xPosition, yPosition, CIRCLE_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = trendColor
  ctx.fill()

  // 작은 원 (내부)
  ctx.beginPath()
  ctx.arc(xPosition, yPosition, 4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.fill()
  ctx.lineWidth = 4
  ctx.strokeStyle = '#2E3F5E'
  ctx.stroke()
}

const calculateBoxDimensions = (ctx: CanvasRenderingContext2D, title: string, score?: number, timestamp?: number) => {
  const time = timestamp ? dayjs(timestamp).tz('America/New_York').format('HH:mm') : dayjs().tz('America/New_York').format('HH:mm')
  const padding = 8
  const lineHeight = 16

  // 텍스트 측정
  ctx.font = '14px Pretendard,sans-serif'
  const timeWidth = ctx.measureText(time).width
  const titleWidth = ctx.measureText(title).width
  const maxWidth = Math.max(timeWidth + (score ? 30 : 0), titleWidth)

  return {
    width: maxWidth + padding * 2,
    height: lineHeight * 2 + padding * 2 + 4,
    time,
    padding,
    lineHeight,
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

const drawConnectionLine = (params: DrawConnectionLineParams) => {
  const { ctx, markerX, markerY, boxX, boxY, boxWidth, boxHeight, isAbove } = params

  ctx.strokeStyle = '#212529'
  ctx.lineWidth = 2
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
    markerStartY = markerY - CIRCLE_RADIUS - 4
  } else if (boxIsBelowMarker) {
    // 박스가 마커 아래에 있으면 원의 아래쪽 가장자리에서 시작
    markerStartY = markerY + CIRCLE_RADIUS + 4
  } else {
    // 박스가 마커와 같은 높이에 있으면 원의 가장 가까운 가장자리에서 시작
    markerStartY = isAbove ? markerY - CIRCLE_RADIUS - 4 : markerY + CIRCLE_RADIUS + 4
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

  // Y 좌표: 박스의 가장 가까운 가장자리
  if (boxIsAboveMarker) {
    boxConnectionY = boxY + boxHeight // 박스 아래쪽 가장자리
  } else if (boxIsBelowMarker) {
    boxConnectionY = boxY // 박스 위쪽 가장자리
  } else {
    // 같은 높이에 있으면 isAbove 플래그에 따라 결정
    boxConnectionY = isAbove ? boxY + boxHeight : boxY
  }

  ctx.beginPath()
  ctx.moveTo(markerStartX, markerStartY)
  ctx.lineTo(boxConnectionX, boxConnectionY)

  ctx.stroke()
}

const drawInfoBox = (params: DrawInfoBoxParams): BoxInfo | null => {
  const {
    ctx,
    xPosition,
    yPosition,
    title,
    score,
    isAbove = true,
    timestamp,
    existingBoxes = [],
    chartArea,
    customPosition,
    enableCollisionDetection = true,
  } = params
  const dimensions = calculateBoxDimensions(ctx, title, score, timestamp)
  const { width: boxWidth, height: boxHeight, time, padding, lineHeight } = dimensions

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
  ctx.font = '600 14px Pretendard,sans-serif'
  const titleWidth = ctx.measureText(title).width
  const titlePadding = 20 // 타이틀 영역 여백
  const titleAreaX = boxX + padding - titlePadding / 2
  const titleAreaY = boxY + padding + lineHeight + 4 - titlePadding / 4 // 타이틀 텍스트 상단

  const boxInfo: BoxInfo = {
    x: boxX,
    y: boxY,
    width: boxWidth,
    height: boxHeight,
    isAbove,
    xPosition,
    yPosition,
    timestamp,
    titleArea: {
      x: titleAreaX,
      y: titleAreaY,
      width: titleWidth + titlePadding,
      height: lineHeight + titlePadding / 2,
    },
  }

  // 충돌 검사 및 위치 조정 (초기 렌더링 시에만 실행)
  let finalBox = boxInfo
  if (enableCollisionDetection && chartArea && existingBoxes.length > 0) {
    finalBox = adjustBoxPosition(boxInfo, existingBoxes, chartArea)
  }

  // 시간
  ctx.fillStyle = '#868E96'
  ctx.font = '600 14px Pretendard,sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const timeX = finalBox.x + padding
  const timeY = finalBox.y + padding + lineHeight / 2

  // 흰색 외곽선 추가 (그래프랑 겹쳐도 잘 보이도록)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.strokeText(time, timeX, timeY)
  ctx.fillText(time, timeX, timeY)

  // 제목
  ctx.fillStyle = '#495057'
  ctx.font = '600 14px Pretendard,sans-serif'
  const titleX = finalBox.x + padding
  const titleY = finalBox.y + padding + lineHeight + 4 + lineHeight / 2

  // 흰색 외곽선 추가 (그래프랑 겹쳐도 잘 보이도록)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.strokeText(title, titleX, titleY)
  ctx.fillText(title, titleX, titleY)

  // 연결선 그리기
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

const findNearestTimestampIndex = (targetTimestamp: number, timestamps: number[]): number => {
  if (timestamps.length === 0) return -1

  let nearestIndex = 0
  let minDifference = Math.abs(timestamps[0] - targetTimestamp)

  for (let i = 1; i < timestamps.length; i++) {
    const difference = Math.abs(timestamps[i] - targetTimestamp)
    if (difference < minDifference) {
      minDifference = difference
      nearestIndex = i
    }
  }

  return nearestIndex
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
  if (!relatedNews?.length) return

  // 차트 ID 생성 - canvas ID가 없으면 설정
  let chartId = chart.canvas?.id
  if (!chartId) {
    chartId = `chart-${Date.now()}-${Math.random().toString(36).substring(7)}`
    if (chart.canvas) {
      chart.canvas.id = chartId
    }
  }

  // showInChart가 true인 항목들만 필터링
  const visibleNews = relatedNews.filter((news) => news.showInChart).reverse()
  if (!visibleNews.length) return

  ctx.save()

  // 박스 정보를 저장할 배열
  const existingBoxes: BoxInfo[] = []

  // 마커 그리기
  visibleNews.forEach((news) => {
    if (!news.timestamp) return

    let timestampIndex = timestamps.findIndex((ts) => ts === news.timestamp)

    // 정확한 매치가 없으면 가장 가까운 값 찾기
    if (timestampIndex === -1) {
      timestampIndex = findNearestTimestampIndex(news.timestamp, timestamps)
    }

    if (timestampIndex === -1) return

    const xPosition = xScale.getPixelForValue(timestampIndex)

    // 차트 영역 내부에 있는지 확인
    if (xPosition < chartArea.left || xPosition > chartArea.right) return

    // 데이터셋에서 해당 인덱스의 실제 y 값을 가져오기
    const firstDataset = chart.data.datasets[0]
    if (!firstDataset?.data[timestampIndex]) return

    const dataPoint = firstDataset.data[timestampIndex] as unknown as Record<string, unknown>
    const yValue = extractYValue(dataPoint)
    if (yValue === undefined) return

    // y 값을 픽셀 위치로 변환
    const yPosition = yScale.getPixelForValue(yValue)

    // 차트 영역 내부에 있는지 확인
    if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
      drawMarker(ctx, xPosition, yPosition, news.trend)
    }
  })

  // 그 다음 정보 박스들을 그리기 (충돌 방지 적용)
  // x축 위치 순서로 정렬하여 교대 배치 적용 (0: 위, 1: 아래, 2: 위, ...)
  const sortedNews = visibleNews
    .map((news) => {
      if (!news.timestamp) return null

      let timestampIndex = timestamps.findIndex((ts) => ts === news.timestamp)

      // 정확한 매치가 없으면 가장 가까운 값 찾기
      if (timestampIndex === -1) {
        timestampIndex = findNearestTimestampIndex(news.timestamp, timestamps)
      }

      if (timestampIndex === -1) return null

      const xPosition = xScale.getPixelForValue(timestampIndex)
      return { news, timestampIndex, xPosition }
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.xPosition - b.xPosition)

  // 초기 위치가 설정되었는지 확인
  const hasInitialPositions = initialPositionsMap.has(chartId)
  const initialPositions = initialPositionsMap.get(chartId) || {}
  const newInitialPositions: Record<number, { x: number; y: number }> = {}

  sortedNews.forEach((item, index) => {
    if (!item) return

    const { news, timestampIndex, xPosition } = item

    // 차트 영역 내부에 있는지 확인
    if (xPosition < chartArea.left || xPosition > chartArea.right) return

    // 데이터셋에서 해당 인덱스의 실제 y 값을 가져오기
    const firstDataset = chart.data.datasets[0]
    if (!firstDataset?.data[timestampIndex]) return

    const dataPoint = firstDataset.data[timestampIndex] as unknown as Record<string, unknown>
    const yValue = extractYValue(dataPoint)
    if (yValue === undefined) return

    // y 값을 픽셀 위치로 변환
    const yPosition = yScale.getPixelForValue(yValue)

    // 차트 영역 내부에 있는지 확인
    if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
      if (news.title) {
        // 인덱스에 따라 교대로 위/아래 배치 (짝수 인덱스: 위, 홀수 인덱스: 아래)
        const isAbove = index % 2 === 0
        const customPosition = news.timestamp ? boxPositions?.[news.timestamp] : undefined

        // 초기 위치가 있으면 사용, 없으면 충돌 검사로 계산
        const useInitialPosition = hasInitialPositions && !customPosition
        const enableCollisionDetection = !hasInitialPositions && !customPosition

        // 사용할 위치 결정
        let finalPosition = customPosition
        if (useInitialPosition && news.timestamp && initialPositions[news.timestamp]) {
          finalPosition = initialPositions[news.timestamp]
        }

        // 드래그 중인 박스의 경우 실시간 위치 사용
        const dragState = dragStateMap.get(chartId)
        if (dragState?.isDragging && news.timestamp && dragState.draggedBoxTimestamp === news.timestamp) {
          // 드래그 중인 박스는 boxPositions에서 현재 위치를 가져와서 사용
          finalPosition = boxPositions?.[news.timestamp]
        }

        const boxInfo = drawInfoBox({
          ctx,
          xPosition,
          yPosition,
          title: news.title,
          isAbove,
          timestamp: news.timestamp,
          existingBoxes,
          chartArea,
          customPosition: finalPosition,
          enableCollisionDetection,
        })

        // 그려진 박스 정보를 저장
        if (boxInfo && news.timestamp) {
          existingBoxes.push(boxInfo)

          // 초기 위치가 없을 때만 새 위치 저장
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

  // 차트별 박스 정보 저장
  boxInfoMap.set(chartId, existingBoxes)

  // 초기 위치가 없으면 새로 계산된 위치를 저장하고 콜백 호출
  if (!hasInitialPositions && Object.keys(newInitialPositions).length > 0) {
    initialPositionsMap.set(chartId, newInitialPositions)
    if (options?.onInitialPositionsSet) {
      options.onInitialPositionsSet(newInitialPositions)
    }
  }

  ctx.restore()
}

const InflectionPointChartPlugin: Plugin = {
  id: 'InflectionPointChartPlugin',
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
      dragStateMap.set(chartId, initDragState(chartId))
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
      // 클릭한 위치에서 최상위 박스 찾기
      const clickedBox = findTopBoxAtPoint(x, y, boxes)

      if (clickedBox && pluginOptions.relatedNews && pluginOptions.timestamps) {
        // 클릭된 박스에 타임스탬프가 있으면 직접 사용
        let timestamp = clickedBox.timestamp

        // 박스에 타임스탬프가 없으면 기존 로직으로 찾기
        if (!timestamp) {
          timestamp = pluginOptions.relatedNews.find((news) => {
            if (!news.showInChart || !pluginOptions.timestamps || !news.timestamp) return false

            let timestampIndex = pluginOptions.timestamps.findIndex((ts) => ts === news.timestamp)

            // 정확한 매치가 없으면 가장 가까운 값 찾기
            if (timestampIndex === -1) {
              timestampIndex = findNearestTimestampIndex(news.timestamp, pluginOptions.timestamps)
            }

            if (timestampIndex === -1) return false

            // 더 넓은 범위에서 매칭 (5px 허용 오차)
            const expectedXPosition = chart.scales.x.getPixelForValue(timestampIndex)
            return Math.abs(clickedBox.xPosition - expectedXPosition) < 5
          })?.timestamp
        }

        if (timestamp) {
          dragState.isDragging = true
          dragState.draggedBoxTimestamp = timestamp
          dragState.dragOffset.x = x - clickedBox.x
          dragState.dragOffset.y = y - clickedBox.y
          dragState.initialPosition.x = clickedBox.x
          dragState.initialPosition.y = clickedBox.y

          // 커서 스타일 변경
          if (chart.canvas) {
            chart.canvas.style.cursor = 'grabbing'
          }

          // 드래그 시작 시 경량 리렌더링 트리거
          args.changed = true
        }
      }
    } else if (event.type === 'mousemove' && dragState.isDragging) {
      // 드래그 중인 경우 박스 위치 업데이트
      const newX = x - dragState.dragOffset.x
      const newY = y - dragState.dragOffset.y

      // 콜백 호출하여 새 위치 전달
      if (pluginOptions.onBoxPositionChange && dragState.draggedBoxTimestamp) {
        pluginOptions.onBoxPositionChange(dragState.draggedBoxTimestamp, { x: newX, y: newY })
      }

      args.changed = true
    } else if (event.type === 'mouseup') {
      // 드래그 종료
      if (dragState.isDragging) {
        dragState.isDragging = false
        dragState.draggedBoxTimestamp = null

        // 커서 스타일 복원
        if (chart.canvas) {
          chart.canvas.style.cursor = 'default'
        }

        // 드래그 종료 시 최종 상태 리렌더링
        args.changed = true
      }
    } else if (event.type === 'mousemove') {
      // 마우스 호버 시 커서 스타일 변경 (최상위 박스만 고려)
      const hoveredBox = findTopBoxAtPoint(x, y, boxes)

      if (chart.canvas) {
        chart.canvas.style.cursor = hoveredBox ? 'grab' : 'default'
      }
    }
  },
  beforeDraw(chart, _args, options) {
    const { ctx, chartArea } = chart

    if (!chartArea) return

    ctx.save()

    // 축 그리드 그리기
    const pluginOptions = options as InflectionPointPluginOptions
    const maxTicks = pluginOptions.yAxisTicks ?? 8

    // x축 그리드 그리기
    if (pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        const maxTicksLimit = pluginOptions.xAxisTicks ?? 10
        drawXAxisGrid(ctx, chartArea, xScale, pluginOptions.timestamps, maxTicksLimit)
      }
    }

    // y축 그리드 그리기
    const yScale = chart.scales.y
    if (yScale) {
      drawYAxisGrid(ctx, chartArea, yScale, maxTicks)
    }

    ctx.restore()
  },
  afterDraw(chart, _args, options) {
    const { ctx, chartArea } = chart

    if (!chartArea) return

    ctx.save()

    // 축 라벨 그리기
    const pluginOptions = options as InflectionPointPluginOptions
    const maxTicks = pluginOptions.yAxisTicks ?? 8
    const decimalPlaces = pluginOptions.decimalPlaces ?? 1

    // x축 라벨 그리기
    if (pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        const maxTicksLimit = pluginOptions.xAxisTicks ?? 10
        drawXAxisLabels(ctx, chartArea, xScale, pluginOptions.timestamps, maxTicksLimit)
      }
    }

    // y축 라벨 그리기
    const yScale = chart.scales.y
    if (yScale) {
      drawYAxisLabels(ctx, chartArea, yScale, maxTicks, decimalPlaces)
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

    ctx.restore()
  },
}

export default InflectionPointChartPlugin
