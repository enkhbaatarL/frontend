import { Button, ButtonProps } from '@mui/material'
import { forwardRef, ReactNode } from 'react'

import MIBaseButtonLabel from '@/components/common/label/MIBaseButtonLabel'

export interface MIBaseButtonProps extends Omit<ButtonProps, 'prefix' | 'suffix' | 'startIcon' | 'endIcon'> {
  variant?: 'text' | 'outlined' | 'contained'
  buttonHoverBgColor?: string
  open?: boolean
  enableHoverBackground?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  disableRipple?: boolean
}

const MIBaseButton = forwardRef<HTMLButtonElement, MIBaseButtonProps>(
  (
    {
      children,
      variant = 'text',
      buttonHoverBgColor,
      open,
      enableHoverBackground = false,
      onClick,
      prefix,
      suffix,
      disableRipple,
      ...props
    },
    ref,
  ) => {
    const getBorderColor = () => {
      if (variant !== 'outlined') return undefined
      return open ? 'contentBorder.Active' : 'contentBorder.Normal'
    }

    const getHoverBackgroundColor = () => {
      if (variant !== 'outlined') return undefined
      return enableHoverBackground || open ? 'contentBG.Active' : 'transparent'
    }

    const borderColor = getBorderColor()
    const hoverBackgroundColor = getHoverBackgroundColor()

    return (
      <Button
        ref={ref}
        onClick={onClick}
        variant={variant}
        disableRipple={disableRipple ?? variant === 'outlined'}
        aria-controls={open ? 'mi-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        {...props}
        sx={{
          padding: `8px ${suffix ? '8px' : '12px'} 8px ${prefix ? '8px' : '12px'}`,
          height: '40px',
          justifyContent: 'space-between',
          textTransform: 'none',
          backgroundColor: variant === 'outlined' && open ? 'contentBG.Active' : undefined,
          transition: 'background-color 0.15s ease-in-out, border-color 0.4s ease-in-out',
          '&:disabled': {
            backgroundColor: props.disabled && variant === 'text' ? 'transparent' : undefined,
            borderColor: props.disabled && variant === 'outlined' ? 'contentBorder.Disabled' : undefined,
          },
          borderColor,
          borderWidth: '1px',
          borderRadius: '10px',
          '&:hover:not(:disabled)': {
            backgroundColor: buttonHoverBgColor ?? hoverBackgroundColor,
            borderColor,
            borderWidth: '1px',
          },
          '& .MuiButton-endIcon': {
            marginRight: '2px',
          },
          ...props.sx,
        }}
      >
        <MIBaseButtonLabel prefix={prefix} suffix={suffix}>
          {children}
        </MIBaseButtonLabel>
      </Button>
    )
  },
)

MIBaseButton.displayName = 'MIBaseButton'

export default MIBaseButton
