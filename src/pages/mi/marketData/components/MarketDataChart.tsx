import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { Chart, Tick } from 'chart.js'
import dayjs from 'dayjs'
import { FC, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import MIChip from '@/components/common/chip/MIChip'
import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { IMarketData } from '@/service/mi/marketData.ts'

interface MarketDataChartProps {
  data?: IMarketData
  size?: 'large' | 'small'
  locked?: boolean
}

const dummyMetaData = {
  lastValue: 54.32,
  wowChangeRate: -12.3,
  momChangeRate: 45.6,
  yoyChangeRate: -78.9,
}

const dummyChartData = {
  mainChart: [35, 27, 43, 39, 37, 25, 31, 29, 21, 24, 35, 27],
  compareCharts: [37, 23, 28, 20, 31, 31, 34, 30, 22, 26, 45, 48],
}

const LockedOverlay = () => (
  <Box
    display={'flex'}
    alignItems={'center'}
    justifyContent={'center'}
    position={'absolute'}
    margin={'-3px -6px'}
    sx={{ inset: '0px -6px', backgroundColor: 'rgba(255, 255, 255, 0.8)', color: '#868E96' }}
  >
    <LockOutlinedIcon />
  </Box>
)

const getChangeRateChip = (changeRate: number) => {
  if (!changeRate) {
    return <MIChip size={'h24'} color={'gray'} label={changeRate === 0 ? '0%' : '-'} />
  }

  const isPositive = changeRate >= 0

  return <MIChip size={'h24'} color={isPositive ? 'green' : 'red'} label={`${isPositive ? '+' : ''}${changeRate}%`} />
}

const getChangeRateLabel = (changeRate: number) => {
  if (!changeRate) {
    return (
      <Typography component={'div'} color={'gray'} lineHeight={1} variant="fieldLabel">
        {changeRate === 0 ? '0%' : '-'}
      </Typography>
    )
  }

  const isPositive = changeRate >= 0

  return (
    <Typography component={'div'} color={isPositive ? '#498B47' : '#A9141A'} lineHeight={1} variant="fieldLabel">
      {isPositive ? '+' : ''}
      {changeRate}%
    </Typography>
  )
}

const SimpleLineChart: FC<{ data?: IMarketData; hasTicks?: boolean }> = ({ data, hasTicks }) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'line', number[], string | number> | null>(null)

  const generateChartData = useCallback(() => {
    if (data?.mainChart?.rawData) {
      const mainData = data.mainChart.rawData.map((point) => point.value)
      const labels = data.mainChart.rawData.map((point) => point.date)

      const datasets = [
        {
          label: 'Main',
          data: mainData,
          borderColor: '#40597A',
          backgroundColor: '#40597A',
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
              borderColor: '#7A8790',
              backgroundColor: '#7A8790',
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
          borderColor: '#40597A',
          backgroundColor: '#40597A',
          tension: 0,
          fill: false,
          borderWidth: 1,
        },
        {
          label: 'Compare',
          data: [],
          borderColor: '#7A8790',
          backgroundColor: '#7A8790',
          tension: 0,
          fill: false,
          borderWidth: 1,
        },
      ],
    }
  }, [data])

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
            elements: {
              point: {
                radius: 0,
              },
            },
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
                ticks: hasTicks
                  ? {
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

                        return dayjs(value).format('MMM DD, YYYY')
                      }

                      return ''
                    },
                  }
                  : {
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
  }, [data, generateChartData, hasTicks])

  return <canvas ref={chartRef} style={{ maxWidth: '100%' }} />
}

const MarketDataChart: FC<MarketDataChartProps> = ({ data, size = 'large', locked }) => {
  const navigate = useNavigate()

  if (!data?.marketMetaData) {
    return null
  }

  const metaData = locked ? { ...data.marketMetaData, ...dummyMetaData } : data.marketMetaData
  const displayData = locked
    ? {
      ...data,
      mainChart: {
        ...data.mainChart,
        rawData: data.mainChart.rawData.map(({ date }, index) => ({
          date,
          value: dummyChartData.mainChart[index],
        })),
      },
      compareCharts: [
        {
          rawData: data.mainChart.rawData.map(({ date }, index) => ({
            date,
            value: dummyChartData.compareCharts[index],
          })),
        },
      ],
    }
    : data

  return (
    <Box
      borderRadius={1}
      sx={{
        padding: 6,
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
            borderColor: '#2E3F5E',
            backgroundColor: '#F8F9FA',
          },
      }}
      onClick={() => !locked && navigate(`/mi/data-detail/${data?.marketMetaData.goodsNo}/${data?.marketMetaData.goodsDataNo}`)}
    >
      <Typography color="gray.90" mb={size === 'large' ? 5 : 2.5} component="h4" variant="sectionTitleTXL">
        {metaData.goodsDataNm}
        <ChevronRightIcon sx={{ color: 'gray.60', verticalAlign: 'middle', ml: 2 }} />
      </Typography>
      <Typography component={size === 'large' ? 'span' : 'div'} mr={5} color="gray.60" variant="body2M14">
        Index Start Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          {metaData.indexStartDt}
        </Typography>
      </Typography>
      {size === 'large' && (
        <Typography component={'span'} color="gray.60" variant="body2M14">
          Unit:
          <Typography ml={1} color="gray.70" variant="body2M14">
            {metaData.currentUnitCd ?? ''}
          </Typography>
        </Typography>
      )}
      <Typography component={'div'} color="gray.60" mt={1} variant="body2M14">
        Updated Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          {metaData.lastUpdateDt}
        </Typography>
      </Typography>
      {size === 'large' && (
        <Box position={'relative'}>
          <Box display={'flex'} flexDirection={'column'} sx={{ filter: locked ? 'blur(6px)' : 'none' }}>
            <Typography sx={{ fontWeight: 600 }} color="gray.90" mt={5} mb={2.5} component="div" variant="heading1">
              {metaData.lastValue}
            </Typography>
            <Grid container direction={'row'} alignItems={'center'} wrap={'nowrap'}>
              <Box>
                <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
                  WoW Change
                </Typography>
                {getChangeRateChip(metaData.wowChangeRate)}
              </Box>
              <MILine thickness={'1px'} length={49} direction={'vertical'} margin={'0 20px'} />
              <Box>
                <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
                  MoM Change
                </Typography>
                {getChangeRateChip(metaData.momChangeRate)}
              </Box>
              <MILine thickness={'1px'} length={49} direction={'vertical'} margin={'0 20px'} />
              <Box>
                <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
                  YoY Change
                </Typography>
                {getChangeRateChip(metaData.yoyChangeRate)}
              </Box>
            </Grid>
            <Box mt={6} height={109}>
              <SimpleLineChart data={displayData} hasTicks />
            </Box>
          </Box>
          {locked && <LockedOverlay />}
        </Box>
      )}
      {size === 'small' && (
        <Box position={'relative'} mt={5}>
          <Box display={'flex'} alignItems={'center'} sx={{ filter: locked ? 'blur(6px)' : 'none' }}>
            <Box mr={6}>
              <Typography sx={{ fontWeight: 600 }} fontSize={28} color="#14181F" mb={2.5} component="div" variant="heading1">
                {metaData.lastValue}
                {getChangeRateLabel(metaData.wowChangeRate)}
              </Typography>
            </Box>
            <Box height={53} px={'10px'}>
              <SimpleLineChart data={displayData} />
            </Box>
          </Box>
          {locked && <LockedOverlay />}
        </Box>
      )}
    </Box>
  )
}

export default MarketDataChart
