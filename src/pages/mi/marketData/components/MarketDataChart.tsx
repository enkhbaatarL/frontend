import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Typography, Tooltip } from '@mui/material'
import { Chart } from 'chart.js'
import dayjs from 'dayjs'
import { FC, Fragment, memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIChip from '@/components/common/chip/MIChip'
import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import { IMarketData } from '@/service/mi/marketData'

interface MarketDataChartProps {
  data?: IMarketData
  size?: 'large' | 'small'
  locked?: boolean
}

const dummyMetaData = {
  lastValue: 54.32,
  dodChangeRate: -10,
  wowChangeRate: -12.3,
  momChangeRate: 45.6,
  yoyChangeRate: -78.9,
  changeRates: [
    { label: 'DoD', value: 0 },
    { label: 'WoW', value: 0 },
  ],
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

  return <MIChip size={'h24'} color={isPositive ? 'green-climb' : 'red-decline'} label={`${isPositive ? '+' : ''}${changeRate}%`} />
}

const getMinMax = (vals: number[]) => {
  let min = Number.POSITIVE_INFINITY,
    max = Number.NEGATIVE_INFINITY
  let minIdx = -1,
    maxIdx = -1
  vals.forEach((v, i) => {
    if (v < min) {
      min = v
      minIdx = i
    }
    if (v > max) {
      max = v
      maxIdx = i
    }
  })
  return { min, max, minIdx, maxIdx }
}

const SimpleLineChart: FC<{ data?: IMarketData; hasTicks?: boolean }> = ({ data, hasTicks }) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart<'line', number[], string | number> | null>(null)
  let cachedGradient: CanvasGradient | null = null
  let gW = 0,
    gH = 0
  const generateChartGradient = (ctx: CanvasRenderingContext2D, area: any) => {
    const w = area.right - area.left
    const h = area.bottom - area.top
    if (!cachedGradient || gW !== w || gH !== h) {
      const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom)
      gradient.addColorStop(0, 'rgba(53, 136, 200,0.1)')
      gradient.addColorStop(0.7, 'rgba(53, 136, 200,0.05)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      cachedGradient = gradient
      gW = w
      gH = h
    }
    return cachedGradient
  }

  const generateChartData = useCallback(() => {
    if (data?.mainChart?.rawData) {
      const mainData = data.mainChart.rawData.map((point) => point.value)
      const labels = data.mainChart.rawData.map((point) => point.date)
      const { min, max, minIdx, maxIdx } = getMinMax(mainData)

      const datasets = [
        {
          type: 'line' as const,
          label: 'Main',
          data: mainData,
          borderColor: '#40597A',
          // backgroundColor: '#40597A',
          backgroundColor: (context: any) => {
            const chart = context.chart
            const { ctx, chartArea } = chart
            if (!chartArea) return 'transparent'
            return generateChartGradient(ctx, chartArea)
          },
          tension: 0,
          fill: true,
          borderWidth: 1,
          spanGaps: true,
        },
        {
          type: 'line' as const,
          label: 'MinMaxMarkers',
          data: mainData.map((v, i) => (i === minIdx || i === maxIdx ? v : Number.NaN)),
          borderColor: 'transparent',
          backgroundColor: '#40597A',
          pointRadius: (ctx: any) => {
            const i = ctx.dataIndex
            return i === minIdx || i === maxIdx ? 3 : 0
          },
          pointHoverRadius: 4.5,
          pointBackgroundColor: '#2E3F5E',
          showLine: false,
          _minMaxInfo: { min, max, minIdx, maxIdx },
        },
      ]

      if (data.compareCharts && data.compareCharts.length > 0) {
        data.compareCharts.forEach((compareChart, index) => {
          if (compareChart.rawData) {
            const compareData = compareChart.rawData.map((point) => point.value)
            const { min, max, minIdx, maxIdx } = getMinMax(compareData)

            // Compare 차트 라인
            datasets.push({
              type: 'line' as const,
              label: compareChart.specificIndicatorName || `Compare ${index + 1}`,
              data: compareData,
              borderColor: '#ef6b35ff',
              backgroundColor: () => 'transparent',
              tension: 0,
              fill: false,
              borderWidth: 1,
              spanGaps: true,
            })

            // Compare 차트의 최고값/최저값 포인트 (realValue 사용)
            const realMin = compareChart.rawData[minIdx]?.real ?? min
            const realMax = compareChart.rawData[maxIdx]?.real ?? max

            datasets.push({
              type: 'line' as const,
              label: `Compare ${index + 1} MinMaxMarkers`,
              data: compareData.map((v, i) => (i === minIdx || i === maxIdx ? v : Number.NaN)),
              borderColor: 'transparent',
              backgroundColor: '#EF6B35',
              pointRadius: (ctx: any) => {
                const i = ctx.dataIndex
                return i === minIdx || i === maxIdx ? 3 : 0
              },
              pointHoverRadius: 4.5,
              pointBackgroundColor: '#ef6b35ff', // 더 진한 주황색
              showLine: false,
              _minMaxInfo: { min: realMin, max: realMax, minIdx, maxIdx },
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
          spanGaps: true,
        },
        {
          label: 'Compare',
          data: [],
          borderColor: '#7A8790',
          backgroundColor: '#7A8790',
          tension: 0,
          fill: false,
          borderWidth: 1,
          spanGaps: true,
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
        const edgeLabels = {
          id: 'edgeLabels',
          afterDraw(chart: any, _args: any, opts: any) {
            const s = chart.scales.x
            const { left, right, bottom } = chart.chartArea
            const ctx = chart.ctx

            const leftText = dayjs(s.min).format(opts.format ?? 'YYYY-MM-DD')
            const rightText = dayjs(s.max).format(opts.format ?? 'YYYY-MM-DD')

            ctx.save()
            ctx.font = '400 12px Pretendard'
            ctx.fillStyle = '#868E96'
            ctx.textBaseline = 'top'

            ctx.textAlign = 'right'
            ctx.fillText(leftText, left + 67, bottom + 7)

            ctx.textAlign = 'left'
            ctx.fillText(rightText, right - 67, bottom + 7)

            ctx.restore()
          },
        }
        const minMaxLabelPlugin = {
          id: 'minMaxLabel',
          afterDatasetsDraw(chart: any) {
            // Main 차트의 MinMaxMarkers 찾기
            const mainDsIndex = chart.data.datasets.findIndex((d: any) => d.label === 'MinMaxMarkers')
            if (mainDsIndex >= 0) {
              const ds: any = chart.data.datasets[mainDsIndex]
              const info = ds._minMaxInfo
              if (info) {
                const meta = chart.getDatasetMeta(mainDsIndex)
                this.drawMinMaxLabels(chart, meta, info)
              }
            }

            // Compare 차트들의 MinMaxMarkers 찾기
            const compareDsIndices = chart.data.datasets
              .map((d: any, index: number) => (d.label?.includes('MinMaxMarkers') && d.label !== 'MinMaxMarkers' ? index : -1))
              .filter((index: number) => index >= 0)

            compareDsIndices.forEach((dsIndex: number) => {
              const ds: any = chart.data.datasets[dsIndex]
              const info = ds._minMaxInfo
              if (info) {
                const meta = chart.getDatasetMeta(dsIndex)
                this.drawMinMaxLabels(chart, meta, info)
              }
            })
          },

          drawMinMaxLabels(chart: any, meta: any, info: any) {
            const drawOne = (idx: number, text: string) => {
              const elem = meta.data[idx]
              if (!elem) return

              const pos = typeof elem.tooltipPosition === 'function' ? elem.tooltipPosition() : { x: elem?.x, y: elem?.y }
              const x = pos?.x,
                y = pos?.y
              if (!Number.isFinite(x) || !Number.isFinite(y)) return

              const { ctx, chartArea } = chart
              ctx.save()

              ctx.font = '600 14px Pretendard, sans-serif'
              ctx.fillStyle = '#2E3F5E'

              const s = String(text)
              const m = ctx.measureText(s)
              const w = m.width
              const h = (m.actualBoundingBoxAscent ?? 11) + (m.actualBoundingBoxDescent ?? 3)

              const pad = 6
              const margin = 2

              const fits = (tx: number, ty: number, align: CanvasTextAlign, base: CanvasTextBaseline) => {
                let left = tx,
                  right = tx,
                  top = ty,
                  bottom = ty
                if (align === 'center') {
                  left = tx - w / 2
                  right = tx + w / 2
                } else if (align === 'left') {
                  left = tx
                  right = tx + w
                } else if (align === 'right') {
                  left = tx - w
                  right = tx
                }

                if (base === 'top') {
                  top = ty
                  bottom = ty + h
                } else if (base === 'middle') {
                  top = ty - h / 2
                  bottom = ty + h / 2
                } else if (base === 'bottom') {
                  top = ty - h
                  bottom = ty
                }

                return (
                  left >= chartArea.left + margin &&
                  right <= chartArea.right - margin &&
                  top >= chartArea.top + margin &&
                  bottom <= chartArea.bottom - margin
                )
              }

              const candidates: Array<{ tx: number; ty: number; align: CanvasTextAlign; base: CanvasTextBaseline }> = [
                { tx: x, ty: y - pad, align: 'center', base: 'bottom' },
                { tx: x + pad, ty: y, align: 'left', base: 'middle' },
                { tx: x - pad, ty: y, align: 'right', base: 'middle' },
                { tx: x, ty: y + pad, align: 'center', base: 'top' },
              ]

              let chosen = candidates.find((c) => fits(c.tx, c.ty, c.align, c.base))

              if (!chosen) {
                let tx = x,
                  ty = y - pad
                tx = Math.min(Math.max(tx, chartArea.left + margin + w / 2), chartArea.right - margin - w / 2)
                ty = Math.min(Math.max(ty, chartArea.top + margin + h), chartArea.bottom - margin)
                chosen = { tx, ty, align: 'center', base: 'bottom' }
              }

              ctx.textAlign = chosen.align
              ctx.textBaseline = chosen.base
              ctx.fillText(s, chosen.tx, chosen.ty)

              ctx.restore()
            }

            drawOne(info.minIdx, info.min)
            drawOne(info.maxIdx, info.max)
          },
        }

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                bottom: 9,
              },
            },
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
                grace: '10%',
                display: false,
                title: {
                  display: false,
                },
                grid: {
                  display: false,
                },
              },
              x: {
                type: 'time',
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
                // 차트 사이즈 확대를 위해 틱 제거,  라벨플러그인 추가
                // ticks: hasTicks
                //   ? {
                //       autoSkip: false,
                //       maxRotation: 0,
                //       minRotation: 0,
                //       color: '#868E96',
                //       font: {
                //         size: 12,
                //         family: 'Pretendard',
                //         weight: 400,
                //       },
                //       source: 'labels',
                //       callback(tickValue: string | number, index: number, ticks: Tick[]) {
                //         if (index === 0 || index === ticks.length - 1) {
                //           const value = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue)

                //           return dayjs(value).format('MMM DD, YYYY')
                //         }

                //         return ''
                //       },
                //     }
                //   : {
                //       display: false,
                //     },
              },
            },
          },
          plugins: [minMaxLabelPlugin, edgeLabels],
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
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTextOverflow, setIsTextOverflow] = useState(false)

  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current
      setIsTextOverflow(element.scrollWidth > element.clientWidth)
    }
  }, [data?.marketMetaData?.goodsDataNm])

  if (!data?.marketMetaData) {
    return null
  }

  const metaData = locked ? { ...data.marketMetaData, ...dummyMetaData } : data.marketMetaData

  const displayData = locked
    ? {
      mainChart: {
        specificIndicatorName: 'CURRENT',
        rawData: dummyChartData.mainChart.map((value, index) => ({
          date: String(index),
          value,
        })),
      },
      compareCharts: [
        {
          specificIndicatorName: 'PAST_5Y_AVG',
          rawData: dummyChartData.compareCharts.map((value, index) => ({
            date: String(index),
            value,
          })),
        },
      ],
      isPermitted: false,
      marketMetaData: {
        chartMarkRank: 0,
        goodsNo: 0,
        goodsDataNo: 0,
        goodsDataSourceNo: 0,
        goodsDataNm: '',
        goodsDataSourceNm: '',
        currency: '',
        currentUnitCd: '',
        visibleChartType: '',
        interval: '',
        lastUpdateDt: '',
        indexStartDt: '',
        lastValue: 0,
        yoyChangeRate: 0,
        momChangeRate: 0,
        wowChangeRate: 0,
        dodChangeRate: 0,
        changeRates: [
          { label: 'DoD', value: 0 },
          { label: 'WoW', value: 0 },
        ],
      },
    }
    : data

  return (
    <Box
      borderRadius={1}
      sx={{
        padding: '20px',
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
      onClick={() =>
        !locked &&
        navigate(`/mi/data-detail/${data?.marketMetaData?.goodsNo}/${data?.marketMetaData?.goodsDataNo}`, {
          state: { goodsDataSrcNo: data?.marketMetaData?.goodsDataSourceNo },
        })
      }
    >
      <Typography
        color="gray.90"
        mb={size === 'large' ? 5 : 2.5}
        component="h4"
        variant="infoDocument"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          '& > span': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 'calc(100% - 32px)',
          },
        }}
      >
        {isTextOverflow ? (
          <Tooltip title={metaData.goodsDataNm} placement="top" followCursor>
            <span ref={textRef}>{metaData.goodsDataNm}</span>
          </Tooltip>
        ) : (
          <span ref={textRef}>{metaData.goodsDataNm}</span>
        )}
        <ChevronRightIcon sx={{ color: 'gray.60', minWidth: '24px', ml: 1 }} />
      </Typography>
      {size === 'large' && (
        <Box position={'relative'}>
          <Box display={'flex'} flexDirection={'column'}>
            <Box
              display={'flex'}
              alignItems={'center'}
              sx={{
                filter: locked ? 'blur(6px)' : 'none',
              }}
            >
              <Typography sx={{ fontWeight: 600 }} color="gray.90" component="div" variant="heading2">
                {metaData.lastValue}
              </Typography>

              <Box display={'flex'} alignContent={'center'} sx={{ ml: 'auto' }} gap={1.25}>
                {(metaData.changeRates ?? []).map(({ label, value }, index) => (
                  <Fragment key={index}>
                    {index !== 0 && <MILine thickness={'1px'} direction={'vertical'} length={18} />}
                    <Typography color="gray.70" component="div" variant="body1M16">
                      {label}
                    </Typography>
                    {getChangeRateChip(value)}
                  </Fragment>
                ))}
              </Box>
            </Box>
            <Box pt={6} height={180} sx={{ overflow: 'visible', filter: locked ? 'blur(6px)' : 'none' }}>
              <SimpleLineChart data={displayData} hasTicks />
            </Box>
            {/* Legend - compare 차트가 있을 때만 표시 */}
            {displayData.compareCharts && displayData.compareCharts.length > 0 && (
              <Box mt={-4} display="flex" justifyContent="center" flexWrap="wrap" gap={2} sx={{ filter: locked ? 'blur(6px)' : 'none' }}>
                {displayData.mainChart && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      width={12}
                      height={2}
                      sx={{
                        backgroundColor: '#40597A',
                        borderRadius: '1px',
                      }}
                    />
                    <Typography variant="body3R12" color="gray.70">
                      {displayData.mainChart.specificIndicatorName || 'Main'}
                    </Typography>
                  </Box>
                )}
                {displayData.compareCharts?.map((chart, index) => (
                  <Box key={index} display="flex" alignItems="center" gap={1}>
                    <Box
                      width={12}
                      height={2}
                      sx={{
                        backgroundColor: '#EF6B35', // 주황색으로 변경
                        borderRadius: '1px',
                        backgroundImage: 'repeating-linear-gradient(90deg, #EF6B35, #EF6B35 5px, transparent 5px, transparent 10px)', // 점선 효과
                      }}
                    />
                    <Typography variant="body3R12" color="gray.70">
                      {chart.specificIndicatorName || `Compare ${index + 1}`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {locked && <LockedOverlay />}
        </Box>
      )}
    </Box>
  )
}

export default memo(MarketDataChart)
