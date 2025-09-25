import { Plugin } from 'chart.js'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

interface ReferencePluginOptions {
  timestamps?: number[]
  xAxisTicks?: number
  yAxisTicks?: number
  yAxisStep?: number
  decimalPlaces?: number
  hideXAxisLabel?: boolean
  hideYAxisLabel?: boolean
  marketOpenTime?: number
  marketCloseTime?: number
  yIDs?: string[]
  subYAxes?: Record<string, { unit: string; borderColor?: string; color?: string; isVirtual?: boolean }>
  seriesTicks?: (number | undefined)[]
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

  // 위 끝 선(점선) - 조건부로 그리기
  if (drawTopBorder) {
    ctx.strokeStyle = '#868E96'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(chartArea.left, chartArea.top)
    ctx.lineTo(chartArea.right, chartArea.top)
    ctx.stroke()
  }

  // 보조선을 점선으로 그리기
  ctx.strokeStyle = '#ADB5BD'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  if (timestamps.length === 0) return

  // 첫 번째와 마지막 타임스탬프
  const firstTimestamp = timestamps[0]
  const lastTimestamp = timestamps[timestamps.length - 1]

  // 첫 번째와 마지막 날짜 확인
  const firstDate = dayjs(firstTimestamp).tz('America/New_York')
  const lastDate = dayjs(lastTimestamp).tz('America/New_York')

  // 날짜가 다른 경우 월/년도 정보 추가
  const isDifferentMonth = !firstDate.isSame(lastDate, 'month')
  const isDifferentYear = !firstDate.isSame(lastDate, 'year')

  // 월/년 기준으로 그리드 간격 결정

  // 년도가 다른 경우: 월 단위로 그리드 표시
  if (isDifferentYear) {
    let currentDate = firstDate.startOf('month')
    const endMonth = lastDate.startOf('month')

    while (currentDate.isBefore(endMonth) || currentDate.isSame(endMonth)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)

      if (nearestIndex !== -1) {
        const xPosition = xScale.getPixelForValue(nearestIndex)

        if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
          ctx.strokeStyle = '#DEE2E6'
          ctx.lineWidth = 1
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.moveTo(xPosition, chartArea.top)
          ctx.lineTo(xPosition, chartArea.bottom)
          ctx.stroke()
        }
      }

      currentDate = currentDate.add(6, 'month')
    }
  }
  // 월이 다른 경우: 일 단위로 그리드 표시
  else if (isDifferentMonth) {
    let currentDate = firstDate.startOf('day')
    const endDay = lastDate.startOf('day')

    while (currentDate.isBefore(endDay) || currentDate.isSame(endDay)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)

      if (nearestIndex !== -1) {
        const xPosition = xScale.getPixelForValue(nearestIndex)

        if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
          ctx.strokeStyle = '#DEE2E6'
          ctx.lineWidth = 1
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.moveTo(xPosition, chartArea.top)
          ctx.lineTo(xPosition, chartArea.bottom)
          ctx.stroke()
        }
      }

      currentDate = currentDate.add(1, 'day')
    }
  }
  // 같은 날인 경우: 시간 단위로 그리드 표시
  else {
    const firstHour = firstDate.startOf('hour')
    const lastHour = lastDate.startOf('hour')

    let currentHour = firstHour
    while (currentHour.isBefore(lastHour) || currentHour.isSame(lastHour)) {
      const currentTimestamp = currentHour.valueOf()
      const nearestIndex = findNearestTimestampIndex(currentTimestamp, timestamps)

      if (nearestIndex !== -1) {
        const xPosition = xScale.getPixelForValue(nearestIndex)

        if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
          ctx.strokeStyle = '#DEE2E6'
          ctx.lineWidth = 1
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.moveTo(xPosition, chartArea.top)
          ctx.lineTo(xPosition, chartArea.bottom)
          ctx.stroke()
        }
      }

      currentHour = currentHour.add(2, 'hour')
    }
  }
}

const drawYAxisGrid = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  yScale: { getPixelForValue: (value: number) => number; min: number; max: number },
  yAxisStep: number = 1,
  _isRightAxis: boolean = false,
  seriesTicks?: (number | undefined)[],
  seriesIndex?: number,
) => {
  ctx.strokeStyle = '#DEE2E6'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])

  // seriesTicks가 있고 해당 시리즈에 tick 값이 있는 경우 우선 사용
  if (seriesTicks && seriesIndex !== undefined && seriesTicks[seriesIndex] !== undefined) {
    const tickValue = seriesTicks[seriesIndex]

    const min = Math.floor(yScale.min / tickValue) * tickValue
    const max = Math.ceil(yScale.max / tickValue) * tickValue

    // 지정된 tick 간격 사용
    for (let value = min; value <= max; value += tickValue) {
      if (value === min) continue

      const yPosition = yScale.getPixelForValue(value)

      // 차트 영역 내부에 있는지 확인
      if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
        ctx.beginPath()
        ctx.moveTo(chartArea.left, yPosition)
        ctx.lineTo(chartArea.right, yPosition)
        ctx.stroke()
      }
    }
  } else {
    const min = Math.floor(yScale.min / yAxisStep) * yAxisStep
    const max = Math.ceil(yScale.max / yAxisStep) * yAxisStep

    // 지정된 단위 간격으로 모든 값에 대해 그리기
    for (let value = min; value <= max; value += yAxisStep) {
      if (value === min) continue

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
}

const drawYAxisLabels = (
  ctx: CanvasRenderingContext2D,
  chartArea: { left: number; right: number; top: number; bottom: number },
  yScale: { getPixelForValue: (value: number) => number; min: number; max: number },
  yAxisStep: number = 1,
  isRightAxis: boolean = false,
  seriesTicks?: (number | undefined)[],
  seriesIndex?: number,
) => {
  // 텍스트 스타일 설정
  ctx.fillStyle = '#2E3F5E'
  ctx.font = '14px Pretendard,sans-serif'
  ctx.textAlign = isRightAxis ? 'left' : 'right'
  ctx.textBaseline = 'middle'

  const xPosition = isRightAxis ? chartArea.right + 10 : chartArea.left - 10

  // seriesTicks가 있고 해당 시리즈에 tick 값이 있는 경우 우선 사용
  if (seriesTicks && seriesIndex !== undefined && seriesTicks[seriesIndex] !== undefined) {
    const tickValue = seriesTicks[seriesIndex]

    const min = Math.floor(yScale.min / tickValue) * tickValue
    const max = Math.ceil(yScale.max / tickValue) * tickValue

    // 지정된 tick 간격 사용
    for (let value = min; value <= max; value += tickValue) {
      const yPosition = yScale.getPixelForValue(value)

      // 차트 영역 내부에 있는지 확인
      if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
        const label = value.toLocaleString()

        if (label) {
          ctx.fillText(label, xPosition, yPosition)
        }
      }
    }
  } else {
    const min = Math.floor(yScale.min / yAxisStep) * yAxisStep
    const max = Math.ceil(yScale.max / yAxisStep) * yAxisStep

    // 지정된 단위 간격으로 모든 값에 대해 라벨 그리기
    for (let value = min; value <= max; value += yAxisStep) {
      const yPosition = yScale.getPixelForValue(value)

      // 차트 영역 내부에 있는지 확인
      if (yPosition >= chartArea.top && yPosition <= chartArea.bottom) {
        const label = Number(value.toFixed(0)).toLocaleString()

        if (label) {
          ctx.fillText(label, xPosition, yPosition)
        }
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
  // marketOpenTime과 marketCloseTime에 해당하는 타임스탬프 인덱스 찾기
  const openIndex = findNearestTimestampIndex(Math.max(openTimestamp, timestamps[0]), timestamps)
  const closeIndex = findNearestTimestampIndex(Math.min(closeTimestamp, timestamps[timestamps.length - 1]), timestamps)

  if (openIndex === -1 || closeIndex === -1) return

  // x축 위치 계산
  const openXPosition = xScale.getPixelForValue(openIndex)
  const closeXPosition = xScale.getPixelForValue(closeIndex)

  // 차트 영역 내부에 있는지 확인
  if (openXPosition >= chartArea.right || closeXPosition <= chartArea.left) return

  // 실제 그릴 영역 계산 (차트 영역과 교집합)
  const startX = Math.max(chartArea.left, openXPosition)
  const endX = Math.min(chartArea.right, closeXPosition)

  if (startX >= endX) return

  // 옅은 회색 배경 그리기
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

  // 라벨 위치 (x축 아래 12px 패딩)
  const yPosition = chartArea.bottom + 12

  if (timestamps.length === 0) return

  // 첫 번째와 마지막 타임스탬프
  const firstTimestamp = timestamps[0]
  const lastTimestamp = timestamps[timestamps.length - 1]

  // 첫 번째와 마지막 날짜 확인
  const firstDate = dayjs(firstTimestamp).tz('America/New_York')
  const lastDate = dayjs(lastTimestamp).tz('America/New_York')

  // 날짜가 다른 경우 월/년도 정보 추가
  const isDifferentMonth = !firstDate.isSame(lastDate, 'month')
  const isDifferentYear = !firstDate.isSame(lastDate, 'year')

  // 월/년 기준으로 라벨 간격 결정

  // 년도가 다른 경우: 월 단위로 라벨 표시
  if (isDifferentYear) {
    let currentDate = firstDate.startOf('month')
    const endMonth = lastDate.startOf('month')

    while (currentDate.isBefore(endMonth) || currentDate.isSame(endMonth)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)

      if (nearestIndex !== -1) {
        const xPosition = xScale.getPixelForValue(nearestIndex)

        if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
          const label = currentDate.format('MMM YYYY')
          ctx.fillText(label, xPosition, yPosition)
        }
      }

      currentDate = currentDate.add(6, 'month')
    }
  }
  // 월이 다른 경우: 일 단위로 라벨 표시
  else if (isDifferentMonth) {
    let currentDate = firstDate.startOf('day')
    const endDay = lastDate.startOf('day')

    while (currentDate.isBefore(endDay) || currentDate.isSame(endDay)) {
      const nearestIndex = findNearestTimestampIndex(currentDate.valueOf(), timestamps)

      if (nearestIndex !== -1) {
        const xPosition = xScale.getPixelForValue(nearestIndex)

        if (xPosition >= chartArea.left && xPosition <= chartArea.right) {
          const label = currentDate.format('MM/DD')
          ctx.fillText(label, xPosition, yPosition)
        }
      }

      currentDate = currentDate.add(1, 'day')
    }
  }
  // 같은 날인 경우: 시간 단위로 라벨 표시
  else {
    const firstHour = firstDate.startOf('hour')
    const lastHour = lastDate.startOf('hour')

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
}

const ReferenceChartPlugin: Plugin = {
  id: 'ReferenceChartPlugin',
  beforeDraw(chart, _args, options) {
    const { ctx, chartArea } = chart

    if (!chartArea) return

    ctx.save()

    // 축 그리드 그리기
    const pluginOptions = options as ReferencePluginOptions

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
      drawYAxisGrid(ctx, chartArea, yScale, yAxisStep, false, pluginOptions.seriesTicks, 0)
    }

    ctx.restore()
  },
  afterDraw(chart, _args, options) {
    const { ctx, chartArea } = chart

    if (!chartArea) return

    ctx.save()

    // 축 라벨 그리기
    const pluginOptions = options as ReferencePluginOptions

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
      drawYAxisLabels(ctx, chartArea, yScale, yAxisStep, false, pluginOptions.seriesTicks, 0)
    }

    // 서브 y축들 라벨 그리기
    if (pluginOptions.subYAxes) {
      Object.keys(pluginOptions.subYAxes).forEach((axisId) => {
        const subYScale = chart.scales[axisId]
        if (subYScale && !pluginOptions.subYAxes?.[axisId]?.isVirtual) {
          const yAxisStep = pluginOptions.yAxisStep ?? 1
          // axisId에서 시리즈 인덱스 추출 (sub-1 -> 1)
          const seriesIndex = axisId.startsWith('sub-') ? parseInt(axisId.replace('sub-', '')) : undefined
          drawYAxisLabels(ctx, chartArea, subYScale, yAxisStep, true, pluginOptions.seriesTicks, seriesIndex)
        }
      })
    }

    ctx.restore()
  },
}

export default ReferenceChartPlugin
