import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect } from 'react'

import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import imgPath from '@/assets/imsi/Dashboard_1440.png'
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
    queryFn: async () => await dashboardDataService.getDashboardMarketDatas(companyNo!),
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
      <Box bgcolor={'#F2F5F7'} position={'relative'}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <img src={imgPath} style={{ display: 'block' }} />
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default MainDashboardPage
