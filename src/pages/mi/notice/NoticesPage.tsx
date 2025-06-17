import { Box, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useNavigate } from 'react-router-dom'

import MISearchInput from '@/components/common/input/MISearchInput.tsx'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import useSearchFilter from '@/hooks/useSearchFilter'
import boardService, { INoticeInfo, INoticeRequest } from '@/service/mi/board'
import useAuthStore from '@/store/useAuthStore'
import { IPaginationResponse } from '@/types/api'

const NoticesPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0

  const { filter, data, updateFilter, pagination, updatePage, updateSize, updateFilterWithSearch, isLoading } = useSearchFilter<
    INoticeRequest,
    IPaginationResponse<INoticeInfo>
  >(
    (params) => boardService.getNotice({ customerCompanyNo, ...params }),
    {
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
    {
      initialFetch: true,
    },
  )

  const { data: filterOptions } = useQuery({
    queryKey: ['getNoticeFilter'],
    queryFn: async () => await boardService.getNoticeFilter(),
    refetchOnWindowFocus: false,
    gcTime: 0,
  })

  const navigate = useNavigate()
  return (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingTop={10}>
        <Typography variant="heading2" component="div" mb={5} color="gray.90">
          Notice
        </Typography>
        <MISearchInput
          storageKey={'notices'}
          placeholder="Search for notice"
          value={filter.keyword ?? ''}
          onChange={(value) => updateFilter('keyword', value)}
          onSearch={(value) => updateFilterWithSearch('keyword', value)}
          onClear={() => updateFilterWithSearch('keyword', '')}
        />
      </Box>
      <Box paddingTop={5} paddingBottom={5}>
        <MITableUser
          hidePagination={data?.totalElements === 0 || !data?.totalElements}
          tableProps={{
            disableHover: false,
            loading: isLoading,
            onRowClick: (row) => {
              navigate(`/mi/notices/${row.id}`)
            },
            noRowMessage: t('등록된 내용이 없습니다.'),
            columns: [
              {
                field: 'bulletinCategorySeparateCode',
                headerName: 'Category',
                width: 120,
                align: 'center',
                renderCell: (params) => (
                  <MITableCell
                    value={filterOptions?.category.find((item) => item.key === params.value)?.value ?? ''}
                    typography={{
                      fontWeight: params.row.isTopFixed ? 600 : 400,
                    }}
                  />
                ),
              },
              {
                field: 'bulletinTitleName',
                headerName: 'Title',
                flex: 1,
                renderCell: (params) => (
                  <MITableCell
                    value={params.value}
                    typography={{
                      fontWeight: params.row.isTopFixed ? 600 : 400,
                    }}
                  />
                ),
              },
              {
                field: 'createDt',
                headerName: 'Updated',
                width: 120,
                align: 'center',
                renderCell: (params) => (
                  <MITableCell
                    value={dayjs(params.value).format('YYYY-MM-DD')}
                    typography={{
                      color: 'gray.60',
                      fontWeight: params.row.isTopFixed ? 600 : 400,
                    }}
                  />
                ),
              },
            ],
            rowId: 'bulletinNo',
            rows: data?.detail,
          }}
          paginationProps={{
            data,
            size: pagination?.size,
            onPageChange: updatePage,
            onSizeChange: updateSize,
          }}
        />
      </Box>
    </Box>
  )
}

export default NoticesPage
