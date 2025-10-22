import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography } from '@mui/material'
import { Chart, LegendItem } from 'chart.js'
import { FC, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { ICompareGraph, IMarketData } from '@/service/mi/marketData'

interface RawPoint {
  date: string
  value: number
}

interface MarketDataCustomChartProps {
  data?: IMarketData
  locked?: boolean
  onClick?: () => void
}

const LockedOverlay = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    position="absolute"
    margin="-3px -6px"
    sx={{ inset: '0px -6px', backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#868E96' }}
  >
    <LockOutlinedIcon />
  </Box>
)
const mainChartLabel = 'Current'
const compareChartLabel = '5Yr Avg'

// ─────────────────────────────────────────────────────────────
// 더미 데이터 유틸
// ─────────────────────────────────────────────────────────────
const makeMonthlyDates = (year = 2024) => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)

const rand = (min: number, max: number) => Math.random() * (max - min) + min

const makeSeriesPoints = (dates: string[], base: number, spread: number): RawPoint[] =>
  dates.map((d) => ({ date: d, value: Math.round((base + rand(-spread, spread)) * 100) / 100 }))

const dates = makeMonthlyDates(2025)

const defaultDummyPayload: IMarketData = {
  compareCharts: [
    {
      specificIndicatorName: '5Yr Avg',
      rawData: makeSeriesPoints(dates, 200, 10),
    },
    {
      specificIndicatorName: 'PAST_5Y_MIN',
      rawData: makeSeriesPoints(dates, 215, 6),
    },
    {
      specificIndicatorName: 'PAST_5Y_MAX',
      rawData: makeSeriesPoints(dates, 245, 6),
    },
  ],
  isPermitted: false,
  mainChart: {
    specificIndicatorName: 'CURRENT',
    rawData: makeSeriesPoints(dates, 230, 12),
  },
}

const colorForKey = (key: string | null) => {
  if (key === 'main') return '#40597A'
  if (key === 'PAST_5Y_AVG') return '#7A8790'
  if (key === 'PAST_5Y_MAX' || key === 'PAST_5Y_MIN') {
    return 'rgba(53, 136, 200, 0.7)'
  }
  return '#6B7280'
}

const dashForKey = (key: string | null): number[] | undefined => {
  if (key === 'PAST_5Y_AVG') return [4, 2]
  return undefined
}

const labelForKey = (key?: string | null, fallback?: string) => {
  if (key === 'PAST_5Y_AVG') return fallback ?? '5Yr Avg'
  if (key === 'PAST_5Y_MAX') return fallback ?? 'Bollinger Upper'
  if (key === 'PAST_5Y_MIN') return fallback ?? 'Bollinger Lower'
  return fallback ?? key ?? ''
}

const buildChartData = (data: IMarketData) => {
  const rawData = data.mainChart?.rawData ?? []
  const compareData = data.compareCharts ?? []

  const allDates: string[] = [...rawData.map((p) => p.date), ...compareData.flatMap((s) => s.rawData.map((p) => p.date))]
  const labels = Array.from(new Set(allDates)).sort()

  const mapPoints = (points: RawPoint[]) => {
    const m = new Map(points.map((p) => [p.date, p.value]))
    return labels.map((d) => m.get(d) ?? null)
  }

  const baseDataset = {
    label: mainChartLabel,
    data: mapPoints(rawData),
    borderColor: colorForKey('main'),
    borderWidth: 2,
    tension: 0.3,
    fill: false as const,
    pointRadius: 0,
    spanGaps: false,
  }

  const compareCharts: ICompareGraph[] = data.compareCharts ?? []
  const sortedCompare: ICompareGraph[] = compareCharts.slice().sort((a, b) => {
    const order = (k: string | null): number => {
      switch (k) {
        case 'PAST_5Y_MIN':
          return 0
        case 'PAST_5Y_MAX':
          return 1
        case 'PAST_5Y_AVG':
          return 2
        default:
          return 3
      }
    }
    return order(a.specificIndicatorName) - order(b.specificIndicatorName)
  })

  const compareDatasets = sortedCompare.map((series) => {
    const isBollingerUpper = series.specificIndicatorName === 'PAST_5Y_MAX'
    const isBollingerDown = series.specificIndicatorName === 'PAST_5Y_MIN'
    const isBollingerMiddle = series.specificIndicatorName === 'PAST_5Y_AVG'
    const isBollinger = isBollingerUpper || isBollingerDown || isBollingerMiddle

    const ds = {
      label: labelForKey(
        series.specificIndicatorName,
        series.specificIndicatorName === 'PAST_5Y_AVG'
          ? compareChartLabel
          : series.specificIndicatorName === 'PAST_5Y_MAX'
            ? 'Bollinger Upper'
            : series.specificIndicatorName === 'PAST_5Y_MIN'
              ? 'Bollinger Lower'
              : (series.specificIndicatorName ?? ''),
      ),
      data: mapPoints(series.rawData),
      borderColor: colorForKey(series.specificIndicatorName),
      borderWidth: isBollinger ? 1 : 2,
      borderDash: dashForKey(series.specificIndicatorName),
      tension: 0.3,
      fill: isBollingerUpper ? { target: '-1' } : false,
      backgroundColor: isBollingerUpper ? 'rgba(53, 136, 200,0.1)' : undefined,
      pointRadius: 0,
      spanGaps: false,
    }

    return ds
  })

  return { labels, datasets: [baseDataset, ...compareDatasets] }
}

const MarketDataCustomChart: FC<MarketDataCustomChartProps> = ({ data, locked = false }) => {
  const navigate = useNavigate()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'line'> | null>(null)

  const title: string = useMemo(() => {
    const base = data ?? defaultDummyPayload
    const ep: IMarketData = locked ? { ...base, isPermitted: false } : base
    return ep.marketMetaData?.goodsDataNm ?? 'SK E&S custom chart'
  }, [data, locked])

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }
    const basePayload = data ?? defaultDummyPayload
    const effectivePayload: IMarketData = locked ? { ...basePayload, isPermitted: false } : basePayload
    const { labels, datasets } = buildChartData(effectivePayload)

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: { point: { radius: 0 } },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  filter: (legendItem: LegendItem) => !legendItem.text.includes('Bollinger'),
                  usePointStyle: true,
                  pointStyle: 'line',
                  boxWidth: 120,
                  boxHeight: 12,
                  generateLabels: (chart: Chart) => {
                    const original = Chart.defaults.plugins.legend.labels.generateLabels
                    const labels = original.call(this, chart)

                    return labels.map((label: LegendItem, index: number) => {
                      const dataset = chart.data.datasets[index] as any
                      if (dataset && dataset.borderDash) {
                        return {
                          ...label,
                          lineDash: dataset.borderDash,
                          strokeStyle: dataset.borderColor,
                          lineWidth: dataset.borderWidth || 2,
                        }
                      }
                      return label
                    })
                  },
                },
              },
              tooltip: { enabled: !locked },
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 0,
                  autoSkip: false,
                  callback(index) {
                    // 좌/우 끝 라벨만 보여주고, 가장자리 붙지 않도록 공백 패딩
                    const allLabels: any = (this as any).getLabels ? (this as any).getLabels() : (this as any).chart.data.labels
                    const label = allLabels[index]
                    if (index === 0) return `\u2002\u2002\u2002\u2002\u2002\u2002\u2002${label}`
                    if (index === allLabels.length - 1) return `${label}\u2002\u2002\u2002\u2002\u2002\u2002\u2002`
                    return ''
                  },
                  font: { family: 'Pretendard', size: 12, weight: 'normal' },
                  color: '#868e96',
                },
                grid: { display: false },
              },
              y: {
                ticks: {
                  maxRotation: 0,
                  maxTicksLimit: 6,
                  font: { family: 'Pretendard', size: 12, weight: 'normal' },
                  color: '#868e96',
                },
                grid: { color: 'rgba(0,0,0,0.06)' },
              },
            },
          },
        })
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [data, locked])

  return (
    <Box
      borderRadius={1}
      sx={{
        padding: '25px 25px 20.5px 25px',
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
              borderColor: 'contentBorder.Primaryactive',
              backgroundColor: 'background.default',
            },
      }}
      onClick={() =>
        !locked &&
        navigate(`/mi/data-detail/${data?.marketMetaData?.goodsNo}/${data?.marketMetaData?.goodsDataNo}`, {
          state: { goodsDataSrcNo: data?.marketMetaData?.goodsDataSourceNo },
        })
      }
    >
      <Typography
        color="gray.90"
        mb={5}
        component="h4"
        variant="infoDocument"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          filter: locked ? 'blur(6px)' : 'none',
          '& > span': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 'calc(100% - 32px)',
          },
        }}
      >
        <span>{title}</span>
        <ChevronRightIcon sx={{ color: 'gray.60', minWidth: '24px', ml: 1 }} />
      </Typography>

      <Box position="relative">
        <Box
          sx={{
            width: 467,
            height: 238,
            overflow: 'visible',
            filter: locked ? 'blur(6px)' : 'none',
          }}
        >
          <canvas
            ref={chartRef}
            style={{
              transform: 'translate(-25px, -5px)',
              pointerEvents: locked ? 'none' : 'auto',
            }}
          />
        </Box>
        {locked && <LockedOverlay />}
      </Box>
    </Box>
  )
}

export default MarketDataCustomChart
