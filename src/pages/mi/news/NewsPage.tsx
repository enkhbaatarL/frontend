import Crop169OutlinedIcon from '@mui/icons-material/Crop169Outlined'
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined'
import { Box, Fade, Stack, Typography } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState, useEffect } from 'react'
import { SwitchTransition } from 'react-transition-group'

import MIToggleButton from '@/components/common/button/MIToggleButton'
import MILine from '@/components/common/divider/MILine'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIDateRangePickerMenu from '@/components/common/menu/MIDateRangePickerMenu'
import MIFilterMenu from '@/components/common/menu/MIFilterMenu'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import useCodeData from '@/hooks/useCodeData'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import NewsItemsGridView from '@/pages/mi/news/NewsItemsGridView'
import NewsItemsListView from '@/pages/mi/news/NewsItemsListView'
import marketNewsService, { INewsListItem, INewsListRequest } from '@/service/mi/marketNews'
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

const NewsPage = () => {
  const today = dayjs()

  const savedViewType = useMemo(() => {
    const saved = localStorage.getItem(VIEW_TYPE_STORAGE_KEY)
    if (saved === 'GRID' || saved === 'LIST') {
      return saved
    }
    return 'LIST'
  }, [])

  const [viewType, setViewType] = useState<'GRID' | 'LIST'>(savedViewType)

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

  const initialFilterValues = useMemo(
    () => ({
      markets: savedFilters?.markets ?? [],
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
      categories: savedFilters?.markets ?? [],
      regions: savedFilters?.regions ?? [],
      industries: savedFilters?.industries ?? [],
    },
    {
      page: 1,
      size: 10,
    },
    {
      initialFetch: true,
      useAbortController: true,
    },
  )

  const appliedFiltersCount = useMemo(
    () => (filter.categories?.length ?? 0) + (filter.industries?.length ?? 0) + (filter.regions?.length ?? 0),
    [filter.categories, filter.industries, filter.regions],
  )

  const { marketCategoryCodeList, industrySectorCodeList, regionCategoryCodeList, isLoading: codeDataLoading } = useCodeData()
  const { showSnackbar } = useSnackbar()

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
    const markets = filterValues.markets ?? []
    const industries = filterValues.industries ?? []
    const regions = filterValues.regions ?? []
    const providers = filterValues.providers ?? []

    updateMultiFilterWithSearch([
      ['categories', markets],
      ['industries', industries],
      ['regions', regions],
    ])

    if (save) {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          markets,
          industries,
          regions,
          providers,
        }),
      )
    } else {
      localStorage.removeItem(FILTERS_STORAGE_KEY)
    }
  }

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
                  <MIFilterMenu
                    onApply={handleApplyFilters}
                    filterGroups={[
                      [
                        {
                          key: 'markets',
                          title: 'Markets',
                          filters:
                            marketCategoryCodeList?.map(({ codeId, codeNm }) => ({
                              label: codeNm,
                              value: codeId,
                            })) ?? [],
                          width: 180,
                        },
                      ],
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
                            skeletonCount={pagination?.size ?? 10}
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
