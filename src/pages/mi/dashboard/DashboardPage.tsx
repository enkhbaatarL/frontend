import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect } from 'react'

import MIDateDisplay from '@/components/common/date/MIDateDisplay'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import AIMarketSensor from '@/pages/mi/dashboard/components/AIMarketSensor'
import AIMarketSensorPersonalized from '@/pages/mi/dashboard/components/AIMarketSensorPersonalized'
import AIMarketSummary from '@/pages/mi/dashboard/components/AIMarketSummary'
import Category from '@/pages/mi/dashboard/components/Category'
import EventCalendar from '@/pages/mi/dashboard/components/EventCalendar'
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
      <Box bgcolor={'#F2F5F7'} position={'relative'} py={6}>
        <Box
          display={'flex'}
          flexDirection={'column'}
          position={'relative'}
          maxWidth={'1380px'}
          width={'100%'}
          margin={'auto'}
          gap={'10px'}
        >
          <Box display={'flex'} justifyContent={'space-between'}>
            <MIDateDisplay />
            <Category onCategoryChange={() => {}} />
          </Box>
          <AIMarketSummary />
          <Box py={'14px'} display={'flex'} justifyContent={'center'}>
            <Box sx={{ display: 'flex', gap: '24px', maxWidth: '1380px' }}>
              <Box sx={{ width: '800px' }}>
                <NewsFeed />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '556px' }}>
                <AIMarketSensor />
                <AIMarketSensorPersonalized />
                <EventCalendar />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default DashboardPage
