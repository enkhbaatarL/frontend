import { Pagination, PaginationProps } from '@mui/material'

const AdminPagination = (props: PaginationProps) => {
  return <Pagination {...props} showFirstButton showLastButton />
}

export default AdminPagination
