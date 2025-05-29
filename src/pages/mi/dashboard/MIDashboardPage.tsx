import CloseIcon from '@mui/icons-material/Close'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import ReportComponent from './components/ReportComponent'
import UpdatedData from './components/UpdatedData'

import psImg from '@/assets/productsymbol.png'
import MIButton from '@/components/common/button/MIButton'
import MITabs from '@/components/common/tabs/MITabs'
import HistoryComponent from '@/pages/mi/dashboard/components/HistoryComponent'
import LatestData from '@/pages/mi/dashboard/components/LatestData'
import dashboardDataService from '@/service/mi/dashboardData'
import useAuthStore from '@/store/useAuthStore'

const MIDashboardPage = () => {
  const [showBanner, setShowBanner] = useState(true)
  const { accessCompanyInfo } = useAuthStore()
  const companyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? -1, [accessCompanyInfo?.customerCompanyNo])

  const tabsData = [
    {
      label: 'Report',
      content: <ReportComponent />,
    },
    {
      label: 'History',
      content: <HistoryComponent />,
    },
  ]

  // 우측 latestInsights 리스트 조회
  const { data: latestInsightsList = [] } = useQuery({
    queryKey: ['getdashboardLatestInsights', companyNo],
    queryFn: async () => await dashboardDataService.getdashboardLatestInsights(companyNo!),
    enabled: !!companyNo || companyNo !== 1,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 우측 marketData 리스트 조회
  const { data: marketDataList = [] } = useQuery({
    queryKey: ['getdashboardMakterDatas', companyNo],
    queryFn: async () => await dashboardDataService.getdashboardMakterDatas(companyNo!),
    enabled: !!companyNo || companyNo !== 1,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  return (
    <Box bgcolor={'#F2F5F7'} position={'relative'}>
      {showBanner && (
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
            >
              <MIButton
                contentType={'icon'}
                size={'h42'}
                type={'ghost'}
                color={'gray'}
                onClick={() => setShowBanner(false)}
                startIcon={<CloseIcon sx={{ color: '#fff', path: { fill: '#fff !important' } }} />}
              />
            </Box>
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
      )}

      <Box maxWidth={'1380px'} margin={'auto'} paddingTop={10} paddingX={7.5}>
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
  )
}

export default MIDashboardPage
