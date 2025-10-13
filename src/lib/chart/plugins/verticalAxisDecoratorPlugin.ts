import { Plugin, Scale } from 'chart.js'

import { getCurrentFontFamily } from '@/utils/font'

interface YAxisOptions {
  position?: 'left' | 'right'
  unit?: string
  isVirtual?: boolean
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

    const firstScale = scales[yIDs[0]]
    const lastScale = scales[yIDs[yIDs.length - 1]]
    if (firstScale && lastScale) {
      // Draw white line on background
      ctx.beginPath()
      ctx.moveTo(Math.round(firstScale.left), Math.round(firstScale.bottom) + 1)
      ctx.lineTo(Math.round(lastScale.right), Math.round(firstScale.bottom) + 1)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#FFFFFF'
      ctx.stroke()

      // Draw dark line
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(Math.round(firstScale.left), Math.round(firstScale.bottom))
      ctx.lineTo(Math.round(lastScale.right), Math.round(lastScale.bottom))
      ctx.lineWidth = 1
      ctx.strokeStyle = AXIS_BORDER_COLOR
      ctx.stroke()
      ctx.restore()
    }

    const drawUnit = (position: 'left' | 'right', scale: Scale, unit: string) => {
      const { width, left, right, bottom } = scale

      // Draw divider beside unit
      ctx.beginPath()
      const xPos = position === 'left' ? right : left
      ctx.moveTo(Math.round(xPos) + (position === 'left' ? 0.5 : 0.2), Math.round(bottom) + 0.5)
      ctx.lineTo(Math.round(xPos) + (position === 'left' ? 0.5 : 0.2), Math.round(bottom + UNIT_BOX_HEIGHT) + 0.5)
      ctx.lineWidth = 1
      ctx.strokeStyle = UNIT_BORDER_COLOR
      ctx.stroke()

      const availableWidth = width - UNIT_PADDING_RIGHT
      let fontSize = DEFAULT_FONT_SIZE
      ctx.font = `600 ${fontSize}px ${getCurrentFontFamily()}`
      let textMetrics = ctx.measureText(unit)

      while (textMetrics.width > availableWidth - SIZE_TOLERANCE && fontSize > MIN_FONT_SIZE) {
        fontSize -= 1
        ctx.font = `600 ${fontSize}px ${getCurrentFontFamily()}`
        textMetrics = ctx.measureText(unit)
      }

      ctx.fillStyle = COLOR
      const adjustedLineHeight = UNIT_LINE_HEIGHT * (fontSize / DEFAULT_FONT_SIZE)
      const xTextPos =
        position === 'left'
          ? Math.round(right - (textMetrics.width + UNIT_PADDING_RIGHT)) + 0.5
          : Math.round(left + UNIT_PADDING_RIGHT) + 0.5

      ctx.fillText(unit, xTextPos, Math.round(bottom + (adjustedLineHeight + UNIT_PADDING_TOP)) + 0.5)
    }

    yIDs.forEach((yid: string) => {
      const scale = scales[yid]

      if (!scale) return
      const { options } = scale
      const axisOptions = options as YAxisOptions
      const position = axisOptions.position ?? 'right'
      const unit = axisOptions.unit ?? ''
      const isVirtual = axisOptions.isVirtual ?? false

      if (isVirtual) return

      ctx.save()
      drawUnit(position, scale, unit)
      ctx.restore()
    })
  },
}

export default verticalAxisDecoratorPlugin
