import { Box, Stack, Typography } from '@mui/material'

import type { EventMarketImpactLevel } from './types'

import levelHighIcon from '@/assets/level-high.svg'
import levelLowIcon from '@/assets/level-low.svg'
import levelMediumIcon from '@/assets/level-medium.svg'
import levelNotRatedIcon from '@/assets/level-not-rated.svg'

const IMPACT_LABEL: Record<EventMarketImpactLevel, string> = {
  0: '없음',
  1: '낮음',
  2: '중간',
  3: '높음',
}

const ImpactIcon = ({ level }: { level: EventMarketImpactLevel }) => {
  if (level === 0) {
    return <img src={levelNotRatedIcon} width={16} height={16} alt="impact-none" />
  }
  if (level === 1) {
    return <img src={levelLowIcon} width={16} height={16} alt="impact-low" />
  }
  if (level === 2) {
    return <img src={levelMediumIcon} width={16} height={16} alt="impact-medium" />
  }
  return <img src={levelHighIcon} width={16} height={16} alt="impact-high" />
}

interface EventMarketImpactCellProps {
  level: EventMarketImpactLevel
}

const EventMarketImpactCell = ({ level }: EventMarketImpactCellProps) => (
  <Stack direction="row" alignItems="center" gap={1} justifyContent="flex-start" width="100%">
    <Box display="flex" alignItems="center" justifyContent="center" minWidth={20}>
      <ImpactIcon level={level} />
    </Box>
    <Typography variant="body2R14" color={level === 0 ? 'gray.60' : 'contentText.Normal'}>
      {IMPACT_LABEL[level]}
    </Typography>
  </Stack>
)

export default EventMarketImpactCell
