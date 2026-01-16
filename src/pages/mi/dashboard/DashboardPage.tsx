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

const DashboardPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const { setMarketDataList, setMarketDataIsLoading } = useMarketData()
  const companyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? -1, [accessCompanyInfo?.customerCompanyNo])

  const { data: criteriaDateInfo, isLoading: isCriteriaDateLoading } = useQuery({
    queryKey: ['getCriteriaDate'],
    queryFn: async () => await dashboardService.getCriteriaDate(),
  })

  const criteriaDate = useMemo(
    () => (isCriteriaDateLoading ? undefined : criteriaDateInfo?.criteriaDate || dayjs().format('YYYYMMDD')),
    [criteriaDateInfo, isCriteriaDateLoading],
  )

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
        <MIDateDisplay date={criteriaDate ? dayjs(criteriaDate, 'YYYYMMDD') : undefined} />
        <AIMarketSummary criteriaDate={criteriaDate} />
        <Box mb="-12px">
          <Toolbar />
        </Box>
        <Stack direction="row" gap="24px">
          <Stack width="740px" gap="24px">
            <NewsFeed criteriaDate={criteriaDate} />
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
