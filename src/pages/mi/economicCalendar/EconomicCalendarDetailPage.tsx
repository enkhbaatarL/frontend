import { Box, Chip, Divider, Grid2 as Grid, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
// import MIButton from '@/components/common/button/MIButton'
import MILine from '@/components/common/divider/MILine'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import MISkeleton from '@/components/mi/MISkeleton'
import economicService, { type IEconomicCalendarItem } from '@/service/mi/economic'
import { getFormattedValue, getImportanceLabel } from '@/utils/economic'

interface EconomicEvent {
  id: number
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
  isTBA?: boolean
}

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

const EconomicCalendarDetailPage = () => {
  const pathParams = useParams()
  const economicCalendarCode = pathParams.economicCalendarCode

  const navigate = useNavigate()

  const { data: detailData, isLoading: detailDataIsLoading } = useQuery({
    queryKey: ['economicCalendarDetail', economicCalendarCode],
    queryFn: () => economicService.getEconomicCalenderDetail(economicCalendarCode!),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!economicCalendarCode,
  })

  const { data: historyData, isLoading: historyDataIsLoading } = useQuery({
    queryKey: ['economicCalendarDetailHistory', economicCalendarCode],
    queryFn: () => economicService.getEconomicCalenderDetailHistory(economicCalendarCode!),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!economicCalendarCode,
  })

  const [pagination, setPagination] = useState({ size: 20, page: 1 })

  const convertToEconomicEvent = (item: IEconomicCalendarItem): EconomicEvent => ({
    id: item.economicCalendarId,
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
    isTBA: item.status === 'SCHEDULED',
  })

  const tableData = useMemo(() => {
    if (!historyData?.detail) return []
    return historyData.detail.map(convertToEconomicEvent)
  }, [historyData])

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
      renderCell: (params) => <MITableCell value={params.value || '-'} />,
    },
    {
      field: 'currency',
      headerName: 'Cur.',
      width: 56,
      align: 'center',
      renderCell: (params) => <MITableCell value={params.value || '-'} />,
    },
    {
      field: 'importance',
      headerName: 'Imp.',
      width: 40,
      align: 'center',
      renderCell: (params) => (
        <MITableCell>
          <Box display="flex" alignItems="center" justifyContent="center" width="100%">
            <ImportanceIcon level={params.value as number} />
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
        const row = params.row as EconomicEvent
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
        const row = params.row as EconomicEvent
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
        const row = params.row as EconomicEvent
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

  const paginatedData = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.size
    const endIndex = startIndex + pagination.size
    return tableData.slice(startIndex, endIndex)
  }, [tableData, pagination])

  const totalPages = useMemo(() => Math.ceil(tableData.length / pagination.size), [tableData.length, pagination.size])

  return (
    <MISkeleton variant={'marketNewsDetail'} loading={detailDataIsLoading || historyDataIsLoading}>
      <Box paddingTop={'56px'} paddingBottom={'30px'}>
        <Box paddingX={7.5} boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'} position={'relative'}>
          <Typography
            color="contentText.Normal"
            variant="subtext1"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/mi/economic-calendar')}
          >
            Economic Calendar
          </Typography>
          <Typography paddingY={4.5} color="contentText.Black" component="h1" lineHeight={1.2} variant="titleSubPage">
            {detailData?.economicIndicatorName || 'Loading...'}
          </Typography>
          {detailData && (
            <>
              <Grid container alignItems="center">
                <Stack
                  direction="row"
                  alignItems="center"
                  padding="6px 12px"
                  gap="10px"
                  borderRadius="6px"
                  border="1px solid"
                  borderColor="contentBorder.Normal"
                >
                  <Typography variant="body1SB16" color="contentText.Normal">
                    Latest Release
                  </Typography>
                  <Typography variant="body1M16" color="contentText.Normal">
                    {detailData.economicIndicatorPresentationDay}
                  </Typography>
                </Stack>
              </Grid>
              <Stack direction="row" alignItems="center" py="8px" gap="14px">
                <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
                  <Typography variant="infoDocument" color="contentText.Normal">
                    Country
                  </Typography>
                  <Typography variant="sectionTitleTXL" color="contentText.Normal">
                    {detailData.countryNameCode}
                  </Typography>
                </Stack>
                <Divider orientation="vertical" flexItem sx={{ mx: '6px' }} />
                <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
                  <Typography variant="infoDocument" color="contentText.Normal">
                    Actual
                  </Typography>
                  <Typography variant="sectionTitleTXL" color="contentText.Normal">
                    {detailData.status === 'SCHEDULED'
                      ? 'TBA'
                      : getFormattedValue(detailData.economicIndicatorRealValue, detailData.unitPrefix, detailData.unit)}
                  </Typography>
                </Stack>
                <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
                  <Typography variant="infoDocument" color="contentText.Normal">
                    Forecast
                  </Typography>
                  <Typography variant="sectionTitleTXL" color="contentText.Normal">
                    {getFormattedValue(detailData.economicIndicatorPredictionValue, detailData.unitPrefix, detailData.unit)}
                  </Typography>
                </Stack>
                <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
                  <Typography variant="infoDocument" color="contentText.Normal">
                    Prior
                  </Typography>
                  <Typography variant="sectionTitleTXL" color="contentText.Normal">
                    {getFormattedValue(detailData.economicIndicatorPresentationPriorValue, detailData.unitPrefix, detailData.unit)}
                  </Typography>
                </Stack>
              </Stack>
            </>
          )}
          {/*<Box position="absolute" px="30px" right={0} top={0}>*/}
          {/*  <MIButton size="h32" type="filled" color="primary">*/}
          {/*    Add to Favorites*/}
          {/*  </MIButton>*/}
          {/*</Box>*/}
        </Box>
      </Box>
      <Box boxSizing={'border-box'} minWidth={'1380px'} width={'1380px'} borderTop="1px solid" borderColor="gray.30" margin={'auto'}></Box>
      <Box boxSizing={'border-box'} minWidth={'1440px'} width={'1440px'} margin={'auto'} paddingTop={10} paddingX={7.5}>
        <Grid
          sx={{
            flexWrap: 'nowrap',
          }}
          direction="row"
          container
          gap={6}
        >
          <Grid container direction="column" flexGrow={1} gap={10}>
            <Box
              sx={{
                height: '838px', // 헤더(38px) + 20개 행(40px * 20 = 800px)
                width: '100%',
                '& .MuiDataGrid-root': {
                  height: '100%',
                },
              }}
            >
              <MITable rowId="id" columns={columns} rows={paginatedData} loading={historyDataIsLoading} disableHover={false} />
            </Box>
            {historyData && tableData.length > 0 && (
              <MIPagination
                data={{
                  detail: paginatedData,
                  currentPage: pagination.page,
                  totalPages,
                  totalElements: tableData.length,
                  numberOfElements: paginatedData.length,
                  size: pagination.size,
                  isFirst: pagination.page === 1,
                  isLast: pagination.page === totalPages,
                  hasPrevious: pagination.page > 1,
                  hasNext: pagination.page < totalPages,
                }}
                size={pagination.size}
                onPageChange={(page) => setPagination({ ...pagination, page })}
                onSizeChange={(value) => setPagination({ ...pagination, size: value, page: 1 })}
              />
            )}
          </Grid>
          <Grid
            sx={{
              width: '286px',
              maxWidth: '286px',
              minWidth: '286px',
              flexShrink: 0,
            }}
            container
            gap={6}
            direction="column"
          >
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
                  Info
                </Typography>
              </Box>
              <Box display={'flex'} flexDirection={'column'} gap={'4px'}>
                {detailData && (
                  <>
                    <Stack py={2} px={3} boxSizing="border-box">
                      <Typography variant="body2SB14" color="contentText.Normal">
                        Updated
                      </Typography>
                      <Typography variant="body2R14" color="contentText.Normal">
                        {detailData.economicIndicatorPresentationDay}{' '}
                        {detailData.economicIndicatorPresentationTime ? detailData.economicIndicatorPresentationTime.slice(0, 5) : ''}
                      </Typography>
                    </Stack>
                    <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                    {detailData.nextEconomicIndicatorPresentationDay && (
                      <>
                        <Stack py={2} px={3} boxSizing="border-box">
                          <Typography variant="body2SB14" color="contentText.Normal">
                            Next Release
                          </Typography>
                          <Typography variant="body2R14" color="contentText.Normal">
                            {detailData.nextEconomicIndicatorPresentationDay}
                          </Typography>
                        </Stack>
                        <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                      </>
                    )}
                    <Stack py={2} px={3} boxSizing="border-box">
                      <Typography variant="body2SB14" color="contentText.Normal">
                        Importance
                      </Typography>
                      <Typography variant="body2R14" color="contentText.Normal">
                        {getImportanceLabel(detailData.refinitivPriority)}
                      </Typography>
                    </Stack>
                    {detailData.refinitivExplanation && (
                      <>
                        <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                        <Stack py={2} px={3} boxSizing="border-box">
                          <Typography variant="body2SB14" color="contentText.Normal">
                            Forecasted By
                          </Typography>
                          <Typography variant="body2R14" color="contentText.Normal">
                            {detailData.refinitivExplanation}
                          </Typography>
                        </Stack>
                      </>
                    )}
                    {detailData.refinitivSourceOrganization && (
                      <>
                        <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                        <Stack py={2} px={3} boxSizing="border-box">
                          <Typography variant="body2SB14" color="contentText.Normal">
                            Source
                          </Typography>
                          <Typography variant="body2R14" color="contentText.Normal">
                            {detailData.refinitivSourceOrganization}
                          </Typography>
                        </Stack>
                      </>
                    )}
                  </>
                )}
              </Box>
            </Box>
            <Typography paddingX={3} color="gray.60" component="div" variant="body3R12">
              This document is the property of the respective data provider. Please refrain from reproducing or distributing it without
              prior approval. If you wish to use this content, please contact the appropriate administrator in advance. The information
              contained herein is provided for reference purposes only, and users are encouraged to exercise their own judgment and
              responsibility when utilizing it.
            </Typography>
            <Typography paddingX={3} color="gray.60" component="div" variant="body3R12">
              본 문서는 해당 데이터 제공업체의 자산으로, 사전 승인 없이 복제하거나 배포하는 것은 삼가 주시기 바랍니다. 활용을 원하실 경우,
              관련 관리자에게 사전 문의해 주시기 바랍니다. 본 문서는 참고용 정보를 제공하기 위한 것으로, 내용의 정확성이나 활용 결과에
              대해서는 사용자의 판단과 책임이 요구됩니다.
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </MISkeleton>
  )
}

export default EconomicCalendarDetailPage
