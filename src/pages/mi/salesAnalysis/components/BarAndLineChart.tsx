import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography } from '@mui/material'
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Legend,
  Tooltip,
  type ChartData,
  type ChartDataset,
  type ChartConfiguration,
  type Plugin,
} from 'chart.js'
import { FC, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { IMarketData } from '@/service/mi/marketData'

Chart.register(CategoryScale, LinearScale, BarElement, BarController, PointElement, LineElement, LineController, Legend, Tooltip)

type MixedType = 'bar' | 'line'

const barLabelPlugin: Plugin<MixedType> = {
  id: 'barLabelPlugin',
  afterDatasetsDraw: (chart) => {
    const ctx = chart.ctx
    const showBarLabel = (chart.options.plugins as any)?.showBarLabel
    if (!showBarLabel) return

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if ((dataset as any).type !== 'bar') return
      const meta = chart.getDatasetMeta(datasetIndex)
      if (!meta?.data) return

      ctx.save()
      ctx.font = '10px Pretendard'
      ctx.fillStyle = '#495057'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'

      meta.data.forEach((bar: any, index: number) => {
        if (bar && typeof bar.x === 'number' && typeof bar.y === 'number') {
          const value = (dataset.data as any[])[index]
          if (value !== null && value !== undefined) {
            const label = typeof value === 'number' ? value.toFixed(1) : String(value)
            ctx.fillText(label, bar.x, bar.y - 4)
          }
        }
      })

      ctx.restore()
    })
  },
}

const lineLabelPlugin: Plugin<MixedType> = {
  id: 'lineLabelPlugin',
  afterDatasetsDraw: (chart) => {
    const ctx = chart.ctx
    const showLineLabel = (chart.options.plugins as any)?.showLineLabel
    if (!showLineLabel) return

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      if ((dataset as any).type !== 'line') return
      const meta = chart.getDatasetMeta(datasetIndex)
      if (!meta?.data) return

      ctx.save()
      ctx.font = '10px Pretendard'
      ctx.fillStyle = '#495057'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'

      meta.data.forEach((point: any, index: number) => {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
          const value = (dataset.data as any[])[index]
          if (value !== null && value !== undefined) {
            const label = typeof value === 'number' ? value.toFixed(1) : String(value)
            ctx.fillText(label, point.x, point.y - 6)
          }
        }
      })

      ctx.restore()
    })
  },
}

interface BarAndLineChartProps {
  data?: IMarketData
  locked?: boolean
  onClick?: () => void
  showBarLabel?: boolean
  showLineLabel?: boolean
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

const buildBarAndLineChartData = (
  data: IMarketData,
): {
  labels: string[]
  datasets: ChartDataset<MixedType, number[]>[]
} => {
  const rawData = data.mainChart?.rawData ?? []
  const compareData = data.compareCharts ?? []

  const allDates: string[] = [...rawData.map((p) => p.date), ...compareData.flatMap((s) => s.rawData.map((p) => p.date))]
  const labels = Array.from(new Set(allDates)).sort()

  const mapPoints = (points: { date: string; value: number }[]) => {
    const m = new Map(points.map((p) => [p.date, p.value]))
    return labels.map((d) => m.get(d) ?? 0)
  }

  const mainLabel = data.mainChart?.specificIndicatorName ?? data.marketMetaData?.goodsDataNm ?? ''
  const firstCompare = compareData[0]
  const compareLabel = firstCompare?.specificIndicatorName ?? data.marketMetaData?.goodsDataNm ?? (compareData.length > 0 ? 'Series 1' : '')

  const datasets: ChartDataset<MixedType, number[]>[] = [
    {
      type: 'bar',
      label: mainLabel,
      data: mapPoints(rawData),
      backgroundColor: '#40597A',
      borderColor: '#40597A',
      borderWidth: 1,
      yAxisID: 'y',
      order: 2,
    },
    ...(compareData.length > 0
      ? [
          {
            type: 'line',
            label: compareLabel,
            data: mapPoints(firstCompare.rawData),
            borderColor: '#7A8790',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0,
            yAxisID: 'y',
            order: 1,
          } as ChartDataset<MixedType, number[]>,
      ]
      : []),
  ]

  return { labels, datasets }
}

const BarAndLineChart: FC<BarAndLineChartProps> = ({ data, locked = false, showBarLabel = false, showLineLabel = false }) => {
  const navigate = useNavigate()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<MixedType> | null>(null)

  const title: string = useMemo(() => data?.marketMetaData?.goodsDataNm ?? 'Sales Analysis', [data])

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }
    if (!data) return undefined

    const { labels, datasets } = buildBarAndLineChartData(data)

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      if (ctx) {
        const config: ChartConfiguration<MixedType, number[], string> = {
          type: 'bar',
          data: { labels, datasets } as ChartData<MixedType, number[], string>,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  usePointStyle: true,
                  pointStyle: (ctx: any) => {
                    const chart = ctx.chart
                    const dataset = chart.data.datasets[ctx.datasetIndex] as any
                    return dataset?.type === 'line' ? 'line' : 'rect'
                  },
                  boxWidth: 12,
                  boxHeight: 12,
                  font: { family: 'Pretendard', size: 12 },
                },
              },
              tooltip: { enabled: !locked },
              ...({ showBarLabel, showLineLabel } as any),
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 0,
                  autoSkip: false,
                  callback(index) {
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
                type: 'linear',
                display: true,
                position: 'left',
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
          plugins: [barLabelPlugin as unknown as Plugin<MixedType>, lineLabelPlugin as unknown as Plugin<MixedType>],
        }

        chartInstance.current = new Chart(ctx, config)
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [data, locked, showBarLabel, showLineLabel])

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

export default BarAndLineChart
