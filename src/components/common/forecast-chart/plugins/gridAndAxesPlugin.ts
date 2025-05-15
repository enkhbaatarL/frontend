import { Chart, ChartArea, ChartType, Plugin } from 'chart.js'

// Allowed font weight values
type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

// Type definitions for the function parameters
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
  // Measure text width and height metrics
  const textMetrics = ctx.measureText(text)
  const textWidth = textMetrics.width

  // Better text height calculation
  const textHeight = fontSize * 1.4

  const rectWidth = textWidth + paddingLeft + paddingRight
  const rectHeight = textHeight + paddingTop + paddingBottom

  return {
    rectWidth,
    rectHeight,
  }
}
// Function to draw text with background and customizable padding
const drawTextWithBackground = (ctx: CanvasRenderingContext2D, options: TextWithBackgroundOptions) => {
  const {
    text,
    x,
    y,
    fontSize,
    fontFamily,
    fontWeight,
    textColor,
    backgroundColor = 'red',
    paddingLeft = 0,
    paddingRight = 0,
    paddingTop = 0,
    paddingBottom = 0,
  } = options

  // Set the font with weight
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`

  // Measure text width and height metrics
  const textMetrics = ctx.measureText(text)
  const textWidth = textMetrics.width

  // Better text height calculation
  const textHeight = fontSize * 1.2

  // Background rectangle dimensions
  const rectX = x
  const rectY = y
  const rectWidth = textWidth + paddingLeft + paddingRight
  const rectHeight = textHeight + paddingTop + paddingBottom

  // Draw background rectangle
  ctx.fillStyle = backgroundColor
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight)

  // Set text baseline to middle for vertical centering
  ctx.textBaseline = 'middle'

  // Draw text
  ctx.fillStyle = textColor
  ctx.fillText(text, x + paddingLeft, y + textHeight / 2 + paddingTop)

  // Reset text baseline
  ctx.textBaseline = 'alphabetic'
}

const gridAndAxesPlugin: Plugin<ChartType> = {
  id: 'gridAndAxes',
  beforeDraw(chart: Chart, _agrs, options: { bottomLabel?: string; topLabel?: string }) {
    const ctx: CanvasRenderingContext2D = chart.ctx
    const chartArea: ChartArea = chart.chartArea
    const scales = chart.scales
    const months = chart.data.labels as string[]
    const { top, bottom, left, right } = chartArea
    const yScale = scales.y

    // Calculate extended axis length (10% on each side)
    const axisExtension = (right - left) * 0.1
    const extendedLeft = left - axisExtension
    const extendedRight = right + axisExtension

    // Save the context state
    ctx.save()

    // 1. Draw dashed grid lines
    ctx.setLineDash([2, 2])
    ctx.lineWidth = 1
    ctx.strokeStyle = '#B5B5B5'

    // Draw horizontal grid lines (y-axis)
    const yMin = yScale.min
    const yMax = yScale.max
    const yStep = 5 // Same as the stepSize in the options

    for (let y = yMin; y < yMax; y += yStep) {
      const yPixel = yScale.getPixelForValue(y)

      // Only draw if within chart area
      if (yPixel >= top && yPixel <= bottom) {
        ctx.beginPath()
        ctx.moveTo(left, yPixel)
        ctx.lineTo(right, yPixel)
        ctx.stroke()
      }
    }

    // Draw vertical grid lines (x-axis) - only for the actual data points
    for (let i = 1; i < months.length - 1; i++) {
      // Get the position from the first dataset's data points
      const meta = chart.getDatasetMeta(0)

      if (meta.data[i]) {
        const x = meta.data[i].x

        // Only draw if within chart area
        if (x >= left && x <= right) {
          ctx.beginPath()
          ctx.moveTo(x, top)
          ctx.lineTo(x, bottom)
          ctx.stroke()
        }
      }
    }

    // 2. Draw solid axes
    ctx.setLineDash([]) // Reset to solid line
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#8B8B8B'

    // Draw extended x-axis (horizontal line at bottom)
    ctx.beginPath()
    ctx.moveTo(extendedLeft, bottom)
    ctx.lineTo(extendedRight, bottom)
    ctx.stroke()

    // Draw y-axis (vertical line at left)
    ctx.beginPath()
    ctx.moveTo(left, top)
    ctx.lineTo(left, bottom)
    ctx.stroke()

    if (options.bottomLabel) {
      const textInformation = {
        fontFamily: 'Pretendard',
        fontSize: 12,
        fontWeight: '400' as FontWeight,
        text: options.bottomLabel,
      }

      const { rectWidth } = measureTextBox(ctx, textInformation)

      drawTextWithBackground(ctx, {
        ...textInformation,
        backgroundColor: 'transparent',
        x: left - rectWidth - 2,
        y: bottom + 10,
        textColor: '#495057',
      })
    }

    if (options.topLabel) {
      const textInformation = {
        fontFamily: 'Pretendard',
        fontSize: 14,
        fontWeight: '400' as FontWeight,
        text: options.topLabel,
        paddingLeft: 4,
        paddingTop: 4,
        paddingRight: 4,
        paddingBottom: 4,
      }

      drawTextWithBackground(ctx, {
        ...textInformation,
        backgroundColor: '#ffffff',
        x: left - 72,
        y: top,
        textColor: '#495057',
      })
    }

    // Restore the context state
    ctx.restore()
  },
}

export default gridAndAxesPlugin
