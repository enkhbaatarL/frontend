import { Box, Stack, Typography } from '@mui/material'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import dayjs from 'dayjs'
import { useMemo, useState, useRef, useEffect } from 'react'
import { Line } from 'react-chartjs-2'

import { IChatQnaAnswerBundle } from '@/service/mi/agent'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  series: IChatQnaAnswerBundle['series']
  onChartImageUrl?: (url: string) => void
}

const colors = ['#2E3F5E', '#CC4D50', '#153870', '#6428AD', '#C3C3C3', '#C91F7D']

const MIAgentLineChart = ({ series, onChartImageUrl }: Props) => {
  const [activeLegends, setActiveLegends] = useState<number[]>(series?.map((_, index) => index) || [])

  const maxValue = useMemo(() => Math.max(...activeLegends.flatMap((index) => series?.[index]?.values || [])), [series, activeLegends])

  const minValue = useMemo(() => Math.min(...activeLegends.flatMap((index) => series?.[index]?.values || [])), [series, activeLegends])

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 0,
      },
      layout: {
        padding: {
          top: 26,
          right: 32,
          bottom: 38,
          left: 8,
        },
      },
      scales: {
        x: {
          type: 'category' as const,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            font: {
              size: 14,
              weight: 500,
            },
            callback(tickValue: string | number) {
              const index = Number(tickValue)
              const timestamp = series?.[0]?.timestamps?.[index]
              if (timestamp) {
                const date = dayjs(timestamp)
                const firstDate = dayjs(series?.[0]?.timestamps?.[0])
                if (date.year() === firstDate.year()) {
                  return date.format('MM-DD')
                }
                return date.format('YYYY-MM')
              }
              return tickValue
            },
            color: '#2E3F5E',
            padding: 8,
          },
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            font: {
              size: 14,
              weight: 500,
            },
            color: '#2E3F5E',
            padding: 10,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    }),
    [series],
  )

  const chartOptions = {
    ...options,
    scales: {
      ...options.scales,
      y: {
        ...options.scales.y,
        suggestedMax: maxValue * 1.01,
        suggestedMin: minValue * 0.99,
      },
    },
  }

  const data = {
    labels: series?.[0]?.timestamps || [],
    datasets:
      series?.map((item, index) => ({
        label: item.legend,
        data: item.values,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        borderWidth: 2,
        pointStyle: 'circle',
        pointRadius: 5,
        pointBackgroundColor: index === 1 ? 'white' : colors[index % colors.length],
        pointBorderColor: colors[index % colors.length],
        pointBorderWidth: index === 1 ? 1.5 : 0,
        borderDash: index === 1 ? [5, 5] : [],
        tension: 0.1,
        hidden: !activeLegends.includes(index),
        fill: false,
      })) || [],
  }

  const legendItems =
    series?.map((item, index) => ({
      id: index,
      label: item.legend,
      color: colors[index % colors.length],
      active: activeLegends.includes(index),
      filled: index !== 1,
    })) || []

  const handleLegendClick = (index: number) => {
    setActiveLegends((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const chartRef = useRef<ChartJS<'line'>>(null)

  // 차트가 렌더링된 후 이미지 URL 생성
  useEffect(() => {
    if (chartRef.current && onChartImageUrl) {
      const imageUrl = chartRef.current.toBase64Image()
      onChartImageUrl(imageUrl)
    }
  }, [data, onChartImageUrl])

  if (!data) return null

  return (
    <Box
      width={'100%'}
      style={{ height: '490px', backgroundColor: '#fff', border: '1px solid', borderColor: '#DEE2E6' }}
      borderRadius={'6px'}
      overflow={'hidden'}
    >
      <Line ref={chartRef} data={data} options={chartOptions} />
      <Stack
        direction="row"
        mt={-8}
        spacing={3}
        justifyContent="center"
        flexWrap="wrap"
        sx={{
          gap: 2,
          '& > *': {
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          },
          backgroundColor: '#fff',
        }}
      >
        {legendItems.map((item) => (
          <Box
            key={item.id}
            onClick={() => handleLegendClick(item.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                mr: 1,
                borderRadius: '2px',
                backgroundColor: item.filled ? item.color : 'transparent',
                border: item.filled ? 'none' : `1px solid ${item.color}`,
                opacity: item.active ? 1 : 0.35,
              }}
            />
            <Typography variant="body2R14" color={item.active ? 'contentText.Normal' : 'contentText.Disabled'}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default MIAgentLineChart
