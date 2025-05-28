import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import useSearchFilter from '@/hooks/useSearchFilter'
import boardService, { INoticeInfo, INoticeRequest } from '@/service/mi/board'
import useAuthStore from '@/store/useAuthStore'
import { IPaginationResponse } from '@/types/api'

const NoticesPage = () => {
  const { accessCompanyInfo } = useAuthStore()
  const customerCompanyNo = accessCompanyInfo?.customerCompanyNo ?? 0
  const initialFetchRef = useRef(false)

  const { filter, data, updateFilter, pagination, updatePage, updateSize, updateFilterWithSearch } = useSearchFilter<
    INoticeRequest,
    IPaginationResponse<INoticeInfo>
  >(
    boardService.getNotice,
    {
      customerCompanyNo,
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

  useEffect(() => {
    if (accessCompanyInfo?.customerCompanyNo && !initialFetchRef.current) {
      initialFetchRef.current = true
      updateFilterWithSearch('customerCompanyNo', accessCompanyInfo.customerCompanyNo)
    }
  }, [accessCompanyInfo, updateFilterWithSearch])

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
