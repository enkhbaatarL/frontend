import { Box, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import ChartDownloadIcon from '@/components/common/forecast-chart/icons/ChartDownloadIcon'
import RefreshIcon from '@/components/common/icons/RefreshIcon'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import useSnackbar from '@/hooks/useSnackbar'
import ForecastChartGraph, { ForecastChartGraphHandle } from '@/pages/mi/forecast/new-components/ForecastChartGraph'
import ForecastChartLegend from '@/pages/mi/forecast/new-components/ForecastChartLegend'
import { IForecastChartInfo, IForecastReport } from '@/service/mi/forecast'
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
  companyNo?: number
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
  companyNo,
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
    /**
     * x축 매핑 기준을 rawData.startDate(YYYYMMDD)로 통일한다.
     * - timestamps: startDate 기반 (툴팁/크로스헤어/리포트 호버 구간 모두 동일 기준)
     * - resultDates(표시용 라벨): startDate가 dateList 구간에 포함되면 해당 label 사용 (예: W45 2025)
     */
    const ymdToTimestamp = (ymd: string): string => {
      if (/^\d{8}$/.test(ymd)) {
        const y = ymd.slice(0, 4)
        const m = ymd.slice(4, 6)
        const d = ymd.slice(6, 8)
        return dayjs(`${y}-${m}-${d}`).format('YYYY-MM-DDTHH:mm:ss')
      }
      const parsed = dayjs(ymd)
      return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm:ss') : dayjs().format('YYYY-MM-DDTHH:mm:ss')
    }

    const normalizeYmd = (d: string): string => {
      if (/^\d{8}$/.test(d)) return d
      const parsed = dayjs(d)
      return parsed.isValid() ? parsed.format('YYYYMMDD') : ''
    }

    const getDisplayLabelByStartDate = (startDate: string): string | undefined => {
      const startNorm = normalizeYmd(startDate)
      if (!startNorm || !chartData?.dateList?.length) return undefined

      // startDate가 dateList의 start~end 사이에 포함되는 항목을 찾는다.
      const matched = chartData.dateList.find((item) => {
        const itemStart = normalizeYmd(item.startDate)
        const itemEnd = normalizeYmd(item.endDate)
        if (!itemStart || !itemEnd) return false
        return startNorm >= itemStart && startNorm <= itemEnd
      })
      return matched?.label
    }

    // 기본적으로 chartData 사용 (호버 시에도 기본 그래프는 유지하고, 흐리게 표시 후 highlight로 새 데이터만 선명하게 그림)
    if (!chartData?.charts) return []

    const result: ChartData[] = []

    chartData.charts.forEach((chart) => {
      // actualChartLines 처리 - dataExplanation 사용
      if (chart.actualChartLines.rawData && chart.actualChartLines.rawData.length > 0) {
        const displayName = chart.actualChartLines.dataExplanation || chart.chartLineDescription
        const timestamps = chart.actualChartLines.rawData.map((item) => ymdToTimestamp(item.startDate))
        const resultDates = chart.actualChartLines.rawData.map((item) => getDisplayLabelByStartDate(item.startDate) ?? item.resultDate)

        const values = chart.actualChartLines.rawData.map((item) => {
          const value = item.value
          if (value === null || value === undefined) {
            return null
          }
          return Number(value)
        })

        result.push({
          goodsDataSourceName: displayName,
          goodsDataSourceNo: chart.actualChartLines.goodsDataSourceNo,
          chartType: ChartType.LINE,
          timestamps,
          resultDates,
          series: [
            {
              seriesId: 'main',
              label: displayName,
              renderAs: 'MAIN',
              values,
              isVisible: true,
            },
          ],
          unitCd: chartData.metadata.currentUnitCd,
          goodsDataName: displayName,
          dataType: chart.actualChartLines.dataType,
        } as ChartData & { dataType?: string; resultDates?: string[] })
      }

      // forecastChartLines 처리 - dataExplanation 사용
      if (chart.forecastChartLines.rawData && chart.forecastChartLines.rawData.length > 0) {
        const displayName = chart.forecastChartLines.dataExplanation || chart.chartLineDescription
        const timestamps = chart.forecastChartLines.rawData.map((item) => ymdToTimestamp(item.startDate))
        const resultDates = chart.forecastChartLines.rawData.map((item) => getDisplayLabelByStartDate(item.startDate) ?? item.resultDate)
        const predictDates = chart.forecastChartLines.rawData.map((item) => item.predictDate || '')

        const values = chart.forecastChartLines.rawData.map((item) => {
          const value = item.value
          if (value === null || value === undefined) {
            return null
          }
          return Number(value)
        })

        result.push({
          goodsDataSourceName: displayName,
          goodsDataSourceNo: chart.forecastChartLines.goodsDataSourceNo,
          chartType: ChartType.LINE,
          timestamps,
          resultDates,
          series: [
            {
              seriesId: 'main',
              label: displayName,
              renderAs: 'MAIN',
              values,
              isVisible: true,
            },
          ],
          unitCd: chartData.metadata.currentUnitCd,
          goodsDataName: displayName,
          dataType: chart.forecastChartLines.dataType,
          predictDates,
        } as ChartData & { dataType?: string; predictDates?: string[]; resultDates?: string[] })
      }
    })

    return result
  }, [chartData])

  // 호버 시 리포트 기간(start~end)만 맞춰 predictionResultList를 highlight로 그림 (기본 그래프는 흐리게 유지)
  const highlightChartData = useMemo((): (ChartData & { dataType?: string; resultDates?: string[] }) | null => {
    if (!hoverReportCardInfo?.predictionResultList?.length || !chartData?.charts?.length) return null

    const resultList = hoverReportCardInfo.predictionResultList
    const reportStart = hoverReportCardInfo.startPredictionResultDt
    const reportEnd = hoverReportCardInfo.endPredictionResultDt

    // 날짜를 YYYYMMDD로 정규화 (형식 차이로 매칭 실패 방지)
    const toYyyyMmDd = (d: string): string => {
      if (/^\d{8}$/.test(d)) return d
      const parsed = dayjs(d)
      return parsed.isValid() ? parsed.format('YYYYMMDD') : ''
    }
    const reportStartNorm = toYyyyMmDd(reportStart)
    const reportEndNorm = toYyyyMmDd(reportEnd)
    const resultListByDate = new Map<string, number>()
    resultList.forEach((p) => {
      const key = toYyyyMmDd(p.date)
      if (key && p.value !== null && p.value !== undefined) resultListByDate.set(key, Number(p.value))
    })

    // 기본 차트의 x축(startDate) - 가장 긴 rawData 사용
    let baseStartDates: string[] = []
    let maxLen = 0
    chartData.charts.forEach((chart) => {
      const actualStartDates = chart.actualChartLines.rawData?.map((r) => r.startDate) ?? []
      const forecastStartDates = chart.forecastChartLines.rawData?.map((r) => r.startDate) ?? []
      const startDates = actualStartDates.length >= forecastStartDates.length ? actualStartDates : forecastStartDates
      if (startDates.length > maxLen) {
        maxLen = startDates.length
        baseStartDates = startDates
      }
    })
    if (baseStartDates.length === 0) return null

    const normalizeYmd = (d: string): string => {
      if (/^\d{8}$/.test(d)) return d
      const parsed = dayjs(d)
      return parsed.isValid() ? parsed.format('YYYYMMDD') : ''
    }

    const ymdToTimestamp = (ymd: string): string => {
      if (/^\d{8}$/.test(ymd)) {
        const y = ymd.slice(0, 4)
        const m = ymd.slice(4, 6)
        const d = ymd.slice(6, 8)
        return dayjs(`${y}-${m}-${d}`).format('YYYY-MM-DDTHH:mm:ss')
      }
      const parsed = dayjs(ymd)
      return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm:ss') : dayjs().format('YYYY-MM-DDTHH:mm:ss')
    }

    const getPeriodByStartDate = (startDate: string): { startNorm: string; endNorm: string; label?: string } | null => {
      const startNorm = normalizeYmd(startDate)
      if (!startNorm || !chartData.dateList?.length) return null
      const item = chartData.dateList.find((d) => {
        const itemStart = normalizeYmd(d.startDate)
        const itemEnd = normalizeYmd(d.endDate)
        if (!itemStart || !itemEnd) return false
        return startNorm >= itemStart && startNorm <= itemEnd
      })
      if (!item) return null
      const itemStartNorm = normalizeYmd(item.startDate)
      const itemEndNorm = normalizeYmd(item.endDate)
      if (!itemStartNorm || !itemEndNorm) return null
      return { startNorm: itemStartNorm, endNorm: itemEndNorm, label: item.label }
    }

    const resultDates = baseStartDates.map((sd) => getPeriodByStartDate(sd)?.label ?? sd)
    const timestamps = baseStartDates.map((sd) => ymdToTimestamp(sd))

    // 기간(reportStart~reportEnd)과 맞는 구간만 predictionResultList 값으로 채움.
    // 1D: 단일일 매칭, 1W/1M 등: dateList(start~end) 구간으로 매칭 후 구간 내 predictionResultList 평균.
    const values = baseStartDates.map((startDate) => {
      const datePeriod = getPeriodByStartDate(startDate)
      if (datePeriod) {
        // 1W 등: 구간(주)이 리포트 기간과 겹치면, 그 구간 안의 predictionResultList 값들의 평균(또는 단일값) 사용
        const { startNorm, endNorm } = datePeriod
        const overlaps = startNorm <= reportEndNorm && endNorm >= reportStartNorm
        if (!overlaps) return null
        const valsInPeriod: number[] = []
        resultListByDate.forEach((val, key) => {
          if (key >= startNorm && key <= endNorm) valsInPeriod.push(val)
        })
        if (valsInPeriod.length === 0) return null
        if (valsInPeriod.length === 1) return valsInPeriod[0]
        return valsInPeriod.reduce((a, b) => a + b, 0) / valsInPeriod.length
      }
      // 1D: 단일일 매칭
      const dateNorm = normalizeYmd(startDate)
      if (!dateNorm) return null
      if (dateNorm < reportStartNorm || dateNorm > reportEndNorm) return null
      const value = resultListByDate.get(dateNorm)
      return value !== undefined ? value : null
    })

    return {
      goodsDataSourceName: hoverReportCardInfo.predictChartDetailExpn,
      goodsDataSourceNo: hoverReportCardInfo.associatedGoodsDataSourceNo,
      chartType: ChartType.LINE,
      timestamps,
      resultDates,
      series: [
        {
          seriesId: 'main',
          label: hoverReportCardInfo.predictChartDetailExpn,
          renderAs: 'MAIN',
          values,
          isVisible: true,
        },
      ],
      unitCd: chartData?.metadata?.currentUnitCd ?? '',
      goodsDataName: hoverReportCardInfo.predictChartDetailExpn,
      dataType: 'FORECAST',
    } as ChartData & { dataType?: string; resultDates?: string[] }
  }, [chartData, hoverReportCardInfo])

  const charts = useMemo(() => convertedChartData, [convertedChartData])

  const colors = useMemo(
    () => ['#26757B', '#8F5B5D', '#2F62A3', '#94826B', '#819E9A', '#7D68A4', '#5C5C5C', '#363434', '#EFA460', '#40597A'],
    [],
  )

  // 특정 라벨에 대한 고정 색상
  const labelColorOverrides: Record<string, string> = useMemo(
    () => ({
      'Brent Crude': '#EFA460',
      'Dubai Crude': '#40597A',
    }),
    [],
  )

  const getOverrideColor = useCallback(
    (label: string): string | undefined => {
      const trimmed = label.trim()
      // 대소문자 무시하고 매칭
      const key = Object.keys(labelColorOverrides).find((k) => k.trim().toLowerCase() === trimmed.toLowerCase())
      return key ? labelColorOverrides[key] : undefined
    },
    [labelColorOverrides],
  )

  // 색상 맵 생성 (차트와 레전드에서 공통 사용)
  const chartColorMap = useMemo(() => {
    const colorMap = new Map<string, string>()
    let colorIndex = 0

    // 원본 chartData.charts를 기준으로 색상 할당
    if (chartData?.charts) {
      chartData.charts.forEach((chart) => {
        const originalLabel = chart.chartLineDescription ?? ''
        if (!colorMap.has(originalLabel)) {
          const overrideColor = getOverrideColor(originalLabel)
          colorMap.set(originalLabel, overrideColor ?? colors[colorIndex % colors.length])
          if (overrideColor === undefined) colorIndex++
        }
      })
    }

    return colorMap
  }, [chartData?.charts, colors, getOverrideColor])

  // legend 정보 추출 (호버 시 대응 forecast만 opacity 1, 나머지 흐리게 하기 위해 goodsDataSourceNo 포함)
  const legendInfo = useMemo(() => {
    const forecastLegends: Array<{
      type: 'forecast' | 'actual'
      color: string
      label: string
      dataType: string
      originalLabel: string
      goodsDataSourceNo: number
    }> = []
    const actualLegends: Array<{
      type: 'forecast' | 'actual'
      color: string
      label: string
      dataType: string
      originalLabel: string
      goodsDataSourceNo: number
    }> = []

    convertedChartData.forEach((chart) => {
      const dataType = (chart as ChartData & { dataType?: string }).dataType ?? ''
      const isForecast = dataType === 'FORECAST'
      const originalLabel = chart.goodsDataSourceName ?? ''
      const chartColor = chartColorMap.get(originalLabel)!

      const baseLabel = originalLabel.toUpperCase()
      const displayLabel = baseLabel

      const legendItem = {
        type: (isForecast ? 'forecast' : 'actual') as 'forecast' | 'actual',
        color: chartColor,
        label: displayLabel,
        dataType,
        originalLabel,
        goodsDataSourceNo: chart.goodsDataSourceNo,
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
            <MIBaseButton prefix={<RefreshIcon color="gray.70" />} sx={{ height: '36px', justifyContent: 'center' }} onClick={handleReset}>
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
              highlightChartData={highlightChartData}
              currency={chartData?.metadata.currency}
              unitCd={chartData?.metadata.currentUnitCd}
              chartVisibilityMap={chartVisibilityMap}
              hoveredChartKey={hoveredChartKey}
              hoverReportCardInfo={hoverReportCardInfo}
              isLoading={chartDataIsLoading}
              onFixedModeChange={setIsFixedMode}
              chartColorMap={chartColorMap}
              monthSelect={monthSelect}
              companyNo={companyNo}
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
                const isHoveredReportForecast =
                  hoverReportCardInfo !== null &&
                  hoverReportCardInfo !== undefined &&
                  legend.originalLabel === hoverReportCardInfo.predictChartDetailExpn
                const legendOpacity = hoverReportCardInfo ? (isHoveredReportForecast ? 1 : 0.2) : 1
                return (
                  <Box
                    key={`forecast-${index}`}
                    onMouseEnter={() => setHoveredChartKey(isShow ? visibilityKey : null)}
                    onMouseLeave={() => setHoveredChartKey(null)}
                    sx={{ opacity: legendOpacity, transition: 'opacity 0.2s ease-in-out' }}
                  >
                    <ForecastChartLegend
                      type={legend.type}
                      color={legend.color}
                      label={legend.label}
                      // description="Standard Model"
                      isShow={isShow}
                      onToggle={(show) => handleChartVisibilityToggle(legend.originalLabel, legend.dataType, show)}
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
                const legendOpacity = hoverReportCardInfo ? 0.2 : 1
                return (
                  <Box
                    key={`actual-${index}`}
                    onMouseEnter={() => setHoveredChartKey(isShow ? visibilityKey : null)}
                    onMouseLeave={() => setHoveredChartKey(null)}
                    sx={{ opacity: legendOpacity, transition: 'opacity 0.2s ease-in-out' }}
                  >
                    <ForecastChartLegend
                      type={legend.type}
                      color={legend.color}
                      label={legend.label}
                      // description="Standard Model"
                      isShow={isShow}
                      onToggle={(show) => handleChartVisibilityToggle(legend.originalLabel, legend.dataType, show)}
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
