import { Button, ButtonProps, SxProps, Theme } from '@mui/material'
import { useMemo } from 'react'

type AdminButtonSize = 'h42' | 'h34' | 'h32' | 'h28' | 'h39'
interface AdminButton extends Omit<ButtonProps, 'size'> {
  size?: AdminButtonSize
}

const getSizeStyle = (size: AdminButtonSize) => {
  if (size === 'h28')
    return {
      padding: '4px 12px',
      fontSize: '12px',
      height: '28px',
    }

  if (size === 'h32')
    return {
      padding: '6px 14px',
      fontSize: '14px',
      height: '32px',
    }

  if (size === 'h34')
    return {
      padding: '7px 16px',
      fontSize: '14px',
      height: '34px',
    }

  if (size === 'h39')
    return {
      padding: '10px 16px',
      fontSize: '16px',
      height: '39px',
    }

  if (size === 'h42')
    return {
      padding: '10px 16px',
      fontSize: '16px',
      height: '42px',
    }

  return {}
}

const AdminButton = ({ children, ...props }: AdminButton) => {
  const { size = 'h28', ...originStyle } = props

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
