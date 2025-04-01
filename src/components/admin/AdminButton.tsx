import { Button, ButtonProps, SxProps, Theme } from '@mui/material'
import { useMemo } from 'react'

type AdminButtonSize = 'h42' | 'h34' | 'h32' | 'h28'
interface AdminButton extends Omit<ButtonProps, 'size'> {
  size?: AdminButtonSize
}

const getSizeStyle = (size: AdminButtonSize = 'h28') => {
  if (size === 'h28')
    return {
      padding: '4px 12px',
      fontSize: '12px',
    }

  if (size === 'h32')
    return {
      padding: '6px 14px',
      fontSize: '14px',
    }

  if (size === 'h34')
    return {
      padding: '7px 16px',
      fontSize: '14px',
    }

  if (size === 'h42')
    return {
      padding: '10px 16px',
      fontSize: '16px',
    }

  return {}
}

const AdminButton = ({ children, ...props }: AdminButton) => {
  // The default value of size can be modified with real project later
  const { size, ...originStyle } = props

  // Size style follow the design
  const buttonStyle = useMemo(
    (): SxProps<Theme> => ({
      ...getSizeStyle(size),
    }),
    [size],
  )

  return (
    <Button sx={buttonStyle} {...originStyle}>
      {children}
    </Button>
  )
}

export default AdminButton
