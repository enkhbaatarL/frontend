import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableLayout from '@/components/common/table/MITableLayout'
import useSearchFilter from '@/hooks/useSearchFilter.tsx'
import boardService, { INoticeInfo, INoticeRequest } from '@/service/mi/board.ts'
import { IPaginationResponse } from '@/types/api.ts'

const NoticesPage = () => {
  const { data, updateFilter, pagination, updatePage, updateSize } = useSearchFilter<INoticeRequest, IPaginationResponse<INoticeInfo>>(
    boardService.getNotice,
    {
      category: '',
      status: '',
      target: '',
      keyword: '',
    },
    {
      page: 1,
      size: 20,
    },
  )

  const navigate = useNavigate()

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    updatePage(page)
  }

  // 페이지 사이즈 변경 핸들러
  const handlePageSizeChange = (pageSize: number) => {
    updateSize(pageSize)
  }

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
          onChange={(e) => updateFilter('keyword', e.target.value)}
        />
      </Box>
      <Box paddingTop={5} paddingBottom={5}>
        <MITableLayout
          tableProps={{
            onRowClick: () => navigate('/user/notice-detail'),
            noRowMessage: '등록된 내용이 없습니다.',
            columns: [
              { field: 'bulletinCategorySeparateCode', headerName: 'Category', width: 120, align: 'center' },
              { field: 'bulletinTitleName', headerName: 'Title', flex: 1 },
              {
                field: 'createDt',
                headerName: 'Updated',
                width: 120,
                align: 'center',
                renderCell(params) {
                  return <MITableCell value={params.value} typography={{ color: 'gray.60' }} />
                },
              },
            ],
            rowId: 'bulletinNo',
            rows: data?.detail || [],
          }}
          pagination={{
            total: data?.totalElements || 0,
            current: pagination?.page || 1,
            pageSize: pagination?.size || 20,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
        />
      </Box>
    </Box>
  )
}

export default NoticesPage
