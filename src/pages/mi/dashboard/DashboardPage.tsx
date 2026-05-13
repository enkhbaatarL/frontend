import { Box, Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useEffect } from 'react'

import MIDateDisplay from '@/components/common/date/MIDateDisplay'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import AIMarketSummary from '@/pages/mi/dashboard/components/aiMarketSummary/AIMarketSummary'
import EconomicCalendar from '@/pages/mi/dashboard/components/economicCalendar/EconomicCalendar'
// import MIGuide from '@/pages/mi/dashboard/components/miGuide/MIGuide'
import NewsFeed from '@/pages/mi/dashboard/components/newsFeed/NewsFeed'
// import Newsletters from '@/pages/mi/dashboard/components/newsletters/Newsletters'
import Toolbar from '@/pages/mi/dashboard/components/Toolbar'
import TopicTracker from '@/pages/mi/dashboard/components/topicTracker/TopicTracker'
import dashboardService from '@/service/mi/dashboard'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const SK_GAS_COMPANY_NO = 2014
/**
 * /// SK Gas 시연용: 뉴스 데이터가 전일(5/11)까지만 있는 동안 금요일(2026-05-15) 시연 전까지
 * 대시보드 뉴스 피드 등의 criteriaDate를 하루 다음인 5/12로 고정합니다.
 * 시연 후에는 서버 기준일을 그대로 씁니다.
 */
const SK_GAS_DEMO_CRITERIA_DATE = '20260512'
const SK_GAS_DEMO_CRITERIA_OVERRIDE_END_EXCLUSIVE = dayjs('2026-05-16').startOf('day')

const DashboardPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const { setMarketDataList, setMarketDataIsLoading } = useMarketData()
  const companyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? -1, [accessCompanyInfo?.customerCompanyNo])
  const newsMarketCategoryCode = useMemo(() => accessCompanyInfo?.newsMarketCategoryCode, [accessCompanyInfo?.newsMarketCategoryCode])

  const { data: criteriaDateInfo, isLoading: isCriteriaDateLoading } = useQuery({
    queryKey: ['getCriteriaDate'],
    queryFn: async () => await dashboardService.getCriteriaDate(),
  })

  const criteriaDate = useMemo(() => {
    if (isCriteriaDateLoading) return undefined

    const devCriteriaDate = typeof localStorage !== 'undefined' ? localStorage.getItem('devCriteriaDate') : null
    if (devCriteriaDate) return devCriteriaDate

    const now = dayjs().startOf('day')
    if (companyNo === SK_GAS_COMPANY_NO && now.isBefore(SK_GAS_DEMO_CRITERIA_OVERRIDE_END_EXCLUSIVE)) {
      return SK_GAS_DEMO_CRITERIA_DATE
    }

    return criteriaDateInfo?.criteriaDate || dayjs().format('YYYYMMDD')
  }, [criteriaDateInfo?.criteriaDate, companyNo, isCriteriaDateLoading])

  const nextUpdateText = useMemo(() => {
    if (!criteriaDateInfo?.nextUpdate) return undefined
    const formattedDate = dayjs(criteriaDateInfo.nextUpdate).format('MMMM D, [at] h:mm A')
    return `Next Update ${formattedDate}`
  }, [criteriaDateInfo?.nextUpdate])

  const {
    data: marketDataList,
    isError: marketDataListError,
    isLoading: marketDataListIsLoading,
  } = useQuery({
    queryKey: ['getDashboardMarKetDatas', companyNo],
    queryFn: async () => {
      if (companyNo === -1) throw new Error('Invalid company number')
      return await forecastDataService.getForecastMarketDatas(companyNo)
    },
    enabled: !!companyNo && companyNo !== -1,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  useEffect(() => {
    setMarketDataIsLoading(marketDataListIsLoading)
  }, [marketDataListIsLoading, setMarketDataIsLoading])

  useEffect(() => {
    if (marketDataListError) {
      setMarketDataList([])
    }
  }, [marketDataListError, setMarketDataList])

  useEffect(() => {
    if (marketDataList) {
      setMarketDataList(marketDataList)
    }
  }, [marketDataList, setMarketDataList])

  return (
    <MISkeleton variant={'dashboard'}>
      <Stack py="24px" maxWidth="1380px" margin="auto" gap="24px">
        <MIDateDisplay date={criteriaDate ? dayjs(criteriaDate, 'YYYYMMDD') : undefined} text={nextUpdateText} />
        <AIMarketSummary criteriaDate={criteriaDate} defaultCategoryCode={newsMarketCategoryCode} />
        <Box mb="-12px">
          <Toolbar />
        </Box>
        <Stack direction="row" gap="24px">
          <Stack width="740px" gap="24px">
            <NewsFeed criteriaDate={criteriaDate} defaultCategoryCode={newsMarketCategoryCode} />
            {/* <MIGuide /> */}
            {/* <Newsletters /> */}
          </Stack>
          <Stack width="616px" gap="24px">
            <EconomicCalendar criteriaDate={criteriaDate} />
            <TopicTracker criteriaDate={criteriaDate} />
            {/*<FactorMap />*/}
          </Stack>
        </Stack>
      </Stack>
    </MISkeleton>
  )
}

export default DashboardPage
