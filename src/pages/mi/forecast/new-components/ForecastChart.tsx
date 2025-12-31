import CandlestickChartIcon from '@mui/icons-material/CandlestickChart'
import LineAxisIcon from '@mui/icons-material/LineAxis'
import { Box, Divider, Stack, Switch, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import ChartNotificationIcon from '@/components/common/forecast-chart/icons/ChartNotificationIcon'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import ForecastChartGraph, { ForecastChartGraphHandle } from '@/pages/mi/forecast/new-components/ForecastChartGraph'
import ForecastChartLegend from '@/pages/mi/forecast/new-components/ForecastChartLegend'
import { IForecastChartData } from '@/service/mi/forecast'
import theme from '@/theming'
import { ChartType, ChartData } from '@/types/dataDetailChart'

const chartOptions = [
  {
    icon: <LineAxisIcon />,
    label: 'Line',
    value: 'line',
  },
  {
    icon: <CandlestickChartIcon />,
    label: 'Candles',
    value: 'candles',
  },
]

interface ForecastChartProps {
  hoverReportCardInfo?: { goodsDataSourceNo: number; startDate: string; endDate: string } | null
  chartData?: IForecastChartData
  chartDataIsLoading?: boolean
  onFixedModeChange?: (isFixedMode: boolean) => void
}

const ForecastChart = ({ hoverReportCardInfo, chartData, chartDataIsLoading, onFixedModeChange }: ForecastChartProps) => {
  const [selectedChartOption, setSelectedChartOption] = useState('line')
  const [isAutosave, setIsAutosave] = useState(false)
  const [chartVisibilityMap, setChartVisibilityMap] = useState<Map<string, boolean>>(new Map())
  const [hoveredChartKey, setHoveredChartKey] = useState<string | null>(null)
  const [isFixedMode, setIsFixedMode] = useState(false)
  const chartGraphRef = useRef<ForecastChartGraphHandle>(null)

  const handleChartVisibilityToggle = useCallback((label: string, dataType: string, isShow: boolean) => {
    const key = `${label}_${dataType}`
    setChartVisibilityMap((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, isShow)
      return newMap
    })
  }, [])

  const handleReset = useCallback(() => {
    chartGraphRef.current?.resetZoom()
    setChartVisibilityMap(new Map())
  }, [])

  // IForecastChartData를 ChartData 형식으로 변환
  const convertedChartData = useMemo<ChartData[]>(() => {
    if (!chartData?.charts) return []

    const result: ChartData[] = []

    chartData.charts.forEach((chart) => {
      // actualChartLines 처리
      if (chart.actualChartLines.rawData && chart.actualChartLines.rawData.length > 0) {
        const timestamps = chart.actualChartLines.rawData.map((item) => dayjs(item.resultDate).format('YYYY-MM-DDTHH:mm:ss'))

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
          unitCd: chartData.dashboardMetadata.currentUnitCd,
          goodsDataName: chart.chartLineDescription,
          dataType: chart.actualChartLines.dataType,
        } as ChartData & { dataType?: string })
      }

      // forecastChartLines 처리
      if (chart.forecastChartLines.rawData && chart.forecastChartLines.rawData.length > 0) {
        const timestamps = chart.forecastChartLines.rawData.map((item) => dayjs(item.resultDate).format('YYYY-MM-DDTHH:mm:ss'))

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
          unitCd: chartData.dashboardMetadata.currentUnitCd,
          goodsDataName: chart.chartLineDescription,
          dataType: chart.forecastChartLines.dataType,
        } as ChartData & { dataType?: string })
      }
    })

    return result
  }, [chartData])

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

  useEffect(() => {
    onFixedModeChange?.(isFixedMode)
  }, [isFixedMode, onFixedModeChange])

  return (
    <Stack direction="row">
      <Stack flexGrow={1}>
        <Stack direction="row" p="6px 30px" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap="8px">
            <Typography variant="body2M14" color="contentText.Normal">
              Last Update
            </Typography>
            <Typography variant="body2M14" color="contentText.Normal">
              2025-12-08 15:32
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap="8px">
            <MISelectMenu
              selected={selectedChartOption}
              onSelected={(selected: string) => setSelectedChartOption(selected)}
              items={chartOptions}
              sx={{
                height: '36px',
              }}
              hideChevron
            />
            <MIBaseButton prefix={<RefreshIcon color="gray.70" />} sx={{ height: '36px', justifyContent: 'center' }} onClick={handleReset}>
              Reset
            </MIBaseButton>
            <Divider orientation="vertical" flexItem />
            <MIBaseButton sx={{ height: '36px', padding: '8px' }}>
              <ChartNotificationIcon fill={theme.palette.gray[70]} />
            </MIBaseButton>
            <MIBaseButton sx={{ height: '36px', padding: '8px' }}>
              <ChartDownloadIcon fill={theme.palette.gray[70]} />
            </MIBaseButton>
            <Divider orientation="vertical" flexItem />
            <Box padding="6px" boxSizing="border-box">
              <Stack
                direction="row"
                alignItems="center"
                gap="8px"
                onClick={() => setIsAutosave(!isAutosave)}
                sx={{
                  cursor: 'pointer',
                }}
              >
                <Switch size="small" checked={isAutosave} sx={{ mr: '0' }} />
                <Typography
                  variant="body1M16"
                  color={isAutosave ? 'contentText.Normal' : 'contentText.Subtext'}
                  sx={{
                    transition: 'color 0.3s',
                  }}
                >
                  Autosave
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Stack>
        <Box padding="0 30px">
          <ForecastChartGraph
            ref={chartGraphRef}
            height="556px"
            chartType={selectedChartOption === 'line' ? ChartType.LINE : ChartType.CANDLE}
            charts={charts}
            currency={chartData?.dashboardMetadata.currency}
            unitCd={chartData?.dashboardMetadata.currentUnitCd}
            chartVisibilityMap={chartVisibilityMap}
            hoveredChartKey={hoveredChartKey}
            hoverReportCardInfo={hoverReportCardInfo}
            isLoading={chartDataIsLoading}
            onFixedModeChange={setIsFixedMode}
            chartColorMap={chartColorMap}
            // spanGaps
          />
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
