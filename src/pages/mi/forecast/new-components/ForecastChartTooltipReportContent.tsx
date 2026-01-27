import { LabelImportantRounded, InfoOutlined } from '@mui/icons-material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ReactNode, memo, useMemo, useRef } from 'react'

import MIBaseButton from '@/components/common/button/MIBaseButton'
import HorizontalScrollContainer from '@/components/common/scroll/HorizontalScrollContainer'
import ForecastChartGraph, { ForecastChartGraphHandle } from '@/pages/mi/forecast/new-components/ForecastChartGraph'
import ForecastChartTooltipReportContentTab from '@/pages/mi/forecast/new-components/ForecastChartTooltipReportContentTap'
import forecastDataService from '@/service/mi/forecast'
import useAuthStore from '@/store/useAuthStore'
import theme from '@/theming'
import { ChartData, ChartType } from '@/types/dataDetailChart'

interface InfoLabelProps {
  label: string
  value: ReactNode
  description?: string
}

const sampleChartData: ChartData[] = [
  {
    goodsNo: 1,
    goodsDataNo: 1,
    goodsDataName: '4-Week Avg Gulf Coast (PADD 3) Commercial Crude Oil Imports Excluding SPR',
    goodsDataSourceNo: 1,
    goodsDataSourceName: '4-Week Avg Gulf Coast (PADD 3) Commercial Crude Oil Imports Excluding SPR',
    unitCd: 'USD',
    chartType: ChartType.LINE,
    timestamps: [
      '2025-10-01T00:00:00',
      '2025-10-08T00:00:00',
      '2025-10-15T00:00:00',
      '2025-10-22T00:00:00',
      '2025-10-29T00:00:00',
      '2025-11-05T00:00:00',
      '2025-11-12T00:00:00',
      '2025-11-19T00:00:00',
      '2025-11-26T00:00:00',
      '2025-12-03T00:00:00',
      '2025-12-10T00:00:00',
      '2025-12-17T00:00:00',
      '2025-12-24T00:00:00',
      '2025-12-31T00:00:00',
      '2026-01-07T00:00:00',
      '2026-01-14T00:00:00',
      '2026-01-21T00:00:00',
      '2026-01-28T00:00:00',
    ],
    series: [
      {
        seriesId: 'main',
        label: '4-Week Avg Gulf Coast (PADD 3) Commercial Crude Oil Imports Excluding SPR',
        renderAs: 'MAIN',
        values: [72.5, 73.2, 74.1, 73.8, 75.2, 74.9, 75.5, 76.1, 75.8, 76.3, 76.8, 77.2, 76.9, 77.5, 78.1, 78.5, 78.9, 79.2],
        isVisible: true,
      },
    ],
  },
]

const InfoLabel = ({ label, value, description }: InfoLabelProps) => (
  <Stack>
    <Typography variant="body2SB14" color="contentText.Subtext">
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="messageText1" color="contentText.Black">
        {value}
      </Typography>
    ) : (
      value
    )}
    <Typography variant="body2M14" color="contentText.Subtext">
      {description}
    </Typography>
  </Stack>
)

const ContentTab = () => (
  <HorizontalScrollContainer py="20px" scrollAmount={0.6} buttonPadding={8}>
    <ForecastChartTooltipReportContentTab />
  </HorizontalScrollContainer>
)

interface ForecastChartTooltipReportContentProps {
  monthSelect?: string
  goodsDataSourceNo?: number
  date?: string
}

const ForecastChartTooltipReportContent = memo(({ monthSelect, goodsDataSourceNo, date }: ForecastChartTooltipReportContentProps) => {
  const chartGraphRef = useRef<ForecastChartGraphHandle>(null)
  const { accessCompanyInfo, user } = useAuthStore()
  const companyNo = accessCompanyInfo?.customerCompanyNo ?? user?.userNo

  // tooltip에서 선택된 항목의 goodsDataSourceNo와 date를 사용하여 getForecastFactorCategory 호출
  const formattedDate = useMemo(() => {
    if (!date) return dayjs().format('YYYYMM')
    // date가 "Index: X" 형식인 경우 처리
    if (date.startsWith('Index:')) return dayjs().format('YYYYMM')
    // YYYY/MM/DD 형식을 YYYYMM으로 변환
    try {
      return dayjs(date).format('YYYYMM')
    } catch {
      return dayjs().format('YYYYMM')
    }
  }, [date])

  const { data: _factorCategory, isLoading: _isLoadingFactorCategory } = useQuery({
    queryKey: ['dashboardFactorCategory', monthSelect, goodsDataSourceNo, formattedDate],
    queryFn: () =>
      forecastDataService.getForecastFactorCategory(companyNo ?? 0, {
        predictDate: monthSelect?.split('-').join('') ?? '',
        goodsDataSourceNo: goodsDataSourceNo ?? 0,
        date: formattedDate,
      }),
    enabled: !!companyNo && !!monthSelect && !!goodsDataSourceNo && !!date && !date.startsWith('Index:'),
  })

  return (
    <Stack>
      <Stack
        padding="20px 38px"
        direction="row"
        justifyContent="space-between"
        gap="24px"
        borderBottom="1px solid"
        borderColor="contentBorder.Normal"
        boxSizing="border-box"
      >
        <Stack direction="row" alignItems="start" gap="24px">
          <Stack direction="row" gap="12px">
            <Box width="52px" height="52px" bgcolor="contentBG.Active" borderRadius="10px" />
            <InfoLabel label="TARGET" value="DUBAI CRUDE" />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
          <Stack gap="20px">
            <InfoLabel label="TARGET DATE" value="2026/01/02" description="7 days" />
            <InfoLabel label="RUN DATE" value="2025/12/30" description="Model execution date" />
          </Stack>
          <Divider orientation="vertical" flexItem sx={{ my: '6px' }} />
          <Stack gap="20px">
            <InfoLabel
              label="PRICE EXP."
              value={
                <Stack direction="row" alignItems="baseline" gap="4px">
                  <Typography variant="messageText1" color="contentText.Black">
                    76.98
                  </Typography>
                  <Typography variant="messageText1" color="increase.main">
                    +1.23(2.94%)
                  </Typography>
                </Stack>
              }
              description="Compare to reference price"
            />
            <InfoLabel label="REFERENCE PRICE" value="75.23" description="25/12/30 · S&P Global Platts" />
          </Stack>
        </Stack>
        <Stack minWidth="136px" alignItems="start" gap="8px">
          <Stack>
            <Typography variant="body2SB14" color="contentText.Subtext">
              Date Forecasted
            </Typography>
            <Typography variant="body2SB14" color="contentText.Normal">
              2026/01/02
            </Typography>
          </Stack>
          <Stack>
            <Typography variant="body2SB14" color="contentText.Subtext">
              Model
            </Typography>
            <Typography variant="body2SB14" color="contentText.Normal">
              Standard v2.0.1
            </Typography>
          </Stack>
        </Stack>
      </Stack>
      <Stack padding="20px 38px 0 38px" gap="24px">
        <Stack direction="row" alignItems="center" gap="6px">
          <LabelImportantRounded sx={{ color: theme.palette.contentIcon.Activeb }} />
          <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
            MAIN FACTORS
          </Typography>
          <InfoOutlined fontSize="small" sx={{ color: theme.palette.contentIcon.Enabled }} />
        </Stack>
      </Stack>
      <Stack>
        <ContentTab />
        <Typography padding="12px 38px" fontSize="18px" fontWeight={500} lineHeight="1.4" color="contentText.Black">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
          enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
          in culpa qui officia deserunt mollit anim id est laborum.
        </Typography>
        <Stack padding="12px 38px" mb="24px" boxSizing="border-box" sx={{ userSelect: 'none' }}>
          <Stack padding="24px" gap="24px" borderRadius="10px" border="1px solid" borderColor="contentBorder.Active" boxSizing="border-box">
            <Stack direction="row" gap="24px">
              <Stack flex={1} gap="8px" sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap="6px">
                  <TrendingUpIcon sx={{ color: theme.palette.contentIcon.Activeb }} />
                  <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
                    UPWARD SUB-FACTORS
                  </Typography>
                </Stack>
                <Stack>
                  <Stack direction="row" padding="8px" alignItems="center" gap="8px" boxSizing="border-box" sx={{ minWidth: 0 }}>
                    <Box
                      display="flex"
                      flexShrink={0}
                      alignItems="center"
                      justifyContent="center"
                      width="60px"
                      height="28px"
                      borderRadius="6px"
                      bgcolor="increase.main"
                    >
                      <Typography variant="body1" color="contentText.White">
                        9.94
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2M14"
                      color="contentText.Black"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      4-Week Avg Gulf Coast (PADD 3) Commercial Crude Oil Imports Excluding SPR (Thousand Barrels per Day)
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
              <Stack flex={1} gap="8px" sx={{ minWidth: 0 }}>
                <Stack direction="row" alignItems="center" gap="6px">
                  <TrendingDownIcon sx={{ color: theme.palette.contentIcon.Activeb }} />
                  <Typography variant="body1SB16" color="contentText.Black" sx={{ userSelect: 'none' }}>
                    DOWNWARD SUB-FACTORS
                  </Typography>
                </Stack>
                <Stack>
                  <Stack direction="row" padding="8px" alignItems="center" gap="8px" boxSizing="border-box" sx={{ minWidth: 0 }}>
                    <Box
                      display="flex"
                      flexShrink={0}
                      alignItems="center"
                      justifyContent="center"
                      width="60px"
                      height="28px"
                      borderRadius="6px"
                      bgcolor="decrease.main"
                    >
                      <Typography variant="body1" color="contentText.White">
                        14.20
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2M14"
                      color="contentText.Black"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      4-Week Avg Gulf Coast (PADD 3) Commercial Crude Oil Imports Excluding SPR (Thousand Barrels per Day)
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Stack>
            <Stack
              padding="20px"
              gap="8px"
              borderRadius="10px"
              border="1px solid"
              borderColor="contentBorder.Active"
              boxSizing="border-box"
            >
              <Stack direction="row" gap="6px" padding="12px" sx={{ minWidth: 0 }}>
                <Stack flex={1} gap="6px" sx={{ minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" gap="12px">
                    <Typography minWidth="120px" variant="body1" color="contentText.Normal">
                      IMPACT SCORE
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ my: '4px' }} />
                    <Typography variant="body1" color="increase.main">
                      9.94
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap="12px" sx={{ minWidth: 0 }}>
                    <Typography minWidth="120px" variant="body1" color="contentText.Normal">
                      SUB-FACTOR
                    </Typography>
                    <Divider orientation="vertical" flexItem sx={{ my: '4px' }} />
                    <Typography
                      variant="body1"
                      color="contentText.Black"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      4-Week Avg Gulf Coast (PADD 3) Commercial Crude Oil Imports Excluding SPR (Thousand Barrels per Day)
                    </Typography>
                  </Stack>
                </Stack>
                <MIBaseButton sx={{ padding: '8px 10px' }}>
                  <OpenInNewRoundedIcon fontSize="small" sx={{ color: theme.palette.gray[70] }} />
                </MIBaseButton>
              </Stack>
              <Divider sx={{ my: '4px' }} />
              <Box position="relative" px="16px">
                <Typography
                  variant="body2M14"
                  color="contentText.Black"
                  sx={{ position: 'absolute', top: 0, left: 20, userSelect: 'none' }}
                >
                  Unit: XXXXXXXX
                </Typography>
                <ForecastChartGraph
                  ref={chartGraphRef}
                  height="556px"
                  chartType={ChartType.LINE}
                  charts={sampleChartData}
                  currency="USD"
                  unitCd="USD"
                  chartVisibilityMap={new Map()}
                  hoveredChartKey={null}
                  hoverReportCardInfo={null}
                  isLoading={false}
                  onFixedModeChange={() => {}}
                  chartColorMap={new Map()}
                  disableFixedMode={true}
                />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  )
})

ForecastChartTooltipReportContent.displayName = 'ForecastChartTooltipReportContent'

export default ForecastChartTooltipReportContent
