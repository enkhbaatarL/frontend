import EastRoundedIcon from '@mui/icons-material/EastRounded'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useState, useRef, useEffect, useMemo } from 'react'

import aiIcon from '@/assets/ai.svg'
import MIButtonArrow from '@/components/common/button/MIButtonArrow'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
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
  onSeeAllReportClick,
}: ChartPageProps) => {
  const [hoverReportCardInfo, setHoverReportCardInfo] = useState<IForecastReport | null>(null)

  const handleHoverReportCardChange = (report: IForecastReport | null) => {
    setHoverReportCardInfo(report)
    onHoverReportCardChange?.(report)
  }
  const [canScroll, setCanScroll] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const cardListWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    const content = cardListWrapperRef.current ?? scrollContentRef.current

    const checkScrollable = () => {
      if (!container || !content) return
      const containerWidth = container.clientWidth
      const contentWidth = content.scrollWidth
      const needsScroll = containerWidth > 0 && contentWidth > containerWidth
      setCanScroll(needsScroll)
    }

    if (!container || !content) {
      return () => {}
    }

    checkScrollable()
    const resizeObserver = new ResizeObserver(checkScrollable)
    resizeObserver.observe(container)
    resizeObserver.observe(content)
    window.addEventListener('resize', checkScrollable)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', checkScrollable)
    }
  }, [forecastReports, forecastReportsIsLoading])

  // 스크롤 위치 업데이트
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return undefined
    }

    const handleScroll = () => {
      setScrollPosition(container.scrollLeft)
    }

    container.addEventListener('scroll', handleScroll)
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // cardWidth: minWidth 260px + gap 20px
  const CARD_SCROLL_AMOUNT = 280

  const handleSlide = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const delta = direction === 'right' ? CARD_SCROLL_AMOUNT : -CARD_SCROLL_AMOUNT

    container.scrollTo({
      left: container.scrollLeft + delta,
      behavior: 'smooth',
    })
  }

  // 왼쪽 끝인지 확인
  const isAtLeftEnd = () => {
    if (!scrollContainerRef.current) return true
    return scrollContainerRef.current.scrollLeft <= 10
  }

  // 오른쪽 끝인지 확인
  const isAtRightEnd = () => {
    if (!scrollContainerRef.current || !scrollContentRef.current) return true
    const container = scrollContainerRef.current
    const currentScrollLeft = container.scrollLeft
    const scrollWidth = scrollContentRef.current.scrollWidth
    const clientWidth = container.clientWidth
    return currentScrollLeft + clientWidth >= scrollWidth - 10
  }

  const showReportCardSkeleton = forecastReportsIsLoading && (!forecastReports || forecastReports.length === 0)

  const shouldShowRightButton = !showReportCardSkeleton && canScroll && !isAtRightEnd()
  const shouldShowLeftButton = !showReportCardSkeleton && canScroll && (!isAtLeftEnd() || isAtRightEnd())

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
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap="4px">
          <Stack direction="row" alignItems="center" gap="4px">
            <Box component="img" src={aiIcon} alt="AI" draggable={false} />
            <Typography variant="infoDocument" color="commonColor.Black">
              AI FORECAST REPORT
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap="12px">
            <Typography variant="body4" color="contentText.Subtext">
              {scheduleInfoText}
            </Typography>
            <Divider orientation="vertical" sx={{ height: '28px' }} />
            {/* <MISelectMenu
              variant="text"
              items={[
                { label: 'All Schedules', value: '' },
                { label: 'Scheduled', value: 'scheduled' },
                { label: 'Ad Hoc', value: 'ad_hoc' },
              ]}
              selected={''}
              onSelected={() => { }}
            /> */}
            <MISelectMenu
              variant="text"
              items={targetSelectItems}
              selected={selectedReportTarget}
              onSelected={(value: string) => onReportTargetChange?.(value)}
            />
          </Stack>
        </Stack>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '1332px',
          }}
        >
          <Box
            ref={scrollContainerRef}
            sx={{
              position: 'relative',
              width: '100%',
              overflowX: canScroll ? 'auto' : 'visible',
              overflowY: 'hidden',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <Stack
              ref={scrollContentRef}
              direction="row"
              gap="20px"
              sx={{
                width: 'fit-content',
                position: 'relative',
              }}
            >
              {/* 스켈레톤 */}
              <Stack
                direction="row"
                gap="20px"
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 'fit-content',
                  opacity: showReportCardSkeleton ? 1 : 0,
                  pointerEvents: showReportCardSkeleton ? 'auto' : 'none',
                  transition: 'opacity 0.3s ease-in-out',
                  zIndex: showReportCardSkeleton ? 1 : 0,
                }}
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Box key={`skeleton-${index}`} sx={{ flexShrink: 0 }}>
                    <ForecastReportCard isLoading={true} />
                  </Box>
                ))}
              </Stack>

              <Stack
                ref={cardListWrapperRef}
                direction="row"
                gap="20px"
                alignItems="flex-start"
                sx={{
                  position: 'relative',
                  width: 'fit-content',
                  minWidth: showReportCardSkeleton ? 5 * CARD_SCROLL_AMOUNT + 4 * 20 : undefined,
                  minHeight: 153,
                  opacity: showReportCardSkeleton ? 0 : 1,
                  pointerEvents: showReportCardSkeleton ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease-in-out',
                  zIndex: showReportCardSkeleton ? 0 : 2,
                }}
              >
                {(forecastReports ?? []).map((item: IForecastReport, index: number) => {
                  let fadeOpacity = 1
                  if (canScroll && scrollContainerRef.current) {
                    const container = scrollContainerRef.current
                    const cardLeft = index * CARD_SCROLL_AMOUNT
                    const containerRight = scrollPosition + container.clientWidth
                    const containerLeft = scrollPosition

                    const isRightFade =
                      !isAtRightEnd() && index === 4 && cardLeft < containerRight && cardLeft + CARD_SCROLL_AMOUNT > containerRight - 50

                    const isLeftFade =
                      (!isAtLeftEnd() || isAtRightEnd()) &&
                      index === 0 &&
                      cardLeft < containerLeft + 50 &&
                      cardLeft + CARD_SCROLL_AMOUNT > containerLeft

                    if (isRightFade) {
                      fadeOpacity = 0.3
                    } else if (isLeftFade) {
                      fadeOpacity = 0.5
                    }
                  }
                  return (
                    <Box
                      key={index}
                      onMouseEnter={() => handleHoverReportCardChange(item)}
                      onMouseLeave={() => handleHoverReportCardChange(null)}
                      sx={{
                        opacity: fadeOpacity,
                        flexShrink: 0,
                        transition: 'opacity 0.3s ease-out',
                        position: 'relative',
                      }}
                    >
                      <ForecastReportCard data={item} isLoading={false} onPopupClose={() => setHoverReportCardInfo(null)} />
                    </Box>
                  )
                })}
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  gap="4px"
                  padding="8px"
                  minWidth="110px"
                  minHeight="130px"
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
          </Box>
          {shouldShowRightButton && (
            <Box
              sx={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                pointerEvents: 'auto',
              }}
            >
              <MIButtonArrow direction="right" onClick={() => handleSlide('right')} />
            </Box>
          )}
          {shouldShowLeftButton && (
            <Box
              sx={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                pointerEvents: 'auto',
              }}
            >
              <MIButtonArrow direction="left" onClick={() => handleSlide('left')} />
            </Box>
          )}
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
