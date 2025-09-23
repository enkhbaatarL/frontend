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
  yAxisStep?: number
  decimalPlaces?: number
  useUnitDisplay?: boolean
  relatedNews?: IRelatedNewsEventItem[]
  enableBoxDragging?: boolean
  boxPositions?: Record<number, { x: number; y: number }>
  onBoxPositionChange?: (timestamp: number, position: { x: number; y: number }) => void
  onInitialPositionsSet?: (positions: Record<number, { x: number; y: number }>) => void
  showHighPoint?: boolean
  highPointData?: { value: number; timestamp: number; time: string }
  showLowPoint?: boolean
  lowPointData?: { value: number; timestamp: number; time: string }
  hideXAxisLabel?: boolean
  hideYAxisLabel?: boolean
  marketOpenTime?: number
  marketCloseTime?: number
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
  isAbove?: boolean
  timestamp?: number
  existingBoxes?: BoxInfo[]
  chartArea?: { left: number; right: number; top: number; bottom: number }
  customPosition?: { x: number; y: number }
  enableCollisionDetection?: boolean
  trend?: string
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
const CIRCLE_RADIUS = 11

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

const drawXAxisGrid = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  timestamps: number[],
  drawTopBorder: boolean = false,
) => {
  // 차트 외곽선 그리기
  ctx.strokeStyle = '#868E96'
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

  // 아래 끝 선
  ctx.beginPath()
  ctx.moveTo(chartArea.left, chartArea.bottom)
  ctx.lineTo(chartArea.right, chartArea.bottom)
  ctx.stroke()

  // 위 끝 선(점선)
  if (drawTopBorder) {
    ctx.strokeStyle = '#868E96'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(chartArea.left, chartArea.top)
    ctx.lineTo(chartArea.right, chartArea.top)
    ctx.stroke()
  }

  // 보조선(점선)
  ctx.strokeStyle = '#ADB5BD'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  if (timestamps.length === 0) return

  // 첫 번째와 마지막 타임스탬프
  const firstTimestamp = timestamps[0]
  const lastTimestamp = timestamps[timestamps.length - 1]

  // 첫 번째 타임스탬프의 시간을 정시로 맞춤 (분, 초, 밀리초를 0으로)
  const firstHour = dayjs(firstTimestamp).tz('America/New_York').startOf('hour')
  const lastHour = dayjs(lastTimestamp).tz('America/New_York').startOf('hour')

  // 1시간마다 점선으로 그리기
  let currentHour = firstHour
  while (currentHour.isBefore(lastHour) || currentHour.isSame(lastHour)) {
    // 현재 시간에 해당하는 데이터 포인트 찾기
    const currentTimestamp = currentHour.valueOf()
    const nearestIndex = findNearestTimestampIndex(currentTimestamp, timestamps)

    if (nearestIndex !== -1) {
      const xPosition = xScale.getPixelForValue(nearestIndex)

      // 차트 영역 내부에 있는지 확인
      if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
        // 1시간마다 점선으로 그리기
        ctx.strokeStyle = '#DEE2E6'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(xPosition, chartArea.top)
        ctx.lineTo(xPosition, chartArea.bottom)
        ctx.stroke()
      }
    }

    currentHour = currentHour.add(1, 'hour')
  }
}

const drawYAxisGrid = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  yScale: { getPixelForValue: (value: number) => number; min: number; max: number },
  yAxisStep: number = 1,
) => {
  ctx.strokeStyle = '#DEE2E6'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  // y축 범위 계산
  const min = Math.floor(yScale.min / yAxisStep) * yAxisStep
  const max = Math.ceil(yScale.max / yAxisStep) * yAxisStep

  for (let value = min; value <= max; value += yAxisStep) {
    if (value === min) continue

    const yPosition = yScale.getPixelForValue(value)

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
  useUnitDisplay?: boolean,
  yAxisStep: number = 1,
) => {
  // 텍스트 스타일 설정
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  // y축 범위 계산
  const min = Math.floor(yScale.min / yAxisStep) * yAxisStep
  const max = Math.ceil(yScale.max / yAxisStep) * yAxisStep

  const xPosition = chartArea.left - 12

  for (let value = min; value <= max; value += yAxisStep) {
    const yPosition = yScale.getPixelForValue(value)

    // 차트 영역 내부에 있는지 확인
    if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
      const label = formatYAxisLabel(value, 0, useUnitDisplay)

      if (label) {
        ctx.fillText(label, xPosition, yPosition)
      }
    }
  }
}

const drawMarketHoursBackgroundSegment = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  timestamps: number[],
  openTimestamp: number,
  closeTimestamp: number,
) => {
  const openIndex = findNearestTimestampIndex(Math.max(openTimestamp, timestamps[0]), timestamps)
  const closeIndex = findNearestTimestampIndex(Math.min(closeTimestamp, timestamps[timestamps.length - 1]), timestamps)

  if (openIndex === -1 || closeIndex === -1) return

  const openXPosition = xScale.getPixelForValue(openIndex)
  const closeXPosition = xScale.getPixelForValue(closeIndex)

  if (openXPosition >= chartArea.right || closeXPosition <= chartArea.left) return

  const startX = Math.max(chartArea.left, openXPosition)
  const endX = Math.min(chartArea.right, closeXPosition)

  if (startX >= endX) return

  ctx.fillStyle = 'rgba(128, 128, 128, 0.1)'
  ctx.fillRect(startX, chartArea.top, endX - startX, chartArea.bottom - chartArea.top)
}

const drawMarketHoursBackground = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  timestamps: number[],
  marketOpenTime?: number,
  marketCloseTime?: number,
) => {
  if (!marketOpenTime || !marketCloseTime || timestamps.length === 0) return

  const openTimestamp = Number(marketOpenTime)
  const closeTimestamp = Number(marketCloseTime)

  if (closeTimestamp < openTimestamp) {
    // 양쪽 범위

    const firstTimestamp = timestamps[0]
    const baseDate = dayjs(firstTimestamp).tz('America/New_York').format('YYYY-MM-DD')

    const firstCloseTimestamp = dayjs.tz(`${baseDate} 23:59:59`, 'America/New_York').valueOf()

    const secondOpenTimestamp = dayjs.tz(`${baseDate} 00:00:00`, 'America/New_York').add(1, 'day').valueOf()

    drawMarketHoursBackgroundSegment(ctx, chartArea, xScale, timestamps, openTimestamp, firstCloseTimestamp)
    drawMarketHoursBackgroundSegment(ctx, chartArea, xScale, timestamps, secondOpenTimestamp, closeTimestamp)
  } else {
    // 단일 범위
    drawMarketHoursBackgroundSegment(ctx, chartArea, xScale, timestamps, openTimestamp, closeTimestamp)
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

  const timestampIndex = timestamps.findIndex((ts) => ts === highPointData.timestamp)
  if (timestampIndex === -1) return

  const xPosition = xScale.getPixelForValue(timestampIndex)
  const yPosition = yScale.getPixelForValue(highPointData.value)

  if (xPosition < chartArea.left || xPosition > chartArea.right || yPosition < chartArea.top || yPosition > chartArea.bottom) {
    return
  }

  // 텍스트 스타일 설정
  ctx.font = '700 12px Pretendard, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4

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
  const boxX = xPosition - totalWidth / 2 - padding
  const boxY = textY - 6

  // 박스 배경 그리기
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  const borderRadius = 2
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius)
  ctx.fill()

  // 박스 테두리 그리기
  ctx.strokeStyle = '#D3D3D3'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius)
  ctx.stroke()

  // 텍스트 그리기 (중앙 정렬)
  ctx.fillStyle = '#DF4B4A'
  let currentX = xPosition - totalWidth / 2

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
  const timestampIndex = timestamps.findIndex((ts) => ts === lowPointData.timestamp)
  if (timestampIndex === -1) return

  const xPosition = xScale.getPixelForValue(timestampIndex)
  const yPosition = yScale.getPixelForValue(lowPointData.value)

  // 차트 영역 내부에 있는지 확인
  if (xPosition < chartArea.left || xPosition > chartArea.right || yPosition < chartArea.top || yPosition > chartArea.bottom) {
    return
  }

  // 텍스트 스타일 설정
  ctx.font = '700 12px Pretendard, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4

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
  const boxX = xPosition - totalWidth / 2 - padding
  const boxY = textY - 6

  // 박스 배경 그리기
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  const borderRadius = 2
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius)
  ctx.fill()

  // 박스 테두리 그리기
  ctx.strokeStyle = '#D3D3D3'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius)
  ctx.stroke()

  // 텍스트 그리기 (중앙 정렬)
  ctx.fillStyle = '#1967D2'
  let currentX = xPosition - totalWidth / 2

  ctx.fillText(lowText, currentX, textY)
  currentX += lowWidth + 4

  ctx.fillText(valueText, currentX, textY)
  currentX += valueWidth + 4

  ctx.font = '400 12px Pretendard, sans-serif'
  ctx.fillText(timeText, currentX, textY)
}

const drawXAxisLabels = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; bottom: number },
  xScale: { getPixelForValue: (value: number) => number },
  timestamps: number[],
) => {
  // 텍스트 스타일 설정
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const yPosition = chartArea.bottom + 12

  if (timestamps.length === 0) return

  const firstTimestamp = timestamps[0]
  const lastTimestamp = timestamps[timestamps.length - 1]

  // 첫 번째 타임스탬프의 시간을 정시로 맞춤 (분, 초, 밀리초를 0으로)
  const firstHour = dayjs(firstTimestamp).tz('America/New_York').startOf('hour')
  const lastHour = dayjs(lastTimestamp).tz('America/New_York').startOf('hour')

  // 두 시간 간격으로 라벨 그리기
  let currentHour = firstHour
  while (currentHour.isBefore(lastHour) || currentHour.isSame(lastHour)) {
    const currentTimestamp = currentHour.valueOf()
    const nearestIndex = findNearestTimestampIndex(currentTimestamp, timestamps)

    if (nearestIndex !== -1) {
      const xPosition = xScale.getPixelForValue(nearestIndex)

      if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
        const label = currentHour.format('HH:mm')
        ctx.fillText(label, xPosition, yPosition)
      }
    }

    currentHour = currentHour.add(2, 'hour')
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

const calculateBoxDimensions = (ctx: CanvasRenderingContext2D, title: string, timestamp?: number) => {
  const time = timestamp ? dayjs(timestamp).tz('America/New_York').format('HH:mm') : dayjs().tz('America/New_York').format('HH:mm')
  const padding = 8
  const lineHeight = 16

  // 타이틀을 20자씩 나누어 여러 줄로 처리
  const splitTitleIntoLines = (text: string, maxCharsPerLine: number = 20): string[] => {
    const lines: string[] = []
    for (let i = 0; i < text.length; i += maxCharsPerLine) {
      lines.push(text.slice(i, i + maxCharsPerLine).trim())
    }
    return lines
  }

  const titleLines = splitTitleIntoLines(title)
  const titleLineCount = titleLines.length

  ctx.font = '600 12px Pretendard,sans-serif'
  const timeWidth = ctx.measureText(time).width

  // 각 타이틀 라인의 너비를 측정하고 최대값 찾기
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

  // 흰색 외곽선 추가 (그래프랑 겹쳐도 잘 보이도록)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.strokeText(time, timeX, timeY)
  ctx.fillText(time, timeX, timeY)

  // 변곡점에 따른 색상 적용
  let titleColor = '#495057' // 기본 색상
  if (params.trend === 'DOWN') {
    titleColor = '#2F62A3'
  } else if (params.trend === 'UP') {
    titleColor = '#AB3B39'
  }

  ctx.fillStyle = titleColor
  ctx.font = '600 12px Pretendard,sans-serif'
  const titleX = finalBox.x + padding

  // 흰색 외곽선 추가 (그래프랑 겹쳐도 잘 보이도록)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4

  // 타이틀을 여러 줄로 렌더링
  titleLines.forEach((line, index) => {
    const titleY = finalBox.y + padding + lineHeight + 2 + lineHeight / 2 + index * lineHeight
    ctx.strokeText(line, titleX, titleY)
    ctx.fillText(line, titleX, titleY)
  })

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

// 동일한 타임스탬프를 가진 뉴스들을 1ms씩 차이나게 조정하는 함수 (겹쳤을때 버그 회피)
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

  const visibleNews = adjustDuplicateTimestamps(relatedNews.filter((news) => news.showInChart)).reverse()
  if (!visibleNews.length) return

  ctx.save()

  // 박스 정보를 저장할 배열
  const existingBoxes: BoxInfo[] = []

  // 마커 그리기
  visibleNews.forEach((news) => {
    if (!news.timestamp) return

    // 조정된 타임스탬프를 사용하여 x축 위치 계산
    // 원본 타임스탬프를 기준으로 가장 가까운 인덱스 찾기
    const originalTimestamp = news.timestamp - (news.timestamp % 1) // 원본 타임스탬프 복원 (1ms 단위)
    let timestampIndex = timestamps.findIndex((ts) => ts === originalTimestamp)

    // 정확한 매치가 없으면 가장 가까운 값 찾기
    if (timestampIndex === -1) {
      timestampIndex = findNearestTimestampIndex(originalTimestamp, timestamps)
    }

    if (timestampIndex === -1) return

    // 조정된 타임스탬프의 오프셋을 픽셀 단위로 변환
    const timeOffset = news.timestamp - originalTimestamp // 밀리초 단위 오프셋
    const baseXPosition = xScale.getPixelForValue(timestampIndex)

    // 1ms 단위로 조정되므로, 시간 오프셋을 픽셀 오프셋으로 변환
    // 다음 타임스탬프까지의 거리를 기준으로 비례 계산
    const nextTimestampIndex = Math.min(timestampIndex + 1, timestamps.length - 1)
    const nextXPosition = xScale.getPixelForValue(nextTimestampIndex)
    const timeRange = timestamps[nextTimestampIndex] - timestamps[timestampIndex]
    const pixelRange = nextXPosition - baseXPosition
    const offsetPixels = (timeOffset / timeRange) * pixelRange

    const xPosition = baseXPosition + offsetPixels

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

      // 조정된 타임스탬프를 사용하여 x축 위치 계산
      const originalTimestamp = news.timestamp - (news.timestamp % 1) // 원본 타임스탬프 복원 (1ms 단위)
      let timestampIndex = timestamps.findIndex((ts) => ts === originalTimestamp)

      // 정확한 매치가 없으면 가장 가까운 값 찾기
      if (timestampIndex === -1) {
        timestampIndex = findNearestTimestampIndex(originalTimestamp, timestamps)
      }

      if (timestampIndex === -1) return null

      // 조정된 타임스탬프의 오프셋을 픽셀 단위로 변환
      const timeOffset = news.timestamp - originalTimestamp
      const baseXPosition = xScale.getPixelForValue(timestampIndex)

      // 1ms 단위로 조정되므로, 시간 오프셋을 픽셀 오프셋으로 변환
      const nextTimestampIndex = Math.min(timestampIndex + 1, timestamps.length - 1)
      const nextXPosition = xScale.getPixelForValue(nextTimestampIndex)
      const timeRange = timestamps[nextTimestampIndex] - timestamps[timestampIndex]
      const pixelRange = nextXPosition - baseXPosition
      const offsetPixels = (timeOffset / timeRange) * pixelRange

      const xPosition = baseXPosition + offsetPixels
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
          trend: news.trend,
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
          // 조정된 타임스탬프를 사용하여 뉴스 찾기
          const adjustedNews = adjustDuplicateTimestamps(pluginOptions.relatedNews?.filter((news) => news.showInChart) ?? [])

          timestamp = adjustedNews.find((news) => {
            if (!news.timestamp) return false

            // 조정된 타임스탬프를 사용하여 x축 위치 계산
            const originalTimestamp = news.timestamp - (news.timestamp % 1) // 원본 타임스탬프 복원 (1ms 단위)
            let timestampIndex = pluginOptions.timestamps?.findIndex((ts) => ts === originalTimestamp)

            if (timestampIndex === -1) {
              timestampIndex = findNearestTimestampIndex(originalTimestamp, pluginOptions.timestamps ?? [])
            }

            if (timestampIndex === -1 || timestampIndex === undefined) return false

            // 조정된 타임스탬프의 오프셋을 픽셀 단위로 변환
            const timeOffset = news.timestamp - originalTimestamp // 1ms 단위 오프셋
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

            // 더 넓은 범위에서 매칭 (5px 허용 오차)
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

    // x축 그리드 그리기 (beforeDraw에서는 위쪽 끝 선 제외)
    if (pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisGrid(ctx, chartArea, xScale, pluginOptions.timestamps, false)
      }
    }

    // y축 그리드 그리기
    const yScale = chart.scales.y
    if (yScale) {
      const yAxisStep = pluginOptions.yAxisStep ?? 1
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
        drawXAxisLabels(ctx, chartArea, xScale, pluginOptions.timestamps)
      }
    }

    // x축 그리드 그리기 (afterDraw에서는 위쪽 끝 선 포함)
    if (!pluginOptions.hideYAxisLabel && pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisGrid(ctx, chartArea, xScale, pluginOptions.timestamps, true)
      }
    }

    // y축 라벨 그리기
    const yScale = chart.scales.y
    if (yScale) {
      const yAxisStep = pluginOptions.yAxisStep ?? 1
      drawYAxisLabels(ctx, chartArea, yScale, pluginOptions.useUnitDisplay, yAxisStep)
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
}

export default InflectionPointChartPlugin
