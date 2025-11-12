import { Box, Grid2 as Grid, Typography } from '@mui/material'
import { GridColDef, GridRenderCellParams, GridRowModel } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import MILine from '@/components/common/divider/MILine'
import MITable from '@/components/common/table/MITable'
import MITopic from '@/components/common/topic/MITopic'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import marketDataService, { IMarketData, IRawDataPoint } from '@/service/mi/marketData'
import useAuthStore from '@/store/useAuthStore'

// 테이블 행 데이터 타입
interface TableRow extends GridRowModel {
  id: string
  indicator: string
  [key: string]: string | number
}

interface ChartDataWithType extends IMarketData {
  category: string // 카테고리 코드 (ALL, TIRE_CODE, PRODUCT, CUSTOMER, REGION)
}

// 카테고리 코드 정의
const CATEGORY_CODE = {
  ALL: 'ALL',
  TIRE_CODE: 'TIRE_CODE',
  PRODUCT: 'PRODUCT',
  CUSTOMER: 'CUSTOMER',
  REGION: 'REGION',
} as const

// 카테고리 순서 정의 (코드 기준)
const CATEGORY_ORDER = [CATEGORY_CODE.TIRE_CODE, CATEGORY_CODE.PRODUCT, CATEGORY_CODE.CUSTOMER, CATEGORY_CODE.REGION]

const CATEGORY_LABEL_FALLBACK: Record<string, string> = {
  [CATEGORY_CODE.ALL]: 'All',
  [CATEGORY_CODE.TIRE_CODE]: 'Tire Code',
  [CATEGORY_CODE.PRODUCT]: 'Product',
  [CATEGORY_CODE.CUSTOMER]: 'Customer',
  [CATEGORY_CODE.REGION]: 'Region',
}

// ============================================
// TODO: 임시 데이터 제거 시 삭제할 영역 시작
// ============================================
// 임시 데이터 생성 함수들 (순서대로)
// 1. 월별 날짜 생성 함수
const makeMonthlyDates = (year = 2024) => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)

// 2. 랜덤 값 생성 함수
const rand = (min: number, max: number) => Math.random() * (max - min) + min

// 3. 시리즈 포인트 생성 함수
const makeSeriesPoints = (dates: string[], base: number, spread: number): IRawDataPoint[] =>
  dates.map((d) => ({ date: d, value: Math.round((base + rand(-spread, spread)) * 100) / 100 }))

// 4. 임시 마켓 데이터 생성 함수
const generateDummyCustomMarketData = (index: number): IMarketData => {
  const baseValue = 200 + index * 10
  const dates = makeMonthlyDates(2025)
  const goodsNames = [
    'Market Revenue Analysis (Stacked Bar)',
    'Product Market Performance (Stacked Line)',
    'Regional Market Distribution (Bar & Line - Bar Label)',
    'Customer Segment Analysis (Single Bar)',
    'Market Trend Analysis (Stacked Line with Labels)',
    'Market Performance (Bar & Line - Both Labels)',
    'Market Distribution (100% Stacked Bar)',
  ]
  const dataSourceNames = ['EIA', 'IEA', 'OPEC', 'Bloomberg', 'Reuters', 'Platts', 'Argus']

  return {
    isPermitted: true, // 모든 카드 잠금 해제
    isCustomChart: true,
    mainChart: {
      specificIndicatorName: 'CURRENT',
      rawData: makeSeriesPoints(dates, baseValue, 12),
    },
    compareCharts: [
      {
        specificIndicatorName: '5Yr Avg',
        rawData: makeSeriesPoints(dates, baseValue - 20, 10),
      },
      {
        specificIndicatorName: 'PAST_5Y_MIN',
        rawData: makeSeriesPoints(dates, baseValue - 30, 6),
      },
      {
        specificIndicatorName: 'PAST_5Y_MAX',
        rawData: makeSeriesPoints(dates, baseValue + 30, 6),
      },
    ],
    marketMetaData: {
      chartMarkRank: index,
      goodsNo: 1000 + index,
      goodsDataNo: 2000 + index,
      goodsDataSourceNo: 3000 + index,
      goodsDataNm: goodsNames[index] || `Market Map ${index + 1}`,
      goodsDataSourceNm: dataSourceNames[index % dataSourceNames.length],
      currency: 'USD',
      currentUnitCd: 'USD',
      visibleChartType: 'LINE',
      interval: 'MONTHLY',
      lastUpdateDt: dayjs().subtract(index, 'day').format('YYYY-MM-DD HH:mm:ss'),
      indexStartDt: dayjs().subtract(12, 'month').format('YYYY-MM-DD'),
      lastValue: baseValue + Math.random() * 10,
      yoyChangeRate: (Math.random() - 0.5) * 20,
      momChangeRate: (Math.random() - 0.5) * 10,
      wowChangeRate: (Math.random() - 0.5) * 5,
      dodChangeRate: (Math.random() - 0.5) * 2,
      changeRates: [
        { label: 'YoY', value: (Math.random() - 0.5) * 20 },
        { label: 'MoM', value: (Math.random() - 0.5) * 10 },
        { label: 'WoW', value: (Math.random() - 0.5) * 5 },
      ],
    },
  }
}

// 5. 임시 대시보드 리스트 생성 함수
const generateDummyDashboardList = (): ChartDataWithType[] => {
  // 카테고리 분배: 타이어코드 2개, 제품 2개, 고객사 2개, 지역 1개 (코드 기준)
  const categories = [
    CATEGORY_CODE.TIRE_CODE,
    CATEGORY_CODE.TIRE_CODE,
    CATEGORY_CODE.PRODUCT,
    CATEGORY_CODE.PRODUCT,
    CATEGORY_CODE.CUSTOMER,
    CATEGORY_CODE.CUSTOMER,
    CATEGORY_CODE.REGION,
  ]
  return categories.map((category, i) => ({
    ...generateDummyCustomMarketData(i),
    category,
  }))
}
// ============================================
// TODO: 임시 데이터 제거 시 삭제할 영역 끝
// ============================================

const MarketMapPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const { t } = useTranslation()

  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORY_CODE.ALL)

  // Market Map API 호출
  const {
    data: apiDashboardList,
    isLoading: dashboardListIsLoading,
    isError,
    error,
  } = useQuery<IMarketData[]>({
    queryKey: ['marketMapDashboard', customerCompanyNo],
    queryFn: async () => await marketDataService.getMarketMapDatas(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!customerCompanyNo,
    retry: false, // 404 에러는 재시도하지 않음
  })

  // API 데이터가 있으면 사용, 404 에러이거나 데이터가 없으면 임시 데이터 사용
  const dashboardList = useMemo(() => {
    // ============================================
    // TODO: 임시 데이터 제거 시 삭제할 영역 시작
    // ============================================
    // 404 에러인 경우 임시 데이터 사용
    if (isError && (error as any)?.response?.status === 404) {
      return generateDummyDashboardList()
    }
    // ============================================
    // TODO: 임시 데이터 제거 시 삭제할 영역 끝
    // ============================================

    // API 데이터가 있으면 사용
    if (apiDashboardList && apiDashboardList.length > 0) {
      // API 응답에 category 필드가 이미 포함되어 있음
      return apiDashboardList as ChartDataWithType[]
    }

    // ============================================
    // TODO: 임시 데이터 제거 시 삭제할 영역 시작
    // ============================================
    // API 데이터가 없으면 임시 데이터 사용
    return generateDummyDashboardList()
    // ============================================
    // TODO: 임시 데이터 제거 시 삭제할 영역 끝
    // ============================================
    // 임시 데이터 제거 후에는 아래 코드로 변경:
    // return apiDashboardList as ChartDataWithType[] || []
  }, [apiDashboardList, isError, error])

  // 초기 로딩 상태 관리
  useEffect(() => {
    // ============================================
    // TODO: 임시 데이터 제거 시 수정할 영역
    // 404 에러 처리 부분 제거하고 apiDashboardList !== undefined만 체크
    // ============================================
    // API 응답이 있거나 404 에러가 발생하면 로딩 완료
    if (apiDashboardList !== undefined || (isError && (error as any)?.response?.status === 404)) {
      setIsInitialLoading(false)
      setHasInitialData(true)
    }
  }, [apiDashboardList, isError, error])

  // API에서 오는 데이터를 모두 표시
  const normalizedChartData = useMemo(() => dashboardList || [], [dashboardList])

  // 카테고리별로 그룹화
  const chartDataByCategory = useMemo(() => {
    if (!normalizedChartData) return {}
    const grouped: Record<string, ChartDataWithType[]> = {}
    normalizedChartData.forEach((chart) => {
      const category = (chart as ChartDataWithType).category || CATEGORY_CODE.ALL
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(chart as ChartDataWithType)
    })
    return grouped
  }, [normalizedChartData])

  // 선택된 카테고리에 따라 필터링된 데이터
  const filteredChartData = useMemo(() => {
    if (selectedCategory === CATEGORY_CODE.ALL) {
      return normalizedChartData || []
    }
    return chartDataByCategory[selectedCategory] || []
  }, [selectedCategory, normalizedChartData, chartDataByCategory])

  // 카테고리별로 표시할 데이터 (전체 선택 시 모든 카테고리, 특정 카테고리 선택 시 해당 카테고리만)
  const displayData = useMemo(() => {
    if (selectedCategory === CATEGORY_CODE.ALL) {
      // 전체 선택 시 카테고리별로 그룹화해서 표시 (순서대로)
      const ordered: Record<string, ChartDataWithType[]> = {}
      CATEGORY_ORDER.forEach((category) => {
        if (chartDataByCategory[category] && chartDataByCategory[category].length > 0) {
          ordered[category] = chartDataByCategory[category]
        }
      })
      return ordered
    } else {
      // 특정 카테고리 선택 시 해당 카테고리만
      return { [selectedCategory]: filteredChartData }
    }
  }, [selectedCategory, chartDataByCategory, filteredChartData])

  const isActuallyLoading = useMemo(
    () => isInitialLoading || dashboardListIsLoading || (isInitialLoading && !hasInitialData),
    [isInitialLoading, dashboardListIsLoading, hasInitialData],
  )

  const getCategoryLabel = useCallback(
    (category: string) => t(`category.${category}`, { defaultValue: CATEGORY_LABEL_FALLBACK[category] ?? category }),
    [t],
  )

  const topicList = useMemo(
    () => [
      { label: getCategoryLabel(CATEGORY_CODE.ALL), value: CATEGORY_CODE.ALL },
      ...CATEGORY_ORDER.map((category) => ({
        label: getCategoryLabel(category),
        value: category,
      })),
    ],
    [getCategoryLabel],
  )

  return (
    <MISkeleton variant={'marketData'} loading={isActuallyLoading}>
      <MIPageHeadline title="Market Map" gradientStart="#021728" gradientEnd="#135F7A" />

      <Box boxSizing="border-box" paddingX={7.5} minWidth="1440px" width="1440px" margin="auto" py={12.5} px={7.5}>
        <Box mb={6}>
          <MITopic topics={topicList} selectedTopic={selectedCategory} onClick={(topic) => setSelectedCategory(topic.value)} />
        </Box>
        <Box mb={17.5}>
          {Object.entries(displayData).map(([category, charts], categoryIndex, array) => {
            if (!charts || charts.length === 0) return null

            const isLastCategory = categoryIndex === array.length - 1

            // 차트 데이터를 테이블 데이터로 변환 (피보팅: 날짜를 컬럼으로)
            const convertChartDataToTable = (chartData: ChartDataWithType): { rows: TableRow[]; columns: GridColDef[] } => {
              if (!chartData.mainChart) {
                return { rows: [], columns: [] }
              }
              const allCharts = [chartData.mainChart, ...(chartData.compareCharts || [])]
              const dates = chartData.mainChart.rawData.map((point) => point.date)

              // 컬럼 정의: 첫 번째 컬럼은 지표명, 나머지는 날짜 (flex로 자동 조정, 컴팩트하게)
              const columns: GridColDef[] = [
                {
                  field: 'indicator',
                  headerName: 'Indicator',
                  minWidth: 120,
                  flex: 0,
                  renderCell: (params: GridRenderCellParams<TableRow, string>) => (
                    <Typography variant="body3R12" fontSize="11px" padding="4px 8px" color="#212529">
                      {params.value}
                    </Typography>
                  ),
                },
                ...dates.map((date) => ({
                  field: date,
                  headerName: dayjs(date).format('YYYY-MM'),
                  flex: 1,
                  minWidth: 60,
                  align: 'right' as const,
                  renderCell: (params: GridRenderCellParams<TableRow, number | string>) => (
                    <Typography variant="body3R12" fontSize="11px" padding="4px 8px" color="#212529">
                      {typeof params.value === 'number' ? params.value.toFixed(1) : params.value}
                    </Typography>
                  ),
                })),
              ]

              // 행 데이터 생성: 각 지표가 한 행
              const rows: TableRow[] = allCharts.map((chart, chartIdx) => {
                const row: TableRow = {
                  id: `${chartData.marketMetaData?.goodsDataNo ?? 'unknown'}-${chartIdx}`,
                  indicator: chart.specificIndicatorName ?? '',
                }

                dates.forEach((date) => {
                  const dataPoint = chart.rawData?.find((p) => p.date === date)
                  row[date] = dataPoint?.value ?? 0
                })

                return row
              })

              return { rows, columns }
            }

            const renderTable = (chartData: ChartDataWithType, _index: number) => {
              const { rows, columns } = convertChartDataToTable(chartData)

              return (
                <Box width="100%" maxWidth="1380px">
                  <MITable<TableRow>
                    rowId="id"
                    columns={columns}
                    rows={rows}
                    hidePagination={true}
                    disableHover={true}
                    noRowMessage="No data available"
                    rowHeight={28}
                    columnHeaderHeight={32}
                    autoHeight={false}
                    disableVirtualization={true}
                  />
                </Box>
              )
            }

            return (
              <Box key={category}>
                <Box mb={10}>
                  <Typography mb={6} color="gray.90" component="h2" variant="titlePage">
                    {getCategoryLabel(category)}
                  </Typography>
                  <Box>
                    {charts.map((chartData, index) => (
                      <Box key={`${category}-table-${index}`} mb={index < charts.length - 1 ? 4 : 0}>
                        <Typography mb={2} color="gray.90" component="h3" variant="body2SB14" fontSize="13px" fontWeight={600}>
                          {chartData.marketMetaData?.goodsDataNm ?? ''}
                        </Typography>
                        {renderTable(chartData, index)}
                      </Box>
                    ))}
                  </Box>
                </Box>
                {!isLastCategory && (
                  <Box
                    mb={selectedCategory === CATEGORY_CODE.ALL ? 10 : 0}
                    mt={selectedCategory === CATEGORY_CODE.ALL ? 0 : 0}
                    width="100%"
                    boxSizing="border-box"
                  >
                    <MILine thickness={1.01} direction="horizontal" backgroundColor="#DEE2E6" />
                  </Box>
                )}
              </Box>
            )
          })}
          {Object.keys(displayData).length === 0 && (
            <Grid container spacing={5}>
              <Grid size={3}>
                <Typography>No results found</Typography>
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default MarketMapPage
