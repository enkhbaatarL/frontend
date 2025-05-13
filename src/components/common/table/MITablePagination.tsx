import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import { Box, Pagination, PaginationItem, PaginationProps, Typography } from '@mui/material'
import { useMemo } from 'react'

import MIButton from '@/components/common/button/MIButton'

export interface MITablePaginationProps extends PaginationProps {
  total: number
  current: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export default function MITablePagination(props: Readonly<MITablePaginationProps>) {
  const { total, current, pageSize, onPageChange, onPageSizeChange, ...paginationProps } = props

  // 총 페이지 수 계산
  const totalPages = Math.ceil(total / pageSize)

  // 현재 페이지에 표시되는 아이템 범위 계산
  const startItem = (current - 1) * pageSize + 1
  const endItem = Math.min(current * pageSize, total)

  const pageSelectOption = useMemo(
    () => ({
      label: String(pageSize),
      value: String(pageSize),
    }),
    [pageSize],
  )

  const handlePageSizeChange = (option: { label: string; value: string }) => {
    onPageSizeChange(Number(option.value))
  }

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    onPageChange(page)
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" pt="20px" pb="10px">
      <Typography variant="body3" color="gray.60">
        {startItem}-{endItem} of {total}
      </Typography>
      <Pagination
        {...paginationProps}
        page={current}
        count={totalPages}
        onChange={handlePageChange}
        shape="rounded"
        showFirstButton
        showLastButton
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
          valueSelect={pageSelectOption}
          onChange={handlePageSizeChange}
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
