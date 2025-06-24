import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { Box, IconButton, PaginationProps } from '@mui/material'
import PaginationItem from '@mui/material/PaginationItem'

interface Props extends PaginationProps {
  onPageChange?: (value: number) => void
  disabled?: boolean
}

const groupSize = 5

const AdminPagination = ({ page = 1, count = 0, onPageChange, disabled = false }: Props) => {
  const currentGroupStart = Math.floor((page - 1) / groupSize) * groupSize + 1
  const currentGroupEnd = Math.min(currentGroupStart + groupSize - 1, count)

  const pageNumbers = Array.from({ length: currentGroupEnd - currentGroupStart + 1 }, (_, index) => currentGroupStart + index)

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

  return pageNumbers.length !== 0 ? (
    <Box display="flex" alignItems="center" sx={{ justifyContent: 'center' }}>
      {/* 첫 번째 페이지 */}
      <IconButton size="small" onClick={goToFirstPage} disabled={disabled || !canGoToFirst} sx={{ margin: '0 4px' }} title="첫 번째 페이지">
        <KeyboardDoubleArrowLeftIcon fontSize="small" />
      </IconButton>

      {/* 이전 그룹 */}
      <IconButton size="small" onClick={goToPrevGroup} disabled={disabled || !canGoToPrevGroup} sx={{ margin: '0 4px' }} title="이전 그룹">
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
        sx={{ margin: '0 4px', borderRadius: '4px' }}
        title="다음 그룹"
      >
        <NavigateNextIcon fontSize="small" />
      </IconButton>

      {/* 마지막 페이지 */}
      <IconButton
        size="small"
        onClick={goToLastPage}
        disabled={disabled || !canGoToLast}
        sx={{ margin: '0 4px', borderRadius: '4px' }}
        title="마지막 페이지"
      >
        <KeyboardDoubleArrowRightIcon fontSize="small" />
      </IconButton>
    </Box>
  ) : null
}

export default AdminPagination
