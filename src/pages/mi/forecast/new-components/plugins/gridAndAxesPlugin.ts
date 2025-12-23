import { Chart, ChartType, Plugin } from 'chart.js'
import dayjs from 'dayjs'

type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

interface TextWithBackgroundOptions {
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: FontWeight
  textColor: string
  backgroundColor?: string
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
}

const measureTextBox = (
  ctx: CanvasRenderingContext2D,
  props: Omit<TextWithBackgroundOptions, 'x' | 'y' | 'backgroundColor' | 'textColor'>,
) => {
  const { text, fontSize, fontFamily, fontWeight, paddingLeft = 0, paddingRight = 0, paddingTop = 0, paddingBottom = 0 } = props

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  const textMetrics = ctx.measureText(text)
  const textWidth = textMetrics.width
  const textHeight = fontSize * 1.4

  return {
    rectWidth: textWidth + paddingLeft + paddingRight,
    rectHeight: textHeight + paddingTop + paddingBottom,
  }
}

const drawTextWithBackground = (ctx: CanvasRenderingContext2D, options: TextWithBackgroundOptions) => {
  const {
    text,
    x,
    y,
    fontSize,
    fontFamily,
    fontWeight,
    textColor,
    backgroundColor = '',
    paddingLeft = 0,
    paddingRight = 0,
    paddingTop = 0,
    paddingBottom = 0,
  } = options

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  const textMetrics = ctx.measureText(text)
  const textWidth = textMetrics.width
  const textHeight = fontSize * 1.2

  if (backgroundColor) {
    ctx.fillStyle = backgroundColor
    ctx.fillRect(x, y, textWidth + paddingLeft + paddingRight, textHeight + paddingTop + paddingBottom)
  }

  ctx.textBaseline = 'middle'
  ctx.fillStyle = textColor
  ctx.fillText(text, x + paddingLeft, y + textHeight / 2 + paddingTop)
  ctx.textBaseline = 'alphabetic'
}

const gridAndAxesPlugin: Plugin<ChartType> = {
  id: 'gridAndAxes',

  afterDraw(chart: Chart, _args, options: { bottomLabel?: string; topLabel?: string; timestamps?: string[]; dataPointCount?: number }) {
    const ctx = chart.ctx
    const chartArea = chart.chartArea
    const { top, bottom, left, right } = chartArea

    if (!chartArea) return

    ctx.save()

    const yScale = chart.scales.y
    if (yScale?.ticks && yScale.ticks.length > 0) {
      const topTickPixel = yScale.getPixelForTick(yScale.ticks.length - 1)
      if (topTickPixel !== undefined && !Number.isNaN(topTickPixel)) {
        ctx.fillStyle = 'white'
        ctx.fillRect(left, topTickPixel - 1, right - left, 2)
      }
    }

    const xScale = chart.scales.x
    if (xScale && options.dataPointCount && options.dataPointCount > 0) {
      ctx.strokeStyle = '#B5B5B5'
      ctx.lineWidth = 1
      ctx.setLineDash([1, 2])

      const buffer = 100
      const minVisibleValue = xScale.getValueForPixel(left - buffer)
      const maxVisibleValue = xScale.getValueForPixel(right + buffer)

      if (minVisibleValue === undefined || maxVisibleValue === undefined) return

      const minVisibleIndex = Math.floor(minVisibleValue)
      const maxVisibleIndex = Math.ceil(maxVisibleValue)
      const startIndex = Math.max(0, minVisibleIndex)
      const endIndex = Math.min(options.dataPointCount - 1, maxVisibleIndex)

      ctx.save()
      ctx.beginPath()
      ctx.rect(left, top, chart.width - left, bottom - top)
      ctx.clip()

      for (let i = startIndex; i <= endIndex; i++) {
        const x = xScale.getPixelForValue(i)

        if (x !== undefined && !Number.isNaN(x)) {
          ctx.beginPath()
          ctx.moveTo(x, top)
          ctx.lineTo(x, bottom)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    ctx.setLineDash([])
    ctx.lineWidth = 1
    ctx.strokeStyle = '#000000'

    const axisExtension = (right - left) * 0.1
    const extendedLeft = left - axisExtension

    ctx.beginPath()
    ctx.moveTo(extendedLeft, bottom)
    ctx.lineTo(right, bottom)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left, bottom)
    ctx.stroke()

    if (xScale && options.timestamps && options.dataPointCount) {
      ctx.font = '14px Pretendard,sans-serif'
      ctx.fillStyle = '#2E3F5E'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const scaleMin = xScale.min ?? 0
      const scaleMax = xScale.max ?? options.dataPointCount - 1
      const extendedMin = Math.max(0, Math.floor(scaleMin) - 3)
      const extendedMax = Math.min(options.dataPointCount - 1, Math.ceil(scaleMax) + 3)
      const visibleRange = extendedMax - extendedMin
      const chartWidth = right - left
      const idealLabelCount = Math.max(8, Math.min(15, Math.floor(chartWidth / 80)))
      const step = Math.max(1, Math.ceil(visibleRange / idealLabelCount))
      let currentIndex = Math.ceil(extendedMin / step) * step

      if (currentIndex < 0) {
        currentIndex = 0
      }

      while (currentIndex <= extendedMax) {
        if (currentIndex >= 0 && currentIndex < options.timestamps.length) {
          const timestamp = options.timestamps[currentIndex]
          if (timestamp) {
            const pixel = xScale.getPixelForValue(currentIndex)

            if (pixel !== undefined && !Number.isNaN(pixel) && pixel >= left && pixel <= right) {
              const label = dayjs(timestamp).format('MM/DD')
              const labelWidth = ctx.measureText(label).width
              const labelLeft = pixel - labelWidth / 2
              const labelRight = pixel + labelWidth / 2

              if (labelRight >= left - 20 && labelLeft <= right + 20) {
                ctx.fillText(label, pixel, bottom + 8)
              }
            }
          }
        }

        currentIndex += step
      }

      ctx.textBaseline = 'alphabetic'
      ctx.textAlign = 'left'
    }

    if (options.bottomLabel) {
      const textInfo = {
        fontFamily: 'Pretendard',
        fontSize: 12,
        fontWeight: '400' as FontWeight,
        text: options.bottomLabel,
      }

      const { rectWidth } = measureTextBox(ctx, textInfo)

      drawTextWithBackground(ctx, {
        ...textInfo,
        backgroundColor: 'transparent',
        x: left - rectWidth - 2,
        y: bottom + 10,
        textColor: '#495057',
      })
    }

    if (options.topLabel) {
      const textInfo = {
        fontFamily: 'Pretendard',
        fontSize: 14,
        fontWeight: '400' as FontWeight,
        text: options.topLabel,
        paddingLeft: 10,
        paddingTop: 4,
        paddingRight: 4,
        paddingBottom: 4,
      }

      drawTextWithBackground(ctx, {
        ...textInfo,
        backgroundColor: '#ffffff',
        x: left - 72,
        y: top - 5,
        textColor: '#495057',
      })
    }

    ctx.restore()
  },
}

export default gridAndAxesPlugin
