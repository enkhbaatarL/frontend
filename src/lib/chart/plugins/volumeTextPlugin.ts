import { Chart, ChartType, Plugin } from 'chart.js'

interface VolumeTextPlugin extends Plugin<ChartType> {
  id: string
  afterDraw(chart: Chart<ChartType>, args: unknown, options: unknown): void
}

const FONT = '500 14px Pretendard'

/**
 * Formats a number with comma separators for thousands
 * @param value - The number to format
 * @returns Formatted string with commas
 */
const formatVolumeNumber = (value: number): string => value.toLocaleString('ko-KR')

/**
 * Calculates the total volume from the visible data points
 * @param chart - The Chart.js instance
 * @returns Total volume of visible data points
 */
const calculateTotalVolume = (chart: Chart): number => {
  const dataset = chart.data.datasets[0]

  if (!dataset || !dataset.data) return 0

  const xScale = chart.scales.x

  if (!xScale) return 0

  const visibleMin = xScale.min
  const visibleMax = xScale.max

  let totalVolume = 0

  // Sum up volume for all visible data points
  dataset.data.forEach((dataPoint: unknown) => {
    if (dataPoint && typeof dataPoint === 'object' && 'x' in dataPoint && 'y' in dataPoint) {
      const x = (dataPoint as { x: number }).x

      if (x >= visibleMin && x <= visibleMax && (dataPoint as { y: number }).y) {
        totalVolume += (dataPoint as { y: number }).y
      }
    }
  })

  return totalVolume
}

const volumeTextPlugin: VolumeTextPlugin = {
  id: 'volumeTextPlugin',
  afterDraw(chart) {
    const ctx = chart.ctx
    const chartArea = chart.chartArea

    if (!chartArea) return

    ctx.save()

    // Calculate total volume
    const totalVolume = calculateTotalVolume(chart)
    const volumeText = `거래량 ${formatVolumeNumber(totalVolume)}`

    // Set font and style
    ctx.font = FONT
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
