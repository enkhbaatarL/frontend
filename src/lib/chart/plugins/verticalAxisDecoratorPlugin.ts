import { Plugin } from 'chart.js'

interface YAxisOptions {
  position?: 'left' | 'right'
  unit?: string
}

const AXIS_BORDER_COLOR = '#2E3F5E'
const UNIT_BORDER_COLOR = '#DEE2E6'
const DEFAULT_FONT_SIZE = 12
const MIN_FONT_SIZE = 8
const COLOR = '#868E96'
const UNIT_BOX_HEIGHT = 32
const UNIT_PADDING_RIGHT = 12
const UNIT_PADDING_TOP = 12
const UNIT_LINE_HEIGHT = 12
const SIZE_TOLERANCE = 2

const verticalAxisDecoratorPlugin: Plugin = {
  id: 'verticalAxisDecorator',
  afterDraw: (chart, _args, options) => {
    const yIDs = options.yIDs ?? []

    if (yIDs.length === 0) return

    const { ctx, scales } = chart

    yIDs.forEach((yid: string) => {
      const scale = scales[yid]

      if (!scale) return
      const { width, left, bottom, right, options } = scale
      const position = (options as YAxisOptions).position ?? 'right'
      const unit = (options as YAxisOptions).unit ?? ''

      //Extend the x-axis
      ctx.save()
      if (position === 'left') {
        ctx.beginPath()
        ctx.moveTo(Math.round(right), Math.round(bottom))
        ctx.lineTo(Math.round(right - width), Math.round(bottom))
        ctx.lineWidth = 1
        ctx.strokeStyle = AXIS_BORDER_COLOR
        ctx.stroke()

        //Draw divider beside unit
        ctx.beginPath()
        ctx.moveTo(Math.round(right) + 0.5, Math.round(bottom) + 0.5)
        ctx.lineTo(Math.round(right) + 0.5, Math.round(bottom + UNIT_BOX_HEIGHT) + 0.5)
        ctx.lineWidth = 1
        ctx.strokeStyle = UNIT_BORDER_COLOR
        ctx.stroke()

        const availableWidth = width - UNIT_PADDING_RIGHT
        let fontSize = DEFAULT_FONT_SIZE
        ctx.font = `600 ${fontSize}px Pretendard`
        let textMetrics = ctx.measureText(unit)

        while (textMetrics.width > availableWidth - SIZE_TOLERANCE && fontSize > MIN_FONT_SIZE) {
          fontSize -= 1
          ctx.font = `600 ${fontSize}px Pretendard`
          textMetrics = ctx.measureText(unit)
        }

        ctx.fillStyle = COLOR
        const adjustedLineHeight = UNIT_LINE_HEIGHT * (fontSize / DEFAULT_FONT_SIZE)
        ctx.fillText(
          unit,
          Math.round(right - (textMetrics.width + UNIT_PADDING_RIGHT)) + 0.5,
          Math.round(bottom + (adjustedLineHeight + UNIT_PADDING_TOP)) + 0.5,
        )
      } else {
        ctx.beginPath()
        ctx.moveTo(Math.round(left) + 0.5, Math.round(bottom))
        ctx.lineTo(Math.round(left + width) + 0.5, Math.round(bottom))
        ctx.lineWidth = 1
        ctx.strokeStyle = AXIS_BORDER_COLOR
        ctx.stroke()

        //Draw divider beside unit
        ctx.beginPath()
        ctx.moveTo(Math.round(left) + 0.2, Math.round(bottom) + 0.5)
        ctx.lineTo(Math.round(left) + 0.2, Math.round(bottom + UNIT_BOX_HEIGHT) + 0.5)
        ctx.lineWidth = 1
        ctx.strokeStyle = UNIT_BORDER_COLOR
        ctx.stroke()

        const availableWidth = width - UNIT_PADDING_RIGHT
        let fontSize = DEFAULT_FONT_SIZE
        ctx.font = `600 ${fontSize}px Pretendard`
        let textMetrics = ctx.measureText(unit)

        while (textMetrics.width > availableWidth - SIZE_TOLERANCE && fontSize > MIN_FONT_SIZE) {
          fontSize -= 1
          ctx.font = `600 ${fontSize}px Pretendard`
          textMetrics = ctx.measureText(unit)
        }

        ctx.fillStyle = COLOR
        const adjustedLineHeight = UNIT_LINE_HEIGHT * (fontSize / DEFAULT_FONT_SIZE)
        ctx.fillText(unit, Math.round(left + UNIT_PADDING_RIGHT) + 0.5, Math.round(bottom + (adjustedLineHeight + UNIT_PADDING_TOP)))
      }

      ctx.restore()
    })
  },
}

export default verticalAxisDecoratorPlugin
