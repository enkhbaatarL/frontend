import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import { Box, Stack } from '@mui/material'

import type { EventMarketDirection, EventMarketImpactLevel } from './types'

/** 단일 지수(JKM/TTF/HH)용 영향도 점 3개 + 방향 아이콘만 표시 (Figma MI/ Events/ Table/ Row) */
interface EventIndexImpactDirectionCellProps {
  level: EventMarketImpactLevel
  direction: EventMarketDirection
}

/** 영향도 레벨에 따라 채워진 점 개수(0~3)를 반환 */
const filledDotCount = (level: EventMarketImpactLevel): number => {
  if (level <= 0) return 0
  if (level === 1) return 1
  if (level === 2) return 2
  return 3
}

/** 영향도 점 1개 (채움=primary, 비움=회색 테두리) */
const ImpactDot = ({ filled }: { filled: boolean }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      flexShrink: 0,
      bgcolor: filled ? 'mari.Primary' : 'transparent',
      border: filled ? 'none' : '1.5px solid',
      borderColor: 'gray.50',
      boxSizing: 'border-box',
    }}
  />
)

/** 가격 방향에 따른 14px 아이콘 (상승/하락/보합) */
const DirectionGlyph = ({ direction }: { direction: EventMarketDirection }) => {
  if (direction === '상승') {
    return <ArrowUpwardIcon sx={{ fontSize: 14, color: 'success.main' }} />
  }
  if (direction === '하락') {
    return <ArrowDownwardIcon sx={{ fontSize: 14, color: 'error.main' }} />
  }
  return <HorizontalRuleIcon sx={{ fontSize: 14, color: 'gray.50' }} />
}

/** JKM·TTF·HH 셀: 점 3개 + 방향 */
const EventIndexImpactDirectionCell = ({ level, direction }: EventIndexImpactDirectionCellProps) => {
  const n = filledDotCount(level)
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap={0.75} width="100%">
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" height={22}>
        {[0, 1, 2].map((i) => (
          <ImpactDot key={i} filled={i < n} />
        ))}
      </Stack>
      <Box display="flex" alignItems="center" justifyContent="center" width={14} height={14}>
        <DirectionGlyph direction={direction} />
      </Box>
    </Stack>
  )
}

export default EventIndexImpactDirectionCell
