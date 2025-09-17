import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, SxProps, Theme } from '@mui/material'
import { PropsWithChildren } from 'react'

import theme from '@/theming'

export interface MIButtonProps {
  type?: 'circle' | 'square'
  direction: 'right' | 'left'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  sx?: SxProps<Theme>
}

export default function MIButtonArrow(props: PropsWithChildren<MIButtonProps>) {
  const { direction = 'right', onClick, sx, type = 'circle', disabled } = props

  return (
    <Box
      component="button"
      alignItems="center"
      onClick={onClick}
      disabled={disabled}
      sx={{
        display: 'inline-flex',
        whiteSpace: 'nowrap',
        transition: 'all 0.3s',
        cursor: disabled ? 'default' : 'pointer',
        border: '1px solid #CED4DA',
        borderRadius: type === 'circle' ? '50%' : '6px',
        outline: 'none',
        padding: type === 'circle' ? '7px' : '0',
        backgroundColor: '#fff',
        color: theme.palette.content['iconActive'],
        fontFamily: theme.typography.fontFamily,
        '&:hover': {
          backgroundColor: theme.palette.content['backgroundHover'],
        },
        // '&.active': {
        //   backgroundColor: '#fff',
        //   borderColor: theme.palette.primary.main,
        // },
        '&[disabled]': {
          backgroundColor: disabled ? '#fff' : theme.palette.content['backgroundHover'],
          borderColor: theme.palette.gray['20'],
        },
        ...sx,
      }}
    >
      <Box width={24} height={24} display="flex" alignItems="center" justifyContent="center">
        {direction === 'left' ? (
          <ChevronLeftIcon
            fontSize={type === 'circle' ? undefined : 'inherit'}
            sx={{
              color: disabled ? theme.palette.content['iconDisabled'] : theme.palette.content['iconActive'],
            }}
          />
        ) : (
          <KeyboardArrowRightIcon
            fontSize={type === 'circle' ? undefined : 'inherit'}
            sx={{
              color: disabled ? theme.palette.content['iconDisabled'] : theme.palette.content['iconActive'],
            }}
          />
        )}
      </Box>
    </Box>
  )
}
