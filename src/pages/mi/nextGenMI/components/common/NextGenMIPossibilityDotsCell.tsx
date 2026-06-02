import { Box, Stack } from '@mui/material'

import NextGenMIFollowCursorTooltip from '@/pages/mi/nextGenMI/components/common/NextGenMIFollowCursorTooltip'
import { FILLED_BARS_TO_LABEL, probabilityToFilledBars } from '@/pages/mi/nextGenMI/utils/probabilityFormatting'

interface NextGenMIPossibilityDotsCellProps {
  probability: number
}

const NextGenMIPossibilityDotsCell = ({ probability }: NextGenMIPossibilityDotsCellProps) => {
  const filledBars = probabilityToFilledBars(probability)

  return (
    <NextGenMIFollowCursorTooltip title={`실행가능성: ${FILLED_BARS_TO_LABEL[filledBars]}`}>
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2.667px" width="100%" height={22}>
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i < filledBars
          return <Box key={i} width={8} height={8} borderRadius="2px" bgcolor={filled ? '#EF1B88' : '#BAD1D7'} />
        })}
      </Stack>
    </NextGenMIFollowCursorTooltip>
  )
}

export default NextGenMIPossibilityDotsCell
