import { Button, ButtonProps } from '@mui/material'

const AdminButton = ({ children, ...props }: ButtonProps) => <Button {...props}>{children}</Button>

export default AdminButton
