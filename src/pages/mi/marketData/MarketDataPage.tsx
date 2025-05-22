import SearchIcon from '@mui/icons-material/Search'
import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import bgmImg from '@/assets/bgmarket.jpg'
import psImg from '@/assets/productsymbol.png'
import MILine from '@/components/common/divider/MILine'
import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import useSearchFilter from '@/hooks/useSearchFilter.tsx'
import MarketDataChart from '@/pages/mi/marketData/components/MarketDataChart'
import marketDataService, { IDataCatalogItem, IDataCatalogRequest, IMarketData } from '@/service/mi/marketData.ts'
import useAuthStore from '@/store/useAuthStore.ts'
import theme from '@/theming'
import { IPaginationResponse } from '@/types/api.ts'

const MarketDataPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const navigate = useNavigate()

  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const initialFetchRef = useRef(false)

  // Data Dashboard
  const { data: dashboardList } = useQuery<IMarketData[]>({
    queryKey: ['marketDashboard', customerCompanyNo],
    queryFn: async () => await marketDataService.getMarketDatas(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!customerCompanyNo,
  })

  // Data Catalog
  const { data, filter, updateFilter, updateFilterWithSearch, pagination, updatePage, updateSize } = useSearchFilter<
    IDataCatalogRequest,
    IPaginationResponse<IDataCatalogItem>
  >(
    marketDataService.getDataCatalog,
    {
      customerCompanyNo,
      keyword: '',
    },
    {
      page: 1,
      size: 10,
    },
    {
      initialFetch: false,
    },
  )

  // Recent Viewed
  const { data: recentViewedList } = useQuery({
    queryKey: ['recentViewed'],
    queryFn: async () => await marketDataService.getRecentViewed(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const normalizedChartData = useMemo(() => dashboardList?.slice(0, 10), [dashboardList])

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
            {normalizedChartData?.map((chartData, index) => (
              // 2개: 큰 차트, 8개: 작은 차트
              <Grid key={`market-data-chart-${index}`} size={index <= 1 ? 6 : 3}>
                <MarketDataChart data={chartData} size={index <= 1 ? 'large' : 'small'} locked={!chartData.isPermitted} />
              </Grid>
            )) ?? (
              <Grid size={3}>
                <Typography>No results found</Typography>
              </Grid>
            )}
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
                hidePagination={data?.totalElements === 0 || !data?.totalElements}
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
                  rows: data?.detail,
                  onRowClick: (row) => {
                    navigate(`/mi/data-detail/${row.row.goodsNo}/${row.row.goodsDataNo}`)
                  },
                }}
                paginationProps={{
                  data,
                  size: pagination?.size,
                  onPageChange: updatePage,
                  onSizeChange: updateSize,
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
              {recentViewedList?.length ? (
                recentViewedList.map((item, index) => (
                  <Box
                    p={3}
                    key={index}
                    onClick={() => navigate(`/mi/data-detail/${item.goodsNo}/${item.goodsDataNo}`)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: theme.palette.gray[5],
                      },
                    }}
                  >
                    <Typography color="gray.70" component="div" variant="body1">
                      {item.goodsDataNm}
                    </Typography>
                    <Typography
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      color="gray.70"
                      lineHeight={1.6}
                      component="div"
                      variant="body2"
                    >
                      {item.goodsDataExpn}
                    </Typography>
                    <Grid direction={'row'} container alignItems={'center'}>
                      <Typography color="gray.60" lineHeight={1.6} component="div" variant="body2">
                        {item.providerNm}
                      </Typography>
                      <MILine thickness={2} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />
                      <Typography color="gray.60" lineHeight={1.6} component="div" variant="body2">
                        {item.modifyDt}
                      </Typography>
                    </Grid>
                  </Box>
                ))
              ) : (
                <Typography color="gray.60" textAlign="center" py={4} component="div" variant="body2">
                  최근 조회한 데이터가 없습니다.
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Box>
    </>
  )
}

export default MarketDataPage
