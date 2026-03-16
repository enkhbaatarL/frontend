import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography, Tooltip, TypographyProps } from '@mui/material'
import { Chart, ChartArea, ChartDataset, Point, ScriptableContext, TimeScale } from 'chart.js'
import dayjs from 'dayjs'
import { FC, Fragment, memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import '@/lib/chart/adapterDayjs'
import MIChip from '@/components/common/chip/MIChip'
import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { ICompareGraph, IMarketData } from '@/service/mi/marketData'
import { formatValue } from '@/utils/number'

Chart.register(TimeScale)

interface MarketDataChartProps {
  data?: IMarketData
  size?: 'large' | 'small'
  locked?: boolean
}

interface LabelInfo {
  x: number
  y: number
  text: string
  color: string
  isMain: boolean
  isMin: boolean
  datasetIndex: number
  pointIndex: number
}

interface LabelPosition extends LabelInfo {
  textWidth: number
  adjustedX: number
  adjustedY: number
  finalX: number
  finalY: number
}

const COMPARE_COLORS = ['#EF6B35', '#9B59B6', '#3498DB', '#1ABC9C', '#F39C12', '#E74C3C', '#2ECC71', '#F1C40F']
const MAIN_COLOR = '#40597A'
const MAIN_MARKER_COLOR = '#2E3F5E'
const LABEL_FONT = '600 14px Pretendard, sans-serif'
const LABEL_SPACING = 16

let cachedLabelTextHeight: number | null = null

const getLabelTextHeight = (ctx: CanvasRenderingContext2D): number => {
  if (cachedLabelTextHeight !== null) {
    return cachedLabelTextHeight
  }

  ctx.save()
  ctx.font = LABEL_FONT
  const metrics = ctx.measureText('123.45')

  let height: number
  const metricsWithExtended = metrics as TextMetrics & {
    actualBoundingBoxAscent?: number
    actualBoundingBoxDescent?: number
    fontBoundingBoxAscent?: number
    fontBoundingBoxDescent?: number
  }
  if (metricsWithExtended.actualBoundingBoxAscent !== undefined && metricsWithExtended.actualBoundingBoxDescent !== undefined) {
    height = metricsWithExtended.actualBoundingBoxAscent + metricsWithExtended.actualBoundingBoxDescent
  } else if (metricsWithExtended.fontBoundingBoxAscent !== undefined && metricsWithExtended.fontBoundingBoxDescent !== undefined) {
    height = metricsWithExtended.fontBoundingBoxAscent + metricsWithExtended.fontBoundingBoxDescent
  } else {
    height = 14 * 1.2
  }

  ctx.restore()
  cachedLabelTextHeight = height
  return height
}
const DATE_FONT = '400 12px Pretendard'
const DATE_COLOR = '#868E96'
const DATE_BOTTOM_OFFSET = 10
const DATE_HORIZONTAL_OFFSET = 67

const DUMMY_META_DATA = {
  lastValue: 54.32,
  dodChangeRate: -10,
  wowChangeRate: -12.3,
  momChangeRate: 45.6,
  yoyChangeRate: -78.9,
  changeRates: [
    { label: 'DoD', value: 0 },
    { label: 'WoW', value: 0 },
  ],
}

const DUMMY_CHART_DATA = {
  mainChart: [35, 27, 43, 39, 37, 25, 31, 29, 21, 24, 35, 27],
  compareCharts: [37, 23, 28, 20, 31, 31, 34, 30, 22, 26, 45, 48],
}

const TruncatedTextWithTooltip = ({ text, ...typographyProps }: { text: string } & TypographyProps) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (element) {
      setIsOverflowing(element.scrollWidth > element.clientWidth)
    }
  }, [text])

  const typography = (
    <Typography ref={textRef} {...typographyProps}>
      {text}
    </Typography>
  )

  return isOverflowing ? (
    <Tooltip title={text} arrow>
      {typography}
    </Tooltip>
  ) : (
    typography
  )
}

const LockedOverlay = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    position="absolute"
    sx={{
      inset: '0px -3px',
      margin: '-3px -3px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      color: '#868E96',
    }}
  >
    <LockOutlinedIcon />
  </Box>
)

const getChangeRateChip = (changeRate: number) => {
  if (changeRate === null || changeRate === undefined) {
    return <MIChip size="h24" color="gray" label="-" />
  }

  if (changeRate === 0) {
    return <MIChip size="h24" color="gray" label="0%" />
  }

  const isPositive = changeRate >= 0
  const label = `${isPositive ? '+' : ''}${changeRate}%`

  return <MIChip size="h24" color={isPositive ? 'green-climb' : 'red-decline'} label={label} />
}

const getMinMax = (values: number[]) => {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let minIdx = -1
  let maxIdx = -1

  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (value < min) {
      min = value
      minIdx = index
    }
    if (value > max) {
      max = value
      maxIdx = index
    }
  }

  return { min, max, minIdx, maxIdx }
}

const createGradientCache = () => {
  let cachedGradient: CanvasGradient | null = null
  let cachedWidth = 0
  let cachedHeight = 0

  return (ctx: CanvasRenderingContext2D, area: { top: number; bottom: number; left: number; right: number }) => {
    const width = area.right - area.left
    const height = area.bottom - area.top

    if (!cachedGradient || cachedWidth !== width || cachedHeight !== height) {
      const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom)
      gradient.addColorStop(0, 'rgba(53, 136, 200, 0.1)')
      gradient.addColorStop(0.7, 'rgba(53, 136, 200, 0.05)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      cachedGradient = gradient
      cachedWidth = width
      cachedHeight = height
    }

    return cachedGradient
  }
}

type LineChart = Chart<'line', number[], string | number>

const createEdgeLabelsPlugin = () => ({
  id: 'edgeLabels',
  afterDraw(chart: LineChart) {
    const { ctx, scales, chartArea, height } = chart
    const { left, right } = chartArea
    const xScale = scales.x

    const leftText = dayjs(xScale.min).format('YYYY-MM-DD')
    const rightText = dayjs(xScale.max).format('YYYY-MM-DD')
    const dateY = height - DATE_BOTTOM_OFFSET

    ctx.save()
    ctx.font = DATE_FONT
    ctx.fillStyle = DATE_COLOR
    ctx.textBaseline = 'top'

    const leftPadding = 8
    const rightPadding = 8

    ctx.textAlign = 'right'
    ctx.fillText(leftText, left + DATE_HORIZONTAL_OFFSET - 15 + leftPadding, dateY)

    ctx.textAlign = 'left'
    ctx.fillText(rightText, right - DATE_HORIZONTAL_OFFSET + 15 - rightPadding, dateY)

    ctx.restore()
  },
})

interface MinMaxInfo {
  min: number
  max: number
  minIdx: number
  maxIdx: number
  color?: string
}

interface ExtendedPoint extends Point {
  tooltipPosition?: (useFinalPosition?: boolean) => Point
}

interface ChartMetaWithPoints {
  data: ExtendedPoint[]
}

const collectLabelsFromDataset = (
  meta: ChartMetaWithPoints,
  info: MinMaxInfo,
  color: string,
  isMain: boolean,
  allLabels: LabelInfo[],
  datasetIndex: number,
) => {
  const collectOne = (index: number, value: number | string | null, isMin: boolean) => {
    const element = meta.data[index]
    if (!element) return

    const finalPosition = typeof element.tooltipPosition === 'function' ? element.tooltipPosition(true) : { x: element.x, y: element.y }

    const x = finalPosition.x ?? element.x ?? 0
    const y = finalPosition.y ?? element.y ?? 0

    const numValue = typeof value === 'string' ? Number.parseFloat(value) : value
    if (!Number.isFinite(x) || !Number.isFinite(y) || numValue === null || numValue === undefined || !Number.isFinite(numValue)) return

    const formattedValue = Number.isFinite(numValue) ? formatValue(numValue, '', 'en-US', 2) : String(numValue)

    allLabels.push({
      x,
      y,
      text: formattedValue,
      color,
      isMain,
      isMin,
      datasetIndex,
      pointIndex: index,
    })
  }

  if (info.min === info.max && info.minIdx === info.maxIdx) {
    collectOne(info.minIdx, info.min, true)
  } else {
    collectOne(info.minIdx, info.min, true)
    collectOne(info.maxIdx, info.max, false)
  }
}

interface ExtendedDataset extends ChartDataset<'line', number[]> {
  type: 'line'
  label: string
  _minMaxInfo?: MinMaxInfo
}

const collectMinMaxLabels = (chart: LineChart, allLabels: LabelInfo[]) => {
  const datasets = chart.data.datasets as ExtendedDataset[]
  const mainDatasetIndex = datasets.findIndex((d) => d.label === 'MinMaxMarkers')

  if (mainDatasetIndex >= 0) {
    const dataset = datasets[mainDatasetIndex]
    const info = dataset._minMaxInfo
    if (info) {
      const meta = chart.getDatasetMeta(mainDatasetIndex) as unknown as ChartMetaWithPoints
      collectLabelsFromDataset(meta, info, info.color ?? MAIN_MARKER_COLOR, true, allLabels, mainDatasetIndex)
    }
  }

  const compareDatasetIndices = datasets
    .map((d, index) => (d.label?.includes('MinMaxMarkers') && d.label !== 'MinMaxMarkers' ? index : -1))
    .filter((index) => index >= 0)

  for (const datasetIndex of compareDatasetIndices) {
    const dataset = datasets[datasetIndex]
    const info = dataset._minMaxInfo
    if (info) {
      const meta = chart.getDatasetMeta(datasetIndex) as unknown as ChartMetaWithPoints
      const color = info.color ?? COMPARE_COLORS[0]
      collectLabelsFromDataset(meta, info, color, false, allLabels, datasetIndex)
    }
  }
}

const calculateInitialPositions = (ctx: CanvasRenderingContext2D, labels: LabelInfo[], chart: LineChart): LabelPosition[] => {
  const { chartArea, height } = chart
  const dateTop = height - DATE_BOTTOM_OFFSET
  const maxLabelBottom = dateTop - 5

  const labelTextHeight = getLabelTextHeight(ctx)
  const estimatedTopPadding = Math.max(30, labels.filter((l) => !l.isMin).length * LABEL_SPACING + 15)

  const sortedLabels = [...labels].sort((a, b) => {
    if (a.isMin !== b.isMin) {
      return a.isMin ? 1 : -1
    }
    if (a.isMain !== b.isMain) {
      return a.isMain ? -1 : 1
    }
    return 0
  })

  return sortedLabels.map((label) => {
    const textWidth = ctx.measureText(label.text).width

    const sameTypeLabels = sortedLabels.filter((l) => l.isMin === label.isMin)
    const offsetFromGraph = sameTypeLabels.indexOf(label)

    let finalY: number
    if (label.isMin) {
      const maxY = maxLabelBottom - labelTextHeight / 2
      finalY = Math.min(label.y + 15 + offsetFromGraph * LABEL_SPACING, maxY)
    } else {
      finalY = Math.max(label.y - 15 - offsetFromGraph * LABEL_SPACING, chartArea.top - estimatedTopPadding + labelTextHeight / 2)
    }

    return {
      ...label,
      textWidth,
      adjustedX: label.x,
      adjustedY: finalY,
      finalX: label.x,
      finalY: label.y,
    }
  })
}

const checkTextOverlap = (label1: LabelPosition, label2: LabelPosition): boolean => {
  const padding = 5
  const label1Left = label1.adjustedX - label1.textWidth / 2
  const label1Right = label1.adjustedX + label1.textWidth / 2
  const label2Left = label2.adjustedX - label2.textWidth / 2
  const label2Right = label2.adjustedX + label2.textWidth / 2

  return label1Left < label2Right + padding && label1Right + padding > label2Left
}

const groupLabelsByTextOverlap = (labels: LabelPosition[]): LabelPosition[][] => {
  const groups: LabelPosition[][] = []
  const processed = new Set<LabelPosition>()

  for (const label of labels) {
    if (processed.has(label)) continue

    const group: LabelPosition[] = [label]
    processed.add(label)

    let found = true
    while (found) {
      found = false
      for (const otherLabel of labels) {
        if (processed.has(otherLabel)) continue

        const overlaps = group.some((groupLabel) => checkTextOverlap(groupLabel, otherLabel))
        if (overlaps) {
          group.push(otherLabel)
          processed.add(otherLabel)
          found = true
        }
      }
    }

    groups.push(group)
  }

  return groups
}

const resolveLabelCollisions = (positions: LabelPosition[], chart: LineChart): LabelPosition[] => {
  const { ctx, chartArea, height } = chart
  const dateTop = height - DATE_BOTTOM_OFFSET

  const labelTextHeight = getLabelTextHeight(ctx)
  const maxLabelBottom = dateTop - 10
  const estimatedTopPadding = Math.max(30, positions.filter((p) => !p.isMin).length * LABEL_SPACING + 15)

  const minLabels = positions.filter((p) => p.isMin)
  const maxLabels = positions.filter((p) => !p.isMin)

  if (minLabels.length > 0) {
    const textOverlapGroups = groupLabelsByTextOverlap(minLabels)

    for (const group of textOverlapGroups) {
      group.sort((a, b) => {
        if (a.isMain !== b.isMain) {
          return a.isMain ? -1 : 1
        }
        return a.y - b.y
      })

      const firstLabel = group[0]
      const baseY: number = Math.min(firstLabel.y + 15, maxLabelBottom - labelTextHeight / 2)
      firstLabel.adjustedY = baseY

      const otherLabels = group.slice(1)
      for (let index = 0; index < otherLabels.length; index++) {
        const label = otherLabels[index]
        label.adjustedY = Math.min(baseY + (index + 1) * LABEL_SPACING, maxLabelBottom - labelTextHeight / 2)
      }
    }
  }

  if (maxLabels.length > 0) {
    const textOverlapGroups = groupLabelsByTextOverlap(maxLabels)

    for (const group of textOverlapGroups) {
      group.sort((a, b) => {
        if (a.isMain !== b.isMain) {
          return a.isMain ? -1 : 1
        }
        return b.y - a.y
      })

      const firstLabel = group[0]
      const baseY: number = Math.max(firstLabel.y - 15, chartArea.top - estimatedTopPadding + labelTextHeight / 2)
      firstLabel.adjustedY = baseY

      const otherLabels = group.slice(1)
      for (let index = 0; index < otherLabels.length; index++) {
        const label = otherLabels[index]
        label.adjustedY = Math.max(baseY - (index + 1) * LABEL_SPACING, chartArea.top - estimatedTopPadding + labelTextHeight / 2)
      }
    }
  }

  const minLabelPositions = positions.filter((p) => p.isMin)
  if (minLabelPositions.length > 0) {
    const bottommostLabelY = Math.max(...minLabelPositions.map((p) => p.adjustedY))
    const labelBottomEdge = bottommostLabelY + labelTextHeight / 2
    const safeMaxLabelBottom = dateTop - 10

    if (labelBottomEdge > safeMaxLabelBottom) {
      const adjustment = labelBottomEdge - safeMaxLabelBottom
      for (const label of minLabelPositions) {
        label.adjustedY -= adjustment
      }
    }
  }

  return positions
}

const drawSingleLabel = (
  ctx: CanvasRenderingContext2D,
  label: LabelInfo,
  position: LabelPosition | undefined,
  maxLabelBottom: number,
  chartArea: ChartArea,
  estimatedTopPadding: number,
  labelTextHeight: number,
  chart: LineChart,
) => {
  ctx.save()
  ctx.font = LABEL_FONT
  ctx.fillStyle = label.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  if (!position) {
    let x = label.x
    const textWidth = ctx.measureText(label.text).width
    const halfWidth = textWidth / 2
    const margin = -8

    x = Math.max(chartArea.left + halfWidth + margin, Math.min(x, chartArea.right - halfWidth - margin))

    const y = label.isMin
      ? Math.min(label.y + 10, maxLabelBottom - labelTextHeight / 2)
      : Math.max(label.y - 10, chartArea.top - estimatedTopPadding + labelTextHeight / 2)

    ctx.fillText(label.text, x, y)
    ctx.restore()
    return
  }

  const meta = chart.getDatasetMeta(position.datasetIndex) as unknown as ChartMetaWithPoints
  const element = meta.data[position.pointIndex]
  if (!element) {
    ctx.restore()
    return
  }

  const currentPosition = typeof element.tooltipPosition === 'function' ? element.tooltipPosition(false) : { x: element.x, y: element.y }
  const currentX = currentPosition.x ?? element.x ?? position.finalX
  const currentY = currentPosition.y ?? element.y ?? position.finalY

  const deltaX = currentX - position.finalX
  const deltaY = currentY - position.finalY

  let x = position.adjustedX + deltaX
  const textWidth = ctx.measureText(label.text).width
  const halfWidth = textWidth / 2
  const margin = -8

  x = Math.max(chartArea.left + halfWidth + margin, Math.min(x, chartArea.right - halfWidth - margin))

  const y = position.adjustedY + deltaY

  ctx.fillText(label.text, x, y)
  ctx.restore()
}

const createMinMaxLabelPlugin = () => ({
  id: 'minMaxLabel',
  afterDatasetsDraw(chart: LineChart) {
    const { ctx, chartArea, height } = chart
    const allLabels: LabelInfo[] = []

    collectMinMaxLabels(chart, allLabels)

    if (allLabels.length === 0) return

    ctx.save()
    ctx.font = LABEL_FONT

    const dateTop = height - DATE_BOTTOM_OFFSET
    const labelTextHeight = getLabelTextHeight(ctx)
    const maxLabelBottom = dateTop - 10
    const estimatedTopPadding = Math.max(20, allLabels.filter((l) => !l.isMin).length * LABEL_SPACING + 10)

    const labelPositions = calculateInitialPositions(ctx, allLabels, chart)
    const resolvedPositions = resolveLabelCollisions(labelPositions, chart)

    for (const position of resolvedPositions) {
      drawSingleLabel(ctx, position, position, maxLabelBottom, chartArea, estimatedTopPadding, labelTextHeight, chart)
    }

    ctx.restore()
  },
})

const createMainDataset = (mainData: number[], getGradient: ReturnType<typeof createGradientCache>): ExtendedDataset[] => {
  const { min, max, minIdx, maxIdx } = getMinMax(mainData)

  return [
    {
      type: 'line' as const,
      label: 'Main',
      data: mainData,
      borderColor: MAIN_COLOR,
      backgroundColor: (context: ScriptableContext<'line'>) => {
        const chart = context.chart as LineChart
        const { ctx, chartArea } = chart
        if (!chartArea) return 'transparent'
        return getGradient(ctx, chartArea)
      },
      tension: 0,
      fill: true,
      borderWidth: 1,
      spanGaps: true,
    },
    {
      type: 'line' as const,
      label: 'MinMaxMarkers',
      data: mainData.map((value, index) => (index === minIdx || index === maxIdx ? value : Number.NaN)),
      borderColor: 'transparent',
      backgroundColor: MAIN_COLOR,
      pointRadius: (ctx: ScriptableContext<'line'>) => {
        const index = ctx.dataIndex
        return index === minIdx || index === maxIdx ? 3 : 0
      },
      pointHoverRadius: 4.5,
      pointBackgroundColor: MAIN_MARKER_COLOR,
      showLine: false,
      _minMaxInfo: { min, max, minIdx, maxIdx, color: MAIN_MARKER_COLOR },
    },
  ]
}

const createCompareDatasets = (compareCharts: ICompareGraph[]): ExtendedDataset[] => {
  const datasets: ExtendedDataset[] = []

  for (let index = 0; index < compareCharts.length; index++) {
    const compareChart = compareCharts[index]
    if (!compareChart.rawData) continue

    const compareData = compareChart.rawData.map((point) => point.value)
    const { min, max, minIdx, maxIdx } = getMinMax(compareData)
    const color = COMPARE_COLORS[index % COMPARE_COLORS.length]

    datasets.push({
      type: 'line' as const,
      label: compareChart.specificIndicatorName || `Compare ${index + 1}`,
      data: compareData,
      borderColor: color,
      backgroundColor: () => 'transparent',
      tension: 0,
      fill: false,
      borderWidth: 1,
      spanGaps: true,
    })

    const realMin: number = compareChart.rawData[minIdx]?.real ?? min
    const realMax: number = compareChart.rawData[maxIdx]?.real ?? max

    datasets.push({
      type: 'line' as const,
      label: `Compare ${index + 1} MinMaxMarkers`,
      data: compareData.map((value: number, i: number) => (i === minIdx || i === maxIdx ? value : Number.NaN)),
      borderColor: 'transparent',
      backgroundColor: color,
      pointRadius: (ctx: ScriptableContext<'line'>) => {
        const i = ctx.dataIndex
        return i === minIdx || i === maxIdx ? 3 : 0
      },
      pointHoverRadius: 4.5,
      pointBackgroundColor: color,
      showLine: false,
      _minMaxInfo: { min: realMin, max: realMax, minIdx, maxIdx, color },
    })
  }

  return datasets
}

const SimpleLineChart: FC<{ data?: IMarketData }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'line', number[], string | number> | null>(null)
  const getGradient = createGradientCache()

  const generateChartData = useCallback(() => {
    if (!data?.mainChart?.rawData) {
      return {
        labels: [],
        datasets: [
          {
            label: 'Main',
            data: [],
            borderColor: MAIN_COLOR,
            backgroundColor: MAIN_COLOR,
            tension: 0,
            fill: false,
            borderWidth: 1,
            spanGaps: true,
          },
        ],
      }
    }

    const mainData = data.mainChart.rawData.map((point) => point.value)
    const labels = data.mainChart.rawData.map((point) => point.date)

    const datasets = createMainDataset(mainData, getGradient)

    if (data.compareCharts && data.compareCharts.length > 0) {
      datasets.push(...createCompareDatasets(data.compareCharts))
    }

    return { labels, datasets }
  }, [data, getGradient])

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    if (!chartRef.current) return undefined

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return undefined

    const chartData = generateChartData()
    const compareChartCount = data?.compareCharts?.length || 0
    const maxLabelCount = 1 + compareChartCount
    const minLabelCount = 1 + compareChartCount

    const needsTopPadding = maxLabelCount > 1
    const topPadding = needsTopPadding ? Math.max(16, maxLabelCount * (LABEL_SPACING * 0.8) + 16) : LABEL_SPACING

    let bottomPadding: number
    if (minLabelCount <= 1) {
      bottomPadding = DATE_BOTTOM_OFFSET + 10
    } else {
      const labelSpacing = LABEL_SPACING / 2
      bottomPadding = DATE_BOTTOM_OFFSET + (minLabelCount - 1) * labelSpacing + 6
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: topPadding,
            bottom: bottomPadding,
            left: 20,
            right: 20,
          },
        },
        elements: {
          point: {
            radius: 0,
          },
        },
        plugins: {
          tooltip: {
            enabled: false,
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            grace: '10%',
            display: false,
            title: {
              display: false,
            },
            grid: {
              display: false,
            },
            afterDataLimits(scale: { min: number; max: number }) {
              const range = scale.max - scale.min
              const labelTotalCount = maxLabelCount + minLabelCount
              const paddingRatio = labelTotalCount <= 2 ? 0.05 : Math.max(0.1, labelTotalCount * 0.03)
              const scaleTopPadding = range * paddingRatio
              const scaleBottomPadding = range * paddingRatio
              scale.min = scale.min - scaleBottomPadding
              scale.max = scale.max + scaleTopPadding
            },
          },
          x: {
            type: 'time',
            display: true,
            title: {
              display: false,
            },
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              display: false,
            },
          },
        },
      },
      plugins: [createMinMaxLabelPlugin(), createEdgeLabelsPlugin()],
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, generateChartData])

  return <canvas ref={chartRef} style={{ maxWidth: '100%', marginLeft: '5px', marginRight: '5px' }} />
}

const extractUnitFromTitle = (title: string) => {
  const match = /\(([^)]+)\)$/.exec(title)
  return match ? match[1] : null
}

const createDummyDisplayData = () => ({
  mainChart: {
    specificIndicatorName: 'CURRENT',
    rawData: DUMMY_CHART_DATA.mainChart.map((value, index) => ({
      date: String(index),
      value,
    })),
  },
  compareCharts: [
    {
      specificIndicatorName: 'PAST_5Y_AVG',
      rawData: DUMMY_CHART_DATA.compareCharts.map((value, index) => ({
        date: String(index),
        value,
      })),
    },
  ],
  isPermitted: false,
  marketMetaData: {
    chartMarkRank: 0,
    goodsNo: 0,
    goodsDataNo: 0,
    goodsDataSourceNo: 0,
    goodsDataNm: '',
    goodsDataSourceNm: '',
    currency: '',
    currentUnitCd: '',
    visibleChartType: '',
    interval: '',
    lastUpdateDt: '',
    indexStartDt: '',
    lastValue: 0,
    yoyChangeRate: 0,
    momChangeRate: 0,
    wowChangeRate: 0,
    dodChangeRate: 0,
    changeRates: [
      { label: 'DoD', value: 0 },
      { label: 'WoW', value: 0 },
    ],
  },
})

const MarketDataChart: FC<MarketDataChartProps> = ({ data, size = 'large', locked }) => {
  const navigate = useNavigate()

  if (!data?.marketMetaData) {
    return null
  }

  const metaData = locked ? { ...data.marketMetaData, ...DUMMY_META_DATA } : data.marketMetaData
  const titleWithoutUnit = metaData.goodsDataNm?.replace(/\s*\([^)]+\)$/, '') || ''
  const extractedUnit = extractUnitFromTitle(metaData.goodsDataNm || '')
  const displayData = locked ? createDummyDisplayData() : data

  return (
    <Box
      borderRadius={1}
      sx={{
        padding: '25px 10px',
        borderRadius: '4px',
        border: '1px solid',
        borderColor: '#E9ECEF',
        backgroundColor: '#FFFFFF',
        transition: '0.3s',
        cursor: locked ? 'default' : 'pointer',
        userSelect: locked ? 'none' : undefined,
        '&:hover': locked
          ? undefined
          : {
            borderColor: '#2E3F5E',
            backgroundColor: '#F8F9FA',
          },
      }}
      onClick={() =>
        !locked &&
        navigate(`/mi/data-detail/${data?.marketMetaData?.goodsNo}/${data?.marketMetaData?.goodsDataNo}`, {
          state: { goodsDataSrcNo: data?.marketMetaData?.goodsDataSourceNo },
        })
      }
    >
      <Box
        color="gray.90"
        mb={size === 'large' ? 5 : 2.5}
        component="h4"
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, overflow: 'hidden', paddingLeft: '15px' }}>
          <TruncatedTextWithTooltip
            text={titleWithoutUnit}
            component="span"
            variant="infoDocument"
            color="gray.90"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flexShrink: 1,
              marginRight: '4px',
            }}
          />
          {extractedUnit && (
            <Typography
              component="span"
              variant="infoDocument"
              color="gray.90"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0, marginRight: '4px' }}
            >
              ({extractedUnit})
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: 'gray.60', minWidth: '24px', ml: '8px', paddingRight: '15px' }} />
      </Box>
      {size === 'large' && (
        <Box position={'relative'}>
          <Box display={'flex'} flexDirection={'column'}>
            <Box
              display={'flex'}
              alignItems={'center'}
              sx={{
                filter: locked ? 'blur(6px)' : 'none',
                minHeight: '33.6px',
                paddingLeft: '15px',
                paddingRight: '15px',
              }}
            >
              <Typography sx={{ fontWeight: 600 }} color="gray.90" component="div" variant="heading2">
                {Number.isFinite(metaData.lastValue) ? formatValue(metaData.lastValue, '', 'en-US', 2) : metaData.lastValue || ''}
              </Typography>

              <Box display={'flex'} alignContent={'center'} sx={{ ml: 'auto', mt: '3px' }} gap={3}>
                {(metaData.changeRates ?? []).length > 0 ? (
                  (metaData.changeRates ?? []).map(({ label, value }, index) => (
                    <Fragment key={index}>
                      {index !== 0 && (
                        <Box sx={{ mt: '3px' }}>
                          <MILine thickness="1px" direction="vertical" length={18} />
                        </Box>
                      )}
                      <Typography color="gray.70" component="div" variant="body1M16">
                        {label}
                      </Typography>
                      {getChangeRateChip(value)}
                    </Fragment>
                  ))
                ) : (
                  <Box sx={{ width: '120px', height: '10px' }} />
                )}
              </Box>
            </Box>
            <Box mt={3} height={188} sx={{ overflow: 'visible', filter: locked ? 'blur(6px)' : 'none', position: 'relative' }}>
              {displayData.compareCharts && displayData.compareCharts.length > 0 && (
                <Box
                  mt={-0.5}
                  display="flex"
                  justifyContent="center"
                  flexWrap="wrap"
                  gap={3}
                  sx={{
                    filter: locked ? 'blur(6px)' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  {displayData.mainChart && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        width={12}
                        height={2}
                        sx={{
                          backgroundColor: MAIN_COLOR,
                          borderRadius: '1px',
                        }}
                      />
                      <Typography variant="body3R12" color="gray.70">
                        {displayData.mainChart.specificIndicatorName || 'Main'}
                      </Typography>
                    </Box>
                  )}
                  {displayData.compareCharts?.map((chart, index) => {
                    const color = COMPARE_COLORS[index % COMPARE_COLORS.length]
                    return (
                      <Box key={index} display="flex" alignItems="center" gap={1}>
                        <Box
                          width={12}
                          height={2}
                          sx={{
                            backgroundColor: color,
                            borderRadius: '1px',
                            backgroundImage: `repeating-linear-gradient(90deg, ${color}, ${color} 5px, transparent 5px, transparent 10px)`,
                          }}
                        />
                        <Typography variant="body3R12" color="gray.70">
                          {chart.specificIndicatorName || `Compare ${index + 1}`}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              )}
              <SimpleLineChart data={displayData} />
            </Box>
          </Box>
          {locked && <LockedOverlay />}
        </Box>
      )}
    </Box>
  )
}

export default memo(MarketDataChart)
