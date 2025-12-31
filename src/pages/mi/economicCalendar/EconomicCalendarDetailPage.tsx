import { Box, Chip, Divider, Grid2 as Grid, Stack, Typography } from '@mui/material'
import { GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'
import MIButton from '@/components/common/button/MIButton'
import TagChip from '@/components/common/chip/TagChip'
import MILine from '@/components/common/divider/MILine'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITable from '@/components/common/table/MITable'
import MITableCell from '@/components/common/table/MITableCell'
import MISkeleton from '@/components/mi/MISkeleton'
import marketNewsService from '@/service/mi/marketNews'

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

const EconomicCalendarDetailPage = () => {
  const pathParams = useParams()
  const newsSummaryId = pathParams.newsSummaryId

  const navigate = useNavigate()

  const { data: newsSummaryData, isLoading: newsSummaryDataIsLoading } = useQuery({
    queryKey: ['newsSummaryData', newsSummaryId],
    queryFn: () => marketNewsService.getNewsSummaryData(newsSummaryId!),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!newsSummaryId,
  })

  const [pagination, setPagination] = useState({ size: 20 })

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
    <MISkeleton variant={'marketNewsDetail'} loading={newsSummaryDataIsLoading}>
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
            Import Growth Prelim
          </Typography>
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
                2025-08-27
              </Typography>
            </Stack>
          </Grid>
          <Stack direction="row" alignItems="center" py="8px" gap="14px">
            <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
              <Typography variant="infoDocument" color="contentText.Normal">
                Country
              </Typography>
              <Typography variant="sectionTitleTXL" color="contentText.Normal">
                KR
              </Typography>
            </Stack>
            <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
              <Typography variant="infoDocument" color="contentText.Normal">
                Period
              </Typography>
              <Typography variant="sectionTitleTXL" color="contentText.Normal">
                Aug 2025
              </Typography>
            </Stack>
            <Divider orientation="vertical" flexItem sx={{ mx: '6px' }} />
            <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
              <Typography variant="infoDocument" color="contentText.Normal">
                Actual
              </Typography>
              <Typography variant="sectionTitleTXL" color="contentText.Normal">
                -4.0%
              </Typography>
            </Stack>
            <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
              <Typography variant="infoDocument" color="contentText.Normal">
                Forecast
              </Typography>
              <Typography variant="sectionTitleTXL" color="contentText.Normal">
                -0.1%
              </Typography>
            </Stack>
            <Stack width="120px" height="73px" padding="8px" gap="4px" boxSizing="border-box">
              <Typography variant="infoDocument" color="contentText.Normal">
                Prior
              </Typography>
              <Typography variant="sectionTitleTXL" color="contentText.Normal">
                0.7%
              </Typography>
            </Stack>
          </Stack>
          <Box position="absolute" px="30px" right={0} top={0}>
            <MIButton size="h32" type="filled" color="primary">
              Add to Favorites
            </MIButton>
          </Box>
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
              <MITable rowId="id" columns={columns} rows={sampleData} loading={false} disableHover={false} />
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
            <TagChip items={newsSummaryData?.tagList?.map((value) => ({ name: value })) ?? []} disabled />
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
                <Stack py={2} px={3} boxSizing="border-box">
                  <Typography variant="body2SB14" color="contentText.Normal">
                    Updated
                  </Typography>
                  <Typography variant="body2R14" color="contentText.Normal">
                    2025-08-27 09:00
                  </Typography>
                </Stack>
                <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                <Stack py={2} px={3} boxSizing="border-box">
                  <Typography variant="body2SB14" color="contentText.Normal">
                    Next Release
                  </Typography>
                  <Typography variant="body2R14" color="contentText.Normal">
                    2025-10-01 09:00
                  </Typography>
                </Stack>
                <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                <Stack py={2} px={3} boxSizing="border-box">
                  <Typography variant="body2SB14" color="contentText.Normal">
                    Importance
                  </Typography>
                  <Typography variant="body2R14" color="contentText.Normal">
                    Low
                  </Typography>
                </Stack>
                <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                <Stack py={2} px={3} boxSizing="border-box">
                  <Typography variant="body2SB14" color="contentText.Normal">
                    Forecasted By
                  </Typography>
                  <Typography variant="body2R14" color="contentText.Normal">
                    Reuters Poll
                  </Typography>
                </Stack>
                <MILine thickness={1.01} direction="horizontal" backgroundColor="gray.30" />
                <Stack py={2} px={3} boxSizing="border-box">
                  <Typography variant="body2SB14" color="contentText.Normal">
                    Source
                  </Typography>
                  <Typography variant="body2R14" color="contentText.Normal">
                    Korea Customs Service
                  </Typography>
                </Stack>
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
