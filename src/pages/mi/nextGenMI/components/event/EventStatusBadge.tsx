import { Box, Typography } from '@mui/material'

import type { EventStatus } from '@/service/mi/nextGenMI/event'

import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'

const STATUS_BADGE_STYLE: Partial<Record<EventStatus, { bgcolor: string; color: string; letter: string }>> = {
  new: { bgcolor: '#ECEDF4', color: '#364FC7', letter: 'N' },
  updated: { bgcolor: '#F7EFDF', color: '#EB670F', letter: 'U' },
}

const STATUS_BADGE_FALLBACK_LABEL: Partial<Record<EventStatus, string>> = {
  new: '신규',
  updated: '갱신',
}

export interface EventStatusBadgeProps {
  status?: EventStatus
  statusLabel?: string | null
}

/** Events 테이블 일시 좌측 신규(N) / 갱신(U) 배지 */
const EventStatusBadge = ({ status, statusLabel }: EventStatusBadgeProps) => {
  if (!status) return null
  const style = STATUS_BADGE_STYLE[status]
  if (!style) return null

  const tooltipTitle = statusLabel?.trim() || STATUS_BADGE_FALLBACK_LABEL[status] || ''

  const badge = (
    <Box
      component="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      px="6px"
      py="2px"
      borderRadius="8px"
      bgcolor={style.bgcolor}
    >
      <Typography component="span" variant="body3SB12" sx={{ color: style.color, lineHeight: 1.4 }} noWrap>
        {style.letter}
      </Typography>
    </Box>
  )

  return tooltipTitle ? <NextGenMIFollowCursorTooltip title={tooltipTitle}>{badge}</NextGenMIFollowCursorTooltip> : badge
}

export default EventStatusBadge
