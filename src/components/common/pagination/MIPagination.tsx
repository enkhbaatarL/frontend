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
  paddingTop?: string | number
}

const MIPagination = <T,>({
  data,
  size,
  sizeList,
  onSizeChange,
  onPageChange,
  disabled,
  groupSize = 5,
  paddingTop = '20px',
}: MIPaginationProps<T>) => {
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
    return `${start.toLocaleString()}-${end.toLocaleString()} of ${totalElements.toLocaleString()}`
  }, [data?.totalElements, page, size])

  // 네비게이션 버튼 활성화 조건
  const canGoToFirst = page > 1 && currentGroupStart > 1
  const canGoToPrevGroup = currentGroupStart > 1
  const canGoToNextGroup = currentGroupEnd < count && count > groupSize
  const canGoToLast = page < count && currentGroupEnd < count

  // 네비게이션 핸들러
  const goToFirstPage = () => onPageChange?.(1)
  const goToPrevGroup = () => {
    const prevGroupEnd = currentGroupStart - 1
    onPageChange?.(prevGroupEnd) // 이전 그룹의 마지막 페이지로 이동
  }
  const goToNextGroup = () => {
    const nextGroupStart = currentGroupEnd + 1
    onPageChange?.(Math.min(nextGroupStart, count)) // 다음 그룹의 첫 페이지로 이동
  }
  const goToLastPage = () => onPageChange?.(count)

  return data ? (
    <Box display="flex" alignItems="center" justifyContent="space-between" pt={paddingTop}>
      <Typography variant="body3" color="gray.60">
        {paginationRange}
      </Typography>
      {pageNumbers.length !== 0 ? (
        <Box display="flex" alignItems="center" sx={{ justifyContent: 'center' }}>
          {/* 첫 번째 페이지 */}
          <IconButton
            size="small"
            onClick={goToFirstPage}
            disabled={disabled || !canGoToFirst}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
            title="첫 번째 페이지"
          >
            <KeyboardDoubleArrowLeftIcon fontSize="small" />
          </IconButton>

          {/* 이전 그룹 */}
          <IconButton
            size="small"
            onClick={goToPrevGroup}
            disabled={disabled || !canGoToPrevGroup}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
            title="이전 그룹"
          >
            <NavigateBeforeIcon fontSize="small" />
          </IconButton>

          {/* 페이지 번호들 */}
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
                height: 26,
                minWidth: 26,
                margin: '0 4px',
                borderRadius: '4px',
              }}
            />
          ))}

          {/* 다음 그룹 */}
          <IconButton
            size="small"
            onClick={goToNextGroup}
            disabled={disabled || !canGoToNextGroup}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
            title="다음 그룹"
          >
            <NavigateNextIcon fontSize="small" />
          </IconButton>

          {/* 마지막 페이지 */}
          <IconButton
            size="small"
            onClick={goToLastPage}
            disabled={disabled || !canGoToLast}
            sx={{ margin: '0 4px', '&:hover': { color: 'primary.main', backgroundColor: 'transparent' } }}
            title="마지막 페이지"
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
            disablePortal={false}
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
