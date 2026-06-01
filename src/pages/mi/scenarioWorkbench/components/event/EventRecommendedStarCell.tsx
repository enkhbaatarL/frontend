import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Box } from '@mui/material'

import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'

export interface EventRecommendedStarCellProps {
  recommended?: boolean
  reason?: string
}

/** Events 테이블 이벤트명 좌측 추천(별) 아이콘 */
const EventRecommendedStarCell = ({ recommended, reason }: EventRecommendedStarCellProps) => {
  if (!recommended) return null

  const star = (
    <Box
      component="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      width={28}
      height={28}
      borderRadius="7px"
      lineHeight={0}
    >
      <StarRoundedIcon sx={{ fontSize: 24.5, color: 'mari.Primary' }} />
    </Box>
  )

  const tooltipTitle = reason?.trim() || '추천'
  return <WorkbenchFollowCursorTooltip title={tooltipTitle}>{star}</WorkbenchFollowCursorTooltip>
}

export default EventRecommendedStarCell
