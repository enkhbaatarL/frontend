import SearchIcon from '@mui/icons-material/Search'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'

import bgmImg from '@/assets/bgmarket.jpg'
import psImg from '@/assets/productsymbol.png'
import MILine from '@/components/common/divider/MILine'
import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import { useMockEvents } from '@/hooks/useMockEvents'
import useSearchFilter from '@/hooks/useSearchFilter.tsx'
import MarketDataChart from '@/pages/mi/marketData/components/MarketDataChart'
import MarketDataChartSmall from '@/pages/mi/marketData/components/MarketDataChartSmall'
import marketDataService, { IDataCatalogItem, IDataCatalogRequest } from '@/service/mi/marketData.ts'
import useAuthStore from '@/store/useAuthStore.ts'
import { IPaginationResponse } from '@/types/api.ts'

const MarketDataPage = () => {
  const { dataEvent } = useMockEvents()
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0
  const initialFetchRef = useRef(false)

  const {
    data: dataCatalogData,
    filter,
    updateFilter,
    updateFilterWithSearch,
  } = useSearchFilter<IDataCatalogRequest, IPaginationResponse<IDataCatalogItem>>(
    marketDataService.getDataCatalog,
    {
      customerCompanyNo,
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
    {
      initialFetch: false,
    },
  )

  useEffect(() => {
    if (accessCompanyInfo?.customerCompanyNo && !initialFetchRef.current) {
      initialFetchRef.current = true
      updateFilterWithSearch('customerCompanyNo', accessCompanyInfo.customerCompanyNo)
    }
  }, [accessCompanyInfo, updateFilterWithSearch])

  return (
    <>
      <Box
        paddingY={14}
        sx={{
          background: `url(${psImg}) right / 33% no-repeat, url(${bgmImg}) lightgray 50% 82%/ cover no-repeat`,
          zIndex: 0,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            boxShadow: '0px 20px 20px 0px rgba(0, 0, 0, 0.25) inset',
          }}
        ></Box>
        <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
          <Typography color="white" component="h1" fontSize={40} variant="body1M16">
            Market Data
          </Typography>
          <Typography color="#DCDCDC" fontSize={20} lineHeight={1.6} variant="subtext1">
            Elevate your market understanding with comprehensive data
          </Typography>
        </Box>
      </Box>
      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'} py={12.5} px={7.5}>
        <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
          Data Dashboard
        </Typography>
        <Grid mb={17.5} container spacing={5}>
          <Grid width={'100%'} container direction={'row'} gap={5}>
            <Grid size={6}>
              <MarketDataChart />
            </Grid>
            <Grid size={6}>
              <MarketDataChart />
            </Grid>
          </Grid>
          <Grid width={'100%'} container direction={'row'} gap={5}>
            <Grid size={3}>
              <MarketDataChartSmall isClock />
            </Grid>
            <Grid size={3}>
              <MarketDataChartSmall />
            </Grid>
            <Grid size={3}>
              <MarketDataChartSmall />
            </Grid>
            <Grid size={3}>
              <MarketDataChartSmall />
            </Grid>
            <Grid size={3}>
              <MarketDataChartSmall />
            </Grid>
            <Grid size={3}>
              <MarketDataChartSmall />
            </Grid>
            <Grid size={3}>
              <MarketDataChartSmall />
            </Grid>
            <Grid size={3}>
              <MarketDataChartSmall />
            </Grid>
          </Grid>
        </Grid>
        <Box pb={6} mb={9} borderBottom={'1px solid'} borderColor={'gray.30'}>
          <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
            Data Catalog
          </Typography>
          <MIInput
            width={458}
            maxWidth={'100%'}
            placeholder="Search for Data"
            size="h46"
            startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
            value={filter?.keyword ?? ''}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            onKeyDown={({ key, target }) => key === 'Enter' && updateFilterWithSearch('keyword', (target as HTMLInputElement).value)}
            onClear={() => updateFilterWithSearch('keyword', '')}
          />
        </Box>
        <Grid
          container
          sx={{
            flexDirection: 'row',
          }}
          wrap={'nowrap'}
          gap={6}
        >
          <Box
            boxSizing={'border-box'}
            sx={{
              width: 'calc(100% - 370px)',
            }}
          >
            <Box boxSizing={'border-box'} width={'100%'}>
              <MITableUser
                tableProps={{
                  disableHover: true,
                  noRowMessage: '등록된 내용이 없습니다.',
                  columns: [
                    {
                      field: 'providerNm',
                      headerName: 'Data Provider',
                      flex: 1,
                      renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'tableBody1' }} />,
                    },
                    { field: 'goodsDataNm', headerName: 'Data Name', flex: 2 },
                    { field: 'goodsDataExpn', headerName: 'Description', flex: 2 },
                    {
                      field: 'modifyDt',
                      headerName: 'Last Updated',
                      flex: 1,
                      align: 'center',
                      renderCell: (param) => <MITableCell value={param.value} typography={{ variant: 'tableBody2', color: '#868E96' }} />,
                    },
                  ],
                  rowId: 'goodsDataNo',
                  rows: dataCatalogData?.detail,
                }}
              />
            </Box>
          </Box>
          <Box
            boxSizing={'border-box'}
            sx={{
              width: 346,
            }}
          >
            <Box border={'1px solid'} borderColor={'gray.30'} borderRadius={1} gap={6} padding={6} flexShrink={0}>
              <Typography mb={2.5} color="gray.90" component="h2" variant="titleBox">
                Recent Viewed
              </Typography>
              {dataEvent.map((item, index) => (
                <Box py={3} borderBottom={index === dataEvent.length - 1 ? 'none' : '1px solid'} borderColor={'gray.30'} key={index}>
                  <Typography color="gray.70" component="div" variant="body1">
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    color="gray.70"
                    lineHeight={1.6}
                    component="div"
                    variant="body2"
                  >
                    {item.subtitle}
                  </Typography>
                  <Grid direction={'row'} container alignItems={'center'}>
                    <Typography color="gray.60" lineHeight={1.6} component="div" variant="body2">
                      {item.location}
                    </Typography>
                    <MILine thickness={2} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />
                    <Typography color="gray.60" lineHeight={1.6} component="div" variant="body2">
                      {item.date}
                    </Typography>
                  </Grid>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
      </Box>
    </>
  )
}

export default MarketDataPage
