import { Box, Typography } from '@mui/material'

import type { ScenarioWorkbenchEventStatus } from '@/service/mi/scenarioWorkbench/event'

import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'

const STATUS_BADGE_STYLE: Partial<Record<ScenarioWorkbenchEventStatus, { bgcolor: string; color: string; letter: string }>> = {
  new: { bgcolor: '#ECEDF4', color: '#364FC7', letter: 'N' },
  updated: { bgcolor: '#F7EFDF', color: '#EB670F', letter: 'U' },
}

export interface EventStatusBadgeProps {
  status?: ScenarioWorkbenchEventStatus
}

/** Events 테이블 일시 좌측 신규(N) / 갱신(U) 배지 */
const EventStatusBadge = ({ status }: EventStatusBadgeProps) => {
  if (!status) return null
  const style = STATUS_BADGE_STYLE[status]
  if (!style) return null

  const tooltipTitle = status === 'new' ? '신규' : status === 'updated' ? '갱신' : ''

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

  return tooltipTitle ? <WorkbenchFollowCursorTooltip title={tooltipTitle}>{badge}</WorkbenchFollowCursorTooltip> : badge
}

export default EventStatusBadge
