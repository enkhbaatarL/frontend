import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { Chart, Tick } from 'chart.js'
import dayjs from 'dayjs'
import React, { useEffect, useRef } from 'react'

import MIChip from '@/components/common/chip/MIChip.tsx'
import MILine from '@/components/common/divider/MILine.tsx'
import { Report } from '@/hooks/useMockReports.tsx'
import { generateMonthlyTimestamps, genMockDataForLineChart } from '@/utils/mock-data.ts'

interface InsightsCardBtnProps {
  report?: Report
  index?: number
}

const mockLineChartData1 = genMockDataForLineChart(12)
const mockLineChartData2 = genMockDataForLineChart(12)
const months = generateMonthlyTimestamps()

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

      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
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
                  autoSkip: false,
                  maxRotation: 0,
                  minRotation: 0,
                  color: '#868E96',
                  font: {
                    size: 12,
                    family: 'Pretendard',
                    weight: 400,
                  },
                  callback(tickValue: string | number, index: number, ticks: Tick[]) {
                    if (index === 0 || index === ticks.length - 1) {
                      const value = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue)

                      return dayjs(this.getLabelForValue(value)).format('MMM DD, YYYY')
                    }

                    return ''
                  },
                },
              },
            },
          },
        })
      }
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return <canvas ref={chartRef}></canvas>
}

const MarketdataChart: React.FC<InsightsCardBtnProps> = () => (
  <Box
    borderRadius={1}
    sx={{
      padding: 6,
      borderRadius: '4px',
      border: '1px solid #E9ECEF',
    }}
  >
    <Typography sx={{ cursor: 'pointer' }} color="gray.90" mb={5} component="h4" variant="sectionTitleTXL">
      DRAM Price Index
      <ChevronRightIcon sx={{ color: 'gray.60', verticalAlign: 'middle', ml: 2 }} />
    </Typography>
    <Typography component={'span'} mr={5} color="gray.60" variant="body2M14">
      Index Start Date :
      <Typography ml={1} color="gray.70" variant="body2M14">
        Dec 30, 2019
      </Typography>
    </Typography>
    <Typography component={'span'} color="gray.60" variant="body2M14">
      Unit:
      <Typography ml={1} color="gray.70" variant="body2M14">
        $/Bbl
      </Typography>
    </Typography>
    <Typography component={'div'} color="gray.60" mt={1} variant="body2M14">
      Updated Date :
      <Typography ml={1} color="gray.70" variant="body2M14">
        Feb 17, 2025
      </Typography>
    </Typography>
    <Typography sx={{ fontWeight: 600 }} color="gray.90" mt={5} mb={2.5} component="div" variant="heading1">
      85.6
    </Typography>
    <Grid container direction={'row'} alignItems={'center'} wrap={'nowrap'}>
      <Box>
        <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
          WoW Change
        </Typography>
        <MIChip size={'h24'} color={'blue'} label={'-2.5%'} />
      </Box>
      <MILine thickness={'1px'} length={49} direction={'vertical'} margin={'0 20px'} />
      <Box>
        <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
          WoW Change
        </Typography>
        <MIChip size={'h24'} color={'green'} label={'+4.8%'} />
      </Box>
      <MILine thickness={'1px'} length={49} direction={'vertical'} margin={'0 20px'} />
      <Box>
        <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
          YoY Change
        </Typography>
        <MIChip size={'h24'} color={'blue'} label={'-12.3%'} />
      </Box>
    </Grid>
    <Box mt={6} height={109}>
      <SimpleLineChart />
    </Box>
  </Box>
)

export default MarketdataChart
