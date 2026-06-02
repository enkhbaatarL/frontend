import { Box, Stack } from '@mui/material'

import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'
import { FILLED_BARS_TO_LABEL, probabilityToFilledBars } from '@/pages/mi/scenarioWorkbench/utils/probabilityFormatting'

interface ScenarioWorkbenchPossibilityDotsCellProps {
  probability: number
}

const ScenarioWorkbenchPossibilityDotsCell = ({ probability }: ScenarioWorkbenchPossibilityDotsCellProps) => {
  const filledBars = probabilityToFilledBars(probability)

  return (
    <WorkbenchFollowCursorTooltip title={`실행가능성: ${FILLED_BARS_TO_LABEL[filledBars]}`}>
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2.667px" width="100%" height={22}>
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i < filledBars
          return <Box key={i} width={8} height={8} borderRadius="2px" bgcolor={filled ? '#EF1B88' : '#BAD1D7'} />
        })}
      </Stack>
    </WorkbenchFollowCursorTooltip>
  )
}

export default ScenarioWorkbenchPossibilityDotsCell
