import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useCallback, useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'

import MarketDataCustomChart from './components/MarketDataCustomChart'

import MILine from '@/components/common/divider/MILine'
import LockOutlinedIcon from '@/components/common/icons/LockOutlinedIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import useSearchFilter from '@/hooks/useSearchFilter'
import MarketDataChart from '@/pages/mi/marketData/components/MarketDataChart'
import marketDataService, { IDataCatalogItem, IDataCatalogRequest, IMarketData } from '@/service/mi/marketData'
import useAuthStore from '@/store/useAuthStore'
import { IPaginationResponse } from '@/types/api'

const MarketDataPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const navigate = useNavigate()

  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const initialFetchRef = useRef(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)

  // Data Dashboard
  const { data: dashboardList, isLoading: dashboardListIsLoading } = useQuery<IMarketData[]>({
    queryKey: ['marketDashboard', customerCompanyNo],
    queryFn: async () => await marketDataService.getMarketDatas(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!customerCompanyNo,
  })

  // SK E&S custom card
  const isEnsCompany = accessCompanyInfo?.customerCompanyNo === 2013 && !!customerCompanyNo

  const { data: customChartInfo, isLoading: customChartInfoIsLoading } = useQuery<IMarketData | undefined>({
    queryKey: ['customChartInfo', customerCompanyNo, isEnsCompany],
    queryFn: async () => {
      if (!isEnsCompany) return undefined
      return marketDataService.getMarketDataCustom(customerCompanyNo!, 'gie-eu')
    },
    enabled: isEnsCompany,
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // Data Catalog
  const { data, filter, updateFilter, updateFilterWithSearch, pagination, updatePage, updateSize, isLoading } = useSearchFilter<
    IDataCatalogRequest,
    IPaginationResponse<IDataCatalogItem>
  >(
    (params) => marketDataService.getDataCatalog(customerCompanyNo, params),
    {
      keyword: '',
    },
    {
      page: 1,
      size: 10,
    },
    {
      initialFetch: true,
    },
  )
  // Recent Viewed
  const { data: recentViewedList, isLoading: recentViewedIsLoading } = useQuery({
    queryKey: ['recentViewed', customerCompanyNo],
    queryFn: async () => await marketDataService.getRecentViewed(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!customerCompanyNo,
  })

  /*
  market data dasshboard의 노출 차트는 최대 9개로 제한하며 custom card 사용시 해당 데이터를 목록에 추가
  */
  const normalizedChartData = useMemo(
    () => (dashboardList && dashboardList.length >= 9 ? dashboardList.slice(0, 9) : dashboardList),
    [dashboardList],
  )
  const insertedChartData = useMemo(() => {
    if (!normalizedChartData) return []

    if (isEnsCompany && accessCompanyInfo?.customerCompanyNo) {
      const targetIndex = customChartInfo?.marketMetaData?.chartMarkRank ?? 0
      const arr = [...normalizedChartData]

      arr.splice(targetIndex, 0, {
        ...arr[targetIndex],
        isCustomChart: true,
      })
      return arr.length >= 9 ? arr.slice(0, 9) : arr
    }

    return normalizedChartData
  }, [normalizedChartData, isEnsCompany, accessCompanyInfo, customChartInfo])

  const handleSearchChange = useCallback(
    (value: string) => {
      updateFilter('keyword', value)
    },
    [updateFilter],
  )

  const handleSearch = useCallback(
    (searchTerm: string) => {
      updateFilterWithSearch('keyword', searchTerm)
    },
    [updateFilterWithSearch],
  )

  const handleSearchClear = useCallback(() => {
    updateFilterWithSearch('keyword', '')
  }, [updateFilterWithSearch])

  useEffect(() => {
    const initializeData = async () => {
      if (accessCompanyInfo?.customerCompanyNo && !initialFetchRef.current) {
        try {
          initialFetchRef.current = true
          setHasInitialData(true)
        } catch (error) {
          console.error('초기 데이터 로딩 실패:', error)
        } finally {
          setIsInitialLoading(false)
        }
      } else if (accessCompanyInfo?.customerCompanyNo && initialFetchRef.current) {
        setIsInitialLoading(false)
        setHasInitialData(true)
      }
    }

    initializeData()
  }, [accessCompanyInfo?.customerCompanyNo, filter?.keyword])

  useEffect(() => {
    if (data?.detail && data.detail.length > 0) {
      setHasInitialData(true)
    }
  }, [data])

  const isActuallyLoading = useMemo(
    () => isInitialLoading || dashboardListIsLoading || customChartInfoIsLoading || recentViewedIsLoading || (isLoading && !hasInitialData),
    [isInitialLoading, dashboardListIsLoading, customChartInfoIsLoading, recentViewedIsLoading, hasInitialData, isLoading],
  )

  return (
    <MISkeleton variant={'marketData'} loading={isActuallyLoading}>
      <MIPageHeadline title="Market Metrics" gradientStart="#021728" gradientEnd="#135F7A" />

      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'} py={12.5} px={7.5}>
        <Typography mb={6} color="gray.90" component="h2" variant="titlePage">
          Focused
        </Typography>
        <Grid mb={17.5} container spacing={5}>
          <Grid width={'100%'} container direction={'row'} gap={'16px'}>
            {insertedChartData?.map((chartData, index) => (
              <Grid key={`market-data-chart-${index}`} size={3} sx={{ width: '449px', minHeight: '324px' }}>
                {chartData.isCustomChart ? (
                  <MarketDataCustomChart data={customChartInfo} locked={!chartData.isPermitted} />
                ) : (
                  <MarketDataChart data={chartData} size="large" locked={!chartData.isPermitted} />
                )}
              </Grid>
            ))}
            {normalizedChartData?.length === 0 && (
              <Grid size={3}>
                <Typography>No results found</Typography>
              </Grid>
            )}
          </Grid>
        </Grid>
        <Typography mb={6} color="gray.90" component="h2" variant="titlePage">
          All Market Metrics
        </Typography>
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
              width: 'calc(100% - 280px)',
            }}
          >
            <MISearchInput
              storageKey={'market-data'}
              value={filter?.keyword ?? ''}
              onChange={handleSearchChange}
              placeholder={'Search for Data'}
              onSearch={handleSearch}
              onClear={handleSearchClear}
            />
            <Box mb={6} mt={6} borderBottom={'1px solid'} borderColor={'gray.30'} />
            <Box boxSizing={'border-box'} width={'100%'}>
              <MITableUser
                hidePagination={data?.totalElements === 0 || !data?.totalElements}
                tableProps={{
                  disableHover: true,
                  loading: isLoading,
                  noRowMessage: 'No results found',
                  getRowClassName: (params) => (!params.row.isViewable ? 'no-click' : ''),
                  columns: [
                    {
                      field: 'goodsDataNm',
                      headerName: 'Data Name',
                      flex: 1,
                      minWidth: 300,
                    },
                    {
                      field: 'goodsDataSrcNm',
                      headerName: 'Datasource',
                      flex: 1,
                      align: 'left',
                      minWidth: 300,
                    },
                    {
                      field: 'lastValue',
                      headerName: 'Value',
                      flex: 1,
                      align: 'center',
                      minWidth: 150,
                      renderCell: ({ row }) => (
                        <Box position="relative" sx={{ userSelect: 'none' }}>
                          <Box
                            sx={{
                              filter: !row.isViewable ? 'blur(3px)' : 'none',
                              fontWeight: 'bold',
                            }}
                          >
                            {row.isViewable ? row.lastValue : '888.88'}
                          </Box>
                          {!row.isViewable && (
                            <Box
                              display={'flex'}
                              alignItems={'center'}
                              justifyContent={'center'}
                              position={'absolute'}
                              top={-1}
                              sx={{
                                inset: '-2px -8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: 'gray.60',
                                borderRadius: '4px',
                              }}
                            >
                              <LockOutlinedIcon style={{ width: '16px', height: '16px' }} />
                            </Box>
                          )}
                        </Box>
                      ),
                    },
                    {
                      field: 'modifyDt',
                      headerName: 'Last Updated',
                      flex: 1,
                      minWidth: 200,
                      align: 'center',
                      renderCell: ({ row }) => (
                        <MITableCell
                          value={dayjs(row.modifyDt).format('YYYY-MM-DD')}
                          typography={{
                            color: 'gray.60',
                          }}
                        />
                      ),
                    },
                  ],
                  rowId: 'goodsDataSrcNo',
                  rows: data?.detail,
                  onRowClick: ({ row }) => {
                    if (row.isViewable) {
                      navigate(`/mi/data-detail/${row.goodsNo}/${row.goodsDataNo}`, { state: { goodsDataSrcNo: row.goodsDataSrcNo } })
                    }
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
              width: 286,
            }}
          >
            <Box border={'1px solid'} borderColor={'gray.30'} borderRadius={1} padding={3} flexShrink={0}>
              <Typography color="gray.70" component="h2" variant="sidePanelTitle" padding={2}>
                Recent Viewed
              </Typography>
              {recentViewedList?.length ? (
                recentViewedList.map((item, index) => (
                  <Fragment key={`recent-viewed-${index}`}>
                    <Box
                      paddingY={2}
                      onClick={() => navigate(`/mi/data-detail/${item.goodsNo}/${item.goodsDataNo}`)}
                      sx={{
                        width: '90%',
                        padding: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'contentBG.Hover',
                        },
                      }}
                    >
                      <Typography paddingTop={1.5} color="gray.70" component="div" lineHeight={1.4} variant="body4">
                        {item.goodsDataNm}
                      </Typography>
                      {/* <Typography
                        sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        color="gray.60"
                        lineHeight={1.4}
                        component="div"
                        variant="body3R12"
                      >
                        {item.goodsDataExpn}
                      </Typography> */}
                      <Grid direction={'row'} container alignItems={'center'} gap={1}>
                        <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">
                          {item.providerNm}
                        </Typography>
                        <MILine thickness={2} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />
                        <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">
                          {/* {dayjs(item.recentViewedDt).format('MMM DD-YY')} */}
                          {dayjs(item.recentViewedDt).format('YY-MM-DD HH:mm')}
                        </Typography>
                      </Grid>
                    </Box>
                    {index !== recentViewedList.length - 1 && <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />}
                  </Fragment>
                ))
              ) : (
                <Typography color="gray.60" textAlign="center" py={4} component="div" variant="body2">
                  No results found
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Box>
    </MISkeleton>
  )
}

export default MarketDataPage
