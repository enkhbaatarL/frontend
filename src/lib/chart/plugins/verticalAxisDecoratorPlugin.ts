import { Plugin } from 'chart.js'

interface YAxisOptions {
  position?: 'left' | 'right'
  unit?: string
}

const AXIS_BORDER_COLOR = '#2E3F5E'
const UNIT_BORDER_COLOR = '#DEE2E6'
const FONT = '600 12px Pretendard'
const COLOR = '#868E96'
const UNIT_BOX_HEIGHT = 32
const UNIT_PADDING_RIGHT = 12
const UNIT_PADDING_TOP = 12
const UNIT_LINE_HEIGHT = 12

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
      ctx.translate(0.5, 0.5) // Fix blur issue when drawing line in canvas

      if (position === 'left') {
        ctx.beginPath()
        ctx.moveTo(right, bottom)
        ctx.lineTo(right - width, bottom)
        ctx.lineWidth = 1
        ctx.strokeStyle = AXIS_BORDER_COLOR
        ctx.stroke()

        //Draw divider beside unit
        ctx.beginPath()
        ctx.moveTo(right, bottom)
        ctx.lineTo(right, bottom + UNIT_BOX_HEIGHT)
        ctx.lineWidth = 1
        ctx.strokeStyle = UNIT_BORDER_COLOR
        ctx.stroke()

        ctx.font = FONT
        const textMetrics = ctx.measureText(unit)

        ctx.fillStyle = COLOR
        ctx.fillText(unit, right - (textMetrics.width + UNIT_PADDING_RIGHT), bottom + (UNIT_LINE_HEIGHT + UNIT_PADDING_TOP))
      } else {
        ctx.beginPath()
        ctx.moveTo(left, bottom)
        ctx.lineTo(left + width, bottom)
        ctx.lineWidth = 1
        ctx.strokeStyle = AXIS_BORDER_COLOR
        ctx.stroke()

        //Draw divider beside unit
        ctx.beginPath()
        ctx.moveTo(left, bottom)
        ctx.lineTo(left, bottom + UNIT_BOX_HEIGHT)
        ctx.lineWidth = 1
        ctx.strokeStyle = UNIT_BORDER_COLOR
        ctx.stroke()

        ctx.font = FONT

        ctx.fillStyle = COLOR
        ctx.fillText(unit, left + UNIT_PADDING_RIGHT, bottom + (UNIT_LINE_HEIGHT + UNIT_PADDING_TOP))
      }

      ctx.restore()
    })
  },
}

export default verticalAxisDecoratorPlugin
