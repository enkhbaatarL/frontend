import { Box, FormControlLabel, FormGroup, Grid2 as Grid, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import InsightsDocumentItem from './components/InsightsDocumentItem'

import psImg from '@/assets/productsymbol.png'
import shiImg from '@/assets/subheaderinsight.jpg'
import AdminCheckbox from '@/components/admin/AdminCheckbox'
import MISearchInput from '@/components/common/input/MISearchInput'
import MIPagination from '@/components/common/pagination/MIPagination'
import MISelect from '@/components/common/select/MISelect'
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

const InsightsPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0
  const [keyword, setKeyword] = useState('')

  // 포커스 목록
  const { data: focusedList } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => await insightsService.getFocusedList(customerCompanyNo),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 필터
  const { data: filterList } = useQuery({
    queryKey: ['filterList'],
    queryFn: async () => await insightsService.getAdvancedFilterData(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  // 정렬 옵션
  const sortOptions = useMemo(
    () => [
      { label: 'Newest', value: 'NEWEST' },
      { label: 'Oldest', value: 'OLDEST' },
      { label: 'Most relevant', value: 'MOST_RELEVANT', disabled: !keyword },
    ],
    [keyword],
  )

  // 기간 옵션
  const periodOptions = useMemo(
    () => [
      { label: 'All dates', value: 'ALL_DATES' },
      { label: '1 day', value: 'ONE_DAY' },
      { label: '1 week', value: 'ONE_WEEK' },
      { label: '1 month', value: 'ONE_MONTH' },
      { label: '3 month', value: 'THREE_MONTH' },
      { label: '6 month', value: 'SIX_MONTH' },
      { label: '12 month', value: 'TWELVE_MONTH' },
    ],
    [],
  )

  const {
    filter,
    updateFilter,
    updateFilterWithSearch,
    data: insightsData,
    pagination,
    updatePage,
    updateSize,
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
  )

  // focused
  const reports = useMemo(() => {
    if (focusedList && Array.isArray(focusedList.data)) {
      return focusedList.data.map((item) => ({
        type: item.goodsDataCategoryCd,
        title: item.goodsDataNm,
        date: item.modifyDt,
        source: item.providerNm,
        typeId: item.goodsDataNo,
        goodsNo: item.goodsNo,
      }))
    }
    return []
  }, [focusedList])

  const convertToFilters = (filterList: IAdvancedFilter) => {
    const { documentTypes, providers, languages } = filterList

    const buildOptions = (arr: IAdvancedFilterItem[]) =>
      arr.map((item: IAdvancedFilterItem) => ({
        label: item.codeNm,
        value: item.codeId,
      }))

    return [
      {
        title: 'Document Types',
        options: buildOptions(documentTypes as IAdvancedFilterItem[]),
      },
      {
        title: 'Providers',
        options: buildOptions(providers as IAdvancedFilterItem[]),
      },
      {
        title: 'Languages',
        options: buildOptions(languages),
      },
    ]
  }

  const filters = useMemo(() => {
    if (filterList) {
      return convertToFilters(filterList.data)
    }
    return []
  }, [filterList])

  const convertToTypes = (category: string) => {
    const categoryList = category.split(',')

    const matchedDocumentTypes = filterList?.data.documentTypes.filter((type) => categoryList.includes(type.codeId))
    return matchedDocumentTypes?.map((type) => type.codeId)
  }

  // insights
  const insights = useMemo(() => {
    if (insightsData && Array.isArray(insightsData.detail)) {
      return insightsData.detail.map((item) => ({
        types: convertToTypes(item.goodsDataCategory),
        title: item.goodsDataNm,
        date: item.modifyDt,
        source: item.providerNm,
        typeId: String(item.goodsDataNo),
        subtitle: item.goodsDataExpn,
        goodsNo: item.goodsNo,
        goodsDataNo: item.goodsDataNo,
      }))
    }
    return []
  }, [convertToTypes, insightsData])

  const [_checkedValues, setCheckedValues] = useState<string[]>([])

  const handleFilterChange = (value: string) => {
    setCheckedValues((prev) => {
      const isChecked = prev.includes(value)
      const newValues = isChecked ? prev.filter((v) => v !== value) : [...prev, value]

      updateFilterWithSearch('filters', newValues.join(','))
      return newValues
    })
  }

  // 검색
  const handleSearch = (value: string) => {
    updateFilterWithSearch('keyword', value)
    setKeyword(value)
  }

  const handleInputChange = (value: string) => {
    updateFilter('keyword', value)
    setKeyword(value)
  }

  useEffect(() => {
    if (filter.filters) {
      setCheckedValues(filter.filters.split(','))
    } else {
      setCheckedValues([])
    }
  }, [filter.filters])

  return (
    <>
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
        <Grid mb={17.5} container spacing={6}>
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
            value={keyword}
            onChange={handleInputChange}
            placeholder={'Search for insights'}
            onSearch={handleSearch}
            onClear={() => {
              updateFilterWithSearch('keyword', '')
              setKeyword('')
            }}
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
                value={filter.sort ? String(filter.sort) : 'NEWEST'}
                onChange={(e) => {
                  if (!e.target.value) {
                    updateFilterWithSearch('sort', 'NEWEST')
                  } else {
                    updateFilterWithSearch('sort', String(e.target.value))
                  }
                }}
              />
              <MISelect
                minWidth={160}
                fullWidth
                options={periodOptions}
                value={filter.period ? String(filter.period) : 'ALL_DATES'}
                onChange={(e) => {
                  if (!e.target.value) {
                    updateFilterWithSearch('period', 'ALL_DATES')
                  } else {
                    updateFilterWithSearch('period', String(e.target.value))
                  }
                }}
              />
            </Grid>
            <Grid container direction={'column'} gap={8}>
              {insights?.map((report, index) => <InsightsDocumentItem key={index} report={report} />)}
            </Grid>
            {insightsData && (
              <MIPagination data={insightsData} size={pagination?.size} onPageChange={updatePage} onSizeChange={updateSize} />
            )}
            {insights?.length === 0 && (
              <Grid size={3}>
                <Typography>No results found</Typography>
              </Grid>
            )}
          </Box>
          <Box
            flexShrink={0}
            sx={{
              width: 346,
            }}
          >
            <Grid container border={'1px solid'} borderColor={'gray.30'} borderRadius={1} gap={6} padding={6} flexShrink={0}>
              {filters?.map((section) => (
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
                            value={option.value}
                            onChange={(e) => {
                              handleFilterChange(e.target.value)
                            }}
                          />
                        }
                        label={option.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}
            </Grid>
          </Box>
        </Grid>
      </Box>
    </>
  )
}

export default InsightsPage
