import { Chart, ChartTypeRegistry } from 'chart.js'
import dayjs from 'dayjs'

import { ChartRange } from '@/types/dataDetailChart'

export const getFormattedDateFromChart = (chart: Chart, index: number, format?: string): string => {
  const dateLabel = chart.scales.x.getLabelForValue(index)
  return dayjs(Number(dateLabel)).format(format ?? 'YYYY-MM-DD')
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
}) => ({
  unit: params.unit,
  title: {
    display: false,
    text: params.label ?? '',
  },
  afterFit(axis: { width: number }) {
    axis.width = Math.max(67, axis.width)
  },
  position: params.position ?? 'right',
  grid: {
    color: params.isMain ? '#DEE2E6' : 'transparent',
    drawTicks: false,
  },
  border: {
    dash: [2, 2],
    color: params.borderColor ?? '#2E3F5E',
  },
  ticks: {
    padding: 12,
    color: params.isMain ? '#2E3F5E' : params.color,
    font: {
      size: 14,
      family: 'Pretendard,sans-serif',
      weight: 'normal' as const,
    },
    // stepSize: 1,
    beginAtZero: true,
    maxTicksLimit: 16,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback(tickValue: string | number, index: number, ticks: any[]) {
      if (index === 0 || index === ticks.length - 1) return ''
      return Number(tickValue).toLocaleString()
    },
  },
  afterDataLimits(scale: { min: number; max: number }) {
    const range = scale.max - scale.min
    scale.min = scale.min - range * 0.1
    scale.max = scale.max + range * 0.1
  },
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
