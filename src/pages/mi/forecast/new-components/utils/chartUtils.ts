import { Chart, ChartTypeRegistry } from 'chart.js'
import dayjs from 'dayjs'

import { ChartRange } from '@/types/dataDetailChart'
import { getCurrentFontFamily } from '@/utils/font'

export const getFormattedDateFromChart = (chart: Chart, index: number, format?: string): string => {
  const dateLabel = chart.scales.x.getLabelForValue(index)
  return dayjs(Number(dateLabel)).format(format ?? 'MM/DD')
}

export const getDatasetMetaData = <T extends keyof ChartTypeRegistry>(chart: Chart<T>, label: string) => {
  const { datasets } = chart.data

  const targetIndex = datasets.findIndex((dataset) => dataset.label === label)

  if (targetIndex === -1) return null

  return chart.getDatasetMeta(targetIndex)
}

export const getDatasetBorderColor = <T extends keyof ChartTypeRegistry>(chart: Chart<T>, label: string) => {
  const { datasets } = chart.data

  return datasets.find((dataset) => dataset.label === label)?.borderColor
}

export const generateYAxis = (params: {
  unit: string
  position: 'left' | 'right'
  isMain?: boolean
  label?: string
  borderColor?: string
  color?: string
  scaleTop?: number
  scaleBottom?: number
  isVirtual?: boolean
  axisWidth?: number
  padding?: number
  maxTicksLimit?: number
  toFixed?: number
}) => ({
  unit: params.unit,
  display: !params.isVirtual,
  title: {
    display: false,
    text: params.label ?? '',
  },
  afterFit(axis: { width: number }) {
    axis.width = params.isVirtual ? 2 : (params.axisWidth ?? 67)
  },
  position: params.position ?? 'right',
  grid: {
    display: !params.isVirtual,
    color: params.isMain ? '#B5B5B5' : 'transparent',
    borderDash: [1, 2],
    drawTicks: false,
    drawOnChartArea: true,
    drawBorder: false,
  },
  border: {
    display: !params.isVirtual,
    dash: params.isVirtual ? [] : [2, 2],
    color: params.borderColor ?? '#2E3F5E',
    width: params.isVirtual ? 2 : undefined,
  },
  ticks: {
    display: !params.isVirtual,
    padding: params.padding ?? 12,
    color: params.isMain ? '#2E3F5E' : params.color,
    font: {
      size: 14,
      family: getCurrentFontFamily(),
      weight: 'normal' as const,
    },
    beginAtZero: true,
    maxTicksLimit: params.maxTicksLimit ?? 16,
    callback(tickValue: string | number, index: number, ticks: unknown[]) {
      if (index === 0 || index === ticks.length - 1) return ''
      const value = Number(tickValue)
      if (params.toFixed !== undefined) {
        return Number(value.toFixed(params.toFixed)).toLocaleString('ko-KR', {
          minimumFractionDigits: params.toFixed,
          maximumFractionDigits: params.toFixed,
        })
      }
      return value.toLocaleString()
    },
  },
  afterDataLimits(scale: { min: number; max: number }) {
    if (params.isVirtual) return

    const range = scale.max - scale.min
    const topPadding = params.scaleTop ?? 0.1
    const bottomPadding = params.scaleBottom ?? 0.1
    scale.min = scale.min - range * bottomPadding
    scale.max = scale.max + range * topPadding
  },
  isVirtual: params.isVirtual,
  borderColor: params.borderColor,
  color: params.color,
})

export const getWeekOfMonth = (date: dayjs.Dayjs) => {
  const firstDay = date.startOf('month')
  const offset = firstDay.day()
  return Math.ceil((date.date() + offset) / 7)
}

export const getChartLabel = (date: dayjs.Dayjs, range?: ChartRange): string => {
  if (!range) return date.format('YY-MM-DD')

  switch (range) {
    case ChartRange.WEEK:
    case ChartRange.MONTH:
      return date.format('YY-MM-DD')
    case ChartRange.THREE_MONTHS:
    case ChartRange.SIX_MONTHS:
    case ChartRange.YEAR:
    case ChartRange.TWO_YEARS:
      return date.format('YY-MM')
    case ChartRange.CUSTOM:
    default:
      return date.format('YY-MM-DD')
  }
}
