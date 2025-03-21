import { Select, SelectProps } from '@mui/material'

const AdminSelect = ({ children, displayEmpty = true, ...props }: SelectProps) => {
  return (
    <Select {...props} displayEmpty={displayEmpty}>
      {children}
    </Select>
  )
}

export default AdminSelect
