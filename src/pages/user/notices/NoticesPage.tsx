import SearchIcon from '@mui/icons-material/Search'
import { Box, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import MIInput from '@/components/common/input/MIInput'
import MITableCell from '@/components/common/table/MITableCell'
import MITableLayout from '@/components/common/table/MITableLayout'
import { useMockBoardData } from '@/hooks/useMockBoardNotices'

const NoticesPage = () => {
  const data = useMockBoardData()
  const navigate = useNavigate()
  const [dataTable, setDataTable] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setDataTable(data as [])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

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
        />
      </Box>
      <Box paddingTop={5} paddingBottom={5}>
        <MITableLayout
          tableProps={{
            onRowClick: () => navigate('/user/notice-detail'),
            noRowMessage: '등록된 내용이 없습니다.',
            columns: [
              { field: 'category', headerName: 'Category', width: 120, align: 'center' },
              { field: 'title', headerName: 'Title', flex: 1 },
              {
                field: 'date',
                headerName: 'Updated',
                width: 120,
                align: 'center',
                renderCell(params) {
                  return <MITableCell value={params.value} typography={{ color: 'gray.60' }} />
                },
              },
            ],
            rowId: 'id',
            rows: dataTable,
          }}
        />
      </Box>
    </Box>
  )
}

export default NoticesPage
