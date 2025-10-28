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

const TruncatedTextWithTooltip = ({ text, ...typographyProps }: { text: string } & any) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (element) {
      setIsOverflowing(element.scrollWidth > element.clientWidth)
    }
  }, [text])

  const typography = (
    <Typography ref={textRef} {...typographyProps}>
      {text}
    </Typography>
  )

  return isOverflowing ? (
    <Tooltip title={text} arrow>
      {typography}
    </Tooltip>
  ) : (
    typography
  )
}

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

  const compareColors = ['#EF6B35', '#9B59B6', '#3498DB', '#1ABC9C', '#F39C12', '#E74C3C', '#2ECC71', '#F1C40F']
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
          _minMaxInfo: { min, max, minIdx, maxIdx, color: '#2E3F5E' },
        },
      ]

      if (data.compareCharts && data.compareCharts.length > 0) {
        data.compareCharts.forEach((compareChart, index) => {
          if (compareChart.rawData) {
            const compareData = compareChart.rawData.map((point) => point.value)
            const { min, max, minIdx, maxIdx } = getMinMax(compareData)
            const color = compareColors[index % compareColors.length]

            // Compare 차트 라인
            datasets.push({
              type: 'line' as const,
              label: compareChart.specificIndicatorName || `Compare ${index + 1}`,
              data: compareData,
              borderColor: color,
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
              backgroundColor: color,
              pointRadius: (ctx: any) => {
                const i = ctx.dataIndex
                return i === minIdx || i === maxIdx ? 3 : 0
              },
              pointHoverRadius: 4.5,
              pointBackgroundColor: color,
              showLine: false,
              _minMaxInfo: { min: realMin, max: realMax, minIdx, maxIdx, color },
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
            ctx.fillText(leftText, left + 67, bottom + 3)

            ctx.textAlign = 'left'
            ctx.fillText(rightText, right - 67, bottom + 3)

            ctx.restore()
          },
        }
        const minMaxLabelPlugin = {
          id: 'minMaxLabel',
          afterDatasetsDraw(chart: any) {
            const allLabels: Array<{ x: number; y: number; text: string; color: string; isMain: boolean; isMin: boolean }> = []

            const mainDsIndex = chart.data.datasets.findIndex((d: any) => d.label === 'MinMaxMarkers')
            if (mainDsIndex >= 0) {
              const ds: any = chart.data.datasets[mainDsIndex]
              const info = ds._minMaxInfo
              if (info) {
                const meta = chart.getDatasetMeta(mainDsIndex)
                this.collectLabels(meta, info, info.color || '#2E3F5E', true, allLabels)
              }
            }

            const compareDsIndices = chart.data.datasets
              .map((d: any, index: number) => (d.label?.includes('MinMaxMarkers') && d.label !== 'MinMaxMarkers' ? index : -1))
              .filter((index: number) => index >= 0)

            compareDsIndices.forEach((dsIndex: number) => {
              const ds: any = chart.data.datasets[dsIndex]
              const info = ds._minMaxInfo
              if (info) {
                const meta = chart.getDatasetMeta(dsIndex)
                const color = info.color || '#EF6B35'
                this.collectLabels(meta, info, color, false, allLabels)
              }
            })

            this.drawAllLabels(chart, allLabels)
          },

          collectLabels(
            meta: any,
            info: any,
            color: string,
            isMain: boolean,
            allLabels: Array<{ x: number; y: number; text: string; color: string; isMain: boolean; isMin: boolean }>,
          ) {
            const collectOne = (idx: number, text: string, isMin: boolean) => {
              const elem = meta.data[idx]
              if (!elem) return
              if (text === null || text === undefined || text === '') return

              const pos = typeof elem.tooltipPosition === 'function' ? elem.tooltipPosition() : { x: elem?.x, y: elem?.y }
              const x = pos?.x,
                y = pos?.y
              if (!Number.isFinite(x) || !Number.isFinite(y)) return

              allLabels.push({ x, y, text: String(text), color, isMain, isMin })
            }

            if (info.min === info.max && info.minIdx === info.maxIdx) {
              collectOne(info.minIdx, info.min, true)
            } else {
              collectOne(info.minIdx, info.min, true)
              collectOne(info.maxIdx, info.max, false)
            }
          },

          drawAllLabels(
            chart: any,
            allLabels: Array<{ x: number; y: number; text: string; color: string; isMain: boolean; isMin: boolean }>,
          ) {
            const { ctx, chartArea } = chart

            const groupedLabels = new Map<
              number,
              Array<{ x: number; y: number; text: string; color: string; isMain: boolean; isMin: boolean }>
            >()

            allLabels.forEach((label) => {
              const yKey = Math.round(label.y / 10) * 10
              if (!groupedLabels.has(yKey)) {
                groupedLabels.set(yKey, [])
              }
              groupedLabels.get(yKey)!.push(label)
            })

            groupedLabels.forEach((labels) => {
              if (labels.length === 1) {
                const label = labels[0]
                ctx.save()
                ctx.font = '600 14px Pretendard, sans-serif'
                ctx.fillStyle = label.color
                ctx.textAlign = 'center'
                ctx.textBaseline = 'bottom'

                const textWidth = ctx.measureText(label.text).width
                const textHeight = 14
                const margin = 10

                const finalX = label.x
                let finalY = label.y

                if (label.isMain) {
                  finalY = label.y - 2
                } else {
                  finalY = label.y + 20
                }

                const adjustedX = Math.max(
                  chartArea.left + margin + textWidth / 2,
                  Math.min(chartArea.right - margin - textWidth / 2, finalX),
                )
                const adjustedY = Math.max(chartArea.top + margin + textHeight, Math.min(chartArea.bottom - margin, finalY))

                ctx.fillText(label.text, adjustedX, adjustedY)
                ctx.restore()
                return
              }

              const mainLabels = labels.filter((label) => label.isMain)
              const compareLabels = labels.filter((label) => !label.isMain)

              mainLabels.sort((a, b) => parseFloat(b.text) - parseFloat(a.text))
              compareLabels.sort((a, b) => parseFloat(b.text) - parseFloat(a.text))

              const sortedLabels = [...mainLabels, ...compareLabels]
              const margin = 10

              const canSpreadHorizontally = (labels: any[]) => {
                const minX = Math.min(...labels.map((l) => l.x))
                const maxX = Math.max(...labels.map((l) => l.x))
                const requiredWidth = (labels.length - 1) * 50 + 50
                const availableWidth = chartArea.right - chartArea.left - margin * 2
                return requiredWidth <= availableWidth && minX - margin >= chartArea.left && maxX + margin <= chartArea.right
              }

              const canSpread = canSpreadHorizontally(sortedLabels)

              sortedLabels.forEach((label, index) => {
                ctx.save()
                ctx.font = '600 14px Pretendard, sans-serif'
                ctx.fillStyle = label.color
                ctx.textAlign = 'center'
                ctx.textBaseline = 'bottom'

                const textWidth = ctx.measureText(label.text).width
                const textHeight = 14

                let finalX = label.x
                let finalY = label.y

                if (label.isMain) {
                  finalY = label.y - 2
                } else {
                  if (labels.length > 1) {
                    if (canSpread) {
                      if (index === 1) {
                        finalX = label.x - 30
                        finalY = label.isMin ? label.y - 15 : label.y + 20
                      } else if (index === 2) {
                        finalX = label.x + 30
                        finalY = label.isMin ? label.y - 15 : label.y + 20
                      } else {
                        const offset = 25 + (index - 3) * 20
                        if (index % 2 === 0) {
                          finalX = label.x + offset
                        } else {
                          finalX = label.x - offset
                        }
                        finalY = label.isMin ? label.y - 15 : label.y + 20
                      }
                    } else {
                      const compareIndex = sortedLabels.filter((l) => !l.isMain).indexOf(label)
                      if (label.isMin) {
                        finalY = label.y - 15 - compareIndex * 20
                      } else {
                        finalY = label.y + 20 + compareIndex * 20
                      }
                    }
                  } else {
                    finalX = label.x
                    finalY = label.isMin ? label.y - 15 : label.y + 20
                  }
                }

                const adjustedX = Math.max(
                  chartArea.left + margin + textWidth / 2,
                  Math.min(chartArea.right - margin - textWidth / 2, finalX),
                )
                const adjustedY = Math.max(chartArea.top + margin + textHeight, Math.min(chartArea.bottom - margin, finalY))

                ctx.fillText(label.text, adjustedX, adjustedY)
                ctx.restore()
              })
            })
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
                top: 30,
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

  if (!data?.marketMetaData) {
    return null
  }

  const metaData = locked ? { ...data.marketMetaData, ...dummyMetaData } : data.marketMetaData

  // 타이틀에서 단위 추출 (괄호 안의 내용)
  const extractUnitFromTitle = (title: string) => {
    const match = title.match(/\(([^)]+)\)$/)
    return match ? match[1] : null
  }

  const titleWithoutUnit = metaData.goodsDataNm?.replace(/\s*\([^)]+\)$/, '') || ''
  const extractedUnit = extractUnitFromTitle(metaData.goodsDataNm || '')

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
        padding: '25px',
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
      <Box
        color="gray.90"
        mb={size === 'large' ? 5 : 2.5}
        component="h4"
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <TruncatedTextWithTooltip
            text={titleWithoutUnit}
            component="span"
            variant="infoDocument"
            color="gray.90"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
              flexShrink: 1,
              marginRight: '4px',
            }}
          />
          {extractedUnit && (
            <Typography
              component="span"
              variant="infoDocument"
              color="gray.90"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0, marginRight: '4px' }}
            >
              ({extractedUnit})
            </Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ color: 'gray.60', minWidth: '24px', ml: '8px' }} />
      </Box>
      {size === 'large' && (
        <Box position={'relative'}>
          <Box display={'flex'} flexDirection={'column'}>
            <Box
              display={'flex'}
              alignItems={'center'}
              sx={{
                filter: locked ? 'blur(6px)' : 'none',
                minHeight: '33.6px',
              }}
            >
              <Typography sx={{ fontWeight: 600 }} color="gray.90" component="div" variant="heading2">
                {metaData.lastValue || ''}
              </Typography>

              <Box display={'flex'} alignContent={'center'} sx={{ ml: 'auto', mt: '3px' }} gap={3}>
                {(metaData.changeRates ?? []).length > 0 ? (
                  (metaData.changeRates ?? []).map(({ label, value }, index) => (
                    <Fragment key={index}>
                      {index !== 0 && (
                        <Box sx={{ mt: '3px' }}>
                          <MILine thickness={'1px'} direction={'vertical'} length={18} />
                        </Box>
                      )}
                      <Typography color="gray.70" component="div" variant="body1M16">
                        {label}
                      </Typography>
                      {getChangeRateChip(value)}
                    </Fragment>
                  ))
                ) : (
                  <Box sx={{ width: '120px', height: '10px' }} />
                )}
              </Box>
            </Box>
            <Box mt={3} height={188} sx={{ overflow: 'visible', filter: locked ? 'blur(6px)' : 'none', position: 'relative' }}>
              {/* Legend - compare 차트가 있을 때만 표시 */}
              {displayData.compareCharts && displayData.compareCharts.length > 0 && (
                <Box
                  display="flex"
                  justifyContent="center"
                  flexWrap="wrap"
                  gap={2}
                  sx={{
                    filter: locked ? 'blur(6px)' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
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
                  {displayData.compareCharts?.map((chart, index) => {
                    const compareColors = ['#EF6B35', '#9B59B6', '#3498DB', '#1ABC9C', '#F39C12', '#E74C3C', '#2ECC71', '#F1C40F']
                    const color = compareColors[index % compareColors.length]
                    return (
                      <Box key={index} display="flex" alignItems="center" gap={1}>
                        <Box
                          width={12}
                          height={2}
                          sx={{
                            backgroundColor: color,
                            borderRadius: '1px',
                            backgroundImage: `repeating-linear-gradient(90deg, ${color}, ${color} 5px, transparent 5px, transparent 10px)`, // 점선 효과
                          }}
                        />
                        <Typography variant="body3R12" color="gray.70">
                          {chart.specificIndicatorName || `Compare ${index + 1}`}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              )}
              <SimpleLineChart data={displayData} hasTicks />
            </Box>
          </Box>
          {locked && <LockedOverlay />}
        </Box>
      )}
    </Box>
  )
}

export default memo(MarketDataChart)
