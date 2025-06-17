import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Box, IconButton, Typography } from '@mui/material'
import PaginationItem from '@mui/material/PaginationItem'
import { useMemo } from 'react'

import MIButton from '@/components/common/button/MIButton'
import { IPaginationResponse } from '@/types/api'

export interface MIPaginationProps<T> {
  data?: IPaginationResponse<T>
  size?: number
  sizeList?: number[]
  onSizeChange?: (value: number) => void
  onPageChange?: (value: number) => void
  disabled?: boolean
  groupSize?: number
}

const MIPagination = <T,>({ data, size, sizeList, onSizeChange, onPageChange, disabled, groupSize = 5 }: MIPaginationProps<T>) => {
  const page = data?.currentPage ?? 1
  const count = data?.totalPages ?? 0

  const currentGroupStart = Math.floor((page - 1) / groupSize) * groupSize + 1
  const currentGroupEnd = Math.min(currentGroupStart + groupSize - 1, count)

  const pageNumbers = Array.from({ length: currentGroupEnd - currentGroupStart + 1 }, (_, index) => currentGroupStart + index)

  const paginationRange = useMemo(() => {
    const pageSize = size ?? 20
    const totalElements = data?.totalElements ?? 0
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, totalElements)
    return `${start}-${end} of ${totalElements.toLocaleString()}`
  }, [data?.totalElements, page, size])

  return data ? (
    <Box display="flex" alignItems="center" justifyContent="space-between" pt="20px" pb="10px">
      <Typography variant="body3" color="gray.60">
        {paginationRange}
      </Typography>
      {pageNumbers.length !== 0 ? (
        <Box display="flex" alignItems="center" sx={{ justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={() => onPageChange?.(1)}
            disabled={disabled || page <= 1}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
          >
            <KeyboardDoubleArrowLeftIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onPageChange?.(Math.min(currentGroupStart - 5, count))}
            disabled={disabled || page <= 1}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
          >
            <NavigateBeforeIcon fontSize="small" />
          </IconButton>
          {pageNumbers.map((i) => (
            <PaginationItem
              key={i}
              page={i}
              selected={i === page}
              onClick={() => onPageChange?.(i)}
              disabled={disabled}
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: 'primary.main',
                width: 26,
                height: 26,
                minWidth: 26,
                margin: '0 4px',
                borderRadius: '4px',
              }}
            />
          ))}
          <IconButton
            size="small"
            onClick={() => onPageChange?.(Math.min(currentGroupEnd + 1, count))}
            disabled={disabled || page >= count}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
          >
            <NavigateNextIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onPageChange?.(count)}
            disabled={disabled || currentGroupEnd === page}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
          >
            <KeyboardDoubleArrowRightIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : null}
      <Box width={72}>
        {size ? (
          <MIButton
            offsetTop={0}
            type={'outlined'}
            contentType={'select'}
            color={'gray'}
            size={'h28'}
            minWidth={69}
            valueSelect={{
              label: String(size),
              value: String(size),
            }}
            onChange={({ value }) => onSizeChange?.(Number(value))}
            options={(sizeList ?? [10, 15, 20, 50, 100]).map((pageSize) => ({
              label: pageSize.toString(),
              value: pageSize.toString(),
            }))}
          />
        ) : null}
      </Box>
    </Box>
  ) : null
}

export default MIPagination
