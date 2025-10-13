import { Chart, ChartType, Plugin } from 'chart.js'

import { getCurrentFontFamily } from '@/utils/font'

interface VolumeTextPlugin extends Plugin<ChartType> {
  id: string
  afterDraw(chart: Chart<ChartType>, args: unknown, options: unknown): void
}

interface DataPoint {
  x: number
  y: number
}

const getFont = () => `500 14px ${getCurrentFontFamily()}`

let currentMouseX: number | null = null

export const setMousePosition = (mouseX: number | null) => {
  currentMouseX = mouseX
}

/**
 * Formats a number with comma separators for thousands
 * @param value - The number to format
 * @returns Formatted string with commas
 */
const formatVolumeNumber = (value: number): string => value.toLocaleString('ko-KR')

/**
 * Finds the data point closest to the mouse x position
 * @param chart - The Chart.js instance
 * @param mouseX - Mouse x position in pixels
 * @returns The volume value at the mouse position, or null if not found
 */
const getVolumeAtMousePosition = (chart: Chart, mouseX: number): number | null => {
  const dataset = chart.data.datasets[0]
  const xScale = chart.scales.x

  if (!dataset || !dataset.data || !xScale) return null

  const xScaleIndex = xScale.getValueForPixel(mouseX)

  if (xScaleIndex === null || xScaleIndex === undefined) return null

  const dataPoint = dataset.data.find((p) => typeof p === 'object' && p !== null && 'x' in p && p.x === xScaleIndex) as
    | DataPoint
    | undefined

  if (!dataPoint) return null

  return dataPoint.y
}

const volumeTextPlugin: VolumeTextPlugin = {
  id: 'volumeTextPlugin',
  afterDraw(chart) {
    const ctx = chart.ctx
    const chartArea = chart.chartArea

    if (!chartArea) return

    ctx.save()

    let volumeText = '거래량 -'

    if (currentMouseX !== null && currentMouseX >= chartArea.left && currentMouseX <= chartArea.right) {
      const volume = getVolumeAtMousePosition(chart, currentMouseX)
      if (volume !== null) {
        volumeText = `거래량 ${formatVolumeNumber(volume)}`
      }
    }

    // Set font and style
    ctx.font = getFont()
    ctx.fillStyle = '#2E3F5E'

    // Position text in top left corner with some padding
    const padding = 16
    const textX = chartArea.left + padding
    const textY = chartArea.top + 20 // 20px from top

    // Draw the text
    ctx.fillText(volumeText, textX, textY)

    ctx.restore()
  },
}

export default volumeTextPlugin
