import { Select, SelectProps } from '@mui/material'

const AdminSelect = ({ children, ...props }: SelectProps) => {
  return <Select {...props}>{children}</Select>
}

export default AdminSelect
