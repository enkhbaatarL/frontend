import { Button, ButtonProps } from '@mui/material'

const AdminButton = ({ children, ...props }: ButtonProps) => {
  return <Button {...props}>{children}</Button>
}

export default AdminButton
