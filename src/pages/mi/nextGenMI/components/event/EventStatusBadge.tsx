import { Box, Typography } from '@mui/material'

import type { EventStatus } from '@/service/mi/nextGenMI/event'

const STATUS_BADGE_STYLE: Partial<Record<EventStatus, { bgcolor: string; color: string; letter: string }>> = {
  new: { bgcolor: '#ECEDF4', color: '#364FC7', letter: '신규' },
  updated: { bgcolor: '#F7EFDF', color: '#EB670F', letter: '갱신' },
}

export interface EventStatusBadgeProps {
  status?: EventStatus
}

/** Events 테이블 일시 좌측 신규 / 갱신 배지 */
const EventStatusBadge = ({ status }: EventStatusBadgeProps) => {
  if (!status) return null
  const style = STATUS_BADGE_STYLE[status]
  if (!style) return null

  return (
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
      <Typography component="span" variant="body3SB12" sx={{ color: style.color, userSelect: 'none' }} noWrap>
        {style.letter}
      </Typography>
    </Box>
  )
}

export default EventStatusBadge
