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
    if (params.isVirtual) {
      axis.width = 2
      return
    }

    // tick 라벨 폭을 기반으로 y축 폭을 동적으로 확장한다.
    // (큰 숫자/천단위 콤마/음수 기호 등으로 라벨이 길어질 때 잘림 방지)
    const baseWidth = params.axisWidth ?? 67
    const padding = params.padding ?? 12

    // Chart.js scale 객체에 접근 (타입 단순화)
    const scaleAny = axis as unknown as {
      chart?: { ctx?: CanvasRenderingContext2D }
      ticks?: Array<{ label?: string | string[] }>
    }
    const ctx = scaleAny.chart?.ctx
    const ticks = scaleAny.ticks ?? []

    if (!ctx || ticks.length === 0) {
      axis.width = baseWidth
      return
    }

    // ticks 폰트 설정과 동일한 기준으로 측정
    ctx.save()
    ctx.font = `normal 14px ${getCurrentFontFamily()}`

    let maxLabelWidth = 0
    for (const t of ticks) {
      const label = t.label
      if (label === undefined || label === null) continue
      const text = Array.isArray(label) ? label.join('') : String(label)
      if (!text) continue
      const w = ctx.measureText(text).width
      if (w > maxLabelWidth) maxLabelWidth = w
    }
    ctx.restore()

    // 여유폭(패딩 + 여분)을 포함해서 최소 baseWidth 이상으로 확장
    const extra = 10
    axis.width = Math.max(baseWidth, Math.ceil(maxLabelWidth + padding + extra))
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
