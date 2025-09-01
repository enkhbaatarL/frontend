/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Typography } from '@mui/material'
import Chart, { CategoryScale, ChartType } from 'chart.js/auto'
import { useEffect, useRef } from 'react'

import MIButton from '../button/MIButton'
import DataTrendChartDownloadIcon from './icons/DataTrendChartDownloadIcon'

import theme from '@/theming'

Chart.register(CategoryScale)

interface MIDataTrendHeatMapChartProps {
  data: number[][]
  height: string | number
}

export default function MIDataTrendHeatMapChart(props: MIDataTrendHeatMapChartProps) {
  const { data = [], height = 345 } = props
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) {
      return () => {}
    }

    // Destroy existing chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')

    if (!ctx) {
      return () => {}
    }

    // Labels for x and y axes
    const xLabels = Array(16).fill('Text')
    const yLabels = Array(6).fill('00')

    // Create a dummy scatter chart that we'll override with our heatmap
    chartInstance.current = new Chart(ctx, {
      type: 'scatter' as ChartType,
      data: {
        labels: xLabels,
        datasets: [
          {
            data: [{ x: 0, y: 0 }], // Dummy data point
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,0,0,0)',
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            right: 116,
          },
        },
        scales: {
          x: {
            type: 'category',
            position: 'bottom',
            labels: xLabels,
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: 'Pretendard,sans-serif',
                size: 14,
                weight: 500,
              },
              color: theme.palette.gray[60],
            },
            afterFit: (axis) => {
              axis.height = 33
            },
            offset: true,
          },
          y: {
            type: 'category',
            position: 'left',
            labels: yLabels,
            grid: {
              display: false,
            },
            afterFit: (axis) => {
              axis.width = 66
            },
            ticks: {
              font: {
                family: 'Pretendard,sans-serif',
                size: 14,
                weight: 500,
              },
              color: theme.palette.gray[60],
            },
            offset: true,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context: any) => {
                const x = context.parsed.x
                const y = context.parsed.y

                if (x >= 0 && x < data[0].length && y >= 0 && y < data.length) {
                  return `Value: ${data[y][x].toFixed(2)}`
                }

                return ''
              },
            },
          },
        },
      },
      plugins: [
        {
          id: 'heatmapRenderer',
          beforeDraw: (chart) => {
            const xScale = chart.scales.x
            const yScale = chart.scales.y
            const chartArea = chart.chartArea
            const { top, bottom, left, right } = chartArea
            const columnsNumber = data[0].length
            const rowsNumber = data.length
            const cellWidth = xScale.width / columnsNumber
            const cellHeight = yScale.height / rowsNumber

            ctx.lineWidth = 1
            ctx.strokeStyle = theme.palette.gray[30]

            for (let y = 0; y < rowsNumber; y += 1) {
              const yPixel = yScale.getPixelForValue(y)

              // Only draw if within chart area
              if (yPixel >= top && yPixel <= bottom) {
                ctx.beginPath()
                ctx.moveTo(left - 8, yPixel + cellHeight / 2)
                ctx.lineTo(right, yPixel + cellHeight / 2)
                ctx.stroke()
              }
            }

            // Draw vertical grid lines (x-axis) - only for the actual data points
            for (let i = 0; i < columnsNumber; i++) {
              const xPixel = xScale.getPixelForValue(i)

              if (xPixel >= left && xPixel <= right) {
                ctx.beginPath()
                ctx.moveTo(xPixel - cellWidth / 2, top)
                ctx.lineTo(xPixel - cellWidth / 2, bottom + 8)
                ctx.stroke()
              }
            }
          },
          afterDraw: (chart) => {
            const ctx = chart.ctx
            const chartArea = chart.chartArea
            const columnsNumber = data[0].length
            const rowsNumber = data.length
            const xScale = chart.scales.x
            const yScale = chart.scales.y

            // Calculate cell dimensions - make them slightly smaller to avoid overlap
            const cellWidth = xScale.width / columnsNumber
            const cellHeight = yScale.height / rowsNumber

            // Draw heatmap cells
            for (let y = 0; y < rowsNumber; y++) {
              for (let x = 0; x < columnsNumber; x++) {
                const value = data[y][x]

                // Calculate cell position - use the center of the category
                const xPos = xScale.getPixelForValue(x)
                const yPos = yScale.getPixelForValue(y)

                // Determine cell color based on value
                let cellColor

                if (value < 0) {
                  // Blue gradient for negative values
                  const intensity = Math.min(Math.abs(value) * 25, 1)

                  cellColor = `rgba(94, 161, 241, ${intensity})`
                } else if (value > 0) {
                  // Purple gradient for positive values
                  const intensity = Math.min(value * 25, 1)

                  cellColor = `rgba(85, 71, 206, ${intensity})`
                } else {
                  // White/very light color for zero
                  cellColor = 'rgba(255, 255, 255, 1)'
                }

                // Draw cell rectangle
                ctx.fillStyle = cellColor
                ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)'
                ctx.lineWidth = 1
                ctx.fillRect(xPos - cellWidth / 2, yPos - cellHeight / 2, cellWidth, cellHeight)
                ctx.strokeRect(xPos - cellWidth / 2, yPos - cellHeight / 2, cellWidth, cellHeight)

                // Draw cell value
                ctx.fillStyle = Math.abs(value) > 0.03 ? 'white' : 'black'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.font = '400 12px Pretendard'
                ctx.fillText(value.toFixed(2), xPos, yPos)
              }
            }

            // Draw vertical color legend
            const legendWidth = 34
            const legendHeight = chartArea.height
            const legendX = chartArea.right + 30
            const legendY = chartArea.top + (chartArea.height - legendHeight) / 2

            // Create gradient
            const gradient = ctx.createLinearGradient(0, legendY + legendHeight, 0, legendY)

            gradient.addColorStop(0, 'rgba(94, 161, 241, 1)') // Blue at bottom
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)') // Light color in middle
            gradient.addColorStop(1, 'rgba(85, 71, 206, 1)') // Purple at top

            // Draw gradient rectangle
            ctx.fillStyle = gradient
            ctx.fillRect(legendX, legendY, legendWidth, legendHeight)
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)'
            ctx.lineWidth = 1
            ctx.strokeRect(legendX, legendY, legendWidth, legendHeight)

            // Add labels
            ctx.fillStyle = theme.palette.gray[60]
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.font = '500 14px Pretendard'

            // Value labels
            ctx.fillText('1', legendX + legendWidth + 14, legendY + 7)
            ctx.fillText('0.5', legendX + legendWidth + 14, legendY + legendHeight * 0.25)
            ctx.fillText('0', legendX + legendWidth + 14, legendY + legendHeight * 0.5)
            ctx.fillText('-0.5', legendX + legendWidth + 14, legendY + legendHeight * 0.75)
            ctx.fillText('-1', legendX + legendWidth + 14, legendY - 7 + legendHeight)

            const { top, bottom, left, right } = chartArea

            ctx.lineWidth = 1
            ctx.strokeStyle = '#FFFFFF'

            for (let y = 0; y < rowsNumber; y += 1) {
              const yPixel = yScale.getPixelForValue(y)

              // Only draw if within chart area
              if (yPixel >= top && yPixel <= bottom) {
                ctx.beginPath()
                ctx.moveTo(left, yPixel - cellHeight / 2)
                ctx.lineTo(right, yPixel - cellHeight / 2)
                ctx.stroke()
              }
            }

            // Draw vertical grid lines (x-axis) - only for the actual data points
            for (let i = 0; i < columnsNumber; i++) {
              const xPixel = xScale.getPixelForValue(i)

              if (xPixel >= left && xPixel <= right) {
                ctx.beginPath()
                ctx.moveTo(xPixel - cellWidth / 2, top)
                ctx.lineTo(xPixel - cellWidth / 2, bottom)
                ctx.stroke()
              }
            }
          },
        },
      ],
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  const handleDownload = () => {
    if (!chartRef.current) return

    const link = document.createElement('a')

    link.download = 'data-trend.png'
    link.href = chartRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <Box>
      <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} py="6px">
        <Typography variant="infoDocument" color="gray.90">
          Data Trend
        </Typography>
        <Box>
          <MIButton startIcon={<DataTrendChartDownloadIcon />} onClick={handleDownload} contentType={'icon'} type="outlined" />
        </Box>
      </Box>

      <Box height={`${height}px`} mb="12px">
        <canvas ref={chartRef} />
      </Box>

      <Box>
        <Typography variant="body2" color="gray.60">
          *상관계수는 -1에서 1 사이의 값으로, 절대값이 클수록 강한 상관관계를 나타냅니다.
        </Typography>
      </Box>
    </Box>
  )
}
