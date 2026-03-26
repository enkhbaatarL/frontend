import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export type ChartAreaRect = { left: number; right: number; top: number; bottom: number }

export type XScaleLike = { getPixelForValue: (value: number) => number }

export type YScaleLike = { getPixelForValue: (value: number) => number; min: number; max: number }

export type XAxisGridMode =
  | 'adaptive' // Reference: 월/일/시간 범위에 따라 그리드 간격 적응
  | 'hourly' // Inflection: 1시간 간격 고정

export type XAxisLabelMode =
  | 'adaptive' // Reference: 적응형 라벨
  | 'hourly' // Inflection: 2시간 간격 HH:mm + yOffset

/** tick 간격(step/dtick)에 맞춰 표시에 필요한 최대 소수 자릿수 (예: 0.25 → 2, 2.5 → 1, 1 → 0) */
export const fractionDigitsFromTickStep = (step: number): number => {
  if (!Number.isFinite(step) || step <= 0) return 0
  const epsilon = 1e-9
  for (let p = 0; p <= 15; p++) {
    const scaled = step * 10 ** p
    if (Math.abs(scaled - Math.round(scaled)) < epsilon) {
      return p
    }
  }
  return 15
}

export const findNearestTimestampIndex = (targetTimestamp: number, timestamps: number[]): number => {
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

/** High/Low 라벨 등에 쓰는 흰색 반투명 배경과 회색 테두리 박스 */
export const drawWhiteRoundedLabelBox = (
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  borderRadius = 2,
): void => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius)
  ctx.fill()

  ctx.strokeStyle = '#D3D3D3'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, borderRadius)
  ctx.stroke()
}

export const isPointInsideChartArea = (x: number, y: number, chartArea: ChartAreaRect): boolean =>
  x >= chartArea.left && x <= chartArea.right && y >= chartArea.top && y <= chartArea.bottom

export const isXInsideChartArea = (x: number, chartArea: ChartAreaRect): boolean => x >= chartArea.left && x <= chartArea.right

/** High/Low 라벨: 굵은 글꼴 + 흰색 스트로크(가독성) */
export const applyInflectionHighLowLabelTextStyle = (ctx: CanvasRenderingContext2D): void => {
  ctx.font = '700 12px Pretendard, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 4
}

const drawChartAxisBorders = (ctx: CanvasRenderingContext2D, chartArea: ChartAreaRect, drawTopBorder: boolean): void => {
  ctx.strokeStyle = '#868E96'
  ctx.lineWidth = 1
  ctx.setLineDash([])

  ctx.beginPath()
  ctx.moveTo(chartArea.left, chartArea.top)
  ctx.lineTo(chartArea.left, chartArea.bottom)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(chartArea.right, chartArea.top)
  ctx.lineTo(chartArea.right, chartArea.bottom)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(chartArea.left, chartArea.bottom)
  ctx.lineTo(chartArea.right, chartArea.bottom)
  ctx.stroke()

  if (drawTopBorder) {
    ctx.strokeStyle = '#868E96'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(chartArea.left, chartArea.top)
    ctx.lineTo(chartArea.right, chartArea.top)
    ctx.stroke()
  }

  ctx.strokeStyle = '#ADB5BD'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
}

const strokeVerticalGridLine = (ctx: CanvasRenderingContext2D, chartArea: ChartAreaRect, xPosition: number): void => {
  if (xPosition < chartArea.left || xPosition > chartArea.right) return
  ctx.strokeStyle = '#DEE2E6'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(xPosition, chartArea.top)
  ctx.lineTo(xPosition, chartArea.bottom)
  ctx.stroke()
}

const getAdaptiveTimestampRangeContext = (timestamps: number[]) => {
  if (timestamps.length === 0) return null
  const firstDate = dayjs(timestamps[0]).tz('America/New_York')
  const lastDate = dayjs(timestamps.at(-1)).tz('America/New_York')
  return {
    firstDate,
    lastDate,
    isDifferentMonth: !firstDate.isSame(lastDate, 'month'),
    isDifferentYear: !firstDate.isSame(lastDate, 'year'),
  }
}

const drawXAxisGridAdaptive = (ctx: CanvasRenderingContext2D, chartArea: ChartAreaRect, xScale: XScaleLike, timestamps: number[]): void => {
  const range = getAdaptiveTimestampRangeContext(timestamps)
  if (!range) return

  const { firstDate, lastDate, isDifferentMonth, isDifferentYear } = range

  if (isDifferentYear) {
    let currentDate = firstDate.startOf('month')
    const endMonth = lastDate.startOf('month')
    while (currentDate.isBefore(endMonth) || currentDate.isSame(endMonth)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)
      if (nearestIndex !== -1) {
        strokeVerticalGridLine(ctx, chartArea, xScale.getPixelForValue(nearestIndex))
      }
      currentDate = currentDate.add(6, 'month')
    }
  } else if (isDifferentMonth) {
    let currentDate = firstDate.startOf('day')
    const endDay = lastDate.startOf('day')
    while (currentDate.isBefore(endDay) || currentDate.isSame(endDay)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)
      if (nearestIndex !== -1) {
        strokeVerticalGridLine(ctx, chartArea, xScale.getPixelForValue(nearestIndex))
      }
      currentDate = currentDate.add(1, 'day')
    }
  } else {
    const firstHour = firstDate.startOf('hour')
    const lastHour = lastDate.startOf('hour')
    let currentHour = firstHour
    while (currentHour.isBefore(lastHour) || currentHour.isSame(lastHour)) {
      const nearestIndex = findNearestTimestampIndex(currentHour.valueOf(), timestamps)
      if (nearestIndex !== -1) {
        strokeVerticalGridLine(ctx, chartArea, xScale.getPixelForValue(nearestIndex))
      }
      currentHour = currentHour.add(2, 'hour')
    }
  }
}

const drawXAxisGridHourly = (ctx: CanvasRenderingContext2D, chartArea: ChartAreaRect, xScale: XScaleLike, timestamps: number[]): void => {
  if (timestamps.length === 0) return

  const firstTimestamp = timestamps[0]
  const lastTs = timestamps.at(-1)
  if (lastTs === undefined) return

  const firstHour = dayjs(firstTimestamp).tz('America/New_York').startOf('hour')
  const lastHour = dayjs(lastTs).tz('America/New_York').startOf('hour')

  let currentHour = firstHour
  while (currentHour.isBefore(lastHour) || currentHour.isSame(lastHour)) {
    const nearestIndex = findNearestTimestampIndex(currentHour.valueOf(), timestamps)
    if (nearestIndex !== -1) {
      strokeVerticalGridLine(ctx, chartArea, xScale.getPixelForValue(nearestIndex))
    }
    currentHour = currentHour.add(1, 'hour')
  }
}

export const drawXAxisGrid = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartAreaRect,
  xScale: XScaleLike,
  timestamps: number[],
  drawTopBorder: boolean = false,
  mode: XAxisGridMode = 'adaptive',
): void => {
  drawChartAxisBorders(ctx, chartArea, drawTopBorder)
  if (timestamps.length === 0) return
  if (mode === 'hourly') {
    drawXAxisGridHourly(ctx, chartArea, xScale, timestamps)
  } else {
    drawXAxisGridAdaptive(ctx, chartArea, xScale, timestamps)
  }
}

const drawYAxisHorizontalGridLines = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartAreaRect,
  yScale: YScaleLike,
  axisStep: number,
): void => {
  const min = Math.floor(yScale.min / axisStep) * axisStep
  const max = Math.ceil(yScale.max / axisStep) * axisStep
  for (let value = min; value <= max; value += axisStep) {
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

export const drawYAxisGrid = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartAreaRect,
  yScale: YScaleLike,
  yAxisStep: number = 1,
  _isRightAxis: boolean = false,
  seriesTicks?: (number | undefined)[],
  seriesIndex?: number,
): void => {
  ctx.strokeStyle = '#DEE2E6'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  const axisStep = seriesTicks && seriesIndex !== undefined && seriesTicks[seriesIndex] !== undefined ? seriesTicks[seriesIndex] : yAxisStep

  drawYAxisHorizontalGridLines(ctx, chartArea, yScale, axisStep)
}

export const drawYAxisLabelsReference = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartAreaRect,
  yScale: YScaleLike,
  yAxisStep: number = 1,
  isRightAxis: boolean = false,
  seriesTicks?: (number | undefined)[],
  seriesIndex?: number,
): void => {
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = isRightAxis ? 'left' : 'right'
  ctx.textBaseline = 'middle'

  const xPosition = isRightAxis ? chartArea.right + 10 : chartArea.left - 10

  if (seriesTicks && seriesIndex !== undefined && seriesTicks[seriesIndex] !== undefined) {
    const tickValue = seriesTicks[seriesIndex]
    const maxFrac = fractionDigitsFromTickStep(tickValue)
    const min = Math.floor(yScale.min / tickValue) * tickValue
    const max = Math.ceil(yScale.max / tickValue) * tickValue
    for (let value = min; value <= max; value += tickValue) {
      const yPosition = yScale.getPixelForValue(value)
      if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
        const label = value.toLocaleString('ko-KR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: maxFrac,
        })
        if (label) ctx.fillText(label, xPosition, yPosition)
      }
    }
  } else {
    const maxFrac = fractionDigitsFromTickStep(yAxisStep)
    const min = Math.floor(yScale.min / yAxisStep) * yAxisStep
    const max = Math.ceil(yScale.max / yAxisStep) * yAxisStep
    for (let value = min; value <= max; value += yAxisStep) {
      const yPosition = yScale.getPixelForValue(value)
      if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
        const label = value.toLocaleString('ko-KR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: maxFrac,
        })
        if (label) ctx.fillText(label, xPosition, yPosition)
      }
    }
  }
}

const formatYAxisLabelForInflection = (value: number, tickStep: number, useUnitDisplay?: boolean): string => {
  const maxFrac = fractionDigitsFromTickStep(tickStep)
  if (useUnitDisplay && value >= 1000000) {
    const v = value / 1_000_000
    return `${v.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: maxFrac })}M`
  }
  return value.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: maxFrac })
}

/** Y축 라벨이 차트 경계에 걸릴 때(부동소수점·dtick 정렬) Reference 차트와 같이 상·하단도 보이도록 허용하는 픽셀 여유 */
const Y_AXIS_LABEL_BOUNDARY_PX = 12
/**
 * 상단에 이미 “윗부분 눈금”이 있는지 판별 (폴백 중복 방지).
 * 차트 상단선 위·아래 패딩 쪽에 그린 눈금까지 포함한다.
 */
const Y_AXIS_TOP_LABEL_MAX_Y_OFFSET_PX = 12

export const drawYAxisLabelsInflection = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartAreaRect,
  yScale: YScaleLike,
  useUnitDisplay?: boolean,
  yAxisStep: number = 1,
  /** false면 볼륨 차트처럼 차트 영역 안의 눈금만 표시하고, 상단 여유·최댓값 폴백 라벨은 쓰지 않음 */
  includeTopYAxisLabel: boolean = true,
): void => {
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  const min = Math.floor(yScale.min / yAxisStep) * yAxisStep
  const max = Math.ceil(yScale.max / yAxisStep) * yAxisStep
  const xPosition = chartArea.left - 12

  const top = chartArea.top
  const bottom = chartArea.bottom
  let hasLabelNearTop = false

  const pad = includeTopYAxisLabel ? Y_AXIS_LABEL_BOUNDARY_PX : 0

  for (let value = min; value <= max; value += yAxisStep) {
    const yPosition = yScale.getPixelForValue(value)
    if (yPosition >= top - pad && yPosition <= bottom + pad) {
      if (includeTopYAxisLabel && yPosition <= top + Y_AXIS_TOP_LABEL_MAX_Y_OFFSET_PX) {
        hasLabelNearTop = true
      }
      const label = formatYAxisLabelForInflection(value, yAxisStep, useUnitDisplay)
      if (label) ctx.fillText(label, xPosition, yPosition)
    }
  }

  if (includeTopYAxisLabel && !hasLabelNearTop && Number.isFinite(yScale.max)) {
    const label = formatYAxisLabelForInflection(yScale.max, yAxisStep, useUnitDisplay)
    if (label) ctx.fillText(label, xPosition, top)
  }
}

export const drawMarketHoursBackgroundSegment = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartAreaRect,
  xScale: XScaleLike,
  timestamps: number[],
  openTimestamp: number,
  closeTimestamp: number,
): void => {
  const firstTs = timestamps[0]
  const lastTs = timestamps.at(-1)
  if (firstTs === undefined || lastTs === undefined) return

  const openIndex = findNearestTimestampIndex(Math.max(openTimestamp, firstTs), timestamps)
  const closeIndex = findNearestTimestampIndex(Math.min(closeTimestamp, lastTs), timestamps)

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

export const drawMarketHoursBackground = (
  ctx: CanvasRenderingContext2D,
  chartArea: ChartAreaRect,
  xScale: XScaleLike,
  timestamps: number[],
  marketOpenTime?: number,
  marketCloseTime?: number,
): void => {
  if (!marketOpenTime || !marketCloseTime || timestamps.length === 0) return

  const openTimestamp = Number(marketOpenTime)
  const closeTimestamp = Number(marketCloseTime)

  if (closeTimestamp < openTimestamp) {
    const firstTimestamp = timestamps[0]
    const baseDate = dayjs(firstTimestamp).tz('America/New_York').format('YYYY-MM-DD')
    const firstCloseTimestamp = dayjs.tz(`${baseDate} 23:59:59`, 'America/New_York').valueOf()
    const secondOpenTimestamp = dayjs.tz(`${baseDate} 00:00:00`, 'America/New_York').add(1, 'day').valueOf()

    drawMarketHoursBackgroundSegment(ctx, chartArea, xScale, timestamps, openTimestamp, firstCloseTimestamp)
    drawMarketHoursBackgroundSegment(ctx, chartArea, xScale, timestamps, secondOpenTimestamp, closeTimestamp)
  } else {
    drawMarketHoursBackgroundSegment(ctx, chartArea, xScale, timestamps, openTimestamp, closeTimestamp)
  }
}

const drawXAxisLabelsEveryTwoHours = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; bottom: number },
  xScale: XScaleLike,
  timestamps: number[],
  yPosition: number,
  firstHour: dayjs.Dayjs,
  lastHour: dayjs.Dayjs,
): void => {
  let currentHour = firstHour
  while (currentHour.isBefore(lastHour) || currentHour.isSame(lastHour)) {
    const nearestIndex = findNearestTimestampIndex(currentHour.valueOf(), timestamps)
    if (nearestIndex !== -1) {
      const xPosition = xScale.getPixelForValue(nearestIndex)
      if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
        ctx.fillText(currentHour.format('HH:mm'), xPosition, yPosition)
      }
    }
    currentHour = currentHour.add(2, 'hour')
  }
}

const drawXAxisLabelsAdaptive = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; bottom: number },
  xScale: XScaleLike,
  timestamps: number[],
  yPosition: number,
): void => {
  const range = getAdaptiveTimestampRangeContext(timestamps)
  if (!range) return

  const { firstDate, lastDate, isDifferentMonth, isDifferentYear } = range

  if (isDifferentYear) {
    let currentDate = firstDate.startOf('month')
    const endMonth = lastDate.startOf('month')
    while (currentDate.isBefore(endMonth) || currentDate.isSame(endMonth)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)
      if (nearestIndex !== -1) {
        const xPosition = xScale.getPixelForValue(nearestIndex)
        if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
          ctx.fillText(currentDate.format('MMM YYYY'), xPosition, yPosition)
        }
      }
      currentDate = currentDate.add(6, 'month')
    }
  } else if (isDifferentMonth) {
    let currentDate = firstDate.startOf('day')
    const endDay = lastDate.startOf('day')
    while (currentDate.isBefore(endDay) || currentDate.isSame(endDay)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)
      if (nearestIndex !== -1) {
        const xPosition = xScale.getPixelForValue(nearestIndex)
        if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
          ctx.fillText(currentDate.format('MM/DD'), xPosition, yPosition)
        }
      }
      currentDate = currentDate.add(1, 'day')
    }
  } else {
    drawXAxisLabelsEveryTwoHours(ctx, chartArea, xScale, timestamps, yPosition, firstDate.startOf('hour'), lastDate.startOf('hour'))
  }
}

const drawXAxisLabelsHourly = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; bottom: number },
  xScale: XScaleLike,
  timestamps: number[],
  yPosition: number,
): void => {
  if (timestamps.length === 0) return

  const firstTimestamp = timestamps[0]
  const lastTimestamp = timestamps.at(-1)
  const firstHour = dayjs(firstTimestamp).tz('America/New_York').startOf('hour')
  const lastHour = dayjs(lastTimestamp).tz('America/New_York').startOf('hour')

  drawXAxisLabelsEveryTwoHours(ctx, chartArea, xScale, timestamps, yPosition, firstHour, lastHour)
}

export const drawXAxisLabels = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; bottom: number },
  xScale: XScaleLike,
  timestamps: number[],
  options?: { mode?: XAxisLabelMode; yOffset?: number },
): void => {
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  const mode = options?.mode ?? 'adaptive'
  const yPosition = chartArea.bottom + (options?.yOffset ?? 12)

  if (mode === 'hourly') {
    drawXAxisLabelsHourly(ctx, chartArea, xScale, timestamps, yPosition)
  } else {
    drawXAxisLabelsAdaptive(ctx, chartArea, xScale, timestamps, yPosition)
  }
}
