import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import ReportComponent from './components/ReportComponent'
import UpdatedData from './components/UpdatedData'

import psImg from '@/assets/productsymbol.png'
import MITabs from '@/components/common/tabs/MITabs'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import HistoryComponent from '@/pages/mi/dashboard/components/HistoryComponent'
import LatestData from '@/pages/mi/dashboard/components/LatestData'
import dashboardDataService from '@/service/mi/dashboardData'
import useAuthStore from '@/store/useAuthStore'

const MIDashboardPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const companyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? -1, [accessCompanyInfo?.customerCompanyNo])

  const { data: basicInfo, isLoading: basicInfoIsLoading } = useQuery({
    queryKey: ['basicInfo', companyNo],
    queryFn: async () => await dashboardDataService.getDashboardBasicInfo(companyNo!),
    enabled: !!companyNo || companyNo !== -1,
  })

  const tabsData = [
    {
      label: 'Report',
      content: <ReportComponent companyNo={companyNo} />,
    },
    {
      label: 'History',
      content: <HistoryComponent basicInfo={basicInfo} />,
    },
  ]

  // 우측 latestInsights 리스트 조회
  const { data: latestInsightsList = [] } = useQuery({
    queryKey: ['getdashboardLatestInsights', companyNo],
    queryFn: async () => await dashboardDataService.getDashboardLatestInsights(companyNo!),
    enabled: !!companyNo || companyNo !== -1,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 우측 marketData 리스트 조회
  const { data: marketDataList = [] } = useQuery({
    queryKey: ['getdashboardMakterDatas', companyNo],
    queryFn: async () => await dashboardDataService.getDashboardMarketDatas(companyNo!),
    enabled: !!companyNo || companyNo !== -1,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  return (
    <MISkeleton variant={'dashboard'} loading={basicInfoIsLoading}>
      <Box bgcolor={'#F2F5F7'} position={'relative'}>
        <Box
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
            <Typography color="#CED4DA" variant="subtext1">
              Gain even more insights with AI-driven intelligence for better decisions.
            </Typography>
          </Box>
        </Box>
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
                <MITabs widthTab={161} widthItem={'50%'} isNotice arrayItem={tabsData} />
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
              <UpdatedData dataList={marketDataList} />
              <LatestData dataList={latestInsightsList} />
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ position: 'absolute', top: '100%', left: 0, right: 0, height: '100px', backgroundColor: '#F2F5F7' }}></Box>
      </Box>
    </MISkeleton>
  )
}

export default MIDashboardPage
