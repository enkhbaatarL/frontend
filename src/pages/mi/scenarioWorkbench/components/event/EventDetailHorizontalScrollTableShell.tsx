import { Box } from '@mui/material'

import type { ReactNode } from 'react'

const RIGHT_FADE_WIDTH_PX = 100

interface EventDetailHorizontalScrollTableShellProps {
  children: ReactNode
  /** 우측 페이드 배경 (테이블 영역 bg와 맞춤) */
  fadeBackground?: string
}

/** 이벤트 상세 - 가로 스크롤 테이블 + 우측 페이드 */
const EventDetailHorizontalScrollTableShell = ({
  children,
  fadeBackground = 'linear-gradient(to left, #ffffff 0%, rgba(255, 255, 255, 0) 100%)',
}: EventDetailHorizontalScrollTableShellProps) => (
  <Box position="relative" width="100%" minWidth={0}>
    {children}
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: RIGHT_FADE_WIDTH_PX,
        pointerEvents: 'none',
        background: fadeBackground,
        zIndex: 3,
      }}
    />
  </Box>
)

export default EventDetailHorizontalScrollTableShell
