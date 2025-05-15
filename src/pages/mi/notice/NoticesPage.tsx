import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useNavigate } from 'react-router-dom'

import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import useSearchFilter from '@/hooks/useSearchFilter.tsx'
import boardService, { INoticeInfo, INoticeRequest } from '@/service/mi/board.ts'
import { IPaginationResponse } from '@/types/api.ts'

const NoticesPage = () => {
  const { filter, data, updateFilter, pagination, updatePage, updateSize, updateFilterWithSearch } = useSearchFilter<
    INoticeRequest,
    IPaginationResponse<INoticeInfo>
  >(
    boardService.getNotice,
    {
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
    {
      initialFetch: false,
    },
  )

  const navigate = useNavigate()

  return (
    <Box maxWidth={'1380px'} margin={'auto'} paddingX={7.5}>
      <Box paddingTop={10}>
        <Typography variant="heading2" component="div" mb={5} color="gray.90">
          Notice
        </Typography>
        <MIInput
          width={458}
          maxWidth={'100%'}
          placeholder="Search for notice"
          size="h46"
          startIcon={<SearchIcon style={{ color: '#CED4DA' }} />}
          value={filter?.keyword ?? ''}
          onChange={(e) => updateFilter('keyword', e.target.value)}
          onKeyDown={({ key, target }) => key === 'Enter' && updateFilterWithSearch('keyword', (target as HTMLInputElement).value)}
          onClear={() => updateFilterWithSearch('keyword', '')}
        />
      </Box>
      <Box paddingTop={5} paddingBottom={5}>
        <MITableUser
          hidePagination={data?.totalElements === 0 || !data?.totalElements}
          tableProps={{
            disableHover: true,
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
                    value={params.value}
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
