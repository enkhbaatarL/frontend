import { Box, Typography } from '@mui/material'
import Chart, { BarController, ChartConfiguration, ChartType } from 'chart.js/auto'
import { useEffect, useRef } from 'react'

import theme from '@/theming'

interface MIInfluenceFactorChartProps {
  data: Record<string, { value: number; color: string }>
  height: number
}

Chart.register(BarController)

export default function MIInfluenceFactorChart(props: MIInfluenceFactorChartProps) {
  const { height, data: chartData } = props

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'bar'> | null>(null)

  const createChart = () => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext('2d')

      if (!ctx) return

      // Data for each case (values represent the length of each bar)

      // Custom plugin to draw case labels at the end of bars
      const barLabelsPlugin = {
        id: 'barLabels',
        afterDatasetsDraw(chart: Chart) {
          const { ctx, data, scales } = chart

          // Set text styling
          ctx.font = '400 12px Pretendard'
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = theme.palette.gray[70]

          // Get the dataset
          const dataset = data.datasets[0]

          // Loop through each data point
          const labels = Object.keys(chartData)

          dataset.data.forEach((value, index) => {
            // Calculate x position (end of bar + padding)
            if (value !== null) {
              const xPos = scales.x.getPixelForValue(value as number) + 5

              // Calculate y position (middle of bar)
              const yPos = scales.y.getPixelForValue(index)

              // Draw the case label instead of the value

              ctx.fillText(labels[index], xPos, yPos)
            }
          })
        },
      }

      // Register the plugin
      Chart.register(barLabelsPlugin)

      // Create new chart with custom spacing
      chartInstance.current = new Chart(ctx, {
        type: 'bar' as ChartType,
        data: {
          labels: ['', '', '', ''], // Empty labels since we're drawing custom ones
          datasets: [
            {
              label: 'Values',
              data: Object.values(chartData).map(({ value }) => value),
              backgroundColor: Object.values(chartData).map(({ color }) => color),
              // Using fixed bar thickness
              barThickness: 17,
              borderRadius: 0,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              right: 60, // Add extra padding on the right for labels
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: false, // Turn off tooltips
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                display: false,
              },
              ticks: {
                display: false,
              },
              border: {
                display: false,
              },
            },
            y: {
              grid: {
                display: false,
              },
              border: {
                display: false,
              },
              ticks: {
                display: false,
              },
              // Custom spacing between bars
              afterFit: (scale) => {
                scale.paddingTop = 15
                scale.paddingBottom = 15
              },
              // This is the key setting for exact 16px spacing
              afterDataLimits: (scale) => {
                // Calculate the space needed for each bar + gap
                const totalBars = 4 // Number of bars
                const barThickness = 17 // Bar thickness in pixels
                const gapThickness = 16 // Gap thickness in pixels

                // Total height needed for all bars and gaps
                const totalHeight = barThickness * totalBars + gapThickness * (totalBars - 1)

                // Set the scale height
                scale.max = totalHeight
              },
            },
          },
          // Disable automatic bar sizing to use our custom spacing
          barPercentage: 1,
          categoryPercentage: 1,
        },
      } as ChartConfiguration<'bar'>)
    }
  }

  useEffect(() => {
    createChart()

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <Box>
      <Box height={height}>
        <canvas ref={chartRef}></canvas>
      </Box>
      <Box display={'flex'} alignItems={'center'} px="4px" gap="10px">
        {Object.entries(chartData).map((item, index) => (
          <Box key={index} display={'flex'} alignItems={'center'} p="4px" gap="2px">
            <Box
              sx={{
                width: '12px',
                height: '12px',
                margin: '4px',
                borderRadius: '2px',
                backgroundColor: item[1].color as string,
                borderColor: item[1].color as string,
                borderWidth: 1,
              }}
            />
            <Typography variant="subtext2" color="gray.70">
              {item[0]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
