import EastRoundedIcon from '@mui/icons-material/EastRounded'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useState, useMemo, useEffect, useRef } from 'react'

import aiIcon from '@/assets/ai.svg'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import ForecastChart from '@/pages/mi/forecast/new-components/ForecastChart'
import ForecastReportCard from '@/pages/mi/forecast/new-components/ForecastReportCard'
import { IForecastChartInfo, ForecastBasicInfoTarget, IForecastReport, ReportPeriodUnitCd } from '@/service/mi/forecast'

interface ChartPageProps {
  chartData?: IForecastChartInfo
  chartDataIsLoading?: boolean
  monthSelect?: string
  targetList?: ForecastBasicInfoTarget[]
  forecastReports?: IForecastReport[]
  forecastReportsIsLoading?: boolean
  onHoverReportCardChange?: (report: IForecastReport | null) => void
  xAxisUnit?: string
  period?: string
  onXAxisUnitChange?: (value: string) => void
  onPeriodChange?: (value: string) => void
  companyNo?: number
  reportPeriodUnitCd?: ReportPeriodUnitCd
  selectedReportTarget?: string
  onReportTargetChange?: (value: string) => void
  scheduleFilter?: boolean | null
  onScheduleFilterChange?: (value: boolean | null) => void
  onSeeAllReportClick?: () => void
}

const ChartPage = ({
  chartData,
  chartDataIsLoading,
  monthSelect,
  targetList,
  forecastReports,
  forecastReportsIsLoading = false,
  onHoverReportCardChange,
  xAxisUnit,
  period,
  onXAxisUnitChange,
  onPeriodChange,
  companyNo,
  reportPeriodUnitCd,
  selectedReportTarget = '',
  onReportTargetChange,
  scheduleFilter = null,
  onScheduleFilterChange,
  onSeeAllReportClick,
}: ChartPageProps) => {
  const [hoverReportCardInfo, setHoverReportCardInfo] = useState<IForecastReport | null>(null)

  const handleHoverReportCardChange = (report: IForecastReport | null) => {
    setHoverReportCardInfo(report)
    onHoverReportCardChange?.(report)
  }

  const CARD_MIN_WIDTH = 280
  const CARD_GAP = 20

  const showReportCardSkeleton = forecastReportsIsLoading && (!forecastReports || forecastReports.length === 0)

  // 원하지 않는 스크롤 영역 제어
  const [isSkeletonTransitioningOut, setIsSkeletonTransitioningOut] = useState(false)
  const prevLoadingRef = useRef(showReportCardSkeleton)

  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    prevLoadingRef.current = showReportCardSkeleton

    if (wasLoading && !showReportCardSkeleton) {
      setIsSkeletonTransitioningOut(true)
      const id = setTimeout(() => setIsSkeletonTransitioningOut(false), 300)
      return () => clearTimeout(id)
    }
    return undefined
  }, [showReportCardSkeleton])

  const showSkeleton = showReportCardSkeleton || isSkeletonTransitioningOut

  const targetSelectItems = useMemo(
    () => [
      { label: 'All Targets', value: '' },
      ...(targetList ?? []).map(({ predictChartDetailExpn, goodsDataSourceNo }: ForecastBasicInfoTarget) => ({
        label: predictChartDetailExpn,
        value: String(goodsDataSourceNo),
      })),
    ],
    [targetList],
  )

  const scheduleInfoText = useMemo(() => {
    let periodUnit = null

    switch (reportPeriodUnitCd) {
      case ReportPeriodUnitCd.DAYS:
        periodUnit = 'daily'
        break
      case ReportPeriodUnitCd.WEEKS:
        periodUnit = 'weekly'
        break
      case ReportPeriodUnitCd.MONTHS:
        periodUnit = 'monthly'
        break
      case ReportPeriodUnitCd.QUARTERS:
        periodUnit = 'quarterly'
        break
      case ReportPeriodUnitCd.YEARS:
        periodUnit = 'yearly'
        break

      default:
        return null
    }

    return `Reports are generated primarily on a ${periodUnit} schedule`
  }, [reportPeriodUnitCd])

  return (
    <Stack py="20px" gap="20px" boxSizing="border-box" width="100%">
      <Stack p="12px 24px" gap="12px">
        <Stack direction="row" height="40px" justifyContent="space-between" alignItems="center" gap="4px">
          <Stack direction="row" alignItems="center" gap="4px">
            <Box component="img" src={aiIcon} alt="AI" draggable={false} />
            <Typography variant="infoDocument" color="commonColor.Black">
              AI FORECAST REPORT
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap="12px">
            {scheduleInfoText && (
              <>
                <Typography variant="body4" color="contentText.Subtext">
                  {scheduleInfoText}
                </Typography>
                {(companyNo === 2020 || (targetList?.length ?? 0) > 1) && <Divider orientation="vertical" sx={{ height: '28px' }} />}
                {companyNo === 2020 && (
                  <MISelectMenu
                    variant="text"
                    items={[
                      { label: 'All Schedules', value: null },
                      { label: 'Scheduled', value: true },
                      { label: 'Ad Hoc', value: false },
                    ]}
                    selected={scheduleFilter}
                    onSelected={(value: boolean | null) => {
                      onScheduleFilterChange?.(value)
                    }}
                  />
                )}
                {(targetList?.length ?? 0) > 1 && (
                  <MISelectMenu
                    variant="text"
                    items={targetSelectItems}
                    selected={selectedReportTarget}
                    onSelected={(value: string) => onReportTargetChange?.(value)}
                  />
                )}
              </>
            )}
          </Stack>
        </Stack>
        <Box sx={{ position: 'relative', width: '100%', maxWidth: '1332px' }}>
          <HorizontalScrollContainer
            key={`${selectedReportTarget}-${showSkeleton ? 'loading' : (forecastReports?.length ?? 0)}`}
            showScrollButtons={!showSkeleton}
            enableWheelScroll={!showSkeleton}
            buttonPadding={10}
            gradientWidth={200}
            sx={{ width: '100%' }}
            onScrollEnd={(elementUnderCursor) => {
              if (!forecastReports) return
              if (!elementUnderCursor) {
                handleHoverReportCardChange(null)
                return
              }
              const reportCardWrapper = elementUnderCursor.closest('[data-report-index]')
              if (reportCardWrapper) {
                const index = Number.parseInt((reportCardWrapper as HTMLElement).dataset.reportIndex ?? '', 10)
                if (!Number.isNaN(index) && forecastReports[index]) {
                  handleHoverReportCardChange(forecastReports[index])
                  return
                }
              }
              handleHoverReportCardChange(null)
            }}
          >
            <Stack direction="row" position="relative" width="fit-content" gap="20px">
              {/* 스켈레톤 - 페이드아웃 전환 후 DOM에서 제거하여 스크롤 영역 계산에 영향 없도록 함 */}
              {showSkeleton && (
                <Stack
                  direction="row"
                  gap="20px"
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 'fit-content',
                    zIndex: 1,
                    opacity: isSkeletonTransitioningOut ? 0 : 1,
                    pointerEvents: isSkeletonTransitioningOut ? 'none' : 'auto',
                    transition: 'opacity 0.3s ease-in-out',
                  }}
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Box key={`skeleton-${index}`} sx={{ flexShrink: 0 }}>
                      <ForecastReportCard isLoading={true} />
                    </Box>
                  ))}
                </Stack>
              )}

              <Stack
                direction="row"
                gap="20px"
                alignItems="flex-start"
                sx={{
                  position: 'relative',
                  width: 'fit-content',
                  minWidth: showReportCardSkeleton ? 5 * CARD_MIN_WIDTH + 4 * CARD_GAP : undefined,
                  minHeight: 154,
                  opacity: showReportCardSkeleton ? 0 : 1,
                  pointerEvents: showReportCardSkeleton ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease-in-out',
                  zIndex: showReportCardSkeleton ? 0 : 2,
                }}
              >
                {(forecastReports ?? []).map((item: IForecastReport, index: number) => (
                  <Box
                    key={index}
                    data-report-index={index}
                    onMouseEnter={() => handleHoverReportCardChange(item)}
                    onMouseLeave={() => handleHoverReportCardChange(null)}
                    sx={{ flexShrink: 0 }}
                  >
                    <ForecastReportCard data={item} isLoading={false} onPopupClose={() => setHoverReportCardInfo(null)} />
                  </Box>
                ))}
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  gap="4px"
                  padding="8px"
                  minWidth="110px"
                  minHeight="130px"
                  height="100%"
                  boxSizing="border-box"
                  bgcolor="commonColor.White"
                  borderRadius="10px"
                  border="1px solid"
                  borderColor="contentBorder.Normal"
                  sx={{
                    cursor: 'pointer',
                    flexShrink: 0,
                    '&:hover': {
                      backgroundColor: 'contentBG.Hover',
                      borderColor: 'contentBorder.Hover',
                    },
                  }}
                  onClick={() => onSeeAllReportClick?.()}
                >
                  <Typography variant="labelText" color="contentText.Normal">
                    See All Report
                  </Typography>
                  <EastRoundedIcon fontSize="small" sx={{ color: 'contentText.Normal' }} />
                </Stack>
              </Stack>
            </Stack>
          </HorizontalScrollContainer>
        </Box>
      </Stack>
      <ForecastChart
        hoverReportCardInfo={hoverReportCardInfo}
        chartData={chartData}
        chartDataIsLoading={chartDataIsLoading}
        monthSelect={monthSelect}
        xAxisUnit={xAxisUnit}
        period={period}
        onXAxisUnitChange={onXAxisUnitChange}
        onPeriodChange={onPeriodChange}
        disableLegendMenu={true}
        companyNo={companyNo}
      />
    </Stack>
  )
}

export default ChartPage
