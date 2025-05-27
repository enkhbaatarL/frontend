import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import { Box, SxProps, Theme } from '@mui/material'
import { PropsWithChildren } from 'react'

import theme from '@/theming'

export interface MIButtonViewMoreProps {
  state: 'more' | 'less'
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  sx?: SxProps<Theme>
}

export default function MIButtonViewMore(props: PropsWithChildren<MIButtonViewMoreProps>) {
  const { state = 'more', onClick, sx } = props

  return (
    <Box
      component="button"
      alignItems="center"
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        whiteSpace: 'nowrap',
        fontSize: '16px',
        cursor: 'pointer',
        fontWeight: 400,
        lineHeight: '1.6',
        gap: '4px',
        outline: 'none',
        padding: 0,
        backgroundColor: 'transparent',
        color: '#414C93',
        border: 0,
        fontFamily: theme.typography.fontFamily,
        ...sx,
      }}
    >
      {state === 'more' ? (
        <>
          View more <KeyboardArrowDownRoundedIcon fontSize={'small'} />
        </>
      ) : (
        <>
          View less <ExpandLessRoundedIcon fontSize={'small'} />
        </>
      )}
    </Box>
  )
}
