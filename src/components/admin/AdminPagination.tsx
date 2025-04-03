import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import { Pagination, PaginationProps } from '@mui/material'
import PaginationItem from '@mui/material/PaginationItem'
import { ChangeEvent } from 'react'

interface Props extends PaginationProps {
  onPageChange?: (value: number) => void
}

const AdminPagination = ({ onPageChange, ...props }: Props) => (
  <Pagination
    {...props}
    shape="rounded"
    showFirstButton
    showLastButton
    page={props.page ?? 1}
    count={props.count ?? 0}
    renderItem={(item) =>
      props.count ? (
        <PaginationItem
          sx={{ fontSize: 14, fontWeight: 600, color: 'primary.main', width: 26, height: 26, minWidth: 26, margin: '0 4px' }}
          slots={{ first: KeyboardDoubleArrowLeftIcon, last: KeyboardDoubleArrowRightIcon }}
          {...item}
        />
      ) : null
    }
    onChange={(_event: ChangeEvent<unknown>, page: number) => onPageChange?.(page)}
  />
)

export default AdminPagination
