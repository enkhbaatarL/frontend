import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

import MIAccordion from '@/components/common/accordion/MIAccordion'
import MIInput from '@/components/common/input/MIInput'
import MIPagination from '@/components/common/pagination/MIPagination'
import MITabs from '@/components/common/tabs/MITabs'
import useSearchFilter from '@/hooks/useSearchFilter'
import boardService, { IFaqDetailInfo, IFaqRequest } from '@/service/mi/board'
import { IPaginationResponse } from '@/types/api'

const QaPage = () => {
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

  const { filter, updateFilter, updateFilterWithSearch, data, pagination, updatePage, updateSize } = useSearchFilter<
    IFaqRequest,
    IPaginationResponse<IFaqDetailInfo>
  >(
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

  const tabsData = useMemo(
    () =>
      filterOptions?.category.map((item) => ({
        label: item.value,
        content: data?.detail ? <MIAccordion isBorder items={data.detail.map(convQaItem) ?? []} /> : null,
      })) ?? [],
    [data?.detail, filterOptions?.category],
  )

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
    if (filterOptions?.category[0] && !filter.category) {
      updateFilterWithSearch('category', filterOptions.category[0].key)
    }
  }, [filterOptions, filter.category, updateFilter, updateFilterWithSearch])

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
          onChange={(e) => updateFilter('keyword', e.target.value)}
          onKeyDown={({ key, target }) => key === 'Enter' && updateFilterWithSearch('keyword', (target as HTMLInputElement).value)}
          onClear={() => updateFilterWithSearch('keyword', '')}
        />
      </Box>
      <Box paddingTop={5} paddingBottom={5}>
        <MITabs size={'h52'} arrayItem={tabsData} onChange={handleTabChange} value={activeTab} />
        <MIPagination data={data} size={pagination?.size} onPageChange={updatePage} onSizeChange={updateSize} />
      </Box>
    </Box>
  )
}

export default QaPage
