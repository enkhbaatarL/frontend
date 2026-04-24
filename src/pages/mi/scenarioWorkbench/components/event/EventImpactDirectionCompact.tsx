import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import { Box } from '@mui/material'

import type { EventMarketDirection } from './types'

interface EventImpactDirectionCompactProps {
  direction: EventMarketDirection
}

/** Figma — 가격방향 셀(14px 아이콘 중앙) */
const EventImpactDirectionCompact = ({ direction }: EventImpactDirectionCompactProps) => {
  const sx = { fontSize: 14 }
  if (direction === '상승') {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" width="100%" height={40}>
        <ArrowUpwardIcon sx={{ ...sx, color: 'success.main' }} />
      </Box>
    )
  }
  if (direction === '하락') {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" width="100%" height={40}>
        <ArrowDownwardIcon sx={{ ...sx, color: 'error.main' }} />
      </Box>
    )
  }
  return (
    <Box display="flex" alignItems="center" justifyContent="center" width="100%" height={40}>
      <HorizontalRuleIcon sx={{ ...sx, color: 'gray.50' }} />
    </Box>
  )
}

export default EventImpactDirectionCompact
