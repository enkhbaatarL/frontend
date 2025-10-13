import { Stack } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect } from 'react'

import MIDateDisplay from '@/components/common/date/MIDateDisplay'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import AIMarketSummary from '@/pages/mi/dashboard/components/AIMarketSummary'
import FactorMap from '@/pages/mi/dashboard/components/FactorMap'
import MIGuide from '@/pages/mi/dashboard/components/MIGuide'
import NewsFeed from '@/pages/mi/dashboard/components/NewsFeed'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const DashboardPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const { setMarketDataList, setMarketDataIsLoading } = useMarketData()
  const companyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? -1, [accessCompanyInfo?.customerCompanyNo])

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
        <MIDateDisplay />
        <AIMarketSummary />
        <Stack direction="row" gap="24px">
          <Stack width="740px" gap="24px">
            <NewsFeed />
          </Stack>
          <Stack width="616px" gap="24px">
            <FactorMap />
            <MIGuide />
          </Stack>
        </Stack>
      </Stack>
    </MISkeleton>
  )
}

export default DashboardPage
