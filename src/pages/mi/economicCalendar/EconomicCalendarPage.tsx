import { Box, Chip, Divider, Grid2 as Grid, Stack, Typography, Tooltip } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { useState, useRef, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import MILine from '@/components/common/divider/MILine'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu from '@/components/common/menu/MIDateRangePickerMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton'

type ImportanceLevel = 'HIGH' | 'MEDIUM' | 'LOW'

interface EconomicEvent {
  id: string
  releaseDate: string
  time: string
  country: string
  currency: string
  importance: ImportanceLevel
  event: string
  period: string
  actual: string
  forecast: string
  prior: string
  revised: string
  isTBA?: boolean
}

const ImportanceIcon = ({ level }: { level: ImportanceLevel }) => {
  let icon = levelNotRatedIcon
  let alt = 'level-not-rated'

  switch (level) {
    case 'HIGH':
      icon = levelHighIcon
      alt = 'level-high'
      break
    case 'MEDIUM':
      icon = levelMediumIcon
      alt = 'level-medium'
      break
    case 'LOW':
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

const TruncatedTextWithTooltip = ({ text, ...typographyProps }: { text: string } & any) => {
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

interface RecentViewedItem {
  goodsNo: number
  goodsDataNo: number
  goodsDataNm: string
  providerNm: string
  recentViewedDt: string
}

const EconomicCalendarPage = () => {
  const navigate = useNavigate()
  const [isListLoading] = useState(false)
  const [pagination, setPagination] = useState({ size: 20 })

  const [recentViewedList, setRecentViewedList] = useState<RecentViewedItem[]>([
    {
      goodsNo: 1,
      goodsDataNo: 101,
      goodsDataNm: 'Global Economic Outlook 2025: Market Trends and Forecasts',
      providerNm: 'Wood Mackenzie',
      recentViewedDt: dayjs().subtract(1, 'hour').toISOString(),
    },
    {
      goodsNo: 2,
      goodsDataNo: 102,
      goodsDataNm: 'Energy Market Analysis: Q3 2025 Quarterly Report',
      providerNm: 'IHS Markit',
      recentViewedDt: dayjs().subtract(3, 'hours').toISOString(),
    },
    {
      goodsNo: 3,
      goodsDataNo: 103,
      goodsDataNm: 'Commodity Price Trends: Oil and Gas Market Update',
      providerNm: 'Wood Mackenzie',
      recentViewedDt: dayjs().subtract(5, 'hours').toISOString(),
    },
    {
      goodsNo: 4,
      goodsDataNo: 104,
      goodsDataNm: 'Regional Economic Indicators: Asia-Pacific Analysis',
      providerNm: 'Bloomberg',
      recentViewedDt: dayjs().subtract(1, 'day').toISOString(),
    },
    {
      goodsNo: 5,
      goodsDataNo: 105,
      goodsDataNm: 'Market Intelligence Report: Energy Sector Overview',
      providerNm: 'IHS Markit',
      recentViewedDt: dayjs().subtract(2, 'days').toISOString(),
    },
  ])

  const handleClearRecentViewed = () => {
    setRecentViewedList([])
  }

  const sampleData: EconomicEvent[] = [
    {
      id: 'e1',
      releaseDate: '2025-09-03',
      time: '10:00',
      country: 'CN',
      currency: 'CNY',
      importance: 'MEDIUM',
      event: 'Imports (YoY)',
      period: 'Aug',
      actual: '-4.1%',
      forecast: '-4.0%',
      prior: '-3.8%',
      revised: '-3.9%',
    },
    {
      id: 'e2',
      releaseDate: '2025-09-03',
      time: '11:00',
      country: 'CN',
      currency: 'CNY',
      importance: 'MEDIUM',
      event: 'Exports (YoY)',
      period: 'Aug',
      actual: '2.5%',
      forecast: '2.0%',
      prior: '1.8%',
      revised: '1.9%',
    },
    {
      id: 'e3',
      releaseDate: '2025-09-03',
      time: '12:00',
      country: 'CN',
      currency: 'CNY',
      importance: 'MEDIUM',
      event: 'Trade Balance',
      period: 'Aug',
      actual: '$1.5B',
      forecast: '$1.8B',
      prior: '$1.2B',
      revised: '$1.3B',
    },
    {
      id: 'e4',
      releaseDate: '2025-09-03',
      time: '13:00',
      country: 'US',
      currency: 'USD',
      importance: 'MEDIUM',
      event: 'CPI (YoY)',
      period: 'Aug',
      actual: '3.2%',
      forecast: '3.5%',
      prior: '3.0%',
      revised: '3.1%',
    },
    {
      id: 'e5',
      releaseDate: '2025-09-03',
      time: '14:00',
      country: 'US',
      currency: 'USD',
      importance: 'MEDIUM',
      event: 'Unemployment Rate',
      period: 'Aug',
      actual: '5.0%',
      forecast: '4.9%',
      prior: '4.8%',
      revised: '4.85%',
    },
    {
      id: 'e6',
      releaseDate: '2025-09-04',
      time: '15:00',
      country: 'EU',
      currency: 'EUR',
      importance: 'MEDIUM',
      event: 'GDP Growth (QoQ)',
      period: 'Q2',
      actual: '1.1%',
      forecast: '1.3%',
      prior: '0.9%',
      revised: '1.0%',
    },
    {
      id: 'e7',
      releaseDate: '2025-09-04',
      time: '16:00',
      country: 'US',
      currency: 'USD',
      importance: 'MEDIUM',
      event: 'Retail Sales (MoM)',
      period: 'Aug',
      actual: '0.8%',
      forecast: '0.6%',
      prior: '0.5%',
      revised: '0.55%',
    },
    {
      id: 'e8',
      releaseDate: '2025-09-04',
      time: '17:00',
      country: 'US',
      currency: 'USD',
      importance: 'MEDIUM',
      event: 'Consumer Confidence',
      period: 'Aug',
      actual: '82.4',
      forecast: '80.7',
      prior: '79.5',
      revised: '80.1',
    },
    {
      id: 'e9',
      releaseDate: '2025-09-04',
      time: '18:00',
      country: 'EU',
      currency: 'EUR',
      importance: 'MEDIUM',
      event: 'Interest Rate',
      period: 'Aug',
      actual: '0.25%',
      forecast: '0.50%',
      prior: '0.00%',
      revised: '0.10%',
    },
    {
      id: 'e10',
      releaseDate: '2025-09-05',
      time: '19:00',
      country: 'US',
      currency: 'USD',
      importance: 'MEDIUM',
      event: 'Manufacturing PMI',
      period: 'Aug',
      actual: '54.2',
      forecast: '53.5',
      prior: '52.8',
      revised: '53.0',
    },
    {
      id: 'e11',
      releaseDate: '2025-09-05',
      time: '20:00',
      country: 'US',
      currency: 'USD',
      importance: 'HIGH',
      event: 'Federal Funds Rate',
      period: 'Sep',
      actual: '5.25%',
      forecast: '5.50%',
      prior: '5.00%',
      revised: '5.10%',
    },
    {
      id: 'e12',
      releaseDate: '2025-09-05',
      time: '21:00',
      country: 'US',
      currency: 'USD',
      importance: 'HIGH',
      event: 'Non-Farm Payrolls',
      period: 'Aug',
      actual: '187K',
      forecast: '200K',
      prior: '175K',
      revised: '180K',
    },
    {
      id: 'e13',
      releaseDate: '2025-09-06',
      time: '15:00',
      country: 'JP',
      currency: 'JPY',
      importance: 'MEDIUM',
      event: 'GDP Growth (QoQ)',
      period: 'Q2',
      actual: 'TBA',
      forecast: '1.1%',
      prior: '0.8%',
      revised: '0.9%',
      isTBA: true,
    },
    {
      id: 'e14',
      releaseDate: '2025-09-06',
      time: '16:00',
      country: 'GB',
      currency: 'GBP',
      importance: 'MEDIUM',
      event: 'Retail Sales (MoM)',
      period: 'Aug',
      actual: 'TBA',
      forecast: '0.6%',
      prior: '0.4%',
      revised: '0.45%',
      isTBA: true,
    },
    {
      id: 'e15',
      releaseDate: '2025-09-06',
      time: '17:00',
      country: 'US',
      currency: 'USD',
      importance: 'MEDIUM',
      event: 'Consumer Confidence',
      period: 'Aug',
      actual: 'TBA',
      forecast: '80.7',
      prior: '78.2',
      revised: '79.0',
      isTBA: true,
    },
    {
      id: 'e16',
      releaseDate: '2025-09-07',
      time: '18:00',
      country: 'EU',
      currency: 'EUR',
      importance: 'MEDIUM',
      event: 'Interest Rate',
      period: 'Aug',
      actual: 'TBA',
      forecast: '0.50%',
      prior: '0.25%',
      revised: '0.30%',
      isTBA: true,
    },
    {
      id: 'e17',
      releaseDate: '2025-09-07',
      time: '19:00',
      country: 'CN',
      currency: 'CNY',
      importance: 'MEDIUM',
      event: 'Manufacturing PMI',
      period: 'Aug',
      actual: 'TBA',
      forecast: '53.5',
      prior: '52.1',
      revised: '52.5',
      isTBA: true,
    },
    {
      id: 'e18',
      releaseDate: '2025-09-07',
      time: '20:00',
      country: 'US',
      currency: 'USD',
      importance: 'HIGH',
      event: 'Federal Funds Rate',
      period: 'Sep',
      actual: 'TBA',
      forecast: '5.50%',
      prior: '5.25%',
      revised: '5.30%',
      isTBA: true,
    },
    {
      id: 'e19',
      releaseDate: '2025-09-07',
      time: '21:00',
      country: 'US',
      currency: 'USD',
      importance: 'HIGH',
      event: 'Non-Farm Payrolls',
      period: 'Aug',
      actual: 'TBA',
      forecast: '200K',
      prior: '187K',
      revised: '190K',
      isTBA: true,
    },
    {
      id: 'e20',
      releaseDate: '2025-09-08',
      time: '22:00',
      country: 'US',
      currency: 'USD',
      importance: 'LOW',
      event: 'Consumer Price Index',
      period: 'Aug',
      actual: 'TBA',
      forecast: '3.2%',
      prior: '3.0%',
      revised: '3.1%',
      isTBA: true,
    },
  ]

  const today = dayjs()

  const [dateRange, setDateRange] = useState({ startDate: today, endDate: today })

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
            <ImportanceIcon level={params.value as ImportanceLevel} />
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
      field: 'period',
      headerName: 'Period',
      width: 64,
      align: 'center',
      renderCell: (params) => <MITableCell value={params.value} />,
    },
    {
      field: 'actual',
      headerName: 'Actual',
      width: 100,
      align: 'right',
      renderCell: (params) => {
        const row = params.row as EconomicEvent
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
            value={params.value}
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
      renderCell: (params) => (
        <MITableCell
          value={params.value}
          typography={{
            sx: {
              fontWeight: 600,
            },
          }}
        />
      ),
    },
    {
      field: 'prior',
      headerName: 'Prior',
      width: 100,
      align: 'right',
      renderCell: (params) => (
        <MITableCell
          value={params.value}
          typography={{
            sx: {
              fontWeight: 600,
            },
          }}
        />
      ),
    },
    {
      field: 'revised',
      headerName: 'Revised',
      width: 100,
      align: 'right',
      renderCell: (params) => (
        <MITableCell
          value={params.value}
          typography={{
            sx: {
              fontWeight: 600,
            },
          }}
        />
      ),
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
                    storageKey="ai-market-summary"
                    value={''}
                    placeholder="Search for economic events"
                    onChange={() => {}}
                    onSearch={() => {}}
                    onClear={() => {}}
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
                  <MIDateRangePickerMenu
                    dateRange={dateRange}
                    onApply={(dates) => setDateRange({ startDate: dates.startDate ?? today, endDate: dates.endDate ?? today })}
                    limitDateRange={[1, 'weeks']}
                    datePresets={[
                      { label: 'Today', value: { startDate: today, endDate: today } },
                      { label: 'Yesterday', value: { startDate: today.subtract(1, 'day'), endDate: today.subtract(1, 'day') } },
                      { label: 'Tomorrow', value: { startDate: today.add(1, 'day'), endDate: today.add(1, 'day') } },
                      {
                        label: 'This Week',
                        value: {
                          startDate: today.startOf('week').add(1, 'day'),
                          endDate: today.endOf('week').add(1, 'day'),
                        },
                      },
                      {
                        label: 'Next Week',
                        value: {
                          startDate: today.startOf('week').add(8, 'day'),
                          endDate: today.startOf('week').add(14, 'day'),
                        },
                      },
                    ]}
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
                <MITable rowId="id" columns={columns} rows={sampleData} loading={isListLoading} disableHover={false} />
              </Box>
              {sampleData.length > 0 && (
                <MIPagination
                  data={{
                    detail: sampleData,
                    currentPage: 1,
                    totalPages: 1,
                    totalElements: sampleData.length,
                    numberOfElements: sampleData.length,
                    size: pagination.size,
                    isFirst: true,
                    isLast: true,
                    hasPrevious: false,
                    hasNext: false,
                  }}
                  size={pagination.size}
                  onPageChange={() => {}}
                  onSizeChange={(value) => setPagination({ size: value })}
                />
              )}
              {!isListLoading && sampleData.length === 0 && (
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
                    Favorites
                  </Typography>
                </Box>
                <Box display={'flex'} flexDirection={'column'} gap={'4px'}>
                  {recentViewedList?.length ? (
                    recentViewedList.map((item, index) => (
                      <Fragment key={`recent-viewed-${item.goodsNo}-${item.goodsDataNo}-${index}`}>
                        <Box
                          paddingY={2}
                          onClick={() => navigate(`/mi/data-detail/${item.goodsNo}/${item.goodsDataNo}`)}
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
                            text={item.goodsDataNm}
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
                          <Grid direction={'row'} container alignItems={'center'} gap={1}>
                            <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">
                              {item.providerNm}
                            </Typography>
                            <MILine thickness={1.1} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />
                            <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">
                              {dayjs(item.recentViewedDt).format('YY-MM-DD HH:mm')}
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
                  {recentViewedList?.length ? (
                    recentViewedList.map((item, index) => (
                      <Fragment key={`recent-viewed-${item.goodsNo}-${item.goodsDataNo}-${index}`}>
                        <Box
                          paddingY={2}
                          onClick={() => navigate(`/mi/data-detail/${item.goodsNo}/${item.goodsDataNo}`)}
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
                            text={item.goodsDataNm}
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
                          <Grid direction={'row'} container alignItems={'center'} gap={1}>
                            <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">
                              {item.providerNm}
                            </Typography>
                            <MILine thickness={1.1} margin={'0 6px'} length={6} borderRadius={10} direction={'vertical'} />
                            <Typography color="gray.60" lineHeight={1.4} component="div" variant="body3R12">
                              {dayjs(item.recentViewedDt).format('YY-MM-DD HH:mm')}
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
