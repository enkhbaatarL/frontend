import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import { Pagination, PaginationProps } from '@mui/material'
import PaginationItem from '@mui/material/PaginationItem'

const AdminPagination = (props: PaginationProps) => (
  <Pagination
    {...props}
    shape="rounded"
    showFirstButton
    showLastButton
    count={10}
    renderItem={(item) => (
      <PaginationItem
        sx={{ fontSize: 14, fontWeight: 600, color: 'primary.main', width: 26, height: 26, minWidth: 26, margin: '0 4px' }}
        slots={{ first: KeyboardDoubleArrowLeftIcon, last: KeyboardDoubleArrowRightIcon }}
        {...item}
      />
    )}
  />
)

export default AdminPagination
