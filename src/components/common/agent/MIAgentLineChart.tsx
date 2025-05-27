import { Box, Stack, Typography } from '@mui/material'
import Chart from 'chart.js/auto'
import { useEffect, useRef } from 'react'

export default function MIAgentLineChart() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  const legendItems = [
    { id: 'hhp', label: 'HHP', color: '#2E3F5E', active: true, filled: true },
    { id: 'hhpPrediction', label: 'HHP 예측', color: '#CC4D50', active: true, filled: false },
    { id: 'm1', label: '설명기 M1', color: '#153870', active: false, filled: true },
    { id: 'm2', label: '설명기 M2', color: '#6428AD', active: false, filled: true },
    { id: 'm3', label: '설명기 M3', color: '#C3C3C3', active: false, filled: true },
    { id: 'm4', label: '설명기 M4', color: '#C91F7D', active: false, filled: true },
  ]

  useEffect(() => {
    if (!chartRef.current) return () => {}

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')

    if (!ctx) return () => {}

    // Sample data matching the pattern in the image
    const labels = ['24-08', '24-09', '24-10', '24-11', '24-12', '25-01', '25-02', '25-03', '25-04', '25-05', '25-06', '25-07']
    const actualData = [0.2, 0.6, 0.4, 0.2, 0.5, 0.3, 0.5, 0.3, 0.2, 0.3, 0.4, 0.3]
    const predictedData = [0.3, 0.25, 0.15, 0.15, 0.2, 0.2, 0.2, 0.15, 0.15, 0.2, 0.35, 0.2]
    const m1Data = [0.1, 0.25, 0.15, 0.15, 0.2, 0.2, 0.2, 0.7, 0.15, 0.2, 0.35, 0.2]
    const m2Data = [0.25, 0.25, 0.15, 0.1, 0.2, 0.2, 0.5, 0.15, 0.15, 0.6, 0.35, 0.2]
    const m3Data = [0.6, 0.25, 0.15, 0.13, 0.2, 0.1, 0.2, 0.13, 0.15, 0.11, 0.22, 0.2]
    const m4Data = [0.05, 0.25, 0.15, 0.15, 0.2, 0.2, 0.2, 0.15, 0.15, 0.2, 0.11, 0.2]

    // @ts-expect-error: Chart.js types not recognized correctly but runtime is fine
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'HHP',
            data: actualData,
            borderColor: '#2E3F5E',
            backgroundColor: '#2E3F5E',
            borderWidth: 2,
            pointStyle: 'circle',
            pointRadius: 5,
            pointBackgroundColor: '#2E3F5E',
            tension: 0.1,
            fill: false,
          },
          {
            label: 'HHP 예측',
            data: predictedData,
            borderColor: '#CC4D50',
            borderWidth: 2,
            borderDash: [5, 5],
            pointStyle: 'circle',
            pointRadius: 5,
            pointBackgroundColor: 'white',
            pointBorderColor: '#CC4D50',
            pointBorderWidth: 1.5,
            tension: 0.1,
            fill: false,
          },
          {
            label: '설명기 M1',
            data: m1Data,
            borderColor: '#CBD5E0',
            backgroundColor: '#CBD5E0',
            hidden: true,
          },
          {
            label: '설명기 M2',
            data: m2Data,
            borderColor: '#E9D8FD',
            backgroundColor: '#E9D8FD',
            hidden: true,
          },
          {
            label: '설명기 M3',
            data: m3Data,
            borderColor: '#F7FAFC',
            backgroundColor: '#F7FAFC',
            hidden: true,
          },
          {
            label: '설명기 M4',
            data: m4Data,
            borderColor: '#FED7E2',
            backgroundColor: '#FED7E2',
            hidden: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              font: {
                size: 14,
                weight: 500,
              },
              color: '#2E3F5E',
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              font: {
                size: 14,
                weight: 500,
              },
              color: '#2E3F5E',
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <Box width={'100%'} mb={'87px'} style={{ height: '400px', backgroundColor: '#fff' }}>
      <canvas ref={chartRef}></canvas>
      {/* Custom legend with circular markers and faded appearance */}
      <Stack
        direction="row"
        py={2.5}
        // mt={2.5}
        spacing={3}
        justifyContent="center"
        flexWrap="wrap"
        sx={{
          pt: '18px',
          gap: 2,
          '& > *': {
            display: 'flex',
            alignItems: 'center',
          },
          backgroundColor: '#fff',
        }}
      >
        {legendItems.map((item) => (
          <Box
            key={item.id}
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
