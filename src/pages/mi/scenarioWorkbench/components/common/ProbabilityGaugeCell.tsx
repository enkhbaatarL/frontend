import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import WorkbenchFollowCursorTooltip from '@/pages/mi/scenarioWorkbench/components/common/WorkbenchFollowCursorTooltip'
import { FILLED_BARS_TO_LABEL, probabilityToFilledBars } from '@/pages/mi/scenarioWorkbench/utils/probabilityFormatting'

const PURPLE_SCALE = ['purple1', 'purple2', 'purple3', 'purple4', 'purple5'] as const

const ProbabilityGaugeTooltipContent = ({ filledBars }: { filledBars: 1 | 2 | 3 | 4 | 5 }) => (
  <Typography component="p" m={0} fontSize={12} lineHeight={1.4} color="common.white">
    발생가능성: {FILLED_BARS_TO_LABEL[filledBars]}
  </Typography>
)

const ProbabilityGaugeCell = ({ probability }: { probability: number }) => {
  const theme = useTheme()
  const filledBars = probabilityToFilledBars(probability)
  const color = theme.palette.chart[PURPLE_SCALE[Math.max(filledBars - 1, 0)]]
  return (
    <WorkbenchFollowCursorTooltip title={<ProbabilityGaugeTooltipContent filledBars={filledBars} />}>
      <Stack direction="row" alignItems="center" justifyContent="center" gap="2px" width="100%" height={22}>
        {[0, 1, 2, 3, 4].map((i) => {
          const filled = i < filledBars
          return (
            <Box
              key={i}
              width={6} /// 원래 4px이었음 (시연용 수정)
              height={14}
              borderRadius="100px"
              bgcolor={filled ? color : theme.palette.commonColor.White}
              boxShadow={filled ? 'none' : `inset 0 0 0 1px ${color}`}
            />
          )
        })}
      </Stack>
    </WorkbenchFollowCursorTooltip>
  )
}

export default ProbabilityGaugeCell
