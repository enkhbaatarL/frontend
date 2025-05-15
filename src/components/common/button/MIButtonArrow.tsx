import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, SxProps, Theme } from '@mui/material'
import { PropsWithChildren, MouseEvent } from 'react'

import theme from '@/theming'

export interface MIButtonProps {
  direction: 'right' | 'left'
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  sx?: SxProps<Theme>
}

const MIButtonArrow = (props: PropsWithChildren<MIButtonProps>) => {
  const { direction = 'right', onClick, sx } = props

  return (
    <Box
      component="button"
      alignItems="center"
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        whiteSpace: 'nowrap',
        transition: 'all 0.3s',
        cursor: 'pointer',
        border: '1px solid #CED4DA',
        borderRadius: '50%',
        outline: 'none',
        padding: '7px',
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
          backgroundColor: '#fff',
          borderColor: theme.palette.gray['20'],
        },
        ...sx,
      }}
    >
      {direction === 'left' ? <ChevronLeftIcon /> : <KeyboardArrowRightIcon />}
    </Box>
  )
}

export default MIButtonArrow
