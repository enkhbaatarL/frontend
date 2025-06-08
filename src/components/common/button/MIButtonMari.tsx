import { Box, SxProps, Theme, Tooltip } from '@mui/material'
import { PropsWithChildren, MouseEvent, ReactNode } from 'react'

import theme from '@/theming'

export interface MIButtonProps {
  icon: ReactNode
  tooltip?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  sx?: SxProps<Theme>
}

const MIButtonMari = ({ icon, tooltip, onClick, disabled, sx }: PropsWithChildren<MIButtonProps>) => {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    onClick?.(e)
  }

  return (
    <Tooltip placement="right" title={tooltip} disableInteractive>
      <span>
        <Box
          component="button"
          alignItems="center"
          onClick={handleClick}
          disabled={disabled}
          sx={{
            display: 'inline-flex',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s',
            cursor: disabled ? 'defalut' : 'pointer',
            border: '0',
            borderRadius: '4px',
            outline: 'none',
            padding: '1px',
            backgroundColor: 'transparent',
            color: disabled ? theme.palette.content['iconDisabled'] : theme.palette.content['iconEnabled'],
            fontFamily: theme.typography.fontFamily,
            '&:hover': {
              backgroundColor: disabled ? 'transparent' : theme.palette.content['backgroundHover'],
            },
            ...sx,
          }}
        >
          {icon}
        </Box>
      </span>
    </Tooltip>
  )
}

export default MIButtonMari
