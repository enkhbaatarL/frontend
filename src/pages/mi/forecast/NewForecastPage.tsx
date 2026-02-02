import { Box, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'

import ChartPage from '@/pages/mi/forecast/new-components/ChartPage'
import ForecastTab from '@/pages/mi/forecast/new-components/ForecastTab'
import RecordsTablePage from '@/pages/mi/forecast/new-components/RecordsTablePage'
import TablePage from '@/pages/mi/forecast/new-components/TablePage'
import forecastDataService, { IForecastReport } from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const NewForecastPage = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [monthSelect, setMonthSelect] = useState('')
  const [hoverReportCardInfo, setHoverReportCardInfo] = useState<IForecastReport | null>(null)

  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo ?? 0

  // 회사별 기본 xAxisUnit / period 설정
  const getDefaultAxisAndPeriod = (companyNo: number) => {
    switch (companyNo) {
      case 2020:
        return { xAxisUnit: '1D', period: '1W' }
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
    queryKey: ['getForecastReports', companyNo],
    queryFn: () => forecastDataService.getForecastReports(companyNo),
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
        content: <RecordsTablePage chartData={chartData} chartDataIsLoading={chartDataIsLoading} onMonthSelectChange={setMonthSelect} hoverReportCardInfo={hoverReportCardInfo} />,
      },
    ],
    [chartData, chartDataIsLoading, monthSelect, hoverReportCardInfo, basicInfo?.targetList, forecastReports, xAxisUnit, period],
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
