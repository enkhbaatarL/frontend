import { Button } from '@mui/material'
import { PropsWithChildren } from 'react'

export interface MIButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
}

export default function MIButtonPdf(props: PropsWithChildren<MIButtonProps>) {
  const { children, onClick, disabled = false } = props

  return (
    <Button
      sx={{
        p: 0,
        minWidth: 'unset',
        borderRadius: '2px',
        color: 'gray.40',
        '&:hover': {
          backgroundColor: 'gray.70',
        },
        '&:active': {
          backgroundColor: 'gray.70',
          color: '#fff',
        },
        '&.Mui-disabled': {
          color: 'gray.60',
          backgroundColor: 'transparent',
        },
      }}
      disableRipple
      variant="text"
      size="small"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  )
}
