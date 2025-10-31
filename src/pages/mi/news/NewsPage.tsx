import { Box, Stack, Typography } from '@mui/material'
import dayjs, { Dayjs } from 'dayjs'
import { Fragment, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import MIDateRangePicker from '@/components/common/datepicker/MIDateRangePicker'
import MILine from '@/components/common/divider/MILine'
import MIFilterGroup from '@/components/common/filter/MIFilterGroup'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIPagination from '@/components/common/pagination/MIPagination'
import MISelect from '@/components/common/select/MISelect'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import useCodeData from '@/hooks/useCodeData'
import useSearchFilter from '@/hooks/useSearchFilter'
import useSnackbar from '@/hooks/useSnackbar'
import marketNewsService, { INewsListItem, INewsListRequest } from '@/service/mi/marketNews'
import { IPaginationResponse } from '@/types/api'

const orderOptions = [
  { label: 'Newest', value: 'NEWEST' },
  { label: 'Oldest', value: 'OLDEST' },
]

const newsSkeletonFields = [
  { width: '100%', height: '24px', marginBottom: '6px' }, // title
  { width: '280px', height: '20px', marginBottom: '6px' }, // provider + date
]

const renderNewsSkeletonGroup = (key: number, removeMarginBottom = false) => (
  <Box key={key} padding="12px 18px" marginBottom={removeMarginBottom ? undefined : '6px'}>
    {newsSkeletonFields.map((field, idx) => (
      <MIBaseSkeleton.InputField
        key={`skeleton-${key}-${idx}`}
        width={field.width}
        height={field.height}
        sx={{ marginBottom: field.marginBottom }}
      />
    ))}
  </Box>
)

const NewsPage = () => {
  const navigate = useNavigate()
  const today = dayjs()

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)

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
      startDate: today.subtract(1, 'year').format('YYYYMMDD'),
      endDate: today.format('YYYYMMDD'),
      categories: [],
      regions: [],
      industries: [],
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
                <MISearchInput
                  storageKey="market-news"
                  value={filter.keyword ?? ''}
                  placeholder="Search for News"
                  onChange={(value) => updateFilter('keyword', value)}
                  onSearch={(value) => updateFilterWithSearch('keyword', value)}
                  onClear={() => updateFilterWithSearch('keyword', '')}
                />
                <Stack direction="row" gap="12px">
                  <MISelect
                    sizeSelect="h40"
                    width={160}
                    options={orderOptions}
                    value={filter.sort ?? 'NEWEST'}
                    onChange={(e) => updateFilterWithSearch('sort', String(e.target.value ?? 'NEWEST'))}
                  />
                  <MIDateRangePicker
                    sizeInput={'h40'}
                    width={380}
                    startDate={filter.startDate ? dayjs(filter.startDate) : undefined}
                    endDate={filter.endDate ? dayjs(filter.endDate) : undefined}
                    onChange={handleDateChange}
                  />
                </Stack>
              </Stack>
              <Stack gap="6px">
                <MILine backgroundColor="gray.30" />
                {isListLoading ? (
                  <Box>
                    {Array.from({ length: pagination?.size ?? 10 }, (_, i) => (
                      <Fragment key={i}>
                        {renderNewsSkeletonGroup(i, i === (pagination?.size ?? 10) - 1)}
                        {i < (pagination?.size ?? 10) - 1 && <MILine backgroundColor="gray.30" />}
                      </Fragment>
                    ))}
                  </Box>
                ) : (
                  newsList?.detail?.map((item) => (
                    <Fragment key={item.newsSummaryId}>
                      <Stack
                        padding="12px 18px"
                        borderRadius="10px"
                        gap="6px"
                        onClick={() => navigate(`/mi/market-news/${item.newsSummaryId}`)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: 'contentBG.Hover',
                          },
                        }}
                      >
                        <Typography variant="body1" color="contentText.Normal">
                          {item.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" gap="10px" height="20px">
                          <Typography variant="body2R14" color="contentText.Subtext">
                            {item.provider}
                          </Typography>
                          <MILine length={8} direction="vertical" backgroundColor="gray.30" />
                          <Typography variant="body2R14" color="contentText.Subtext">
                            {dayjs(item.firstCreated).format('MMMM D, YYYY [at] h:mm A')}
                          </Typography>
                        </Stack>
                      </Stack>
                      <MILine backgroundColor="gray.30" />
                    </Fragment>
                  ))
                )}
              </Stack>
              {(newsList?.detail?.length ?? 0) > 0 && (
                <MIPagination data={newsList} size={pagination?.size} onPageChange={updatePage} onSizeChange={updateSize} />
              )}
              {!newsListIsLoading && newsList?.detail?.length === 0 && (
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

            {/* 필터영역 */}
            <Stack width={286}>
              <Stack border="1px solid" borderColor="gray.30" borderRadius={1} padding="24px 12px" boxSizing="border-box" gap="24px">
                <MIFilterGroup
                  title={
                    <Stack direction="row" alignItems="center" gap="10px">
                      <Typography variant="sidePanelTitle" color="contentText.Normal">
                        Markets
                      </Typography>
                      <Box
                        padding="4px 6px"
                        borderRadius="4px"
                        border="1px solid"
                        borderColor="contentBorder.Normal"
                        boxSizing="border-box"
                        height="22px"
                        display="flex"
                        alignItems="center"
                      >
                        <Typography variant="subtext3" color="contentText.Normal">
                          Sentiments
                        </Typography>
                      </Box>
                    </Stack>
                  }
                  filters={marketCategoryCodeList?.map((code) => ({ label: code.codeNm, value: code.codeId })) ?? []}
                  selectedFilters={filter.categories}
                  onFilterChange={(selectedFilters) => updateFilterWithSearch('categories', selectedFilters)}
                  padding="16px"
                  bgcolor="contentBG.Primaryactive"
                  border="1px solid"
                  borderColor="contentBorder.Normal"
                  borderRadius="4px"
                />
                <MIFilterGroup
                  title="Industries"
                  filters={industrySectorCodeList?.map((code) => ({ label: code.codeNm, value: code.codeId })) ?? []}
                  selectedFilters={filter.industries}
                  onFilterChange={(selectedFilters) => updateFilterWithSearch('industries', selectedFilters)}
                />
                <MIFilterGroup
                  title="Regions"
                  filters={regionCategoryCodeList?.map((code) => ({ label: code.codeNm, value: code.codeId })) ?? []}
                  selectedFilters={filter.regions}
                  onFilterChange={(selectedFilters) => updateFilterWithSearch('regions', selectedFilters)}
                />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </MISkeleton>
  )
}

export default NewsPage
