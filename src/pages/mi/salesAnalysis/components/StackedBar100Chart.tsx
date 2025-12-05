import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography } from '@mui/material'
import { Chart, CategoryScale, LinearScale, BarElement, BarController, Legend, Tooltip } from 'chart.js'
import { FC, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { IMarketData } from '@/service/mi/marketData'

Chart.register(CategoryScale, LinearScale, BarElement, BarController, Legend, Tooltip)

interface StackedBar100ChartProps {
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

const buildStackedBar100ChartData = (data: IMarketData) => {
  const rawData = data.mainChart?.rawData ?? []
  const compareData = data.compareCharts ?? []

  const allDates: string[] = [...rawData.map((p) => p.date), ...compareData.flatMap((s) => s.rawData.map((p) => p.date))]
  const labels = Array.from(new Set(allDates)).sort()

  const mapPoints = (points: { date: string; value: number }[]) => {
    const m = new Map(points.map((p) => [p.date, p.value]))
    return labels.map((d) => m.get(d) ?? 0)
  }

  // 2가지 legend만 사용 (mainChart와 첫 번째 compareData)
  const currentData = mapPoints(rawData)
  const compareDataValues = compareData.length > 0 ? mapPoints(compareData[0].rawData) : []

  const mainLabel = data.mainChart?.specificIndicatorName ?? data.marketMetaData?.goodsDataNm ?? ''
  const firstCompare = compareData[0]
  const compareLabel = firstCompare?.specificIndicatorName ?? data.marketMetaData?.goodsDataNm ?? (compareData.length > 0 ? 'Series 1' : '')

  // 100% stacked bar를 위해 각 라벨별 합계를 구하고 비율로 변환
  const normalizedData = labels.map((_, index) => {
    const current = currentData[index] || 0
    const compare = compareDataValues[index] || 0
    const total = current + compare
    if (total === 0) return { current: 0, compare: 0 }
    return {
      current: (current / total) * 100,
      compare: (compare / total) * 100,
    }
  })

  const datasets = [
    {
      label: mainLabel,
      data: normalizedData.map((d) => d.current),
      backgroundColor: '#40597A',
      borderColor: '#40597A',
      borderWidth: 1,
    },
    ...(compareData.length > 0
      ? [
        {
          label: compareLabel,
          data: normalizedData.map((d) => d.compare),
          backgroundColor: '#7A8790',
          borderColor: '#7A8790',
          borderWidth: 1,
        },
      ]
      : []),
  ]

  return { labels, datasets }
}

const StackedBar100Chart: FC<StackedBar100ChartProps> = ({ data, locked = false }) => {
  const navigate = useNavigate()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'bar'> | null>(null)

  const title: string = useMemo(() => data?.marketMetaData?.goodsDataNm ?? 'Sales Analysis', [data])

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }

    if (!data) return undefined

    const { labels, datasets } = buildStackedBar100ChartData(data)

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
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
                min: 0,
                max: 100,
                ticks: {
                  maxRotation: 0,
                  maxTicksLimit: 6,
                  font: { family: 'Pretendard', size: 12, weight: 'normal' },
                  color: '#868e96',
                  callback(value) {
                    return `${value}%`
                  },
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

export default StackedBar100Chart
