import { Box, Chip, Divider, Grid2 as Grid, Stack, Tooltip, Typography, TypographyProps } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton'
import useSearchFilter from '@/hooks/useSearchFilter'
import economicService, { EconomicCalendarDateRange, type IEconomicCalendarItem, type IRecentViewedItem } from '@/service/mi/economic'
import { IPaginationResponse } from '@/types/api'
import { getFormattedValue } from '@/utils/economic'

const ImportanceIcon = ({ level }: { level: number }) => {
  let icon = levelNotRatedIcon
  let alt = 'level-not-rated'

  switch (level) {
    case 3:
      icon = levelHighIcon
      alt = 'level-high'
      break
    case 2:
      icon = levelMediumIcon
      alt = 'level-medium'
      break
    case 1:
      icon = levelLowIcon
      alt = 'level-low'
      break
    default:
      break
  }

  return <img src={icon} width={16} height={16} alt={alt} />
}

const TBABadge = () => (
  <Chip
    label="TBA"
    size="small"
    sx={{
      height: 20,
      fontSize: '12px',
      fontWeight: 500,
      backgroundColor: '#FFFFFF',
      color: '#495057',
      border: '1px solid #DEE2E6',
      borderRadius: '4px',
    }}
  />
)

const TruncatedTextWithTooltip = ({ text, ...typographyProps }: { text: string } & TypographyProps) => {
  const textRef = useRef<HTMLDivElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (element) {
      setIsOverflowing(element.scrollWidth > element.clientWidth)
    }
  }, [text])

  const typography = (
    <Typography ref={textRef} {...typographyProps}>
      {text}
    </Typography>
  )

  return isOverflowing ? (
    <Tooltip title={text} placement="top" followCursor>
      {typography}
    </Tooltip>
  ) : (
    typography
  )
}

interface IGetEconomicCalendarRequest {
  dateRange: EconomicCalendarDateRange
  keyword?: string
  categories?: string
  importance?: '3' | '2' | '1'
  page?: number
  size?: number
}

interface TableRow {
  id: string
  releaseDate: string
  time: string
  country: string
  currency: string
  importance: number
  event: string
  actual: number | null
  forecast: number | null
  prior: number | null
  revised: number | null
  unitPrefix: string | null
  unit: string | null
  status: string
  isTBA: boolean
}

const EconomicCalendarPage = () => {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<EconomicCalendarDateRange>(EconomicCalendarDateRange.TODAY)

  const [recentViewedList, setRecentViewedList] = useState<IRecentViewedItem[]>([])
  const [isRecentViewedLoading, setIsRecentViewedLoading] = useState(false)

  useEffect(() => {
    const fetchRecentViewed = async () => {
      try {
        setIsRecentViewedLoading(true)
        const data = await economicService.getRecentViewed()
        setRecentViewedList(data)
      } catch (error) {
        console.error('Failed to fetch recent viewed:', error)
        setRecentViewedList([])
      } finally {
        setIsRecentViewedLoading(false)
      }
    }

    fetchRecentViewed().then()
  }, [])

  const handleClearRecentViewed = async () => {
    try {
      await economicService.clearRecentViewed()
      setRecentViewedList([])
    } catch (error) {
      console.error('Failed to clear recent viewed:', error)
    }
  }

  const fetchEconomicCalendar = async (params: Partial<IGetEconomicCalendarRequest> & { page?: number; size?: number }) =>
    await economicService.getEconomicCalendar({
      dateRange: params.dateRange ?? EconomicCalendarDateRange.TODAY,
      keyword: params.keyword,
      categories: params.categories,
      importance: params.importance,
      page: params.page ?? 1,
      size: params.size ?? 20,
    })

  const { pagination, isLoading, data, filter, updateFilter, updateFilterWithSearch, updatePage, updateSize } = useSearchFilter<
    IGetEconomicCalendarRequest,
    IPaginationResponse<IEconomicCalendarItem>
  >(fetchEconomicCalendar, { dateRange }, { page: 1, size: 20 }, { initialFetch: true })

  useEffect(() => {
    updateFilterWithSearch('dateRange', dateRange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

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

  const dateRangeOptions = useMemo(
    () => [
      { label: 'Today', value: EconomicCalendarDateRange.TODAY },
      { label: 'Yesterday', value: EconomicCalendarDateRange.YESTERDAY },
      { label: 'Tomorrow', value: EconomicCalendarDateRange.TOMORROW },
      { label: 'This Week', value: EconomicCalendarDateRange.THISWEEK },
      { label: 'Next Week', value: EconomicCalendarDateRange.NEXTWEEK },
    ],
    [],
  )

  const tableRows = useMemo(() => {
    if (!data?.detail) return []
    return data.detail.map((item) => ({
      id: item.code,
      releaseDate: item.economicIndicatorPresentationDay,
      time: item.economicIndicatorPresentationTime ? item.economicIndicatorPresentationTime.slice(0, 5) : '',
      country: item.countryNameCode,
      currency: item.countryCurrencyCode,
      importance: item.refinitivPriority,
      event: item.economicIndicatorName,
      actual: item.economicIndicatorRealValue,
      forecast: item.economicIndicatorPredictionValue,
      prior: item.economicIndicatorPresentationPriorValue,
      revised: null,
      unitPrefix: item.unitPrefix,
      unit: item.unit,
      status: item.status,
      isTBA: item.status === 'SCHEDULED',
    }))
  }, [data])

  const columns: GridColDef[] = [
    {
      field: 'releaseDate',
      headerName: 'Release Date',
      width: 110,
      align: 'center',
      renderCell: (params) => <MITableCell value={params.value} color="contentText.Subtext" />,
    },
    {
      field: 'time',
      headerName: 'Time',
      width: 70,
      align: 'center',
      renderCell: (params) => <MITableCell value={params.value} color="contentText.Subtext" />,
    },
    {
      field: 'country',
      headerName: 'Ctry.',
      width: 40,
      align: 'center',
      renderCell: (params) => <MITableCell value={params.value} />,
    },
    {
      field: 'currency',
      headerName: 'Cur.',
      width: 56,
      align: 'center',
      renderCell: (params) => <MITableCell value={params.value} />,
    },
    {
      field: 'importance',
      headerName: 'Imp.',
      width: 40,
      align: 'center',
      renderCell: (params) => (
        <MITableCell>
          <Box display="flex" alignItems="center" justifyContent="center" width="100%">
            <ImportanceIcon level={params.value} />
          </Box>
        </MITableCell>
      ),
    },
    {
      field: 'event',
      headerName: 'Event',
      flex: 1,
      minWidth: 200,
      align: 'left',
      renderCell: (params) => <MITableCell value={params.value} tooltipContent={params.value} />,
    },
    {
      field: 'actual',
      headerName: 'Actual',
      width: 100,
      align: 'right',
      renderCell: (params) => {
        const row = params.row as TableRow
        if (row.isTBA) {
          return (
            <MITableCell>
              <Box display="flex" alignItems="center" justifyContent="flex-end" width="100%">
                <TBABadge />
              </Box>
            </MITableCell>
          )
        }
        return (
          <MITableCell
            value={getFormattedValue(row.actual, row.unitPrefix, row.unit)}
            typography={{
              sx: {
                fontWeight: 600,
              },
            }}
          />
        )
      },
    },
    {
      field: 'forecast',
      headerName: 'Forecast',
      width: 100,
      align: 'right',
      renderCell: (params) => {
        const row = params.row as TableRow
        return (
          <MITableCell
            value={getFormattedValue(row.forecast, row.unitPrefix, row.unit)}
            typography={{
              sx: {
                fontWeight: 600,
              },
            }}
          />
        )
      },
    },
    {
      field: 'prior',
      headerName: 'Prior',
      width: 100,
      align: 'right',
      renderCell: (params) => {
        const row = params.row as TableRow
        return (
          <MITableCell
            value={getFormattedValue(row.prior, row.unitPrefix, row.unit)}
            typography={{
              sx: {
                fontWeight: 600,
              },
            }}
          />
        )
      },
    },
    {
      field: 'revised',
      headerName: 'Revised',
      width: 100,
      align: 'right',
      renderCell: (params) => {
        const row = params.row as TableRow
        return (
          <MITableCell
            value={row.revised ? getFormattedValue(row.revised, row.unitPrefix, row.unit) : '-'}
            typography={{
              sx: {
                fontWeight: 600,
              },
            }}
          />
        )
      },
    },
  ]

  return (
    <MISkeleton variant={'aiMarketSummary'}>
      <MIPageHeadline title="Economic Calendar" gradientStart="#2E313A" gradientEnd="#1F212A" />

      <Stack maxWidth={1440} width="100%" padding="50px 30px" margin="auto" gap="24px" boxSizing="border-box" overflow="hidden">
        <Stack gap="24px">
          <Stack direction="row" gap="24px">
            <Stack flexGrow={1} gap="24px" sx={{ minWidth: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" gap="12px">
                  <MISearchInput
                    storageKey="economic-calendar"
                    value={filter?.keyword ?? ''}
                    placeholder="Search for economic events"
                    onChange={handleSearchChange}
                    onSearch={handleSearch}
                    onClear={handleSearchClear}
                  />
                </Stack>
                <Stack direction="row" gap="12px">
                  <MISelectMenu
                    variant="outlined"
                    sx={{ width: 160 }}
                    items={[{ label: 'UTC+9 (KST)', value: 'kst' }]}
                    selected={'kst'}
                    onSelected={() => {}}
                    disabled
                  />
                  <MISelectMenu
                    variant="outlined"
                    sx={{ width: 160 }}
                    items={dateRangeOptions}
                    selected={dateRange}
                    onSelected={(selected: string) => setDateRange(selected as EconomicCalendarDateRange)}
                  />
                </Stack>
              </Stack>
              <Divider />
              <Box
                sx={{
                  height: '838px', // 헤더(38px) + 20개 행(40px * 20 = 800px)
                  width: '100%',
                  '& .MuiDataGrid-root': {
                    height: '100%',
                  },
                }}
              >
                <MITable
                  rowId="id"
                  columns={columns}
                  rows={tableRows}
                  loading={isLoading}
                  disableHover={false}
                  onRowClick={(params) => {
                    navigate(`/mi/economic-calendar/${params.row.id}`)
                  }}
                />
              </Box>
              {data && tableRows.length > 0 && (
                <MIPagination
                  data={data}
                  size={pagination.size}
                  onPageChange={(page) => updatePage(page)}
                  onSizeChange={(value) => updateSize(value)}
                />
              )}
              {!isLoading && tableRows.length === 0 && (
                <Box
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  width={'100%'}
                  height={'732px'}
                  sx={{ backgroundColor: '#F8F9FA', border: '1px solid #DEE2E6', borderRadius: '4px' }}
                >
                  <Box display={'flex'} flexDirection={'column'} height={'fit-content'} alignItems={'center'}>
                    <ErrorOutlineIcon />
                    <Typography variant="body3SB12" color="gray.60" mt={'10px'}>
                      No results found
                    </Typography>
                  </Box>
                </Box>
              )}
            </Stack>

            <Stack width={286} flexShrink={0} gap="30px">
              {/*<Box*/}
              {/*  display={'flex'}*/}
              {/*  flexDirection={'column'}*/}
              {/*  border={'1px solid'}*/}
              {/*  borderColor={'gray.30'}*/}
              {/*  borderRadius={1}*/}
              {/*  py={6}*/}
              {/*  px={3}*/}
              {/*  flexShrink={0}*/}
              {/*  width={286}*/}
              {/*  boxSizing={'border-box'}*/}
              {/*  gap={2}*/}
              {/*>*/}
              {/*  <Box display="flex" justifyContent="space-between" alignItems="center" px={3}>*/}
              {/*    <Typography color="gray.70" component="h2" variant="sidePanelTitle">*/}
              {/*      Favorites*/}
              {/*    </Typography>*/}
              {/*  </Box>*/}
              {/*  <Box display={'flex'} flexDirection={'column'} gap={'4px'}>*/}
              {/*    {recentViewedList?.length ? (*/}
              {/*      recentViewedList.map((item, index) => (*/}
              {/*        <Fragment key={`recent-viewed-${item.goodsNo}-${item.goodsDataNo}-${index}`}>*/}
              {/*          <Box*/}
              {/*            paddingY={2}*/}
              {/*            // onClick={() => navigate(`/mi/data-detail/${item.goodsNo}/${item.goodsDataNo}`)}*/}
              {/*            sx={{*/}
              {/*              width: '90%',*/}
              {/*              padding: '12px',*/}
              {/*              overflow: 'hidden',*/}
              {/*              cursor: 'pointer',*/}
              {/*              borderRadius: '4px',*/}
              {/*              '&:hover': {*/}
              {/*                backgroundColor: 'contentBG.Hover',*/}
              {/*              },*/}
              {/*            }}*/}
              {/*          >*/}
              {/*            <TruncatedTextWithTooltip*/}
              {/*              text={item.goodsDataNm}*/}
              {/*              color="gray.70"*/}
              {/*              component="div"*/}
              {/*              lineHeight={1.4}*/}
              {/*              variant="body4"*/}
              {/*              sx={{*/}
              {/*                overflow: 'hidden',*/}
              {/*                textOverflow: 'ellipsis',*/}
              {/*                whiteSpace: 'nowrap',*/}
              {/*              }}*/}
              {/*            />*/}
              {/*            <Grid direction={'row'} container alignItems={'center'} gap={1}>*/}
              {/*              <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">*/}
              {/*                {item.providerNm}*/}
              {/*              </Typography>*/}
              {/*              <MILine thickness={1.1} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />*/}
              {/*              <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">*/}
              {/*                {dayjs(item.recentViewedDt).format('YY-MM-DD HH:mm')}*/}
              {/*              </Typography>*/}
              {/*            </Grid>*/}
              {/*          </Box>*/}
              {/*          {index !== recentViewedList.length - 1 && (*/}
              {/*            <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />*/}
              {/*          )}*/}
              {/*        </Fragment>*/}
              {/*      ))*/}
              {/*    ) : (*/}
              {/*      <Typography color="gray.50" textAlign="center" py={5.5} component="div" variant="body3R12">*/}
              {/*        No History*/}
              {/*      </Typography>*/}
              {/*    )}*/}
              {/*  </Box>*/}
              {/*</Box>*/}
              <Box
                display={'flex'}
                flexDirection={'column'}
                border={'1px solid'}
                borderColor={'gray.30'}
                borderRadius={1}
                py={6}
                px={3}
                flexShrink={0}
                width={286}
                boxSizing={'border-box'}
                gap={2}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" px={3}>
                  <Typography color="gray.70" component="h2" variant="sidePanelTitle">
                    Recently Viewed
                  </Typography>
                  <Typography
                    variant="body3R12"
                    sx={{
                      color: 'gray.70',
                      lineHeight: 1.2,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      '&:hover': {
                        color: 'gray.70',
                      },
                    }}
                    onClick={handleClearRecentViewed}
                  >
                    Clear
                  </Typography>
                </Box>
                <Box display={'flex'} flexDirection={'column'} gap={'4px'}>
                  {isRecentViewedLoading ? (
                    <Typography color="gray.50" textAlign="center" py={5.5} component="div" variant="body3R12">
                      Loading...
                    </Typography>
                  ) : recentViewedList?.length ? (
                    recentViewedList.map((item, index) => (
                      <Fragment key={`recent-viewed-${item.code}-${index}`}>
                        <Box
                          paddingY={2}
                          onClick={() => navigate(`/mi/economic-calendar/${item.code}`)}
                          sx={{
                            width: '90%',
                            padding: '12px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            '&:hover': {
                              backgroundColor: 'contentBG.Hover',
                            },
                          }}
                        >
                          <TruncatedTextWithTooltip
                            text={item.economicIndicatorName}
                            color="gray.70"
                            component="div"
                            lineHeight={1.4}
                            variant="body4"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          />
                          <Grid direction={'row'} container alignItems={'center'} gap={1} sx={{ minWidth: 0, flexWrap: 'nowrap' }}>
                            <Typography
                              color="gray.60"
                              lineHeight={1.4}
                              component="div"
                              variant="body3R12"
                              sx={{
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                              }}
                            >
                              {item.refinitivSourceOrganization}
                            </Typography>
                            <MILine thickness={1.1} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />
                            <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12" sx={{ flexShrink: 0 }}>
                              {dayjs(item.inquiryDateTime).format('YY-MM-DD HH:mm')}
                            </Typography>
                          </Grid>
                        </Box>
                        {index !== recentViewedList.length - 1 && (
                          <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                        )}
                      </Fragment>
                    ))
                  ) : (
                    <Typography color="gray.50" textAlign="center" py={5.5} component="div" variant="body3R12">
                      No History
                    </Typography>
                  )}
                </Box>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </MISkeleton>
  )
}

export default EconomicCalendarPage
