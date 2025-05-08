import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography } from '@mui/material'
import { Chart } from 'chart.js'
import { useEffect, useRef } from 'react'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { generateMonthlyTimestamps, genMockDataForLineChart } from '@/utils/mock-data.ts'

interface MarketdataChartSmallProps {
  isClock?: boolean
}

const mockLineChartData1 = genMockDataForLineChart(7)
const mockLineChartData2 = genMockDataForLineChart(7)
const months = generateMonthlyTimestamps(7)

const SimpleLineChart = () => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'line', number[], number> | null>(null)

  // Generate mock data
  const generateMockData = () => ({
    labels: months,
    datasets: [
      {
        label: 'Line1',
        data: mockLineChartData1,
        borderColor: '#A945C5',
        backgroundColor: '#A945C5',
        tension: 0,
        fill: false,
        borderWidth: 1,
      },
      {
        label: 'Line2',
        data: mockLineChartData2,
        borderColor: '#2E3F5E',
        backgroundColor: '#2E3F5E',
        tension: 0,
        fill: false,
        borderWidth: 1,
      },
    ],
  })

  useEffect(() => {
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Create new chart
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      const data = generateMockData()

      if (ctx)
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
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
                display: false,
                title: {
                  display: false,
                },
                grid: {
                  display: false,
                },
              },
              x: {
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
        })
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return <canvas ref={chartRef} style={{ maxWidth: '100%' }}></canvas>
}

const MarketdataChartSmall = (props: MarketdataChartSmallProps) => {
  const { isClock } = props

  return (
    <Box
      borderRadius={1}
      sx={{
        padding: 6,
        borderRadius: '4px',
        border: '1px solid #E9ECEF',
      }}
    >
      <Typography sx={{ cursor: 'pointer' }} color="gray.90" mb={2.5} component="h4" variant="sectionTitleTXL">
        DRAM Price Index
        <ChevronRightIcon sx={{ color: 'gray.60', verticalAlign: 'middle', ml: 2 }} />
      </Typography>
      <Typography component={'div'} mr={5} color="gray.60" variant="body2M14">
        Index Start Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          Dec 30, 2019
        </Typography>
      </Typography>
      <Typography component={'div'} color="gray.60" mt={1} variant="body2M14">
        Updated Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          Feb 17, 2025
        </Typography>
      </Typography>

      <Box position={'relative'} mt={5}>
        <Box display={'flex'} alignItems={'center'} sx={{ filter: isClock ? 'blur(5px)' : 'none' }}>
          <Box mr={5}>
            <Typography sx={{ fontWeight: 600 }} fontSize={28} color="#14181F" mb={2.5} component="div" variant="heading1">
              85.6
              <Typography component={'div'} color="#1967D2" lineHeight={1} variant="fieldLabel">
                -2.05%
              </Typography>
            </Typography>
          </Box>
          <Box height={53}>
            <SimpleLineChart />
          </Box>
        </Box>
        {isClock && (
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            position={'absolute'}
            sx={{ inset: '0px -6px', backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#868E96' }}
          >
            <LockOutlinedIcon />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default MarketdataChartSmall
