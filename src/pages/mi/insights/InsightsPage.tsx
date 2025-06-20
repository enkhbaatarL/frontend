import { Box, FormControlLabel, FormGroup, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import InsightsDocumentItem from './components/InsightsDocumentItem'

import psImg from '@/assets/productsymbol.png'
import shiImg from '@/assets/subheaderinsight.jpg'
import AdminCheckbox from '@/components/admin/AdminCheckbox'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIPagination from '@/components/common/pagination/MIPagination'
import MISelect from '@/components/common/select/MISelect'
import { MIBaseSkeleton } from '@/components/mi/MIBaseSkeleton'
import MISkeleton from '@/components/mi/MISkeleton.tsx'
import useSearchFilter from '@/hooks/useSearchFilter'
import InsightsCardBtn from '@/pages/mi/insights/components/InsightsCardBtn'
import insightsService, { IAdvancedFilter, IAdvancedFilterItem, IInsightsInfo, IInsightsRequest } from '@/service/mi/insights'
import useAuthStore from '@/store/useAuthStore'
import { IPaginationResponse } from '@/types/api'

export type ReportType = 'A_INSIGHT' | 'A_CMMDT_MRKT_RPT' | 'A_CMPY_RPT' | 'A_ASST_RPT' | 'A_DEAL_INSIGHT'
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

const InsightsPage = () => {
  const { accessCompanyInfo } = useAuthStore()
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

  const {
    filter,
    updateFilter,
    updateFilterWithSearch,
    data: insightsData,
    pagination,
    updatePage,
    updateSize,
    isLoading: insightsIsLoading,
  } = useSearchFilter<IInsightsRequest, IPaginationResponse<IInsightsInfo>>(
    (params) => insightsService.getInsightsData(customerCompanyNo, params),
    {
      keyword: '',
      sort: 'NEWEST',
      period: 'ALL_DATES',
      filters: '',
    },
    {
      page: 1,
      size: 10,
    },
    {
      initialFetch: true,
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
      })),
    [focusedList],
  )
  const convertToFilters = (filterInfo: IAdvancedFilter) => {
    const buildOptions = (arr: IAdvancedFilterItem[] = []) =>
      arr.map(({ codeNm, codeId }) => ({
        label: codeNm,
        value: codeId,
      }))

    const sections = [
      { title: 'Document Types', items: filterInfo.documentTypes },
      { title: 'Providers', items: filterInfo.providers },
      { title: 'Languages', items: filterInfo.languages },
    ]

    return sections.map(({ title, items }) => ({
      title,
      options: buildOptions(items),
    }))
  }

  const filters = useMemo(() => (filterList ? convertToFilters(filterList.data) : []), [filterList])

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
      }))
    }
    return []
  }, [convertToTypes, insightsData])

  const handleFilterChange = (value: string) => {
    const currentFilters = (filter?.filters ?? '').split(',').filter(Boolean)
    const updatedFilters = currentFilters.includes(value) ? currentFilters.filter((v) => v !== value) : [...currentFilters, value]

    updateFilterWithSearch('filters', updatedFilters.join(','))
  }

  const isActuallyLoading = useMemo(
    () => isInitialLoading || focusedIsLoading || filterIsLoading || (insightsIsLoading && !hasInitialData),
    [isInitialLoading, focusedIsLoading, filterIsLoading, insightsIsLoading, hasInitialData],
  )

  useEffect(() => {
    const shouldMarkAsInitialized = filterList?.data && (!filter.filters || (filter.sort && filter.period))
    if (shouldMarkAsInitialized) {
      setHasInitialData(true)
      setIsInitialLoading(false)
    }
  }, [filterList, filter.filters, filter.sort, filter.period])

  useEffect(() => {
    if (insightsData?.detail?.length) setHasInitialData(true)
  }, [insightsData])

  return (
    <MISkeleton variant={'insights'} loading={isActuallyLoading}>
      <Box
        paddingY={14}
        sx={{
          background: `url(${psImg}) right / 33% no-repeat, url(${shiImg}) lightgray 50% / cover no-repeat`,
          zIndex: 0,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
            boxShadow: '0px 20px 20px 0px rgba(0, 0, 0, 0.25) inset',
          }}
        ></Box>
        <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'}>
          <Typography color="white" component="h1" fontSize={40} variant="body1M16">
            Insights
          </Typography>
          <Typography color="#DCDCDC" fontSize={20} lineHeight={1.6} variant="subtext1">
            Stay informed, stay ahead
          </Typography>
        </Box>
      </Box>
      <Box boxSizing={'border-box'} paddingX={7.5} minWidth={'1440px'} width={'1440px'} margin={'auto'} py={12.5} px={7.5}>
        <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
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

        <Box pb={6} mb={9} borderBottom={'1px solid'} borderColor={'gray.30'}>
          <Typography mb={9} color="gray.90" component="h2" variant="titlePage">
            Insights
          </Typography>
          <MISearchInput
            storageKey={'insights'}
            value={filter.keyword ?? ''}
            onChange={(value) => updateFilter('keyword', value)}
            placeholder={'Search for insights'}
            onSearch={(value) => updateFilterWithSearch('keyword', value)}
            onClear={() => updateFilterWithSearch('keyword', '')}
          />
        </Box>
        <Grid
          container
          sx={{
            flexDirection: 'row',
          }}
          wrap={'nowrap'}
          gap={6}
        >
          <Box flexGrow={1}>
            <Grid mb={6} width={334} container direction={'row'} wrap={'nowrap'} gap={3.5}>
              <MISelect
                minWidth={160}
                fullWidth
                options={sortOptions}
                value={filter.sort || 'NEWEST'}
                onChange={(e) => updateFilterWithSearch('sort', String(e.target.value ?? 'NEWEST'))}
              />
              <MISelect
                minWidth={160}
                fullWidth
                options={periodOptions}
                value={filter.period || 'ALL_DATES'}
                onChange={(e) => updateFilterWithSearch('period', String(e.target.value ?? 'ALL_DATES'))}
              />
            </Grid>
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
            flexShrink={0}
            sx={{
              width: 346,
            }}
          >
            <Grid container border={'1px solid'} borderColor={'gray.30'} borderRadius={1} gap={6} padding={6} flexShrink={0}>
              {filters?.map((section) => {
                const checkedValues = (filter?.filters ?? '').split(',')
                return (
                  <Box key={section.title}>
                    <Typography mb={3.5} color="gray.90" component="h2" variant="titleBox">
                      {section.title}
                    </Typography>
                    <FormGroup>
                      {section.options.map((option: { label: string; value: string }) => (
                        <FormControlLabel
                          key={option.value}
                          sx={{
                            p: '6.82px 8px',
                            mr: 0,
                            '.MuiTypography-root': { fontSize: '16px', lineHeight: 1.4 },
                          }}
                          control={
                            <AdminCheckbox
                              checked={checkedValues.includes(option.value)}
                              value={option.value}
                              onChange={(e) => handleFilterChange(e.target.value)}
                            />
                          }
                          label={option.label}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                )
              })}
            </Grid>
          </Box>
        </Grid>
      </Box>
    </MISkeleton>
  )
}

export default InsightsPage
