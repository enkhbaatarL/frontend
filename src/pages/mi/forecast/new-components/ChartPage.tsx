import { Box, Stack, Typography } from '@mui/material'
import { useState, useRef, useEffect } from 'react'

import aiIcon from '@/assets/ai.svg'
import MIButtonArrow from '@/components/common/button/MIButtonArrow'
import ForecastChart from '@/pages/mi/forecast/new-components/ForecastChart'
import ForecastReportCard from '@/pages/mi/forecast/new-components/ForecastReportCard'
import { IForecastChartInfo, ForecastBasicInfoTarget, IForecastReport } from '@/service/mi/forecast'

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
}

const ChartPage = ({
  chartData,
  chartDataIsLoading,
  monthSelect,
  forecastReports,
  forecastReportsIsLoading = false,
  onHoverReportCardChange,
  xAxisUnit,
  period,
  onXAxisUnitChange,
  onPeriodChange,
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

  // 1332px 초과 여부 확인 및 스크롤 가능 여부 체크
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContentRef.current) {
        const contentWidth = scrollContentRef.current.scrollWidth
        const needsScroll = contentWidth > 1332
        setCanScroll(needsScroll)
      }
    }

    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 체크
    const timer = setTimeout(checkScrollable, 100)
    window.addEventListener('resize', checkScrollable)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkScrollable)
    }
  }, [forecastReports])

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

  const handleSlideRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = 280 // minWidth 260px + gap 20px
      const scrollAmount = cardWidth
      const newScrollLeft = container.scrollLeft + scrollAmount

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
    }
  }

  const handleSlideLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = 280 // minWidth 260px + gap 20px
      const scrollAmount = cardWidth
      const newScrollLeft = container.scrollLeft - scrollAmount

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
    }
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

  const shouldShowRightButton = canScroll && !isAtRightEnd()
  const shouldShowLeftButton = canScroll && (!isAtLeftEnd() || isAtRightEnd())

  return (
    <Stack py="20px" gap="20px" boxSizing="border-box" width="100%">
      <Stack p="12px 24px" gap="12px">
        <Stack direction="row" alignItems="center" gap="4px">
          <Box component="img" src={aiIcon} alt="AI" draggable={false} />
          <Typography variant="infoDocument" color="commonColor.Black">
            AI FORECAST REPORT
          </Typography>
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
              }}
            >
              {forecastReportsIsLoading && (!forecastReports || forecastReports.length === 0)
                ? // 로딩 중일 때 스켈레톤 카드 표시
                Array.from({ length: 5 }).map((_, index) => (
                  <Box
                    key={`skeleton-${index}`}
                    sx={{
                      flexShrink: 0,
                      position: 'relative',
                    }}
                  >
                    <ForecastReportCard isLoading={true} />
                  </Box>
                ))
                : // 데이터가 있을 때 실제 카드 표시
                (forecastReports ?? []).map((item: IForecastReport, index: number) => {
                  // 페이드 처리 로직
                  let fadeOpacity = 1
                  if (canScroll && scrollContainerRef.current) {
                    const container = scrollContainerRef.current
                    const cardWidth = 280 // minWidth 260px + gap 20px
                    const cardLeft = index * cardWidth
                    const containerRight = scrollPosition + container.clientWidth
                    const containerLeft = scrollPosition

                    // 오른쪽 끝 페이드: 5번째 카드(인덱스 4)가 오른쪽 끝에 살짝 보일 때 (오른쪽 끝이 아닐 때만)
                    const isRightFade =
                        !isAtRightEnd() && index === 4 && cardLeft < containerRight && cardLeft + cardWidth > containerRight - 50

                    // 왼쪽 끝 페이드: 첫 번째 카드(인덱스 0)가 왼쪽 끝에 살짝 보일 때 (왼쪽 끝이 아니거나 오른쪽 끝일 때)
                    // 왼쪽 페이드는 더 약하게 (0.5)
                    const isLeftFade =
                        (!isAtLeftEnd() || isAtRightEnd()) &&
                        index === 0 &&
                        cardLeft < containerLeft + 50 &&
                        cardLeft + cardWidth > containerLeft

                    if (isRightFade) {
                      fadeOpacity = 0.3
                    } else if (isLeftFade) {
                      fadeOpacity = 0.5 // 왼쪽 페이드는 더 약하게
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
              <MIButtonArrow direction="right" onClick={handleSlideRight} />
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
              <MIButtonArrow direction="left" onClick={handleSlideLeft} />
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
      />
    </Stack>
  )
}

export default ChartPage
