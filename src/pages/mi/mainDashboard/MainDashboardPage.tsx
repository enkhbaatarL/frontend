import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect } from 'react'

import MIDateDisplay from '@/components/common/date/MIDateDisplay'
import AIMarketSensor from '@/components/mi/dashboard/AIMarketSensor'
import AIMarketSensorPersonalized from '@/components/mi/dashboard/AIMarketSensorPersonalized'
import AIMarketSummary from '@/components/mi/dashboard/AIMarketSummary'
import EventCalendar from '@/components/mi/dashboard/EventCalendar'
import NewsFeed from '@/components/mi/dashboard/NewsFeed'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import dashboardDataService from '@/service/mi/dashboardData'
import useAuthStore from '@/store/useAuthStore'

const MainDashboardPage = () => {
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
      return await dashboardDataService.getDashboardMarketDatas(companyNo)
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
          <MIDateDisplay />
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

export default MainDashboardPage
