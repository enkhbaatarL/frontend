import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { debounce } from 'lodash-es'
import { useState, useEffect, useMemo, useRef } from 'react'

import ChartPage from '@/pages/mi/forecast/new-components/ChartPage'
import ForecastTab from '@/pages/mi/forecast/new-components/ForecastTab'
import RecordsTablePage from '@/pages/mi/forecast/new-components/RecordsTablePage'
import TablePage from '@/pages/mi/forecast/new-components/TablePage'
import forecastDataService, { IForecastReport } from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const STICKY_TOP_WHEN_SCROLLED = -14

const NewForecastPage = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const [monthSelect, setMonthSelect] = useState('')
  const [hoverReportCardInfo, setHoverReportCardInfo] = useState<IForecastReport | null>(null)
  const [selectedReportTarget, setSelectedReportTarget] = useState<string>('')
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null)
  const contentWrapperRef = useRef<HTMLDivElement | null>(null)

  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0

  // 회사별 기본 xAxisUnit / period 설정
  const getDefaultAxisAndPeriod = (companyNo: number) => {
    switch (companyNo) {
      case 2020:
        return { xAxisUnit: '1W', period: '3M' }
      case 2013:
        return { xAxisUnit: '1M', period: '3M' }
      case 2015:
        return { xAxisUnit: '1Q', period: '1Y' }
      default:
        return { xAxisUnit: '1D', period: '1W' }
    }
  }

  const [xAxisUnit, setXAxisUnit] = useState<string>('')
  const [period, setPeriod] = useState<string>('')

  const { data: basicInfo } = useQuery({
    queryKey: ['getForecastBasicInfo', companyNo],
    queryFn: () => forecastDataService.getForecastBasicInfo(companyNo),
    enabled: !!companyNo,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // Forecast Reports
  const { data: forecastReports, isLoading: forecastReportsIsLoading } = useQuery({
    queryKey: ['getForecastReports', companyNo, selectedReportTarget],
    queryFn: () => forecastDataService.getForecastReports(companyNo, selectedReportTarget ? Number(selectedReportTarget) : undefined),
    enabled: !!companyNo,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // xAxisUnit / period 기본값 설정 (companyNo 기준)
  useEffect(() => {
    if (!companyNo) return
    const defaults = getDefaultAxisAndPeriod(companyNo)
    setXAxisUnit(defaults.xAxisUnit)
    setPeriod(defaults.period)
  }, [companyNo])

  const { data: chartData, isLoading: chartDataIsLoading } = useQuery({
    queryKey: ['getForecastChartInfo', companyNo, xAxisUnit, period],
    queryFn: () => forecastDataService.getForecastChartInfo(companyNo, { xAxisUnit, period }),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!companyNo && !!xAxisUnit && !!period,
  })

  const tabItems = useMemo(
    () => [
      {
        label: 'Model',
        content: (
          <Stack gap="20px">
            <ChartPage
              chartData={chartData}
              chartDataIsLoading={chartDataIsLoading}
              monthSelect={monthSelect}
              targetList={basicInfo?.targetList ?? []}
              forecastReports={forecastReports ?? []}
              forecastReportsIsLoading={forecastReportsIsLoading}
              onHoverReportCardChange={setHoverReportCardInfo}
              xAxisUnit={xAxisUnit}
              period={period}
              onXAxisUnitChange={setXAxisUnit}
              onPeriodChange={setPeriod}
              companyNo={companyNo}
              reportPeriodUnitCd={basicInfo?.reportPeriodUnitCd}
              selectedReportTarget={selectedReportTarget}
              onReportTargetChange={setSelectedReportTarget}
            />
            <TablePage
              basicInfo={basicInfo}
              chartData={chartData}
              chartDataIsLoading={chartDataIsLoading}
              onMonthSelectChange={setMonthSelect}
              hoverReportCardInfo={hoverReportCardInfo}
            />
          </Stack>
        ),
      },
      {
        label: 'Records',
        content: (
          <RecordsTablePage
            basicInfo={basicInfo}
            chartData={chartData}
            chartDataIsLoading={chartDataIsLoading}
            onMonthSelectChange={setMonthSelect}
            hoverReportCardInfo={hoverReportCardInfo}
          />
        ),
      },
    ],
    [
      chartData,
      chartDataIsLoading,
      monthSelect,
      hoverReportCardInfo,
      basicInfo?.targetList,
      forecastReports,
      xAxisUnit,
      period,
      selectedReportTarget,
    ],
  )

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined

    let scrollStartTop = scrollEl.scrollTop

    const handleScrollImmediate = () => {
      const currentScrollTop = scrollEl.scrollTop
      setIsScrolled(currentScrollTop > 0)
    }

    const handleScrollDebounced = debounce(() => {
      const currentScrollTop = scrollEl.scrollTop
      const isScrollingUp = currentScrollTop < scrollStartTop
      const isScrollingDown = currentScrollTop > scrollStartTop
      const contentEl = contentWrapperRef.current
      const stickyEl = stickyHeaderRef.current

      if (contentEl && stickyEl) {
        const containerRect = scrollEl.getBoundingClientRect()
        const contentRect = contentEl.getBoundingClientRect()
        const stickyHeight = stickyEl.getBoundingClientRect().height
        const stickyBottomWhenStuck = stickyHeight + STICKY_TOP_WHEN_SCROLLED
        const firstContentTop = scrollEl.scrollTop + contentRect.top - containerRect.top - stickyBottomWhenStuck

        if (isScrollingDown && currentScrollTop < firstContentTop) {
          scrollEl.scrollTo({ top: firstContentTop, behavior: 'smooth' })
        } else if (isScrollingUp && currentScrollTop + 1 < firstContentTop && currentScrollTop > 0) {
          scrollEl.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }

      scrollStartTop = scrollEl.scrollTop
    }, 150)

    const handleScroll = () => {
      handleScrollImmediate()
      handleScrollDebounced()
    }

    handleScroll()
    scrollEl.addEventListener('scroll', handleScroll)
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll)
      handleScrollDebounced.cancel()
    }
  }, [])

  return (
    <Stack maxWidth="1380px" margin="auto" pt="20px" position="relative" sx={{ userSelect: 'none' }}>
      <Box ref={stickyHeaderRef} position="sticky" top={isScrolled ? '-14px' : 0} left="0" bgcolor="commonColor.White" zIndex={200}>
        <Typography
          variant="titleLarge"
          position="absolute"
          top="12px"
          left="24px"
          fontSize="38px"
          sx={{
            transform: `translateY(${isScrolled ? -6 : 0}px)`,
            opacity: isScrolled ? 0 : 1,
            transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out, font-size 0.3s ease-in-out, top 0.3s ease-in-out',
            transitionDelay: isScrolled ? '0s' : '0.2s',
          }}
        >
          {basicInfo?.chartPredictSettingNm}
        </Typography>
        <Box mt="96px">
          <ForecastTab
            tabItems={tabItems}
            tabBarOnly
            value={selectedTab}
            onChange={setSelectedTab}
            rightAdornment={
              <Typography
                variant="infoDocument"
                color="contentText.Normal"
                sx={{
                  mr: '70px',
                  mb: '8px',
                  transform: `translateY(${isScrolled ? 0 : 6}px)`,
                  opacity: isScrolled ? 1 : 0,
                  transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  transitionDelay: isScrolled ? '0.2s' : '0s',
                }}
              >
                {basicInfo?.chartPredictSettingNm}
              </Typography>
            }
          />
        </Box>
      </Box>
      <Box ref={contentWrapperRef} position="relative">
        {tabItems.map((tab, index) => {
          const isSelected = selectedTab === index
          return (
            <Box
              key={tab.label}
              aria-hidden={!isSelected}
              sx={{
                position: isSelected ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                visibility: isSelected ? 'visible' : 'hidden',
                pointerEvents: isSelected ? 'auto' : 'none',
                zIndex: isSelected ? 0 : -1,
                opacity: isSelected ? 1 : 0,
                transition: 'opacity 0.15s ease-out',
              }}
            >
              {tab.content}
            </Box>
          )
        })}
      </Box>
    </Stack>
  )
}

export default NewForecastPage
