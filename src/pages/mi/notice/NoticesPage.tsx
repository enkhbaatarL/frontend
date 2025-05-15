import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import dayjs from 'dayjs'
import { t } from 'i18next'
import { useNavigate } from 'react-router-dom'

import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableUser from '@/components/common/table/MITableUser'
import useSearchFilter from '@/hooks/useSearchFilter'
import boardService, { INoticeInfo, INoticeRequest } from '@/service/mi/board'
import { IPaginationResponse } from '@/types/api'

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
        <MITableUser
          tableProps={{
            disableHover: true,
            onRowClick: (row) => {
              navigate(`/mi/notices/${row.id}`)
            },
            noRowMessage: t('등록된 내용이 없습니다.'),
            columns: [
              { field: 'bulletinCategorySeparateCode', headerName: 'Category', width: 120, align: 'center' },
              { field: 'bulletinTitleName', headerName: 'Title', flex: 1 },
              {
                field: 'createDt',
                headerName: 'Updated',
                width: 120,
                align: 'center',
                renderCell: (params) => <MITableCell value={dayjs(params.value).format('YYYY-MM-DD')} typography={{ color: 'gray.60' }} />,
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
