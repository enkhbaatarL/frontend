import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { Chart, Tick } from 'chart.js'
import dayjs from 'dayjs'
import { FC, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIChip from '@/components/common/chip/MIChip'
import MILine from '@/components/common/divider/MILine'
import { IMarketData } from '@/service/mi/marketData.ts'

interface MarketDataChartProps {
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

      // compareGraphs가 있는 경우에만 추가
      if (data.compareCharts && data.compareCharts.length > 0) {
        data.compareCharts.forEach((compareGraph, index) => {
          if (compareGraph.rawData) {
            const compareData = compareGraph.rawData.map((point) => point.value)
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
    // 기존 차트 제거
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // 새 차트 생성
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

    // 클린업 함수
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={chartRef}></canvas>
}

const MarketDataChart: FC<MarketDataChartProps> = ({ data }) => {
  // 데이터의 유무에 따라 표시할 내용을 결정
  const metaData = data?.marketMetaData || {
    goodsDataNm: 'DRAM Price Index',
    indexStartDt: 'Dec 30, 2019',
    lastUpdateDt: 'Feb 17, 2025',
    currentUnitCd: '$/Bbl',
    lastValue: 85.6,
    wowChangeRate: -2.5,
    momChangeRate: 4.8,
    yoyChangeRate: -12.3,
  }

  // 단위 표시 형식 개선
  const formatUnit = (unit: string) => {
    if (!unit) return ''
    return unit
  }

  const [isHover, setIsHover] = useState(false)
  const navigate = useNavigate()

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
        cursor: 'pointer',
      }}
      onMouseOver={() => setIsHover(true)}
      onMouseOut={() => setIsHover(false)}
      onClick={() =>
        isHover && navigate(`mi/data-detail/goods/${data?.marketMetaData.goodsNo}/goods-data/${data?.marketMetaData.goodsDataNo}`)
      }
    >
      <Typography sx={{ cursor: 'pointer' }} color="gray.90" mb={5} component="h4" variant="sectionTitleTXL">
        {metaData.goodsDataNm}
        <ChevronRightIcon sx={{ color: 'gray.60', verticalAlign: 'middle', ml: 2 }} />
      </Typography>
      <Typography component={'span'} mr={5} color="gray.60" variant="body2M14">
        Index Start Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          {metaData.indexStartDt}
        </Typography>
      </Typography>
      <Typography component={'span'} color="gray.60" variant="body2M14">
        Unit:
        <Typography ml={1} color="gray.70" variant="body2M14">
          {formatUnit(metaData.currentUnitCd)}
        </Typography>
      </Typography>
      <Typography component={'div'} color="gray.60" mt={1} variant="body2M14">
        Updated Date :
        <Typography ml={1} color="gray.70" variant="body2M14">
          {metaData.lastUpdateDt}
        </Typography>
      </Typography>
      <Typography sx={{ fontWeight: 600 }} color="gray.90" mt={5} mb={2.5} component="div" variant="heading1">
        {metaData.lastValue}
      </Typography>
      <Grid container direction={'row'} alignItems={'center'} wrap={'nowrap'}>
        <Box>
          <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
            WoW Change
          </Typography>
          <MIChip
            size={'h24'}
            color={metaData.wowChangeRate >= 0 ? 'green' : 'blue'}
            label={`${metaData.wowChangeRate >= 0 ? '+' : ''}${metaData.wowChangeRate}%`}
          />
        </Box>
        <MILine thickness={'1px'} length={49} direction={'vertical'} margin={'0 20px'} />
        <Box>
          <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
            MoM Change
          </Typography>
          <MIChip
            size={'h24'}
            color={metaData.momChangeRate >= 0 ? 'green' : 'blue'}
            label={`${metaData.momChangeRate >= 0 ? '+' : ''}${metaData.momChangeRate}%`}
          />
        </Box>
        <MILine thickness={'1px'} length={49} direction={'vertical'} margin={'0 20px'} />
        <Box>
          <Typography color="gray.70" mb={2.5} component="div" variant="body1R16">
            YoY Change
          </Typography>
          <MIChip
            size={'h24'}
            color={metaData.yoyChangeRate >= 0 ? 'green' : 'blue'}
            label={`${metaData.yoyChangeRate >= 0 ? '+' : ''}${metaData.yoyChangeRate}%`}
          />
        </Box>
      </Grid>
      <Box mt={6} height={109}>
        <SimpleLineChart data={data} />
      </Box>
    </Box>
  )
}

export default MarketDataChart
