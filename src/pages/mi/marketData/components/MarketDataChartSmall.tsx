import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography } from '@mui/material'
import { Chart } from 'chart.js'
import { FC, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { IMarketData } from '@/service/mi/marketData.ts'

interface MarketDataChartSmallProps {
  isClock?: boolean
  data?: IMarketData
}

const SimpleLineChart: FC<{ data?: IMarketData }> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'line', number[], string | number> | null>(null)

  const generateChartData = () => {
    if (data?.mainChart?.rawData) {
      const mainData = data.mainChart.rawData.map((point) => point.value)
      const labels = data.mainChart.rawData.map((point) => point.date)

      const datasets = [
        {
          label: 'Main',
          data: mainData,
          borderColor: '#A945C5',
          backgroundColor: '#A945C5',
          tension: 0,
          fill: false,
          borderWidth: 1,
        },
      ]

      if (data.compareCharts && data.compareCharts.length > 0) {
        data.compareCharts.forEach((compareChart, index) => {
          if (compareChart.rawData) {
            const compareData = compareChart.rawData.map((point) => point.value)
            datasets.push({
              label: `Compare ${index + 1}`,
              data: compareData,
              borderColor: '#2E3F5E',
              backgroundColor: '#2E3F5E',
              tension: 0,
              fill: false,
              borderWidth: 1,
            })
          }
        })
      }

      return {
        labels,
        datasets,
      }
    }

    return {
      labels: [],
      datasets: [
        {
          label: 'Main',
          data: [],
          borderColor: '#A945C5',
          backgroundColor: '#A945C5',
          tension: 0,
          fill: false,
          borderWidth: 1,
        },
        {
          label: 'Compare',
          data: [],
          borderColor: '#2E3F5E',
          backgroundColor: '#2E3F5E',
          tension: 0,
          fill: false,
          borderWidth: 1,
        },
      ],
    }
  }

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d')
      const chartData = generateChartData()

      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: chartData,
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
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, generateChartData])

  return <canvas ref={chartRef} style={{ maxWidth: '100%' }}></canvas>
}

const MarketDataChartSmall: FC<MarketDataChartSmallProps> = ({ isClock, data }) => {
  const navigate = useNavigate()
  const [isHover, setIsHover] = useState(false)

  const metaData = data?.marketMetaData || {
    goodsDataNm: 'DRAM Price Index',
    indexStartDt: 'Dec 30, 2019',
    lastUpdateDt: 'Feb 17, 2025',
    lastValue: 85.6,
    wowChangeRate: -2.05,
  }

  return (
    <Box
      borderRadius={1}
      sx={{
        padding: 6,
        borderRadius: '4px',
        border: '1px solid',
        borderColor: isHover ? '#2E3F5E' : '#E9ECEF',
        backgroundColor: isHover ? '#F8F9FA' : '#FFFFFF',
        transition: '0.3s',
        cursor: !isClock ? 'pointer' : 'default',
      }}
      onMouseOver={() => !isClock && setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      onClick={() =>
        isHover && navigate(`mi/data-detail/goods/${data?.marketMetaData.goodsNo}/goods-data/${data?.marketMetaData.goodsDataNo}`)
      }
    >
      <Typography sx={{ cursor: 'pointer' }} color="gray.90" mb={2.5} component="h4" variant="sectionTitleTXL">
        {metaData.goodsDataNm}
        <ChevronRightIcon sx={{ color: 'gray.60', verticalAlign: 'middle', ml: 2 }} />
      </Typography>
      <Typography component={'div'} mr={5} color="gray.60" variant="body2M14">
        Index Start Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          {metaData.indexStartDt}
        </Typography>
      </Typography>
      <Typography component={'div'} color="gray.60" mt={1} variant="body2M14">
        Updated Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          {metaData.lastUpdateDt}
        </Typography>
      </Typography>

      <Box position={'relative'} mt={5}>
        <Box display={'flex'} alignItems={'center'} sx={{ filter: isClock ? 'blur(5px)' : 'none' }}>
          <Box mr={5}>
            <Typography sx={{ fontWeight: 600 }} fontSize={28} color="#14181F" mb={2.5} component="div" variant="heading1">
              {metaData.lastValue}
              <Typography component={'div'} color={metaData.wowChangeRate >= 0 ? '#498B47' : '#1967D2'} lineHeight={1} variant="fieldLabel">
                {metaData.wowChangeRate >= 0 ? '+' : ''}
                {metaData.wowChangeRate}%
              </Typography>
            </Typography>
          </Box>
          <Box height={53}>
            <SimpleLineChart data={data} />
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

export default MarketDataChartSmall
