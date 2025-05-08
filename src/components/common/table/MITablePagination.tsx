import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import { Box, Pagination, PaginationItem, PaginationProps, Typography } from '@mui/material'
import { useState } from 'react'

import MIButton from '@/components/common/button/MIButton.tsx'

export interface MITablePaginationProps extends PaginationProps {
  total?: number
  page?: number
}

export default function MITablePagination(props: Readonly<PaginationProps>) {
  const [pageSize, setPageSize] = useState({
    label: '10',
    value: '10',
  })

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" pt="20px" pb="10px">
      <Typography variant="body3" color="gray.60">
        1-10 of 1,000
      </Typography>
      <Pagination
        {...props}
        shape="rounded"
        showFirstButton
        showLastButton
        count={5}
        renderItem={(item) => (
          <PaginationItem
            sx={{ fontSize: 14, color: 'primary.main', width: 26, height: 26, minWidth: 26 }}
            slots={{ first: KeyboardDoubleArrowLeftIcon, last: KeyboardDoubleArrowRightIcon }}
            {...item}
          />
        )}
      />
      <Box width={72}>
        <MIButton
          offsetTop={0}
          type={'outlined'}
          contentType={'select'}
          color={'gray'}
          size={'h28'}
          minWidth={69}
          valueSelect={pageSize}
          onChange={(option) => setPageSize(option)}
          options={[
            { label: '10', value: '10' },
            { label: '20', value: '20' },
            { label: '30', value: '30' },
          ]}
        />
      </Box>
    </Box>
  )
}
