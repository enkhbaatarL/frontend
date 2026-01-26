import Crop169OutlinedIcon from '@mui/icons-material/Crop169Outlined'
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined'
import { Box, Divider, Fade, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { SwitchTransition } from 'react-transition-group'

import MIToggleButton from '@/components/common/button/MIToggleButton'
import MILine from '@/components/common/divider/MILine'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu from '@/components/common/menu/MIDateRangePickerMenu'
import MIFilterMenu from '@/components/common/menu/MIFilterMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton'
import useCodeData from '@/hooks/useCodeData'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import InfoTooltip from '@/pages/mi/dashboard/components/common/InfoTooltip'
import MISentimentsChart from '@/pages/mi/news/components/MISentimentsChart'
import NewsItemsGridView from '@/pages/mi/news/NewsItemsGridView'
import NewsItemsListView from '@/pages/mi/news/NewsItemsListView'
import marketNewsService, { INewsListItem, INewsListRequest } from '@/service/mi/marketNews'
import useAuthStore from '@/store/useAuthStore'
import { IPaginationResponse } from '@/types/api'

const viewOptions = [
  {
    label: <Crop169OutlinedIcon />,
    value: 'LIST',
  },
  {
    label: <ViewAgendaOutlinedIcon sx={{ rotate: '90deg' }} />,
    value: 'GRID',
  },
]

const orderOptions = [
  { label: 'Newest', value: 'NEWEST' },
  { label: 'Oldest', value: 'OLDEST' },
]

const STORAGE_KEY = 'newsPageDateRange'
const VIEW_TYPE_STORAGE_KEY = 'newsPageViewType'
const FILTERS_STORAGE_KEY = 'newsPageFilters'
const DATE_RANGE_OPTION_STORAGE_KEY = 'newsPageDateRangeOption'

const NewsPage = () => {
  const today = dayjs()
  const { accessCompanyInfo } = useAuthStore()

  const savedViewType = useMemo(() => {
    const saved = localStorage.getItem(VIEW_TYPE_STORAGE_KEY)
    if (saved === 'GRID' || saved === 'LIST') {
      return saved
    }
    return 'LIST'
  }, [])

  const savedDateRangeOption = useMemo(() => {
    const saved = localStorage.getItem(DATE_RANGE_OPTION_STORAGE_KEY)
    if (
      saved === 'LAST_7_DAYS' ||
      saved === 'LAST_14_DAYS' ||
      saved === 'LAST_30_DAYS' ||
      saved === 'LAST_60_DAYS' ||
      saved === 'LAST_12_MONTHS' ||
      saved === 'ALL_TIME'
    ) {
      return saved
    }
    return 'LAST_14_DAYS'
  }, [])

  const [viewType, setViewType] = useState<'GRID' | 'LIST'>(savedViewType)
  const [dateRangeOption, setDateRangeOption] = useState<string>(savedDateRangeOption)

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)

  const savedDateRange = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { startDate, endDate } = JSON.parse(saved)
        return {
          startDate: startDate ? dayjs(startDate, 'YYYYMMDD') : undefined,
          endDate: endDate ? dayjs(endDate, 'YYYYMMDD') : undefined,
        }
      } catch {
        return null
      }
    }
    return null
  }, [])

  const hasSavedDateRange = savedDateRange !== null

  const savedFilters = useMemo(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  }, [])

  const { marketCategoryCodeList, industrySectorCodeList, regionCategoryCodeList, isLoading: codeDataLoading } = useCodeData()

  const defaultMarket = useMemo(
    () => accessCompanyInfo?.newsMarketCategoryCode ?? marketCategoryCodeList?.[0]?.codeId,
    [accessCompanyInfo?.newsMarketCategoryCode, marketCategoryCodeList],
  )

  const initialFilterValues = useMemo(
    () => ({
      industries: savedFilters?.industries ?? [],
      regions: savedFilters?.regions ?? [],
      providers: savedFilters?.providers ?? [],
    }),
    [savedFilters],
  )

  const {
    filter,
    updateFilter,
    updateFilterWithSearch,
    updateMultiFilter,
    updateMultiFilterWithSearch,
    data: newsList,
    pagination,
    updatePage,
    updateSize,
    isLoading: newsListIsLoading,
  } = useSearchFilter<INewsListRequest, IPaginationResponse<INewsListItem>>(
    (params, signal) => marketNewsService.getNewsList(params, signal),
    {
      keyword: '',
      sort: 'NEWEST',
      startDate: savedDateRange?.startDate?.format('YYYYMMDD') ?? today.subtract(1, 'year').format('YYYYMMDD'),
      endDate: savedDateRange?.endDate?.format('YYYYMMDD') ?? today.format('YYYYMMDD'),
      categories: defaultMarket,
      regions: savedFilters?.regions ?? [],
      industries: savedFilters?.industries ?? [],
    },
    {
      page: 1,
      size: viewType === 'GRID' ? 30 : 10,
    },
    {
      initialFetch: true,
      useAbortController: true,
    },
  )

  const appliedFiltersCount = useMemo(
    () => (filter.industries?.length ?? 0) + (filter.regions?.length ?? 0),
    [filter.industries, filter.regions],
  )
  const { showSnackbar } = useSnackbar()

  const customerCompanyNo = useMemo(() => accessCompanyInfo?.customerCompanyNo ?? 0, [accessCompanyInfo?.customerCompanyNo])

  const { data: dailyTrendData, isLoading: dailyTrendIsLoading } = useQuery({
    queryKey: ['dailyTrend', customerCompanyNo, dateRangeOption],
    queryFn: async () => await marketNewsService.getDailyTrend({ companyNo: customerCompanyNo, dateRangeOption }),
    enabled: !!customerCompanyNo,
  })

  const sentimentData = useMemo(() => dailyTrendData?.data ?? [], [dailyTrendData])

  const isPageLoading = useMemo(() => isInitialLoading || codeDataLoading, [isInitialLoading, codeDataLoading])
  const isListLoading = useMemo(() => newsListIsLoading && hasInitialData, [newsListIsLoading, hasInitialData])

  const handleDateChange = ({ startDate: newStartDate, endDate: newEndDate }: { startDate?: Dayjs; endDate?: Dayjs }) => {
    if (!newStartDate || !newEndDate) {
      updateMultiFilter([
        ['startDate', newStartDate?.format('YYYYMMDD')],
        ['endDate', newEndDate?.format('YYYYMMDD')],
      ])
      return
    }

    if (newStartDate.isAfter(newEndDate)) {
      showSnackbar('시작일은 종료일보다 이전이어야 합니다.', {
        variant: 'error',
      })
      return
    }

    updateMultiFilterWithSearch([
      ['startDate', newStartDate.format('YYYYMMDD')],
      ['endDate', newEndDate.format('YYYYMMDD')],
    ])
  }

  const handleApplyFilters = (filterValues: { [key: string]: string[] }, save?: boolean) => {
    const industries = filterValues.industries ?? []
    const regions = filterValues.regions ?? []
    const providers = filterValues.providers ?? []

    updateMultiFilterWithSearch([
      ['industries', industries],
      ['regions', regions],
    ])

    if (save) {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          industries,
          regions,
          providers,
        }),
      )
    } else {
      localStorage.removeItem(FILTERS_STORAGE_KEY)
    }
  }

  const handleMarketsChange = (selectedMarket: string) => {
    updateFilterWithSearch('categories', selectedMarket)
  }

  const handleDateRangeChange = useCallback((value: string) => {
    setDateRangeOption(value)
    localStorage.setItem(DATE_RANGE_OPTION_STORAGE_KEY, value)
  }, [])

  useEffect(() => {
    if (newsList?.detail?.length) {
      setHasInitialData(true)
      setIsInitialLoading(false)
    }
  }, [newsList])

  useEffect(() => {
    if (marketCategoryCodeList && industrySectorCodeList && regionCategoryCodeList) {
      setHasInitialData(true)
      setIsInitialLoading(false)
    }
  }, [marketCategoryCodeList, industrySectorCodeList, regionCategoryCodeList])

  return (
    <MISkeleton variant={'marketNews'} loading={isPageLoading}>
      <MIPageHeadline title="Market News" gradientStart="#2E313A" gradientEnd="#1F212A" />

      <Stack minWidth={1440} width={1440} padding="50px 30px" margin="auto" gap="24px" boxSizing="border-box">
        <Typography component="h2" variant="titlePage" color="gray.90">
          News Impact
        </Typography>
        <Stack padding="12px 0 24px 0" borderRadius="10px" border="1px solid" borderColor="contentBorder.Normal" bgcolor="common.White">
          <Stack height={36} direction="row" padding="6px 22px" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap="6px">
              <Typography variant="body1" color="contentText.Normal">
                Sentiments
              </Typography>
              <InfoTooltip title="Sentiments are calculated based on the news articles published in the last 14 days." />
            </Stack>
            <Stack direction="row" alignItems="center" gap="10px">
              {dailyTrendIsLoading ? (
                <MIBaseSkeleton.TextLine width={120} height={24} />
              ) : (
                <Typography variant="body1" color="contentText.Normal">
                  {dailyTrendData?.criteriaItemName}
                </Typography>
              )}
              <MISelectMenu
                variant="outlined"
                sx={{ width: 160 }}
                items={[
                  { label: 'Last 7 days', value: 'LAST_7_DAYS' },
                  { label: 'Last 14 days', value: 'LAST_14_DAYS' },
                  // { label: 'Last 30 days', value: 'LAST_30_DAYS' },
                  // { label: 'Last 60 days', value: 'LAST_60_DAYS' },
                  // { label: 'Last 12 months', value: 'LAST_12_MONTHS' },
                  // { label: 'All time', value: 'ALL_TIME' },
                ]}
                selected={dateRangeOption}
                onSelected={handleDateRangeChange}
              />
            </Stack>
          </Stack>
          <Stack borderRadius="10px" overflow="hidden" gap="12px" boxSizing="border-box">
            <Stack direction="row" height={30} px="16px" justifyContent="start" alignItems="center" gap="8px">
              <Stack direction="row" alignItems="center" gap="2px">
                <Box width={12} height={12} margin="5px" borderRadius="3px" bgcolor="#3386C2" />
                <Typography variant="body2SB14" color="contentText.Normal">
                  Upward
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap="2px">
                <Box width={12} height={12} margin="5px" borderRadius="3px" bgcolor="#A8A8A8" />
                <Typography variant="body2SB14" color="contentText.Normal">
                  Neutral
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap="2px">
                <Box width={12} height={12} margin="5px" borderRadius="3px" bgcolor="#A02A74" />
                <Typography variant="body2SB14" color="contentText.Normal">
                  Downward
                </Typography>
              </Stack>
            </Stack>
            <Box height={280} boxSizing="border-box">
              {dailyTrendIsLoading ? (
                <MIBaseSkeleton.BaseElement width="100%" height="100%" sx={{ borderRadius: '10px' }} />
              ) : (
                <MISentimentsChart data={sentimentData} />
              )}
            </Box>
          </Stack>
        </Stack>
        <Divider sx={{ marginY: '16px' }} />
        <Typography component="h2" variant="titlePage" color="gray.90">
          All News
        </Typography>
        <Stack gap="24px">
          <Stack direction="row" gap="24px">
            <Stack flexGrow={1} gap="24px">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" gap="12px">
                  <MISearchInput
                    storageKey="market-news"
                    value={filter.keyword ?? ''}
                    placeholder="Search for News"
                    onChange={(value) => updateFilter('keyword', value)}
                    onSearch={(value) => updateFilterWithSearch('keyword', value)}
                    onClear={() => updateFilterWithSearch('keyword', '')}
                  />
                  <MISelectMenu
                    variant="outlined"
                    placeholder="Markets"
                    items={
                      marketCategoryCodeList?.map(({ codeId, codeNm }) => ({
                        label: codeNm,
                        value: codeId,
                      })) ?? []
                    }
                    selected={filter.categories ?? ''}
                    onSelected={handleMarketsChange}
                  />
                  <MIFilterMenu
                    onApply={handleApplyFilters}
                    filterGroups={[
                      [
                        {
                          key: 'industries',
                          title: 'Industries',
                          filters:
                            industrySectorCodeList?.map(({ codeId, codeNm }) => ({
                              label: codeNm,
                              value: codeId,
                            })) ?? [],
                          width: 180,
                        },
                      ],
                      [
                        {
                          key: 'regions',
                          title: 'Regions',
                          filters:
                            regionCategoryCodeList?.map(({ codeId, codeNm }) => ({
                              label: codeNm,
                              value: codeId,
                            })) ?? [],
                          width: 180,
                        },
                      ],
                      // [{
                      //   key: 'providers',
                      //   title: 'Providers',
                      //   filters: [
                      //     { label: 'Reuters', value: 'Reuters' },
                      //     { label: 'Bloomberg', value: 'Bloomberg' },
                      //   ],
                      //   width: 180,
                      // }],
                    ]}
                    initialValues={initialFilterValues}
                    appliedFiltersCount={appliedFiltersCount}
                    showSaveOption={true}
                    initialSaveOn={Boolean(localStorage.getItem(FILTERS_STORAGE_KEY))}
                    enableHoverBackground
                  />
                </Stack>
                <Stack direction="row" gap="12px">
                  <MIDateRangePickerMenu
                    dateRange={
                      filter.startDate && filter.endDate
                        ? { startDate: dayjs(filter.startDate), endDate: dayjs(filter.endDate) }
                        : undefined
                    }
                    menuPositionOffset={{ right: -14 }}
                    initialSaveOn={hasSavedDateRange}
                    limitDateRange={[1, 'years']}
                    onApply={handleDateChange}
                    onSave={(dates) => {
                      if (dates) {
                        localStorage.setItem(
                          STORAGE_KEY,
                          JSON.stringify({
                            startDate: dates.startDate?.format('YYYYMMDD'),
                            endDate: dates.endDate?.format('YYYYMMDD'),
                          }),
                        )
                      } else {
                        localStorage.removeItem(STORAGE_KEY)
                      }
                    }}
                  />
                  <MISelectMenu
                    variant="outlined"
                    items={orderOptions}
                    selected={filter.sort ?? 'NEWEST'}
                    onSelected={(selected: string) => updateFilterWithSearch('sort', selected)}
                  />
                  <MIToggleButton
                    options={viewOptions}
                    value={viewType}
                    onChange={(_event, newValue) => {
                      const finalViewType = (newValue ?? 'LIST') as 'GRID' | 'LIST'
                      updateSize(finalViewType === 'GRID' ? 30 : 10)
                      setViewType(finalViewType)
                      localStorage.setItem(VIEW_TYPE_STORAGE_KEY, finalViewType)
                    }}
                  />
                </Stack>
              </Stack>
              <Stack gap="30px">
                <MILine backgroundColor="gray.30" />
                <Box>
                  <SwitchTransition mode="out-in">
                    <Fade key={viewType} timeout={120}>
                      <Stack gap="6px">
                        {viewType === 'LIST' ? (
                          <NewsItemsListView
                            newsList={newsList?.detail ?? []}
                            isLoading={isListLoading}
                            skeletonCount={pagination?.size ?? 10}
                          />
                        ) : (
                          <NewsItemsGridView
                            newsList={newsList?.detail ?? []}
                            isLoading={isListLoading}
                            skeletonCount={pagination?.size ?? 30}
                          />
                        )}
                      </Stack>
                    </Fade>
                  </SwitchTransition>
                </Box>
              </Stack>
              {(newsList?.detail?.length ?? 0) > 0 && (
                <MIPagination data={newsList} size={pagination?.size} onPageChange={updatePage} onSizeChange={updateSize} />
              )}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </MISkeleton>
  )
}

export default NewsPage
