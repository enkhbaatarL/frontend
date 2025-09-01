import { Button } from '@mui/material'
import { SxProps, Theme } from '@mui/material/styles'
import { FC, ReactNode } from 'react'

type Props = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  color?: string
  bgColor?: string
  bdColor?: string
  bdRadius?: string
  sx?: SxProps<Theme>
}

const AdminIconButton: FC<Props> = ({
  children,
  onClick,
  disabled = false,
  color = '#868E96',
  bgColor = '#fff',
  bdColor = '#DEE2E6',
  bdRadius = '6px',
  sx,
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    sx={{
      color,
      border: '1px solid',
      borderColor: bdColor,
      backgroundColor: bgColor,
      borderRadius: bdRadius,
      width: 28,
      height: 28,
      minWidth: 'unset',
      ...sx,
    }}
  >
    {children}
  </Button>
)

export default AdminIconButton
