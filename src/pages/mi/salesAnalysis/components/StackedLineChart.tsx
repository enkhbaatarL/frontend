import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography } from '@mui/material'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, LineController, Legend, Tooltip, Filler } from 'chart.js'
import { FC, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { IMarketData } from '@/service/mi/marketData'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Legend, Tooltip, Filler)

// 라벨 표시 커스텀 플러그인
const dataLabelPlugin = {
  id: 'dataLabelPlugin',
  afterDatasetsDraw: (chart: Chart<'line'>) => {
    const ctx = chart.ctx
    const showLabel = (chart.options.plugins as any)?.showLabel

    if (!showLabel) return

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex)
      if (!meta || !meta.data) return

      ctx.save()
      ctx.font = '10px Pretendard'
      ctx.fillStyle = '#495057'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'

      meta.data.forEach((point: any, index: number) => {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
          const value = dataset.data[index]
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

interface StackedLineChartProps {
  data?: IMarketData
  locked?: boolean
  onClick?: () => void
  showLabel?: boolean // 라벨 표시 옵션
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

// TODO: API 연동 시 사용 예정
const buildStackedLineChartData = (data: IMarketData, _showLabel: boolean = false) => {
  const rawData = data.mainChart?.rawData ?? []
  const compareData = data.compareCharts ?? []

  const allDates: string[] = [...rawData.map((p) => p.date), ...compareData.flatMap((s) => s.rawData.map((p) => p.date))]
  const labels = Array.from(new Set(allDates)).sort()

  const mapPoints = (points: { date: string; value: number }[]) => {
    const m = new Map(points.map((p) => [p.date, p.value]))
    return labels.map((d) => m.get(d) ?? 0)
  }

  const mainLabel = data.mainChart?.specificIndicatorName ?? data.marketMetaData?.goodsDataNm ?? ''

  const datasets = [
    {
      label: mainLabel,
      data: mapPoints(rawData),
      borderColor: '#40597A',
      backgroundColor: 'rgba(64, 89, 122, 0.1)',
      borderWidth: 2,
      tension: 0.3,
      fill: true,
      pointRadius: 4, // 포인트 표시
      pointBackgroundColor: '#40597A',
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
    },
    ...compareData.map((series, index) => {
      const seriesLabel = series.specificIndicatorName ?? data.marketMetaData?.goodsDataNm ?? `Series ${index + 1}`
      return {
        label: seriesLabel,
        data: mapPoints(series.rawData),
        borderColor: index === 0 ? '#7A8790' : index === 1 ? 'rgba(53, 136, 200, 0.7)' : '#6B7280',
        backgroundColor: index === 0 ? 'rgba(122, 135, 144, 0.1)' : index === 1 ? 'rgba(53, 136, 200, 0.1)' : 'rgba(107, 114, 128, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 4, // 포인트 표시
        pointBackgroundColor: index === 0 ? '#7A8790' : index === 1 ? 'rgba(53, 136, 200, 0.7)' : '#6B7280',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      }
    }),
  ]

  return { labels, datasets }
}

const StackedLineChart: FC<StackedLineChartProps> = ({ data, locked = false, showLabel = false }) => {
  const navigate = useNavigate()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'line'> | null>(null)

  const title: string = useMemo(() => data?.marketMetaData?.goodsDataNm ?? 'Sales Analysis', [data])

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }

    if (!data) return undefined

    const { labels, datasets } = buildStackedLineChartData(data, showLabel)

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  usePointStyle: true,
                  pointStyle: 'rect',
                  boxWidth: 12,
                  boxHeight: 12,
                  font: { family: 'Pretendard', size: 12 },
                },
              },
              tooltip: { enabled: !locked },
              showLabel, // 플러그인에서 사용할 옵션
            },
            scales: {
              x: {
                stacked: true,
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
                stacked: true,
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
          plugins: [dataLabelPlugin],
        })
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [data, locked, showLabel])

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

export default StackedLineChart
