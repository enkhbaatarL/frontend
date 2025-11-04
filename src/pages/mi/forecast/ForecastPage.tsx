import { Box, Grid2 as Grid } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useEffect } from 'react'

import ReportComponent from './components/ReportComponent'
import UpdatedData from './components/UpdatedData'

// import psImg from '@/assets/productsymbol.png'
import MITabs from '@/components/common/tabs/MITabs'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import { useMarketData } from '@/contexts/MarketDataContext'
import HistoryComponent from '@/pages/mi/forecast/components/HistoryComponent'
import LatestData from '@/pages/mi/forecast/components/LatestData'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'

const ForecastPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const { setMarketDataList, setMarketDataIsLoading } = useMarketData()
  const companyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? -1, [accessCompanyInfo?.customerCompanyNo])

  const { data: basicInfo, isLoading: basicInfoIsLoading } = useQuery({
    queryKey: ['basicInfo', companyNo],
    queryFn: async () => await forecastDataService.getForecastBasicInfo(companyNo!),
    enabled: !!companyNo && companyNo !== -1,
  })

  // 우측 latestInsights 리스트 조회
  const { data: latestInsightsList = [] } = useQuery({
    queryKey: ['getDashboardLatestInsights', companyNo],
    queryFn: async () => await forecastDataService.getForecastLatestInsights(companyNo!),
    enabled: !!companyNo && companyNo !== -1,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 우측 marketData 리스트 조회
  const {
    data: marketDataList,
    isError: marketDataListError,
    isLoading: marketDataListIsLoading,
  } = useQuery({
    queryKey: ['getDashboardMarKetDatas', companyNo],
    queryFn: async () => await forecastDataService.getForecastMarketDatas(companyNo!),
    enabled: !!companyNo && companyNo !== -1,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const hideForecast = useMemo(() => companyNo === 2025, [companyNo])

  const tabsData = useMemo(
    () => [
      {
        label: 'Report',
        content: <ReportComponent companyNo={companyNo} hideForecast={hideForecast} />,
      },
      {
        label: 'History',
        content: <HistoryComponent companyNo={companyNo} basicInfo={basicInfo} />,
      },
    ],
    [companyNo, basicInfo, hideForecast],
  )

  useEffect(() => {
    setMarketDataIsLoading(marketDataListIsLoading)
  }, [marketDataListIsLoading, setMarketDataIsLoading])

  useEffect(() => {
    if (marketDataListError) {
      setMarketDataList([])
    }
  }, [marketDataListError])

  useEffect(() => {
    if (marketDataList) {
      setMarketDataList(marketDataList)
    }
  }, [marketDataList])

  return (
    <MISkeleton variant={'dashboard'} loading={basicInfoIsLoading}>
      <Box bgcolor={'#F2F5F7'} position={'relative'}>
        {/* <Box
          paddingX={7.5}
          paddingTop={6.25}
          paddingBottom={7.5}
          sx={{
            background: `url(${psImg}) right / 33% no-repeat,linear-gradient(271deg, #71738F 1.64%, #475083 99.32%)`,
            zIndex: 0,
            position: 'relative',
          }}
        >
          <Box position={'relative'} maxWidth={'1380px'} margin={'auto'}>
            <Box
              sx={{
                position: 'absolute',
                top: -18,
                right: 0,
                zIndex: 2,
              }}
            ></Box>
            <Typography mb={3} component={'div'} color="white" variant="tableHeaderSemibold">
              New Product
            </Typography>
            <Typography color="white" mb={2} component="h1" fontWeight={600} variant="heading3">
              Smart Market Intelligence
            </Typography>
            <Typography color="white" variant="body2">
              Gain even more insights with AI-driven intelligence for better decisions.
            </Typography>
          </Box>
        </Box> */}
        <Box maxWidth={'1380px'} margin={'auto'} paddingTop={'30px'}>
          <Grid
            sx={{
              flexWrap: {
                xs: 'wrap',
                md: 'nowrap',
              },
            }}
            direction="row"
            container
            gap={6}
          >
            <Grid container direction="column" flexGrow={1} gap={9.5}>
              <Box
                maxWidth={'100%'}
                boxSizing={'border-box'}
                bgcolor={'#fff'}
                py={6}
                px={5}
                borderRadius={1}
                border={'1px solid'}
                borderColor={'gray.30'}
              >
                <MITabs widthTab={161} widthItem={'50%'} isNotice arrayItem={tabsData} hideForecast={hideForecast} />
              </Box>
            </Grid>
            <Grid
              sx={{
                width: {
                  xs: '100%',
                  md: '286px',
                },
              }}
              container
              gap={3}
              direction="column"
              flexShrink={0}
            >
              {(marketDataList?.length ?? 0) > 0 && <UpdatedData dataList={marketDataList ?? []} />}
              {latestInsightsList.length > 0 && <LatestData dataList={latestInsightsList} />}
            </Grid>
          </Grid>
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default ForecastPage
