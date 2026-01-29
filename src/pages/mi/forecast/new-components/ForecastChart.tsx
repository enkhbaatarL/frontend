import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
import ForecastChartGraph, { ForecastChartGraphHandle } from '@/pages/mi/forecast/new-components/ForecastChartGraph'
import ForecastChartLegend from '@/pages/mi/forecast/new-components/ForecastChartLegend'
import { IForecastChartInfo, IForecastReport } from '@/service/mi/forecast'
import useSnackbar from '@/hooks/useSnackbar'
import { ChartType, ChartData } from '@/types/dataDetailChart'

interface ForecastChartProps {
  hoverReportCardInfo?: IForecastReport | null
  chartData?: IForecastChartInfo
  chartDataIsLoading?: boolean
  onFixedModeChange?: (isFixedMode: boolean) => void
  monthSelect?: string
  xAxisUnit?: string
  period?: string
  onXAxisUnitChange?: (value: string) => void
  onPeriodChange?: (value: string) => void
  disableLegendMenu?: boolean
}

const ForecastChart = ({
  hoverReportCardInfo,
  chartData,
  chartDataIsLoading,
  onFixedModeChange,
  monthSelect,
  xAxisUnit,
  period,
  onXAxisUnitChange,
  onPeriodChange,
  disableLegendMenu = false,
}: ForecastChartProps) => {
  const { showSnackbar } = useSnackbar()
  const [chartVisibilityMap, setChartVisibilityMap] = useState<Map<string, boolean>>(new Map())
  const [hoveredChartKey, setHoveredChartKey] = useState<string | null>(null)
  const [isFixedMode, setIsFixedMode] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(xAxisUnit || '1D')
  const [selectedRange, setSelectedRange] = useState<string>(period || '1W')
  const chartGraphRef = useRef<ForecastChartGraphHandle>(null)

  const periodOptions = [
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '1Q', value: '1Q' },
    { label: '1Y', value: '1Y' },
  ]

  const rangeOptions = [
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: 'YTD', value: 'YTD' },
    { label: '1Y', value: '1Y' },
    { label: 'All', value: 'ALL' },
  ]

  // 단위/기간 비교를 위한 스케일 맵
  const getScale = (value: string): number => {
    switch (value) {
      case '1D':
        return 1
      case '1W':
        return 2
      case '1M':
        return 3
      case '1Q':
      case '3M':
        return 4
      case '6M':
        return 5
      case 'YTD':
        return 6
      case '1Y':
        return 7
      case 'ALL':
        return 8
      default:
        return 0
    }
  }

  // 외부에서 xAxisUnit/period가 변경되면 내부 선택값 동기화
  useEffect(() => {
    if (xAxisUnit) {
      setSelectedPeriod(xAxisUnit)
    }
  }, [xAxisUnit])

  useEffect(() => {
    if (period) {
      setSelectedRange(period)
    }
  }, [period])

  const handleChartVisibilityToggle = useCallback((label: string, dataType: string, isShow: boolean) => {
    const key = `${label}_${dataType}`
    setChartVisibilityMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, isShow)
      return newMap
    })
  }, [])

  // IForecastChartData를 ChartData 형식으로 변환
  const convertedChartData = useMemo<ChartData[]>(() => {
    // x축 라벨(또는 날짜 문자열)을 차트에서 사용하는 타임스탬프로 변환
    const formatLabelToTimestamp = (label: string): string => {
      // xAxisUnit이 1D가 아니고 dateList가 있으면, label을 dateList의 label과 매칭
      if (chartData?.xAxisUnit && chartData.xAxisUnit !== '1D' && chartData.dateList?.length) {
        const matched = chartData.dateList.find((item) => item.label === label)
        if (matched) {
          const src = matched.startDate
          if (/^\d{8}$/.test(src)) {
            const y = src.slice(0, 4)
            const m = src.slice(4, 6)
            const d = src.slice(6, 8)
            return dayjs(`${y}-${m}-${d}`).format('YYYY-MM-DDTHH:mm:ss')
          }
          return dayjs(src).format('YYYY-MM-DDTHH:mm:ss')
        }
      }

      // 기본: YYYYMMDD 형식 처리
      if (/^\d{8}$/.test(label)) {
        const y = label.slice(0, 4)
        const m = label.slice(4, 6)
        const d = label.slice(6, 8)
        return dayjs(`${y}-${m}-${d}`).format('YYYY-MM-DDTHH:mm:ss')
      }

      // dayjs가 인식 가능한 형식이면 그대로 사용
      const parsed = dayjs(label)
      if (parsed.isValid()) {
        return parsed.format('YYYY-MM-DDTHH:mm:ss')
      }

      // 최후의 수단: 현재 날짜로 대체 (invalid date 방지)
      return dayjs().format('YYYY-MM-DDTHH:mm:ss')
    }

    // hoverReportCardInfo가 있고 predictionResultList가 있으면 그것을 사용
    if (hoverReportCardInfo?.predictionResultList && hoverReportCardInfo.predictionResultList.length > 0) {
      const resultList = hoverReportCardInfo.predictionResultList

      // 날짜 형식 변환: "20251215" -> "2025-12-15"
      const formatDate = (dateStr: string) => {
        if (dateStr.length === 8) {
          return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        }
        return dateStr
      }
      
      const timestamps = resultList.map((item) => dayjs(formatDate(item.date)).format('YYYY-MM-DDTHH:mm:ss'))
      const values = resultList.map((item) => {
        const value = item.value
        if (value === null || value === undefined) {
          return null
        }
        return Number(value)
      })

      return [
        {
          goodsDataSourceName: hoverReportCardInfo.predictChartDetailExpn,
          goodsDataSourceNo: hoverReportCardInfo.associatedGoodsDataSourceNo,
          chartType: ChartType.LINE,
          timestamps,
          series: [
            {
              seriesId: 'main',
              label: hoverReportCardInfo.predictChartDetailExpn,
              renderAs: 'MAIN',
              values,
              isVisible: true,
            },
          ],
          unitCd: chartData?.metadata.currentUnitCd || '',
          goodsDataName: hoverReportCardInfo.predictChartDetailExpn,
          dataType: 'FORECAST',
        } as ChartData & { dataType?: string },
      ]
    }

    // 기본적으로 chartData 사용
    if (!chartData?.charts) return []

    const result: ChartData[] = []

    chartData.charts.forEach((chart) => {
      // actualChartLines 처리
      if (chart.actualChartLines.rawData && chart.actualChartLines.rawData.length > 0) {
        const timestamps = chart.actualChartLines.rawData.map((item) => formatLabelToTimestamp(item.resultDate))

        const values = chart.actualChartLines.rawData.map((item) => {
          const value = item.value
          if (value === null || value === undefined) {
            return null
          }
          return Number(value)
        })

        result.push({
          goodsDataSourceName: chart.chartLineDescription,
          goodsDataSourceNo: chart.actualChartLines.goodsDataSourceNo,
          chartType: ChartType.LINE,
          timestamps,
          series: [
            {
              seriesId: 'main',
              label: chart.chartLineDescription,
              renderAs: 'MAIN',
              values,
              isVisible: true,
            },
          ],
          unitCd: chartData.metadata.currentUnitCd,
          goodsDataName: chart.chartLineDescription,
          dataType: chart.actualChartLines.dataType,
        } as ChartData & { dataType?: string })
      }

      // forecastChartLines 처리
      if (chart.forecastChartLines.rawData && chart.forecastChartLines.rawData.length > 0) {
        const timestamps = chart.forecastChartLines.rawData.map((item) => formatLabelToTimestamp(item.resultDate))

        const values = chart.forecastChartLines.rawData.map((item) => {
          const value = item.value
          if (value === null || value === undefined) {
            return null
          }
          return Number(value)
        })

        result.push({
          goodsDataSourceName: chart.chartLineDescription,
          goodsDataSourceNo: chart.forecastChartLines.goodsDataSourceNo,
          chartType: ChartType.LINE,
          timestamps,
          series: [
            {
              seriesId: 'main',
              label: chart.chartLineDescription,
              renderAs: 'MAIN',
              values,
              isVisible: true,
            },
          ],
          unitCd: chartData.metadata.currentUnitCd,
          goodsDataName: chart.chartLineDescription,
          dataType: chart.forecastChartLines.dataType,
        } as ChartData & { dataType?: string })
      }
    })

    return result
  }, [chartData, hoverReportCardInfo])

  const charts = useMemo(() => convertedChartData, [convertedChartData])

  const colors = useMemo(
    () => ['#EFA460', '#40597A', '#2F62A3', '#26757B', '#94826B', '#8F5B5D', '#819E9A', '#7D68A4', '#EFD485', '#5C5C5C', '#363434'],
    [],
  )

  // 색상 맵 생성 (차트와 레전드에서 공통 사용)
  const chartColorMap = useMemo(() => {
    const colorMap = new Map<string, string>()
    let colorIndex = 0

    convertedChartData.forEach((chart) => {
      const originalLabel = chart.goodsDataSourceName ?? ''
      if (!colorMap.has(originalLabel)) {
        colorMap.set(originalLabel, colors[colorIndex % colors.length])
        colorIndex++
      }
    })

    return colorMap
  }, [convertedChartData, colors])

  // legend 정보 추출
  const legendInfo = useMemo(() => {
    const forecastLegends: Array<{ type: 'forecast' | 'actual'; color: string; label: string; dataType: string; originalLabel: string }> =
      []
    const actualLegends: Array<{ type: 'forecast' | 'actual'; color: string; label: string; dataType: string; originalLabel: string }> = []

    convertedChartData.forEach((chart) => {
      const dataType = (chart as ChartData & { dataType?: string }).dataType ?? ''
      const isForecast = dataType === 'FORECAST'
      const originalLabel = chart.goodsDataSourceName ?? ''
      const chartColor = chartColorMap.get(originalLabel)!

      // 팝업에 표시될 라벨: 대문자로 변환 (+ FORECAST인 경우 " FORECAST" 추가)
      const baseLabel = originalLabel.toUpperCase()
      const displayLabel = isForecast ? `${baseLabel} FORECAST` : baseLabel

      const legendItem = {
        type: (isForecast ? 'forecast' : 'actual') as 'forecast' | 'actual',
        color: chartColor,
        label: displayLabel,
        dataType,
        originalLabel,
      }

      if (isForecast) {
        forecastLegends.push(legendItem)
      } else {
        actualLegends.push(legendItem)
      }
    })

    return { forecastLegends, actualLegends }
  }, [convertedChartData, chartColorMap])

  // 그래프 리셋
  const handleReset = useCallback(() => {
    chartGraphRef.current?.resetZoom()
    setChartVisibilityMap(new Map())
  }, [])

  // 그래프 다운로드
  const handleDownload = useCallback(() => {
    const canvas = chartGraphRef.current?.getCanvas()
    if (!canvas || canvas.width === 0 || canvas.height === 0) return

    // 파일 이름 생성
    const chartName = hoverReportCardInfo?.predictChartDetailExpn || chartData?.metadata.tableHeader || 'Forecast'
    const lastUpdateDt = chartData?.metadata.lastUpdateDt || hoverReportCardInfo?.predictionFulfillDt || dayjs().format('YYYYMMDD')

    // 날짜 형식 변환 (YYYYMMDD -> YYYY-MM-DD)
    let formattedDate = lastUpdateDt
    if (/^\d{8}$/.test(lastUpdateDt)) {
      const y = lastUpdateDt.slice(0, 4)
      const m = lastUpdateDt.slice(4, 6)
      const d = lastUpdateDt.slice(6, 8)
      formattedDate = `${y}-${m}-${d}`
    } else {
      // 이미 YYYY-MM-DD 형식이거나 다른 형식인 경우 dayjs로 파싱 시도
      const parsed = dayjs(lastUpdateDt)
      if (parsed.isValid()) {
        formattedDate = parsed.format('YYYY-MM-DD')
      }
    }

    const fileName = `${chartName} Forecast_${formattedDate}.png`

    // 임시 캔버스 생성하여 하얀 배경색 적용
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    // 하얀 배경색 설정
    tempCtx.fillStyle = '#FFFFFF'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // 원본 캔버스를 임시 캔버스에 그리기
    tempCtx.drawImage(canvas, 0, 0)

    // 다운로드 링크 생성
    const link = document.createElement('a')
    link.download = fileName
    link.href = tempCanvas.toDataURL('image/png', 1.0)
    link.click()
  }, [chartData, hoverReportCardInfo])

  useEffect(() => {
    onFixedModeChange?.(isFixedMode)
  }, [isFixedMode, onFixedModeChange])

  return (
    <Stack direction="row">
      <Stack flexGrow={1}>
        <Stack direction="row" p="6px 30px" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap="6px" minWidth="224px" height="36px">
            {periodOptions.map((option) => (
              <Box
                key={option.value}
                component="button"
                onClick={() => {
                  const newXAxisUnit = option.value
                  // X축 단위 선택 시: 단위가 전체기간보다 크면 경고 후 무시
                  if (period && getScale(newXAxisUnit) > getScale(period)) {
                    showSnackbar('X축 단위는 전체 기간보다 클 수 없습니다.', { variant: 'error' })
                    return
                  }
                  setSelectedPeriod(newXAxisUnit)
                  onXAxisUnitChange?.(newXAxisUnit)
                }}
                sx={{
                  width: '40px',
                  height: '36px',
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedPeriod === option.value ? '#E9ECEF' : 'transparent',
                  color: '#212529',
                  fontFamily: 'Pretendard',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '140%',
                  letterSpacing: '0%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: selectedPeriod === option.value ? '#E9ECEF' : 'rgba(233, 236, 239, 0.5)',
                  },
                }}
              >
                {option.label}
              </Box>
            ))}
          </Stack>
          {/* 우측 컨트롤 영역: Reset / Download 버튼 */}
          <Stack direction="row" alignItems="center" gap="8px">
            <MIBaseButton
              prefix={<RefreshIcon color="gray.70" />}
              sx={{ height: '36px', justifyContent: 'center' }}
              onClick={handleReset}
            >
              Reset
            </MIBaseButton>
            <MIBaseButton sx={{ height: '36px', padding: '8px' }} onClick={handleDownload}>
              <ChartDownloadIcon fill="#495057" />
            </MIBaseButton>
          </Stack>
        </Stack>
        <Box padding="0 30px">
          <Stack>
            {/* Unit 표시 영역 */}
            <Box
              sx={{
                width: '100%',
                height: '17px',
                display: 'flex',
                alignItems: 'center',
                marginTop: '21px',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Pretendard',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                  textAlign: 'right',
                  fontVariantNumeric: 'lining-nums tabular-nums',
                  color: '#212529',
                }}
              >
                {`Unit: ${chartData?.metadata.tableHeader ?? '-'}`}
              </Typography>
            </Box>

            <ForecastChartGraph
              ref={chartGraphRef}
              height="556px"
              chartType={ChartType.LINE}
              charts={charts}
              currency={chartData?.metadata.currency}
              unitCd={chartData?.metadata.currentUnitCd}
              chartVisibilityMap={chartVisibilityMap}
              hoveredChartKey={hoveredChartKey}
              hoverReportCardInfo={hoverReportCardInfo}
              isLoading={chartDataIsLoading}
              onFixedModeChange={setIsFixedMode}
              chartColorMap={chartColorMap}
              monthSelect={monthSelect}
              // spanGaps
            />
          </Stack>
        </Box>

        {/* 그래프 하단 컨트롤 영역 */}
        <Box
          sx={{
            width: '100%',
            padding: '8px 30px',
            boxSizing: 'border-box',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {/* 하단 기간 버튼 그룹 */}
            <Stack direction="row" alignItems="center" gap="6px" height="36px">
              {rangeOptions.map((option) => (
                <Box
                  key={option.value}
                  component="button"
                  onClick={() => {
                    const newPeriod = option.value
                    const currentXAxis = xAxisUnit || selectedPeriod
                    // 전체기간 선택 시: 전체기간이 X축 단위보다 작으면 경고 후 무시
                    if (currentXAxis && getScale(newPeriod) < getScale(currentXAxis)) {
                      showSnackbar('전체 기간은 X축 단위보다 작을 수 없습니다.', { variant: 'error' })
                      return
                    }
                    setSelectedRange(newPeriod)
                    onPeriodChange?.(newPeriod)
                  }}
                  sx={{
                    minWidth: '40px',
                    height: '36px',
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: selectedRange === option.value ? '#E9ECEF' : 'transparent',
                    color: '#212529',
                    fontFamily: 'Pretendard',
                    fontWeight: 600,
                    fontSize: '16px',
                    lineHeight: '140%',
                    letterSpacing: '0%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: selectedRange === option.value ? '#E9ECEF' : 'rgba(233, 236, 239, 0.5)',
                    },
                  }}
                >
                  {option.label}
                </Box>
              ))}
            </Stack>

            {/* 오른쪽 Last Update 영역 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: '36px',
                borderRadius: '10px',
                gap: '8px',
                paddingY: '8px',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Pretendard',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '140%',
                  letterSpacing: '0%',
                  verticalAlign: 'middle',
                  color: '#495057',
                }}
              >
                Last Update
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'Pretendard',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '140%',
                  letterSpacing: '0%',
                  verticalAlign: 'middle',
                  color: '#495057',
                }}
              >
                {chartData?.metadata.lastUpdateDt || '-'}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>

        <Stack width="232px" flexShrink={0} p="10px 12px" gap="20px" boxSizing="border-box" position="relative">
          {/* 스켈레톤 */}
          <Box
            sx={{
              position: 'absolute',
              top: '10px',
              left: '12px',
              right: '12px',
              opacity: chartDataIsLoading ? 1 : 0,
              pointerEvents: chartDataIsLoading ? 'auto' : 'none',
              transition: 'opacity 0.3s ease-in-out',
              zIndex: chartDataIsLoading ? 1 : 0,
            }}
          >
            <Stack gap="20px">
              {/* Forecast 섹션 스켈레톤 */}
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width="80px" height="16px" />
                {[1, 2, 3].map((index) => (
                  <Box key={`skeleton-forecast-${index}`} padding="6px">
                    <Stack direction="row" gap="8px" alignItems="center">
                      <MIBaseSkeleton.BaseElement width="26px" height="26px" sx={{ borderRadius: '4px', flexShrink: 0 }} />
                      <Stack flex={1} gap="4px">
                        <MIBaseSkeleton.TextLine width="100%" height="14px" />
                        <MIBaseSkeleton.TextLine width="60%" height="12px" />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
              {/* Actual 섹션 스켈레톤 */}
              <Stack gap="8px">
                <MIBaseSkeleton.TextLine width="60px" height="16px" />
                {[1, 2].map((index) => (
                  <Box key={`skeleton-actual-${index}`} padding="6px">
                    <Stack direction="row" gap="8px" alignItems="center">
                      <MIBaseSkeleton.BaseElement width="26px" height="26px" sx={{ borderRadius: '4px', flexShrink: 0 }} />
                      <Stack flex={1} gap="4px">
                        <MIBaseSkeleton.TextLine width="100%" height="14px" />
                        <MIBaseSkeleton.TextLine width="60%" height="12px" />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Box>

          <Box
            sx={{
              position: 'relative',
              opacity: chartDataIsLoading ? 0 : 1,
              pointerEvents: chartDataIsLoading ? 'none' : 'auto',
              transition: 'opacity 0.3s ease-in-out',
              zIndex: chartDataIsLoading ? 0 : 2,
            }}
          >
            {legendInfo.forecastLegends.length > 0 && (
              <Stack gap="8px">
                <Typography variant="tableHeaderSemibold" color="contentText.Normal">
                  Forecast
                </Typography>
                {legendInfo.forecastLegends.map((legend, index) => {
                  const visibilityKey = `${legend.originalLabel}_${legend.dataType}`
                  const isShow = chartVisibilityMap.get(visibilityKey) !== false
                  return (
                    <Box
                      key={`forecast-${index}`}
                      onMouseEnter={() => !isFixedMode && setHoveredChartKey(isShow ? visibilityKey : null)}
                      onMouseLeave={() => !isFixedMode && setHoveredChartKey(null)}
                      sx={{
                        opacity: isFixedMode ? 0.6 : 1,
                      }}
                    >
                      <ForecastChartLegend
                        type={legend.type}
                        color={legend.color}
                        label={legend.label}
                        description="Standard Model"
                        isShow={isShow}
                        onToggle={(show) => !isFixedMode && handleChartVisibilityToggle(legend.originalLabel, legend.dataType, show)}
                        isFixedMode={isFixedMode}
                        disableMenu={disableLegendMenu}
                      />
                    </Box>
                  )
                })}
              </Stack>
            )}
            {legendInfo.actualLegends.length > 0 && (
              <Stack gap="8px">
                <Typography variant="tableHeaderSemibold" color="contentText.Normal">
                  Actual
                </Typography>
                {legendInfo.actualLegends.map((legend, index) => {
                  const visibilityKey = `${legend.originalLabel}_${legend.dataType}`
                  const isShow = chartVisibilityMap.get(visibilityKey) !== false
                  return (
                    <Box
                      key={`actual-${index}`}
                      onMouseEnter={() => !isFixedMode && setHoveredChartKey(isShow ? visibilityKey : null)}
                      onMouseLeave={() => !isFixedMode && setHoveredChartKey(null)}
                      sx={{
                        opacity: isFixedMode ? 0.6 : 1,
                      }}
                    >
                      <ForecastChartLegend
                        type={legend.type}
                        color={legend.color}
                        label={legend.label}
                        description="Standard Model"
                        isShow={isShow}
                        onToggle={(show) => !isFixedMode && handleChartVisibilityToggle(legend.originalLabel, legend.dataType, show)}
                        isFixedMode={isFixedMode}
                        disableMenu={disableLegendMenu}
                      />
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Box>
        </Stack>
    </Stack>
  )
}

export default ForecastChart