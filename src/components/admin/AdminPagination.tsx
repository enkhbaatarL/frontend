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
  return pageNumbers.length !== 0 ? (
    <Box display="flex" alignItems="center" sx={{ justifyContent: 'center' }}>
      <IconButton size="small" onClick={() => onPageChange?.(1)} disabled={disabled || page === 1} sx={{ margin: '0 4px' }}>
        <KeyboardDoubleArrowLeftIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onPageChange?.(page > 1 ? page - 1 : 1)}
        disabled={disabled || page <= 1}
        sx={{ margin: '0 4px' }}
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
        onClick={() => onPageChange?.(page < count ? page + 1 : count)}
        disabled={disabled || page >= count}
        sx={{ margin: '0 4px', borderRadius: '4px' }}
      >
        <NavigateNextIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={() => onPageChange?.(count)}
        disabled={disabled || page === count}
        sx={{ margin: '0 4px', borderRadius: '4px' }}
      >
        <KeyboardDoubleArrowRightIcon fontSize="small" />
      </IconButton>
    </Box>
  ) : null
}

export default AdminPagination
