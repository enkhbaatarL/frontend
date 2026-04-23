import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import { Stack, Typography } from '@mui/material'

import type { EventMarketDirection } from './types'

interface EventMarketDirectionCellProps {
  direction: EventMarketDirection
}

const EventMarketDirectionCell = ({ direction }: EventMarketDirectionCellProps) => {
  if (direction === '상승') {
    return (
      <Stack direction="row" alignItems="center" gap={0.5} justifyContent="flex-start" width="100%">
        <ArrowUpwardIcon sx={{ fontSize: 18, color: 'success.main' }} />
        <Typography variant="body2R14" color="contentText.Normal">
          상승
        </Typography>
      </Stack>
    )
  }
  if (direction === '하락') {
    return (
      <Stack direction="row" alignItems="center" gap={0.5} justifyContent="flex-start" width="100%">
        <ArrowDownwardIcon sx={{ fontSize: 18, color: 'error.main' }} />
        <Typography variant="body2R14" color="contentText.Normal">
          하락
        </Typography>
      </Stack>
    )
  }
  return (
    <Stack direction="row" alignItems="center" gap={0.5} justifyContent="flex-start" width="100%">
      <HorizontalRuleIcon sx={{ fontSize: 18, color: 'gray.50' }} />
      <Typography variant="body2R14" color="contentText.Normal">
        보합
      </Typography>
    </Stack>
  )
}

export default EventMarketDirectionCell
