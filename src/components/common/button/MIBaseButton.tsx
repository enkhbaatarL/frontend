import { Box, Button, ButtonProps, Stack } from '@mui/material'
import { forwardRef, ReactNode } from 'react'

import LoadingSpinner from '@/components/common/influence-factor-chart/icons/LoadingSpinIcon'
import MIBaseButtonLabel from '@/components/common/label/MIBaseButtonLabel'

export interface MIBaseButtonProps extends Omit<ButtonProps, 'prefix' | 'suffix' | 'startIcon' | 'endIcon'> {
  variant?: 'text' | 'outlined' | 'contained'
  buttonHoverBgColor?: string
  open?: boolean
  enableHoverBackground?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  disableRipple?: boolean
  isLoading?: boolean
  gap?: string | number
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
      isLoading = false,
      disabled,
      gap,
      sx,
      ...restProps
    },
    ref,
  ) => {
    const {
      borderRadius: _omitBorderRadius,
      borderColor: _omitBorderColor,
      ...forwardProps
    } = restProps as typeof restProps & { borderRadius?: unknown; borderColor?: unknown }
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
        disabled={disabled || isLoading}
        disableRipple={disableRipple ?? variant === 'outlined'}
        aria-controls={open ? 'mi-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        aria-busy={isLoading}
        {...forwardProps}
        sx={[
          {
            padding: `8px ${suffix ? '8px' : '12px'} 8px ${prefix ? '8px' : '12px'}`,
            height: '40px',
            justifyContent: 'space-between',
            textTransform: 'none',
            backgroundColor: variant === 'outlined' && open ? 'contentBG.Active' : undefined,
            transition: 'background-color 0.15s ease-in-out, border-color 0.4s ease-in-out',
            '&:disabled': {
              backgroundColor: (disabled || isLoading) && variant === 'text' ? 'transparent' : undefined,
              borderColor: (disabled || isLoading) && variant === 'outlined' ? 'contentBorder.Disabled' : undefined,
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
          },
          ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box component="span" position="relative" display="inline-flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box component="span" visibility={isLoading ? 'hidden' : 'visible'} display="inline-flex" alignItems="center" width="100%">
            <MIBaseButtonLabel prefix={prefix} suffix={suffix} gap={gap}>
              {children}
            </MIBaseButtonLabel>
          </Box>
          {isLoading && (
            <Stack
              component="span"
              position="absolute"
              top="50%"
              left="50%"
              alignItems="center"
              justifyContent="center"
              sx={{
                transform: 'translate(-50%, -50%)',
              }}
            >
              <LoadingSpinner size={20} color="rgba(0, 0, 0, 0.4)" speed={2} />
            </Stack>
          )}
        </Box>
      </Button>
    )
  },
)

MIBaseButton.displayName = 'MIBaseButton'

export default MIBaseButton
