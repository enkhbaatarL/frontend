import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import MIAccordion from '@/components/common/accordion/MIAccordion'
import MIInput from '@/components/common/input/MIInput'
import MITablePagination from '@/components/common/table/MITablePagination'
import MITabs from '@/components/common/tabs/MITabs'
import useSearchFilter from '@/hooks/useSearchFilter'
import boardService, { IFaqDetailInfo, IFaqRequest } from '@/service/mi/board'
import { IPaginationResponse } from '@/types/api'

const QaPage = () => {
  const [selectedTab, setSelectedTab] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const convQaItem = (item: IFaqDetailInfo) => ({
    key: item.bulletinNo,
    title: item.bulletinTitleNm,
    content: item.bulletinCntt,
  })

  const { data: filterOptions } = useQuery({
    queryKey: ['getFaqFilter'],
    queryFn: async () => await boardService.getFaqFilter(),
    refetchOnWindowFocus: false,
  })

  const {
    // filter,
    updateFilter,
    // pagination,
    // updateSize,
    // updatePage,
    // resetFilter,
    search,
    data,
    // refetch,
    // isInitialState,
    // isSearchedState,
    // isLoading,
  } = useSearchFilter<IFaqRequest, IPaginationResponse<IFaqDetailInfo>>(
    boardService.getFaq,
    {
      category: '',
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const tabsData = useMemo(
    () =>
      filterOptions?.category.map((item) => ({
        label: item.value,
        content: data?.detail ? <MIAccordion isBorder items={data.detail.map(convQaItem) ?? []} /> : null,
      })) ?? [],
    [data?.detail, filterOptions?.category],
  )

  const handleTabChange = (newValue: number) => {
    setSelectedTab(newValue)
    if (filterOptions?.category[newValue]) {
      updateFilter('category', filterOptions.category[newValue].key)
      search()
    }
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // 페이지 사이즈 변경 시 첫 페이지로 이동
  }

  useEffect(() => {
    if (filterOptions?.category && filterOptions.category.length > 0) {
      updateFilter('category', filterOptions.category[selectedTab]?.key || '')
      search()
    }
  }, [filterOptions?.category, selectedTab])

  return (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingTop={10}>
        <Typography variant="heading2" component="div" mb={5} color="gray.90">
          Help Center
        </Typography>
        <MIInput
          width={458}
          maxWidth={'100%'}
          placeholder="Search for help center"
          size="h46"
          startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
          onChange={() => search()}
        />
      </Box>
      <Box paddingTop={5} paddingBottom={5}>
        <MITabs size={'h52'} arrayItem={tabsData} onChange={handleTabChange} />
        <MITablePagination
          total={data?.totalElements ?? 0}
          current={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Box>
    </Box>
  )
}

export default QaPage
