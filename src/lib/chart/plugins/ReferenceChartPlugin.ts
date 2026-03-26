import { Plugin } from 'chart.js'

import {
  drawMarketHoursBackground,
  drawXAxisGrid,
  drawXAxisLabels,
  drawYAxisGrid,
  drawYAxisLabelsReference,
} from '@/lib/chart/plugins/chartPluginSharedDrawing'

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

const ReferenceChartPlugin: Plugin = {
  id: 'ReferenceChartPlugin',
  beforeDraw(chart, _args, options) {
    const { ctx, chartArea } = chart

    if (!chartArea) return

    ctx.save()

    const pluginOptions = options as ReferencePluginOptions

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

    if (pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisGrid(ctx, chartArea, xScale, pluginOptions.timestamps, false, 'adaptive')
      }
    }

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

    const pluginOptions = options as ReferencePluginOptions

    if (!pluginOptions.hideXAxisLabel && pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisLabels(ctx, chartArea, xScale, pluginOptions.timestamps)
      }
    }

    if (!pluginOptions.hideYAxisLabel && pluginOptions?.timestamps && pluginOptions.timestamps.length > 0) {
      const xScale = chart.scales.x
      if (xScale) {
        drawXAxisGrid(ctx, chartArea, xScale, pluginOptions.timestamps, true, 'adaptive')
      }
    }

    const yScale = chart.scales.y
    if (yScale) {
      const yAxisStep = pluginOptions.yAxisStep ?? 1
      drawYAxisLabelsReference(ctx, chartArea, yScale, yAxisStep, false, pluginOptions.seriesTicks, 0)
    }

    if (pluginOptions.subYAxes) {
      Object.keys(pluginOptions.subYAxes).forEach((axisId) => {
        const subYScale = chart.scales[axisId]
        if (subYScale && !pluginOptions.subYAxes?.[axisId]?.isVirtual) {
          const yAxisStep = pluginOptions.yAxisStep ?? 1
          const seriesIndex = axisId.startsWith('sub-') ? Number.parseInt(axisId.replace('sub-', '')) : undefined
          drawYAxisLabelsReference(ctx, chartArea, subYScale, yAxisStep, true, pluginOptions.seriesTicks, seriesIndex)
        }
      })
    }

    ctx.restore()
  },
}

export default ReferenceChartPlugin
