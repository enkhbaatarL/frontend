import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'

import ChartPage from '@/pages/mi/forecast/new-components/ChartPage'
import ForecastTab from '@/pages/mi/forecast/new-components/ForecastTab'
import TablePage from '@/pages/mi/forecast/new-components/TablePage'
import forecastDataService, { IForecastReport } from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const NewForecastPage = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [monthSelect, setMonthSelect] = useState('')
  const [hoverReportCardInfo, setHoverReportCardInfo] = useState<IForecastReport | null>(null)

  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0

  const { data: basicInfo } = useQuery({
    queryKey: ['getForecastBasicInfo', companyNo],
    queryFn: () => forecastDataService.getForecastBasicInfo(companyNo),
    enabled: !!companyNo,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 대시보드 차트 조회 가능한 날짜 리스트 (임시)
  const { data: chartDates } = useQuery({
    queryKey: ['dashboardChartDates'],
    queryFn: () => forecastDataService.getForecastChartDates(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // Forecast Reports
  const { data: forecastReports } = useQuery({
    queryKey: ['getForecastReports', companyNo],
    queryFn: () => forecastDataService.getForecastReports(companyNo),
    enabled: !!companyNo,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // monthSelect 초기값 설정 (임시)
  useEffect(() => {
    if (chartDates?.dates[0] && !monthSelect) {
      setMonthSelect(chartDates.dates[0])
    }
  }, [chartDates, monthSelect])

  const { data: chartData, isLoading: chartDataIsLoading } = useQuery({
    queryKey: ['dashboardChartData', monthSelect],
    queryFn: () =>
      forecastDataService.getForecastChartData(accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0, monthSelect.replaceAll('-', '')),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!monthSelect,
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
              onHoverReportCardChange={setHoverReportCardInfo}
            />
            <TablePage 
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
        content: <TablePage chartData={chartData} chartDataIsLoading={chartDataIsLoading} onMonthSelectChange={setMonthSelect} hoverReportCardInfo={hoverReportCardInfo} />,
      },
    ],
    [chartData, chartDataIsLoading, monthSelect, hoverReportCardInfo],
  )

  useEffect(() => {
    const scrollEl = document.getElementById('main-scroll-wrapper')
    if (!scrollEl) return undefined

    const handleScroll = () => {
      const currentScrollTop = scrollEl.scrollTop
      setIsScrolled(currentScrollTop > 0)
    }

    handleScroll()
    scrollEl.addEventListener('scroll', handleScroll)
    return () => {
      scrollEl.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <Stack maxWidth="1380px" margin="auto" pt="20px" position="relative" sx={{ userSelect: 'none' }}>
      <Box position="sticky" top={isScrolled ? '-14px' : 0} left="0" bgcolor="commonColor.White" zIndex={200}>
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
          <ForecastTab tabItems={tabItems} />
        </Box>
      </Box>
    </Stack>
  )
}

export default NewForecastPage
