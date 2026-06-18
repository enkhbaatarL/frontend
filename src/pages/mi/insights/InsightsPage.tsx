import { Box, Grid2 as Grid, Typography, Tooltip, TypographyProps } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'

import InsightsDocumentItem from './components/InsightsDocumentItem'

import MILine from '@/components/common/divider/MILine'
import MIFilterGroup from '@/components/common/filter/MIFilterGroup'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MISelectMenu from '@/components/common/menu/MISelectMenu'
import MIPagination from '@/components/common/pagination/MIPagination'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import MIPageHeadline from '@/components/mi/MIPageHeadline'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import useSearchFilter from '@/hooks/useSearchFilter'
import InsightsCardBtn from '@/pages/mi/insights/components/InsightsCardBtn'
import insightsService, { IAdvancedFilter, IAdvancedFilterItem, IInsightsInfo, IInsightsRequest } from '@/service/mi/insights'
import useAuthStore from '@/store/useAuthStore'
import { IPaginationResponse } from '@/types/api'

export type ReportType = 'A_INSIGHT' | 'A_MAIL' | 'A_CMMDT_MRKT_RPT' | 'A_CMPY_RPT' | 'A_ASST_RPT' | 'A_DEAL_INSIGHT' | 'A_DATA'
export interface Report {
  type?: ReportType
  types?: string[]
  title: string
  date: string
  source: string
  typeId: string
  subtitle?: string
  goodsNo?: number
  goodsDataNo?: number
  isViewable: boolean
}

const skeletonFields = [
  { width: '49px', height: '20px', marginBottom: '10px' },
  { width: '659px', height: '24px', marginBottom: '6px' },
  { width: '248px', height: '19px', marginBottom: '6px' },
  { width: '130px', height: '19px', marginBottom: '6px' },
]

// 기간 옵션
const periodOptions = [
  { label: 'All dates', value: 'ALL_DATES' },
  { label: '1 day', value: 'ONE_DAY' },
  { label: '1 week', value: 'ONE_WEEK' },
  { label: '1 month', value: 'ONE_MONTH' },
  { label: '3 month', value: 'THREE_MONTH' },
  { label: '6 month', value: 'SIX_MONTH' },
  { label: '12 month', value: 'TWELVE_MONTH' },
]

const renderSkeletonGroup = (key: number, removeMarginBottom = false) => (
  <Box key={key} padding="10px" marginBottom={removeMarginBottom ? undefined : '32px'}>
    {skeletonFields.map((field, idx) => (
      <MIBaseSkeleton.InputField key={idx} width={field.width} height={field.height} sx={{ marginBottom: field.marginBottom }} />
    ))}
  </Box>
)

// 말줄임이 적용된 경우에만 툴팁을 표시하는 컴포넌트
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
    <Tooltip title={text} arrow>
      {typography}
    </Tooltip>
  ) : (
    typography
  )
}

const InsightsPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)

  // 포커스 목록
  const { data: focusedList, isLoading: focusedIsLoading } = useQuery({
    queryKey: ['getFocusedList', customerCompanyNo],
    queryFn: async () => await insightsService.getFocusedList(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!customerCompanyNo,
  })
  // 필터
  const { data: filterList, isLoading: filterIsLoading } = useQuery({
    queryKey: ['getAdvancedFilterData', customerCompanyNo],
    queryFn: async () => await insightsService.getAdvancedFilterData(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!customerCompanyNo,
  })

  const { data: recentViewedList, isLoading: recentViewedIsLoading } = useQuery({
    queryKey: ['recentViewed', customerCompanyNo],
    queryFn: async () => await insightsService.getRecentViewed(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
    enabled: !!customerCompanyNo,
  })

  const clearRecentViewedMutation = useMutation({
    mutationFn: async () => await insightsService.clearRecentViewed(customerCompanyNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentViewed', customerCompanyNo] })
    },
  })

  const {
    filter,
    updateFilter,
    updateFilterWithSearch,
    updateMultiFilterWithSearch,
    data: insightsData,
    pagination,
    updatePage,
    updateSize,
    isLoading: insightsIsLoading,
  } = useSearchFilter<IInsightsRequest, IPaginationResponse<IInsightsInfo>>(
    (params, signal) => insightsService.getInsightsData(customerCompanyNo, params, signal),
    {
      keyword: '',
      sort: 'NEWEST',
      period: 'ALL_DATES',
      docFilters: '',
      provFilters: '',
      langFilters: '',
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

  // 정렬 옵션
  const sortOptions = useMemo(
    () => [
      { label: 'Newest', value: 'NEWEST' },
      { label: 'Oldest', value: 'OLDEST' },
      { label: 'Most relevant', value: 'MOST_RELEVANT', disabled: !filter?.keyword },
    ],
    [filter?.keyword],
  )

  // focused
  const reports = useMemo(
    () =>
      (focusedList?.data ?? []).map((item) => ({
        type: item.goodsDataCategoryCd as ReportType,
        title: item.goodsDataNm,
        date: item.modifyDt,
        source: item.providerNm,
        typeId: String(item.goodsDataNo),
        goodsNo: item.goodsNo,
        viewable: item.viewable,
      })),
    [focusedList],
  )
  const convertToFilters = (filterInfo: IAdvancedFilter) => {
    const buildOptions = (arr: IAdvancedFilterItem[] = []) =>
      arr.map(({ codeNm, codeId, codeExpn }) => ({
        label: codeNm,
        value: codeId,
        codeExpn,
      }))

    const sections = [
      // { title: 'Document Types', items: filterInfo.documentTypes },
      { title: 'Providers', items: filterInfo.providers },
      { title: 'Languages', items: filterInfo.languages },
    ]

    return sections.map(({ title, items }) => ({
      title,
      options: buildOptions(items),
    }))
  }

  const filters = useMemo(() => (filterList ? convertToFilters(filterList.data) : []), [filterList])

  const getSelectedFilters = useCallback(
    (filterType: 'docFilters' | 'provFilters' | 'langFilters'): string[] => {
      const filterValue = filter[filterType]
      return filterValue ? filterValue.split(',').filter(Boolean) : []
    },
    [filter],
  )

  const convertToTypes = useCallback(
    (category: string) =>
      filterList?.data?.documentTypes?.filter((type) => category.split(',').includes(type.codeId)).map((type) => type.codeId),
    [filterList?.data?.documentTypes],
  )

  // insights
  const insights = useMemo(() => {
    if (insightsData && Array.isArray(insightsData.detail)) {
      return insightsData.detail.map((item) => ({
        types: convertToTypes(item.goodsDataCategory),
        title: item.goodsDataNm,
        date: item.modifyDt,
        source: item.providerNm,
        typeId: String(item.goodsDataNo),
        subtitle: item.goodsDataSummaryCntt,
        goodsNo: item.goodsNo,
        goodsDataNo: item.goodsDataNo,
        isViewable: item.isViewable,
      }))
    }
    return []
  }, [convertToTypes, insightsData])

  const handleFilterChange = (filterType: 'docFilters' | 'provFilters' | 'langFilters', selectedFilters: string[]) => {
    updateFilterWithSearch(filterType, selectedFilters.join(','))
  }

  const getFilterType = (sectionTitle: string): 'docFilters' | 'provFilters' | 'langFilters' => {
    if (sectionTitle === 'Document Types') return 'docFilters'
    if (sectionTitle === 'Providers') return 'provFilters'
    return 'langFilters'
  }

  const isActuallyLoading = useMemo(
    () => isInitialLoading || focusedIsLoading || filterIsLoading || recentViewedIsLoading || (insightsIsLoading && !hasInitialData),
    [isInitialLoading, focusedIsLoading, filterIsLoading, recentViewedIsLoading, insightsIsLoading, hasInitialData],
  )

  useEffect(() => {
    // isChecked가 true인 항목들을 디폴트로 설정

    if (filterList?.data) {
      const filterEntries: [string, string][] = []

      if (filterList.data.providers?.length && !(filter?.provFilters && filter?.provFilters.length > 0)) {
        const checkedProviders = filterList.data.providers.filter((p) => p.isChecked === true).map((p) => p.codeId)

        if (checkedProviders.length > 0) {
          filterEntries.push(['provFilters', checkedProviders.join(',')])
        }
      }

      if (filterList.data.languages?.length && !(filter?.langFilters && filter?.langFilters.length > 0)) {
        const checkedLanguages = filterList.data.languages.filter((l) => l.isChecked === true).map((l) => l.codeId)

        if (checkedLanguages.length > 0) {
          filterEntries.push(['langFilters', checkedLanguages.join(',')])
        }
      }

      if (filterList.data.documentTypes?.length && !(filter?.docFilters && filter?.docFilters.length > 0)) {
        const checkedDocTypes = filterList.data.documentTypes.filter((d) => d.isChecked === true).map((d) => d.codeId)

        if (checkedDocTypes.length > 0) {
          filterEntries.push(['docFilters', checkedDocTypes.join(',')])
        }
      }

      if (filterEntries.length > 0) {
        updateMultiFilterWithSearch(filterEntries as [string, IInsightsRequest[keyof IInsightsRequest]][])
      }
    }
  }, [filterList, filter?.provFilters, filter?.langFilters, filter?.docFilters, updateMultiFilterWithSearch])

  useEffect(() => {
    const shouldMarkAsInitialized = filterList?.data && (!filter.docFilters || (filter.sort && filter.period))
    if (shouldMarkAsInitialized) {
      setHasInitialData(true)
      setIsInitialLoading(false)
    }
  }, [filterList, filter.docFilters, filter.sort, filter.period])

  useEffect(() => {
    if (insightsData?.detail?.length) setHasInitialData(true)
  }, [insightsData])

  return (
    <MISkeleton variant={'insights'} loading={isActuallyLoading}>
      <MIPageHeadline title="Market Reports" gradientStart="#14416D" gradientEnd="#165586" />

      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'} py={12.5} px={7.5}>
        <Typography mb={6} color="gray.90" component="h2" variant="titlePage">
          Focused
        </Typography>
        <Grid mb={17.5} container spacing={'16px'}>
          {reports?.map((report, index) => (
            <Grid size={3} key={index}>
              <InsightsCardBtn index={index} report={report} />
            </Grid>
          ))}
          {reports?.length === 0 && (
            <Grid size={3}>
              <Typography>No results found</Typography>
            </Grid>
          )}
        </Grid>

        <Typography mb={6} color="gray.90" component="h2" variant="titlePage">
          All Reports
        </Typography>
        <Grid
          container
          sx={{
            flexDirection: 'row',
          }}
          wrap={'nowrap'}
          gap={6}
        >
          <Box flexGrow={1}>
            <Grid mb={6} container direction={'row'} wrap={'nowrap'} gap={3.5} alignItems={'center'} justifyContent={'space-between'}>
              <Box sx={{ width: 400 }}>
                <MISearchInput
                  storageKey={'insights'}
                  value={filter.keyword ?? ''}
                  onChange={(value) => updateFilter('keyword', value)}
                  placeholder={'Search for insights'}
                  onSearch={(value) => updateFilterWithSearch('keyword', value)}
                  onClear={() => updateFilterWithSearch('keyword', '')}
                />
              </Box>
              <Grid container direction={'row'} wrap={'nowrap'} gap={3.5}>
                <MISelectMenu
                  sx={{ width: 160 }}
                  variant="outlined"
                  items={sortOptions}
                  selected={filter.sort ?? 'NEWEST'}
                  onSelected={
                    ((selected: string) => updateFilterWithSearch('sort', String(selected ?? 'NEWEST'))) as (selected: string) => void
                  }
                />
                <MISelectMenu
                  sx={{ width: 160 }}
                  variant="outlined"
                  items={periodOptions}
                  selected={filter.period ?? 'ALL_DATES'}
                  onSelected={
                    ((selected: string) => updateFilterWithSearch('period', String(selected ?? 'ALL_DATES'))) as (selected: string) => void
                  }
                />
              </Grid>
            </Grid>
            <Box mb={6} borderBottom={'1px solid'} borderColor={'gray.30'} />
            <Grid container direction={'column'} gap={8}>
              {!isActuallyLoading && (insightsIsLoading || (insightsData && !insights)) ? (
                <Box>{[0, 1, 2, 3].map((i) => renderSkeletonGroup(i, i === 3))}</Box>
              ) : (
                insights?.map((report, index) => <InsightsDocumentItem key={index} report={report} />)
              )}
            </Grid>
            {insightsData && insightsData.totalElements > 0 && (
              <MIPagination data={insightsData} size={pagination?.size} onPageChange={updatePage} onSizeChange={updateSize} />
            )}
            {!insightsIsLoading && insights?.length === 0 && (
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
          </Box>
          <Box
            display={'flex'}
            flexDirection={'column'}
            boxSizing={'border-box'}
            gap={6}
            sx={{
              width: 286,
            }}
          >
            <Box
              display={'flex'}
              flexDirection={'column'}
              border={'1px solid'}
              borderColor={'gray.30'}
              borderRadius={1}
              padding={'24px 12px'}
              boxSizing={'border-box'}
              gap={6}
            >
              {filters?.map((section) => (
                <MIFilterGroup
                  key={section.title}
                  title={section.title}
                  filters={section.options}
                  selectedFilters={getSelectedFilters(getFilterType(section.title))}
                  onFilterChange={(selectedFilters) => handleFilterChange(getFilterType(section.title), selectedFilters)}
                />
              ))}
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
                  onClick={() => clearRecentViewedMutation.mutate()}
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
          </Box>
        </Grid>
      </Box>
    </MISkeleton>
  )
}

export default InsightsPage
