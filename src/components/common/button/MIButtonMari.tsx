//components/common/button/MIButtonMari.tsx

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined'
import { Box, SxProps, Theme, Tooltip } from '@mui/material'
import { PropsWithChildren } from 'react'

import theme from '@/theming'

export interface MIButtonProps {
  action: 'copy' | 'copied' | 'like' | 'dislike' | 'refresh'

  active?: boolean

  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void

  sx?: SxProps<Theme>
}

export default function MIButtonMari(props: PropsWithChildren<MIButtonProps>) {
  const { action = 'copy', active, onClick, sx } = props

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
  }

  return (
    <Tooltip
      placement="right"
      title={
        action === 'copy'
          ? '복사'
          : action === 'copied'
            ? '복사됨'
            : action === 'like'
              ? '응답이 마음에 들어요'
              : action === 'dislike'
                ? '응답이 마음에 들지 않아요'
                : '다시 답변'
      }
    >
      <Box
        component="button"
        alignItems="center"
        onClick={handleClick}
        sx={{
          display: 'inline-flex',
          whiteSpace: 'nowrap',
          transition: 'all 0.3s',
          cursor: 'pointer',
          border: '0',
          borderRadius: '4px',
          outline: 'none',
          padding: '1px',
          backgroundColor: 'transparent',
          color: theme.palette.content['iconEnabled'],
          fontFamily: theme.typography.fontFamily,
          '&:hover': {
            backgroundColor: theme.palette.content['backgroundHover'],
          },
          ...sx,
        }}
      >
        {action === 'copy' && <ContentCopyIcon fontSize="small" />}
        {action === 'copied' && <CheckRoundedIcon style={{ color: '#343A40' }} fontSize="small" />}
        {action === 'like' && (active ? <ThumbUpAltIcon fontSize="small" /> : <ThumbUpAltOutlinedIcon fontSize="small" />)}
        {action === 'dislike' && (active ? <ThumbDownAltIcon fontSize="small" /> : <ThumbDownAltOutlinedIcon fontSize="small" />)}
        {action === 'refresh' && <RefreshRoundedIcon fontSize="small" />}
      </Box>
    </Tooltip>
  )
}
