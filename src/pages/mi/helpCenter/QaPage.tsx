import SearchIcon from '@mui/icons-material/Search'
import { Box, Skeleton, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { t } from 'i18next'
import { useEffect, useMemo, useState } from 'react'

import MIAccordion from '@/components/common/accordion/MIAccordion'
import ErrorOutlineIcon from '@/components/common/icons/ErrorOutlineIcon'
import MIInput from '@/components/common/input/MIInput'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITabs from '@/components/common/tabs/MITabs'
import MISkeleton from '@/components/mi/MISkeleton'
import useSearchFilter from '@/hooks/useSearchFilter'
import boardService, { IFaqDetailInfo, IFaqRequest } from '@/service/mi/board'
import { IPaginationResponse } from '@/types/api'

const QaPage = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasInitialData, setHasInitialData] = useState(false)

  const convQaItem = (item: IFaqDetailInfo) => ({
    key: item.bulletinNo,
    title: item.bulletinTitleNm,
    content: item.bulletinCntt,
  })

  const { data: filterOptions, isLoading: isFilterLoading } = useQuery({
    queryKey: ['getFaqFilter'],
    queryFn: async () => await boardService.getFaqFilter(),
    refetchOnWindowFocus: false,
  })

  const {
    filter,
    updateFilter,
    updateFilterWithSearch,
    data,
    pagination,
    updatePage,
    updateSize,
    isLoading: isDataLoading,
  } = useSearchFilter<IFaqRequest, IPaginationResponse<IFaqDetailInfo>>(
    boardService.getFaq,
    {
      category: '',
      keyword: '',
    },
    {
      page: 1,
      size: 10,
    },
    {
      initialFetch: false,
    },
  )

  const isActuallyLoading = useMemo(
    () => isInitialLoading || isFilterLoading || (isDataLoading && !hasInitialData),
    [isInitialLoading, isFilterLoading, isDataLoading, hasInitialData],
  )

  const isEmpty = useMemo(() => !data?.detail || data.detail.length === 0, [data?.detail])
  const tabsData = useMemo(() => {
    if (!filterOptions?.category) return []

    return filterOptions.category.map((item) => {
      let content
      if (!data?.detail) {
        content = <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '4px', minHeight: '500px' }} />
      } else if (isEmpty) {
        content = (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="gray.5"
            textAlign="center"
            height="100%"
            sx={{ padding: '140px 0', borderBottom: '1px solid #DEE2E6' }}
          >
            <Box display="flex" flexDirection="column" rowGap="10px" alignItems="center">
              <ErrorOutlineIcon />
              <Typography variant="body6" color="gray.60">
                {t('검색 결과가 없습니다.')}
              </Typography>
            </Box>
          </Box>
        )
      } else {
        content = <MIAccordion isBorder items={data.detail.map(convQaItem)} />
      }

      return { label: item.value, content }
    })
  }, [data?.detail, filterOptions?.category, isEmpty])

  const handleTabChange = (newValue: number) => {
    if (filterOptions?.category[newValue]) {
      updateFilterWithSearch('category', filterOptions.category[newValue].key)
    }
  }

  const activeTab = useMemo(() => {
    const index = filterOptions?.category.findIndex((item) => item.key === filter.category) ?? -1
    return index < 0 ? undefined : index
  }, [filterOptions?.category, filter.category])

  useEffect(() => {
    const initializeData = async () => {
      if (filterOptions?.category[0] && !filter.category) {
        try {
          updateFilterWithSearch('category', filterOptions.category[0].key)
          setHasInitialData(true)
        } catch (error) {
          console.error('초기 데이터 로딩 실패:', error)
        } finally {
          setIsInitialLoading(false)
        }
      } else if (filterOptions && filter.category) {
        setIsInitialLoading(false)
        setHasInitialData(true)
      }
    }

    initializeData()
  }, [filterOptions, filter.category, updateFilterWithSearch])

  useEffect(() => {
    if (data?.detail && data.detail.length > 0) {
      setHasInitialData(true)
    }
  }, [data])

  return (
    <MISkeleton loading={isActuallyLoading} variant="boardPage">
      <Box maxWidth="1380px" margin="auto" paddingX={7.5}>
        <Box paddingTop={10}>
          <Typography variant="heading2" component="div" mb={5} color="gray.90">
            Help Center
          </Typography>
          <MIInput
            width={360}
            maxWidth="100%"
            placeholder="Search for help center"
            size="h46"
            endIcon={<SearchIcon style={{ color: '#CED4DA' }} sx={{ fontSize: 20 }} />}
            value={filter?.keyword ?? ''}
            onChange={(e) => updateFilter('keyword', e.target.value)}
            onKeyDown={({ key, target }) => key === 'Enter' && updateFilterWithSearch('keyword', (target as HTMLInputElement).value)}
            onClear={() => updateFilterWithSearch('keyword', '')}
          />
        </Box>
        <Box paddingTop={5} paddingBottom={5}>
          <MITabs size="h52" arrayItem={tabsData} onChange={handleTabChange} value={activeTab} />
          {!isEmpty && <MIPagination data={data} size={pagination?.size} onPageChange={updatePage} onSizeChange={updateSize} />}
        </Box>
      </Box>
    </MISkeleton>
  )
}

export default QaPage
