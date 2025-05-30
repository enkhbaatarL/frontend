import { Chart } from 'chart.js'
import dayjs from 'dayjs'

export const getFormattedDateFromChart = (chart: Chart, index: number, format?: string): string => {
  const dateLabel = chart.scales.x.getLabelForValue(index)
  return dayjs(Number(dateLabel)).format(format ?? 'YYYY-MM-DD')
}

export const getDatasetMetaData = (chart: Chart<'line'>, label: string) => {
  const { datasets } = chart.data

  const targetIndex = datasets.findIndex((dataset) => dataset.label === label)

  if (targetIndex === -1) return null

  return chart.getDatasetMeta(targetIndex)
}

export const getDatasetBorderColor = (chart: Chart<'line'>, label: string) => {
  const { datasets } = chart.data

  return datasets.find((dataset) => dataset.label === label)?.borderColor
}

export const generateYAxis = (params: {
  unit: string
  position: 'left' | 'right'
  isMain?: boolean
  label?: string
  borderColor?: string
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
    color: params.isMain ? '#2E3F5E' : '#868E96',
    font: {
      size: 14,
      family: 'Pretendard,sans-serif',
      weight: 'normal' as const,
    },
    stepSize: 1,
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

export const getChartLabel = (date: dayjs.Dayjs, interval: 'day' | 'week' | 'month' | 'year'): string => {
  switch (interval) {
    case 'day':
      return date.format('D일')
    case 'week': {
      const week = getWeekOfMonth(date)
      return `${date.format('M월')} ${week}주차`
    }
    case 'month':
      return date.format('M월')
    case 'year':
      return date.format('YYYY년')
    default:
      return date.format()
  }
}
