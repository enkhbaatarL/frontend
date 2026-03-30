import { Box } from '@mui/material'
import { PropsWithChildren, ReactElement, useMemo, MouseEvent } from 'react'

import theme from '@/theming'

export type MISize = 'h40' | 'h38' | 'h34' | 'h30'
export type MIType = 'rounded' | 'Rectangle' | 'rectangle' | 'icon'
export type MIPosition = 'center' | 'left' | 'right'

export interface MIButtonProps {
  size?: MISize
  type?: MIType
  position?: MIPosition
  endIcon?: ReactElement
  startIcon?: ReactElement
  disabled?: boolean
  active?: boolean
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  width?: number | string
}

export default function MISegmented(props: PropsWithChildren<MIButtonProps>) {
  const { size = 'h38', children, type = 'rounded', endIcon, startIcon, disabled = false, onClick, position = 'center', active } = props

  const styleBaseSize = useMemo(() => {
    const typography = {
      h40: theme.typography.body1M16,
      h38: theme.typography.body1M16,
      h34: theme.typography.body1M16,
      h30: theme.typography.body3,
    }[size]

    const padding = {
      h40: type === 'icon' ? '8px' : '8px 13px',
      h38: type === 'icon' ? '8px' : '8px 13px',
      h34: type === 'icon' ? '6px' : '6px 13px',
      h30: type === 'icon' ? '6px' : '6px 13px',
    }[size]

    const height = {
      h40: '40px',
      h38: '38px',
      h34: '34px',
      h30: '30px',
    }[size]

    return {
      padding,
      height,
      ...typography,
    }
  }, [size])

  const getBorderRadius = (buttonType: MIType, buttonPosition: MIPosition): string | number => {
    if (buttonType === 'Rectangle' || buttonType === 'rectangle') return '4px'
    if (buttonType === 'icon') {
      switch (buttonPosition) {
        case 'left':
          return '4px 0 0 4px'
        case 'right':
          return '0 4px 4px 0'
        case 'center':
          return 0
      }
    }

    return '100px'
  }

  return (
    <Box
      component="button"
      disabled={disabled}
      alignItems="center"
      columnGap={'8px'}
      className={active ? 'active' : ''}
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        whiteSpace: 'nowrap',
        transition: 'all 0.3s',
        cursor: 'pointer',
        border: '1px solid #E9ECEF',
        borderRadius: getBorderRadius(type, position),
        ...(position === 'left' && {
          borderRight: 0,
        }),
        ...(position === 'right' && {
          borderLeft: 0,
        }),
        outline: 'none',
        backgroundColor: '#fff',
        color: 'gray.70',
        fontFamily: theme.typography.fontFamily,
        ...styleBaseSize,
        '&:hover': {
          backgroundColor: theme.palette.content['backgroundHover'],
          color: 'gray.90',
        },
        '&.active': {
          backgroundColor: '#fff',
          borderColor: theme.palette.primary.main,
          color: 'gray.90',
        },
        '&[disabled]': {
          backgroundColor: '#fff',
          borderColor: theme.palette.gray['20'],
          color: theme.palette.content['textDisabled'],
        },
      }}
    >
      {startIcon}
      {children && <Box>{children}</Box>}
      {endIcon}
    </Box>
  )
}
